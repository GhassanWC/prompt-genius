// app/api/lemon/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  updateSubscription,
  createSubscription,
  getSubscriptionByUserId,
} from "@/lib/subscription-server";
import { addMonths, isEqual } from "date-fns";
const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

/* -------------------- utils -------------------- */
function safeEqualHex(aHex: string, bHex: string) {
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function deriveTierAndQuantity(variantName?: string) {
  const v = variantName?.toLowerCase() ?? "";
  if (v.includes("plus")) return { tierId: "plus", quantity: 10 };
  if (v.includes("pro")) return { tierId: "pro", quantity: 30 };
  return { tierId: null, quantity: 0 };
}

/* -------------------- handler -------------------- */
export async function POST(req: NextRequest) {
  if (!secret) {
    console.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET");
    return new NextResponse("Server misconfigured.", { status: 500 });
  }

  // Read raw body for signature verification
  let rawBody: ArrayBuffer;
  try {
    rawBody = await req.arrayBuffer();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const digestHex = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(rawBody))
    .digest("hex");

  const signatureHex = (req.headers.get("x-signature") ?? "").trim();
  if (!safeEqualHex(digestHex, signatureHex)) {
    return new NextResponse("Invalid signature.", { status: 401 });
  }

  // Parse payload JSON
  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(rawBody).toString("utf8"));
  } catch {
    return new NextResponse("Invalid JSON.", { status: 400 });
  }

  const meta = payload?.meta ?? {};
  const data = payload?.data ?? {};
  const eventName: string | undefined = meta?.event_name;
  const userId: string | undefined = meta?.custom_data?.user_id;
  const subscriptionId: string | undefined = data?.id;
  const attrs = data?.attributes ?? {};

  if (!eventName || !userId || !subscriptionId) {
    return new NextResponse("Ignored (missing required fields).", { status: 200 });
  }

  const { tierId, quantity } = deriveTierAndQuantity(attrs.variant_name);
  const status = (attrs.status ?? "").toLowerCase();

  const stored = await getSubscriptionByUserId(userId);
  const base = {
    user_id: userId,
    subscription_id: subscriptionId,
    tier_id: tierId ?? stored?.tier_id ?? null,
    cumulative_quantity: stored?.cumulative_quantity ?? 0,
    status,
    ...attrs,
  };

  try {
    if (!stored) {
      await createSubscription({
        ...base,
        cumulative_quantity: quantity > 0 ? quantity : 0,
      });
      return new NextResponse("Created", { status: 200 });
    }

    switch (eventName) {
      case "subscription_created":
        await updateSubscription({
          ...base,
          cumulative_quantity: stored.cumulative_quantity + (quantity > 0 ? quantity : 0),
        });
        break;

      case "subscription_updated":
        if (status === "active" && 
            !isEqual(attrs.renews_at, stored.renews_at)
          && attrs.variant_name === stored.variant_name) {
          await updateSubscription({
            ...base,
            cumulative_quantity: stored.cumulative_quantity + (quantity > 0 ? quantity : 0),
          });
        }
        break;

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_resumed":
      case "subscription_paused":
      case "subscription_unpaused":
        await updateSubscription({ ...base, cumulative_quantity: stored.cumulative_quantity });
        break;

      default:
        await updateSubscription({ ...base, cumulative_quantity: stored.cumulative_quantity });
        return new NextResponse(`Ignored event ${eventName}`, { status: 200 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Webhook processing error.", { status: 200 });
  }
}

export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
