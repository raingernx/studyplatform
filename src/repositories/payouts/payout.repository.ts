import { prisma } from "@/lib/prisma";

export async function getCreatorPayoutSummary(authorId: string) {
  const [totals, latestPayout] = await Promise.all([
    prisma.payout.aggregate({
      where: { authorId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.payout.findFirst({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
      },
    }),
  ]);

  return {
    count: totals._count.id ?? 0,
    totalPayouts: totals._sum.amount ?? 0,
    latestCreatedAt: latestPayout?.createdAt ?? null,
  };
}

export async function getCreatorPayouts(authorId: string) {
  return prisma.payout.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function sumCreatorPayouts(authorId: string) {
  const totals = await prisma.payout.aggregate({
    where: { authorId },
    _sum: {
      amount: true,
    },
  });

  return totals._sum.amount ?? 0;
}
