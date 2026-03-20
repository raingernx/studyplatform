import { prisma } from "@/lib/prisma";

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
