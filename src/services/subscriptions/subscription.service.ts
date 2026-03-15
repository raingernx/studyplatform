import { findUserSubscription } from "@/repositories/subscriptions/subscription.repository";

export async function getUserSubscription(userId: string) {
  return findUserSubscription(userId);
}
