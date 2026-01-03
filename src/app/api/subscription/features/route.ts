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
  | "executionFollowUpAgent"
  | "promptPlayground"
  | "cloning"
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
      
      // Determine tier_id: use subscription tier if exists, otherwise use 'free'
      const tierId = subscription?.tier_id || 'free';
      const tier = await getTier(tierId);
      
      // Get project limit: from subscription cumulative_quantity if exists, otherwise from tier's projectLimit
      let projectLimit: number;
      if (subscription?.cumulative_quantity) {
        projectLimit = subscription.cumulative_quantity;
      } else {
        // No subscription or no cumulative_quantity - get project limit from tiers collection
        projectLimit = tier?.features?.projectLimit ?? 1;
      }

      return NextResponse.json({
        count: projectLimit,
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
    
    // Determine tier_id: use subscription tier if exists, otherwise use 'free'
    const tierId = subs?.tier_id || 'free';
    
    // Tier + features lookup from tiers collection based on subscription plan
    const tier = await getTier(tierId);
    if (!tier?.features) {
      return NextResponse.json({ enabled: false });
    }
    const { features } = tier;

    // Feature checks (same logic, clearer guards)
    // Handle predefined features
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

      case "executionFollowUpAgent":
        if (features.executionFollowUpAgent !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "promptPlayground":
        if (features.promptPlayground !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "cloning":
        if (features.cloning !== true) {
          return NextResponse.json({ enabled: false });
        }
        break;

      case "support":
        if (features.support !== "priority") {
          return NextResponse.json({ enabled: false });
        }
        break;

      default:
        // Handle custom features - check if the feature exists and is truthy
        const featureValue = features[feature];
        if (featureValue === undefined || featureValue === null || featureValue === false) {
          return NextResponse.json({ enabled: false });
        }
        // For boolean custom features, check if true
        if (typeof featureValue === 'boolean' && featureValue !== true) {
          return NextResponse.json({ enabled: false });
        }
        // For other types (string, number), if they exist and are truthy, allow access
        break;
    }

    return NextResponse.json({ enabled: true });
  } catch (error: any) {
    console.error('[subscription/features POST] Error:', error?.message || error, error?.stack);
    return NextResponse.json({ enabled: false });
  }
}
async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("__unauthorized__");
  return uid;
}
