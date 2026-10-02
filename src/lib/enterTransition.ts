import { useEffect, useSyncExternalStore } from "react";
import type { IssueTheme } from "../data/publications";

// A cover clicked on the home page grows to fill the screen in the issue's
// own palette, then hands off to the reader. The overlay lives outside the
// routes so it survives the route change; the reader dismisses it on mount.
export interface EnterState {
  rect: { top: number; left: number; width: number; height: number };
  theme: IssueTheme;
  to: string;
  phase: "growing" | "waiting";
}
let state: EnterState | null = null;
const listeners = new Set<() => void>();
let token = 0;
function emit(next: EnterState | null) {
  state = next;
  listeners.forEach((listener) => listener());
}
export function startEnter(element: Element, theme: IssueTheme, to: string) {
  const { top, left, width, height } = element.getBoundingClientRect();
  emit({ rect: { top, left, width, height }, theme, to, phase: "growing" });
  // Safety net in case the reader never mounts (e.g. a bad link).
  const mine = ++token;
  window.setTimeout(() => mine === token && finishEnter(), 2600);
}
export function finishEnter() {
  if (state) emit(null);
}
// Returns the destination once, the first time the cover finishes growing.
export function takeGrownDestination() {
  if (state?.phase !== "growing") return null;
  state = { ...state, phase: "waiting" };
  return state.to;
}
export function useEnterState() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => state,
  );
}
export function useFinishEnterOnMount() {
  useEffect(() => {
    const timer = window.setTimeout(finishEnter, 120);
    return () => window.clearTimeout(timer);
  }, []);
}
