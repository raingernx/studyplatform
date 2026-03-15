import { prisma } from "@/lib/prisma";

export async function findCheckoutUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });
}

export async function updateUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId },
  });
}

export interface ActivateUserStripeSubscriptionInput {
  userId: string;
  stripeSubscriptionId: string;
  subscriptionPlan: string | null;
  currentPeriodEnd: Date;
}

export async function activateUserStripeSubscription(
  input: ActivateUserStripeSubscriptionInput,
) {
  return prisma.user.update({
    where: { id: input.userId },
    data: {
      stripeSubscriptionId: input.stripeSubscriptionId,
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: input.subscriptionPlan,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });
}
