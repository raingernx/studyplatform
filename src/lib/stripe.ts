import Stripe from "stripe";
import { env } from "@/env";

// Server-side Stripe client (secret key)
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  typescript: true,
});

// Subscription plan IDs – map to Stripe Price IDs in your dashboard
export const SUBSCRIPTION_PLANS = {
  pro_monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_annual: env.STRIPE_PRO_ANNUAL_PRICE_ID,
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
