import { useSyncExternalStore } from "react";

// The table by lamplight (dark, the default) or by daylight (light). The choice is
// kept in this browser and set on <html> straight away so the page never flashes.
export type ColorMode = "dark" | "light";
const KEY = "tnj:mode:v1";
const listeners = new Set<() => void>();

function read(): ColorMode {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
let mode = read();
document.documentElement.dataset.mode = mode;

export function setColorMode(next: ColorMode) {
  mode = next;
  document.documentElement.dataset.mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
  listeners.forEach((listener) => listener());
}

export function useColorMode() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => mode,
    () => "dark" as ColorMode,
  );
}
