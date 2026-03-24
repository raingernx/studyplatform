import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

const PERFORMANCE_DEBUG_LOGS_ENABLED = process.env.PERFORMANCE_DEBUG_LOGS === "1";
const PERFORMANCE_MONITORING_ENABLED =
  PERFORMANCE_DEBUG_LOGS_ENABLED || process.env.PERFORMANCE_MONITORING === "1";
const DEFAULT_SLOW_QUERY_MS = Number(process.env.PERFORMANCE_SLOW_QUERY_MS ?? "75");

type PerformanceDetails = Record<string, unknown>;

type Aggregate = {
  count: number;
  totalMs: number;
  maxMs: number;
};

type CacheAggregate = {
  calls: number;
  misses: number;
};

type SlowQueryRecord = {
  signature: string;
  durationMs: number;
};

type RequestTraceState = {
  route: string;
  startedAt: number;
  details: PerformanceDetails;
  queryCount: number;
  totalQueryMs: number;
  queryAggregates: Map<string, Aggregate>;
  serviceAggregates: Map<string, Aggregate>;
  cacheAggregates: Map<string, CacheAggregate>;
  slowQueries: SlowQueryRecord[];
};

const requestTraceStorage = new AsyncLocalStorage<RequestTraceState>();

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function logPerformanceEvent(
  event: string,
  details: PerformanceDetails = {},
) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return;
  }

  console.info(`[PERF] ${event}`, details);
}

function recordAggregate(target: Map<string, Aggregate>, name: string, elapsedMs: number) {
  const existing = target.get(name);

  if (!existing) {
    target.set(name, {
      count: 1,
      totalMs: elapsedMs,
      maxMs: elapsedMs,
    });
    return;
  }

  existing.count += 1;
  existing.totalMs += elapsedMs;
  existing.maxMs = Math.max(existing.maxMs, elapsedMs);
}

function summarizeAggregates(target: Map<string, Aggregate>, limit = 8) {
  return Array.from(target.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      totalMs: stats.totalMs,
      maxMs: stats.maxMs,
      avgMs: Math.round((stats.totalMs / stats.count) * 100) / 100,
    }))
    .sort((left, right) => {
      if (right.totalMs !== left.totalMs) {
        return right.totalMs - left.totalMs;
      }

      return right.count - left.count;
    })
    .slice(0, limit);
}

function summarizeCacheAggregates(target: Map<string, CacheAggregate>) {
  return Array.from(target.entries())
    .map(([name, stats]) => ({
      name,
      calls: stats.calls,
      misses: stats.misses,
      hits: Math.max(0, stats.calls - stats.misses),
    }))
    .sort((left, right) => right.calls - left.calls);
}

export function isPerformanceMonitoringEnabled() {
  return PERFORMANCE_MONITORING_ENABLED;
}

export function recordCacheCall(name: string, details: PerformanceDetails = {}) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return;
  }

  const state = requestTraceStorage.getStore();
  if (state) {
    const existing = state.cacheAggregates.get(name);
    if (!existing) {
      state.cacheAggregates.set(name, { calls: 1, misses: 0 });
    } else {
      existing.calls += 1;
    }
  }

  logPerformanceEvent("cache_call", { name, ...details });
}

export function recordCacheMiss(name: string, details: PerformanceDetails = {}) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return;
  }

  const state = requestTraceStorage.getStore();
  if (state) {
    const existing = state.cacheAggregates.get(name);
    if (!existing) {
      state.cacheAggregates.set(name, { calls: 0, misses: 1 });
    } else {
      existing.misses += 1;
    }
  }

  logPerformanceEvent("cache_miss", { name, ...details });
}

export function recordPrismaQuery(details: {
  model?: string;
  action: string;
  durationMs: number;
}) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return;
  }

  const signature = details.model
    ? `${details.model}.${details.action}`
    : `raw.${details.action}`;
  const state = requestTraceStorage.getStore();

  if (state) {
    state.queryCount += 1;
    state.totalQueryMs += details.durationMs;
    recordAggregate(state.queryAggregates, signature, details.durationMs);

    if (details.durationMs >= DEFAULT_SLOW_QUERY_MS) {
      state.slowQueries.push({
        signature,
        durationMs: details.durationMs,
      });
    }
  }

  if (details.durationMs >= DEFAULT_SLOW_QUERY_MS) {
    logPerformanceEvent("prisma_query_slow", {
      signature,
      durationMs: details.durationMs,
      route: state?.route,
    });
  }
}

export async function traceServerStep<T>(
  name: string,
  work: () => Promise<T>,
  details: PerformanceDetails = {},
) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return work();
  }

  const startedAt = Date.now();

  try {
    const result = await work();
    const elapsedMs = Date.now() - startedAt;
    const state = requestTraceStorage.getStore();

    if (state) {
      recordAggregate(state.serviceAggregates, name, elapsedMs);
    }

    logPerformanceEvent("service_step", {
      name,
      elapsedMs,
      route: state?.route,
      ...details,
    });

    return result;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    logPerformanceEvent("service_step_fail", {
      name,
      elapsedMs,
      route: requestTraceStorage.getStore()?.route,
      error: normalizeError(error),
      ...details,
    });
    throw error;
  }
}

export async function withRequestPerformanceTrace<T>(
  route: string,
  details: PerformanceDetails,
  work: () => Promise<T>,
) {
  if (!PERFORMANCE_MONITORING_ENABLED) {
    return work();
  }

  const state: RequestTraceState = {
    route,
    startedAt: Date.now(),
    details,
    queryCount: 0,
    totalQueryMs: 0,
    queryAggregates: new Map(),
    serviceAggregates: new Map(),
    cacheAggregates: new Map(),
    slowQueries: [],
  };

  return requestTraceStorage.run(state, async () => {
    logPerformanceEvent("request_start", { route, ...details });

    try {
      const result = await work();
      const elapsedMs = Date.now() - state.startedAt;

      logPerformanceEvent("request_summary", {
        route,
        ...details,
        elapsedMs,
        queryCount: state.queryCount,
        totalQueryMs: state.totalQueryMs,
        topQueries: summarizeAggregates(state.queryAggregates),
        topServiceCalls: summarizeAggregates(state.serviceAggregates),
        cache: summarizeCacheAggregates(state.cacheAggregates),
        slowQueries: state.slowQueries
          .sort((left, right) => right.durationMs - left.durationMs)
          .slice(0, 8),
      });

      return result;
    } catch (error) {
      const elapsedMs = Date.now() - state.startedAt;

      logPerformanceEvent("request_fail", {
        route,
        ...details,
        elapsedMs,
        queryCount: state.queryCount,
        totalQueryMs: state.totalQueryMs,
        topQueries: summarizeAggregates(state.queryAggregates),
        topServiceCalls: summarizeAggregates(state.serviceAggregates),
        cache: summarizeCacheAggregates(state.cacheAggregates),
        slowQueries: state.slowQueries
          .sort((left, right) => right.durationMs - left.durationMs)
          .slice(0, 8),
        error: normalizeError(error),
      });

      throw error;
    }
  });
}

export async function withPerformanceTiming<T>(
  event: string,
  details: PerformanceDetails,
  work: () => Promise<T>,
) {
  const startedAt = Date.now();
  logPerformanceEvent(`${event}:start`, details);

  try {
    const result = await work();
    logPerformanceEvent(`${event}:done`, {
      ...details,
      elapsedMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logPerformanceEvent(`${event}:fail`, {
      ...details,
      elapsedMs: Date.now() - startedAt,
      error: normalizeError(error),
    });
    throw error;
  }
}
