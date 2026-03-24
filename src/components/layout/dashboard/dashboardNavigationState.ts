"use client";

import { useSyncExternalStore } from "react";

export interface DashboardNavigationState {
  id: number;
  href: string | null;
  startedAt: number;
}

let nextNavigationId = 1;
let state: DashboardNavigationState = {
  id: 0,
  href: null,
  startedAt: 0,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function canonicalizeSearch(input: string) {
  const params = new URLSearchParams(input);
  const entries = Array.from(params.entries()).sort(([keyA, valueA], [keyB, valueB]) => {
    if (keyA === keyB) {
      return valueA.localeCompare(valueB);
    }

    return keyA.localeCompare(keyB);
  });

  return new URLSearchParams(entries).toString();
}

export function canonicalizeDashboardHref(href: string) {
  const url = new URL(href, "http://dashboard.local");
  const search = canonicalizeSearch(url.search);
  return search ? `${url.pathname}?${search}` : url.pathname;
}

export function beginDashboardNavigation(href: string) {
  state = {
    id: nextNavigationId++,
    href: canonicalizeDashboardHref(href),
    startedAt: Date.now(),
  };
  emit();
}

export function clearDashboardNavigation(id: number) {
  if (state.id !== id) {
    return;
  }

  state = {
    id: 0,
    href: null,
    startedAt: 0,
  };
  emit();
}

export function useDashboardNavigationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
