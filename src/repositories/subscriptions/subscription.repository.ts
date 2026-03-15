import { prisma } from "@/lib/prisma";

export async function findUserSubscription(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });
}
