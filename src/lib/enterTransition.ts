import { useEffect, useSyncExternalStore } from "react";
import type { IssueTheme } from "../data/publications";

// Opening an issue: the book's cover grows to fill the screen in the issue's
// own palette, then hands off to the reader. Leaving an issue runs it in
// reverse: the screen shrinks back onto the book, which then slides back into
// the shelf. The overlay lives outside the routes so it survives route changes.
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface EnterState {
  kind: "enter";
  rect: Rect;
  theme: IssueTheme;
  /** The cover has filled the screen / the reader has mounted behind it. */
  grown: boolean;
  ready: boolean;
}
export interface ReturnState {
  kind: "return";
  id: string;
  theme: IssueTheme;
  /** The book cover to shrink onto, once the shelf has measured it. */
  target: Rect | null;
}
type State = EnterState | ReturnState | null;

let state: State = null;
const listeners = new Set<() => void>();
let token = 0;
function emit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}
function measure(element: Element): Rect {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { top, left, width, height };
}
// Clears the overlay if nothing else does (e.g. a bad link or a missing book).
function safetyNet(finish: () => void) {
  const mine = ++token;
  window.setTimeout(() => mine === token && finish(), 2600);
}

// The route changes at the click, so the reader loads while the cover grows over it;
// the overlay lifts once it has filled the screen and the reader is there.
export function startEnter(element: Element, theme: IssueTheme) {
  emit({ kind: "enter", rect: measure(element), theme, grown: false, ready: false });
  safetyNet(finishEnter);
}
export function finishEnter() {
  if (state?.kind === "enter") emit(null);
}
export function markGrown() {
  if (state?.kind !== "enter") return;
  if (state.ready) emit(null);
  else state = { ...state, grown: true };
}
function markReady() {
  if (state?.kind !== "enter") return;
  if (state.grown) emit(null);
  else state = { ...state, ready: true };
}

export function startReturn(id: string, theme: IssueTheme) {
  emit({ kind: "return", id, theme, target: null });
  safetyNet(finishReturn);
}
export function setReturnTarget(element: Element) {
  if (state?.kind === "return" && !state.target)
    emit({ ...state, target: measure(element) });
}
export function finishReturn() {
  if (state?.kind === "return") emit(null);
}

export function useEnterState() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => state,
    () => null,
  );
}
export function useFinishEnterOnMount() {
  useEffect(() => {
    markReady();
  }, []);
}
