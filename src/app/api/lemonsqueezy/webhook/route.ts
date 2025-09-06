// app/api/lemon/webhook/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  updateSubscription,
  createSubscription,
} from "@/lib/subscription-server";
import { getSubscription } from "@/lib/subscriptions";

const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

/* -------------------- utils -------------------- */

function safeEqualHex(aHex: string, bHex: string) {
  if (
    typeof aHex !== "string" ||
    typeof bHex !== "string" ||
    aHex.length === 0 ||
    bHex.length === 0 ||
    aHex.length !== bHex.length
  ) {
    return false;
  }
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function deriveTierAndQuantity(variantName?: string): {
  tierId: "plus" | "pro" | null;
  quantity: number;
} {
  const v = variantName?.toLowerCase() ?? "";
  if (v.includes("plus")) return { tierId: "plus", quantity: 10 };
  if (v.includes("pro")) return { tierId: "pro", quantity: 30 };
  return { tierId: null, quantity: 0 };
}

function buildEventKey(args: {
  eventName?: string;
  lemonSqueezyId?: string;
  updatedAt?: string | null;
  eventUUID?: string | null;
}) {
  if (args.eventUUID) return `ls:${args.eventUUID}`;
  return `ls:${args.lemonSqueezyId ?? "unknown"}:${args.eventName ?? "unknown"}:${args.updatedAt ?? "0"}`;
}

/** Wire these to Firestore if you want cross-process idempotency; no-op locally. */
async function hasProcessed(_eventKey: string) { return false; }
async function markProcessed(_eventKey: string) { /* noop */ }

/* Updated-at pointer helpers */
function isNewerUpdate(incomingUpdatedAt?: string | null, storedUpdatedAt?: string | null) {
  if (!incomingUpdatedAt) return false;
  if (!storedUpdatedAt) return true;
  return new Date(incomingUpdatedAt).getTime() > new Date(storedUpdatedAt).getTime();
}

type SubAttrs = {
  status?: string;
  updated_at?: string | null;
  variant_id?: number | string | null;
  variant_name?: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  paused?: boolean | null;
};

/* -------------------- handler -------------------- */

export async function POST(req: NextRequest) {
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured.");
    return new NextResponse("Server misconfigured.", { status: 500 });
  }

  // raw body for signature
  let rawBody: ArrayBuffer;
  try {
    rawBody = await req.arrayBuffer();
  } catch (e) {
    console.error("Failed to read raw body:", e);
    return new NextResponse("Bad Request", { status: 400 });
  }

  const digestHex = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(rawBody))
    .digest("hex");

  const signatureHex = (req.headers.get("x-signature") ?? "").trim();

  if (!safeEqualHex(digestHex, signatureHex)) {
    console.warn("Invalid webhook signature.");
    return new NextResponse("Invalid signature.", { status: 401 });
  }

  // parse JSON after verifying
  let payload: any;
  try {
    const bodyText = Buffer.from(rawBody).toString("utf8");
    payload = JSON.parse(bodyText);
  } catch (e) {
    console.error("Invalid JSON payload:", e);
    return new NextResponse("Invalid JSON.", { status: 400 });
  }

  const meta = payload?.meta ?? {};
  const data = payload?.data ?? {};
  const eventName: string | undefined = meta?.event_name;
  const customData = meta?.custom_data ?? {};
  const subscriptionData = data?.attributes ?? {};
  const lemonSqueezyId: string | undefined = data?.id;
  const userId: string | undefined = customData?.user_id;

  const eventUUID = req.headers.get("x-event-uuid");
  const updatedAt = subscriptionData?.updated_at ?? subscriptionData?.updatedAt ?? null;
  const eventKey = buildEventKey({
    eventName,
    lemonSqueezyId,
    updatedAt,
    eventUUID,
  });

  try {
    if (await hasProcessed(eventKey)) {
      return new NextResponse("Already processed.", { status: 200 });
    }

    if (!eventName) {
      console.warn("Webhook missing meta.event_name. Ignoring.");
      await markProcessed(eventKey);
      return new NextResponse("Ignored (no event name).", { status: 200 });
    }

    if (!userId) {
      console.warn(`Event '${eventName}' has no custom_data.user_id. Ignoring.`);
      await markProcessed(eventKey);
      return new NextResponse("Ignored (no user_id).", { status: 200 });
    }

    if (!lemonSqueezyId) {
      console.warn(`Event '${eventName}' missing data.id (subscription id). Ignoring.`);
      await markProcessed(eventKey);
      return new NextResponse("Ignored (no subscription id).", { status: 200 });
    }

    // Normalize attributes and status
    const attrs: SubAttrs = {
      status: subscriptionData?.status,
      updated_at: updatedAt,
      variant_id: subscriptionData?.variant_id ?? subscriptionData?.variantId ?? null,
      variant_name: subscriptionData?.variant_name ?? null,
      renews_at: subscriptionData?.renews_at ?? null,
      ends_at: subscriptionData?.ends_at ?? null,
      paused: subscriptionData?.paused ?? null,
    };
    const status = (attrs.status ?? "").toLowerCase();
    const { tierId, quantity } = deriveTierAndQuantity(attrs.variant_name);

    // Load existing once
    const stored = await getSubscription(userId); // should return { last_processed_updated_at?, status?, cumulative_quantity?, tier_id?, ... }

    // ----- UPDATED_AT POINTER GUARD -----
    if (!isNewerUpdate(attrs.updated_at, stored?.last_processed_updated_at ?? null)) {
      // Same or older update -> ack & skip
      await markProcessed(eventKey);
      return new NextResponse("Duplicate/old update; ignored.", { status: 200 });
    }

    // Base payload for writes
    const base = {
      user_id: userId,
      subscription_id: lemonSqueezyId,
      tier_id: tierId ?? (stored?.tier_id ?? null),
      cumulative_quantity: stored?.cumulative_quantity ?? 0,
      last_processed_updated_at: attrs.updated_at ?? (stored?.last_processed_updated_at ?? null),
      status,
      ...subscriptionData,
    };

    /* ---------- Logic: status-driven + only add seats on CREATE ---------- */

    if (!stored) {
      // First time we see this subscription for this user (most likely subscription_created)
      await createSubscription({
        ...base,
        // Only here we add quantity
        cumulative_quantity: (quantity > 0 ? quantity : 0),
      });
      await markProcessed(eventKey);
      return new NextResponse("Created", { status: 200 });
    }

    // If plan changed, decide policy (here: disallow and acknowledge)
    if (tierId && stored.tier_id && stored.tier_id !== tierId) {
      console.log(`User ${userId} is changing plan from ${stored.tier_id} to ${tierId}. Ignored by policy.`);
      // Still advance pointer so LS doesn't retry forever
      await updateSubscription({
        ...stored,
        last_processed_updated_at: attrs.updated_at ?? stored.last_processed_updated_at ?? null,
        status,
        ...subscriptionData,
      });
      await markProcessed(eventKey);
      return new NextResponse("Plan change not supported (ack).", { status: 200 });
    }

    // We do NOT change cumulative_quantity for generic updates/cancel/expire/resume.
    switch (eventName) {
      case "subscription_created": {
        // If LS fires a follow-up updated/created pattern, we won't double-count due to updated_at guard above.
        await updateSubscription({
          ...base,
          cumulative_quantity: stored.cumulative_quantity + (quantity > 0 ? quantity : 0),
        });
        break;
      }

      case "subscription_updated": {
        // No seat changes on noisy updates
        await updateSubscription({
          ...base,
          cumulative_quantity: stored.cumulative_quantity,
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_resumed": {
        await updateSubscription({
          ...base,
          cumulative_quantity: stored.cumulative_quantity,
        });
        break;
      }

      default: {
        // Unknown events: just advance pointer & persist fresh attrs
        await updateSubscription({
          ...base,
          cumulative_quantity: stored.cumulative_quantity,
        });
        await markProcessed(eventKey);
        return new NextResponse(`Ignored event ${eventName}`, { status: 200 });
      }
    }

    await markProcessed(eventKey);
    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("Error processing Lemon Squeezy webhook:", error);
    // Acknowledge to prevent infinite retries for app-side issues
    return new NextResponse("Webhook processing error.", { status: 200 });
  }
}

export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
