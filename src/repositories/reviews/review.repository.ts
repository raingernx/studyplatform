import { prisma } from "@/lib/prisma";

export interface CreateReviewRecordInput {
  userId: string;
  resourceId: string;
  rating: number;
  body?: string | null;
}

export async function findReviewByUserAndResource(userId: string, resourceId: string) {
  return prisma.review.findUnique({
    where: {
      userId_resourceId: {
        userId,
        resourceId,
      },
    },
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findReviewById(reviewId: string) {
  return prisma.review.findUnique({
    where: {
      id: reviewId,
    },
    select: {
      id: true,
      isVisible: true,
    },
  });
}

export async function createReviewRecord(input: CreateReviewRecordInput) {
  return prisma.review.create({
    data: {
      userId: input.userId,
      resourceId: input.resourceId,
      rating: input.rating,
      isVisible: true,
      body: input.body ?? null,
    },
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function updateReviewRecord(
  reviewId: string,
  input: Pick<CreateReviewRecordInput, "rating" | "body">,
) {
  return prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      rating: input.rating,
      body: input.body ?? null,
    },
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function findAdminReviews(take = 50) {
  return prisma.review.findMany({
    take,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      rating: true,
      body: true,
      isVisible: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function setReviewVisibility(reviewId: string, isVisible: boolean) {
  return prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      isVisible,
    },
    select: {
      id: true,
      isVisible: true,
      updatedAt: true,
    },
  });
}

export async function getResourceReviews(resourceId: string, take = 5) {
  return prisma.review.findMany({
    where: {
      resourceId,
      isVisible: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function getResourceRatingSummary(resourceId: string) {
  return prisma.review.aggregate({
    where: {
      resourceId,
      isVisible: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });
}

export async function getResourceRatingSummaries(resourceIds: string[]) {
  if (resourceIds.length === 0) {
    return [];
  }

  return prisma.review.groupBy({
    by: ["resourceId"],
    where: {
      resourceId: {
        in: resourceIds,
      },
      isVisible: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });
}
