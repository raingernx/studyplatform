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

export async function findAdminUsers(params: {
  query?: string;
  take: number;
}) {
  const query = params.query?.trim();

  return prisma.user.findMany({
    take: params.take,
    orderBy: { createdAt: "desc" },
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { resources: true } },
    },
  });
}

export async function findAdminUserLookup(params: {
  query?: string;
  take: number;
}) {
  const query = params.query?.trim();

  return prisma.user.findMany({
    take: params.take,
    orderBy: { name: "asc" },
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export function findAdminsWithAuditLogs() {
  return prisma.user.findMany({
    where: { auditLogs: { some: {} } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export function findUserSettingsProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      providerImage: true,
      hashedPassword: true,
      createdAt: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      accounts: {
        select: { provider: true },
      },
    },
  });
}

export function updateUserProfileById(input: {
  userId: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  return prisma.user.update({
    where: { id: input.userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
    },
    select: { name: true, email: true, image: true },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export function findUserAuthCandidateByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      hashedPassword: true,
      emailVerified: true,
    },
  });
}

export function createRegisteredUser(input: {
  name: string;
  email: string;
  hashedPassword: string;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      hashedPassword: input.hashedPassword,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

export function updateUserPasswordByEmail(email: string, hashedPassword: string) {
  return prisma.user.update({
    where: { email },
    data: { hashedPassword },
    select: { id: true, email: true },
  });
}

export function verifyUserEmailByEmail(email: string) {
  return prisma.user.updateMany({
    where: { email, emailVerified: null },
    data: { emailVerified: new Date() },
  });
}
