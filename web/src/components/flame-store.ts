"use client";

import { useSyncExternalStore } from "react";

type State = { ready: boolean; signedIn: boolean; lit: Set<string>; own: Set<string> };

let state: State = { ready: false, signedIn: false, lit: new Set(), own: new Set() };
const listeners = new Set<() => void>();
const SERVER_STATE: State = state;

export function publishFlames(next: { signedIn: boolean; lit: string[]; own: string[] }) {
  state = {
    ready: true,
    signedIn: next.signedIn,
    lit: new Set([...state.lit, ...next.lit]),
    own: new Set([...state.own, ...next.own]),
  };
  listeners.forEach((listener) => listener());
}

export function setFlameLit(key: string, lit: boolean) {
  const nextLit = new Set(state.lit);
  if (lit) nextLit.add(key);
  else nextLit.delete(key);
  state = { ...state, lit: nextLit };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFlameState() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
