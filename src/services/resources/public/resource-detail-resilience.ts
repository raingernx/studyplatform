type NonCriticalResourceDetailContext = {
  section: string;
  slug?: string;
  resourceId?: string;
  critical?: boolean;
};

function createTimeoutError(timeoutMs: number) {
  const error = new Error(`Resource detail task timed out after ${timeoutMs}ms`);
  error.name = "TimeoutError";
  return error;
}

function summarizeResourceDetailError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: String(error),
    name: "UnknownError",
  };
}

function isTimeoutLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "TimeoutError" ||
    error.message.toLowerCase().includes("timed out") ||
    error.message.toLowerCase().includes("timeout")
  );
}

export function logResourceDetailFailure(
  context: NonCriticalResourceDetailContext,
  error: unknown,
  elapsedMs: number,
  options?: {
    fallbackApplied?: boolean;
  },
) {
  const event = isTimeoutLikeError(error)
    ? "[RESOURCE_DETAIL_TIMEOUT]"
    : context.critical
      ? "[RESOURCE_DETAIL_CRITICAL_ERROR]"
      : "[RESOURCE_DETAIL_NON_CRITICAL_ERROR]";

  console.error(event, {
    critical: Boolean(context.critical),
    elapsedMs,
    fallbackApplied: Boolean(options?.fallbackApplied),
    ...context,
    error: summarizeResourceDetailError(error),
  });
}

export async function runNonCriticalResourceDetailTask<T>(
  loader: () => Promise<T>,
  options: {
    fallback: T;
    context: NonCriticalResourceDetailContext;
    timeoutMs?: number;
  },
): Promise<T> {
  const startedAt = Date.now();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    if (!options.timeoutMs) {
      return await loader();
    }

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(createTimeoutError(options.timeoutMs!));
      }, options.timeoutMs);
    });

    return await Promise.race([loader(), timeoutPromise]);
  } catch (error) {
    logResourceDetailFailure(
      {
        ...options.context,
        critical: false,
      },
      error,
      Date.now() - startedAt,
      {
        fallbackApplied: true,
      },
    );

    return options.fallback;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
