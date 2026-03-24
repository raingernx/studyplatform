"use client";

import { useSyncExternalStore } from "react";

export type ResourcesNavigationMode = "discover" | "listing";

export interface ResourcesNavigationState {
  id: number;
  mode: ResourcesNavigationMode | null;
  href: string | null;
  startedAt: number;
}

let nextNavigationId = 1;
let state: ResourcesNavigationState = {
  id: 0,
  mode: null,
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

export function canonicalizeResourcesHref(href: string) {
  const url = new URL(href, "http://resources.local");
  const search = canonicalizeSearch(url.search);
  return search ? `${url.pathname}?${search}` : url.pathname;
}

export function beginResourcesNavigation(mode: ResourcesNavigationMode, href: string) {
  state = {
    id: nextNavigationId++,
    mode,
    href: canonicalizeResourcesHref(href),
    startedAt: Date.now(),
  };
  emit();
}

export function clearResourcesNavigation(id: number) {
  if (state.id !== id) {
    return;
  }

  state = {
    id: 0,
    mode: null,
    href: null,
    startedAt: 0,
  };
  emit();
}

export function useResourcesNavigationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
