export const runtime = "nodejs";

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getSubscriptionByUserId } from "@/lib/subscription-server";
import { getTier } from "@/lib/tiers-server";
import { executionFollowUp, type ExecutionFollowUpInput } from "@/ai/flows/execution-follow-up";

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("__unauthorized__");
  return uid;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUser();

    // Check if user has access to this feature
    const subscription = await getSubscriptionByUserId(userId);
    if (!subscription?.tier_id) {
      return NextResponse.json(
        { error: "Subscription not found. Please upgrade to Pro tier to access this feature." },
        { status: 403 }
      );
    }

    const tier = await getTier(subscription.tier_id);
    if (!tier?.features?.executionFollowUpAgent) {
      return NextResponse.json(
        { error: "This feature is only available for Pro tier users. Please upgrade to access the Execution Follow-Up Agent." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json() as Partial<ExecutionFollowUpInput>;
    const { originalPrompt, actualOutput, desiredOutcome, aiTool } = body;

    // Validate required fields
    if (!originalPrompt || !actualOutput) {
      return NextResponse.json(
        { error: "Both 'originalPrompt' and 'actualOutput' are required." },
        { status: 400 }
      );
    }

    // Call the execution follow-up flow
    const result = await executionFollowUp({
      originalPrompt,
      actualOutput,
      desiredOutcome,
      aiTool,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[execution-follow-up POST] Error:', error?.message || error, error?.stack);
    if (error?.message === "__unauthorized__") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

