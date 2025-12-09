export const runtime = "nodejs";

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSubscriptionByUserId } from "@/lib/subscription-server";
import { getTier } from "@/lib/tiers-server";
import { getProjectsForUser } from "@/lib/project-server";
import { getCurrentUserId } from "@/lib/auth";

type FeatureKey =
  | "projectLimit"
  | "fullPromptGeneration"
  | "publicProjects"
  | "communityAccess"
  | "aiPromptEnhancement"
  | "support";

interface Payload {
  userId: string;
  feature: FeatureKey;
}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionProjectsCount =
      searchParams.get("subscriptionProjectsCount") === "true";

    const userId = await requireUser();

    if (subscriptionProjectsCount) {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }
      // Use server-side Firebase Admin SDK for proper Firebase App Hosting support
      const subscription = await getSubscriptionByUserId(userId);
      if (subscription === null) {
        return NextResponse.json({
          count: 1,
        });
      }

      return NextResponse.json({
        count: subscription.cumulative_quantity,
      });
    }

    // For any other GET usage on this route, return an explicit 400 so we
    // never fall through without a response.
    return NextResponse.json(
      { error: 'Unsupported query. Use subscriptionProjectsCount=true.' },
      { status: 400 }
    );
  } catch (e: any) {
    console.error('[subscription/features GET] Error:', e?.message || e, e?.stack);
    if (e?.message === '__unauthorized__') return NextResponse.json({ error: 'unauthorized' }, { status:401 });
    return NextResponse.json({ error: e?.message || 'unexpected error' }, { status:500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate payload
    const { userId, feature } = (await req.json()) as Partial<Payload>;
    if (!userId || !feature) {
      return NextResponse.json({ enabled: false });
    }

    // Subscription lookup
    const subs = await getSubscriptionByUserId(userId);
    if (!subs?.tier_id) {
      return NextResponse.json({ enabled: false });
    }

    // Tier + features lookup
    const tier = await getTier(subs.tier_id);
    if (!tier?.features) {
      return NextResponse.json({ enabled: false });
    }
    const { features } = tier;

    // Feature checks (same logic, clearer guards)
    switch (feature) {
      case "projectLimit": {
        const projects = await getProjectsForUser(userId);
        if (projects.length >= (features.projectLimit ?? 0)) {
          return NextResponse.json({ enabled: false });
        }
        break;
      }

      case "fullPromptGeneration":
        if (features.fullPromptGeneration !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "publicProjects":
        if (features.publicProjects !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "communityAccess":
        if (features.communityAccess !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "aiPromptEnhancement":
        if (features.aiPromptEnhancement !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "support":
        if (features.support !== "priority") {
          return NextResponse.json({ enabled: false });
        }
        break;

      default:
        return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({ enabled: true });
  } catch (error) {
    return NextResponse.json({ enabled: false });
  }
}
async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("__unauthorized__");
  return uid;
}
