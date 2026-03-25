import { isTransientPrismaInfrastructureError } from "@/lib/prismaErrors";

export async function runWithConcurrencyLimit<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new Error("Concurrency limit must be at least 1.");
  }

  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );

  return results;
}

export async function runBestEffortAsync<T>(
  loader: () => Promise<T>,
  options: {
    fallback: T;
    warningLabel?: string;
  },
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (!isTransientPrismaInfrastructureError(error)) {
      throw error;
    }

    if (options.warningLabel) {
      console.warn(options.warningLabel, error);
    }

    return options.fallback;
  }
}
