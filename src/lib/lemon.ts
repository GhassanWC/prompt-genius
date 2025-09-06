"use server";

import { getSubscriptionByUserId } from "./subscription-server";

const API_BASE_URL = "https://api.lemonsqueezy.com/v1";

const PLAN_IDS = {
  plus: process.env.LEMONSQUEEZY_PLUS_PLAN_ID,
  pro: process.env.LEMONSQUEEZY_PRO_PLAN_ID,
};

async function apiRequest(path: string, options: RequestInit = {}) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not configured.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Accept", "application/vnd.api+json");
  headers.set("Content-Type", "application/vnd.api+json");

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.errors?.[0]?.detail || `API error: ${response.statusText}`;
    console.error("Lemon Squeezy API Error:", data);
    throw new Error(errorMessage);
  }

  return data;
}

export async function createCheckout(
  plan: "plus" | "pro",
  userId: string,
  email: string,
  name: string,
  subscriptionPlan: string
): Promise<string> {
  const planId = PLAN_IDS[plan];
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  if (subscriptionPlan == "plus" || subscriptionPlan == "pro") {
    throw new Error(
      `Please unsubscribe from the ${subscriptionPlan} plan to upgrade to the new ${plan} plan.`
    );
  }

  // Enhanced validation with detailed error messages
  if (!process.env.LEMONSQUEEZY_API_KEY) {
    throw new Error(
      "LEMONSQUEEZY_API_KEY is not configured in environment variables."
    );
  }

  if (!storeId) {
    throw new Error(
      "LEMONSQUEEZY_STORE_ID is not configured in environment variables."
    );
  }

  if (!planId) {
    throw new Error(
      `Plan ID for "${plan}" is not configured in environment variables. Check LEMONSQUEEZY_${plan.toUpperCase()}_PLAN_ID.`
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not configured in environment variables."
    );
  }

  // Log configuration for debugging
  console.log("Lemon Squeezy Checkout Configuration:", {
    plan,
    planId,
    storeId,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
  });

  try {
    const subscription = await getSubscriptionByUserId(userId);
    if (subscription && subscription.status === "active") { 
      throw new Error(
        `You already have an active subscription. Please cancel it before subscribing to a new plan.`
      );
    }

    const response = await apiRequest("checkouts", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email,
              name,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?checkout=success`,
              enabled_variants: [planId],
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: planId,
              },
            },
          },
        },
      }),
    });

    return response.data.attributes.url;
  } catch (e: any) {
    console.error("Lemon Squeezy checkout creation failed:", {
      error: e.message,
      plan,
      planId,
      storeId,
      userId,
      email,
    });

    // Provide more specific error messages
    if (e.message.includes("related resource does not exist")) {
      throw new Error(
        `The variant (${planId}) or store (${storeId}) does not exist. Please check your Lemon Squeezy configuration.`
      );
    }

    if (e.message.includes("unauthorized")) {
      throw new Error(
        "Invalid API key. Please check your LEMONSQUEEZY_API_KEY configuration."
      );
    }

    throw new Error(`Checkout creation failed: ${e.message}`);
  }
}

