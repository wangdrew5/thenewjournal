import { useSyncExternalStore } from "react";

// How a reader likes their pages: the size of the text and the tone of the paper.
// Kept in this browser and set on <html> at once so a page never flashes the wrong way.
export const READ_SIZES = [0.9, 1, 1.15, 1.32] as const;
export type ReadTone = "paper" | "night";
export interface ReadingPrefs {
  size: number;
  tone: ReadTone;
}
const KEY = "tnj:read:v1";
const DEFAULT: ReadingPrefs = { size: 1, tone: "paper" };
const listeners = new Set<() => void>();

function read(): ReadingPrefs {
  if (typeof localStorage === "undefined") return DEFAULT;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ReadingPrefs> | null;
    const size = Number.isInteger(raw?.size) && raw!.size! >= 0 && raw!.size! < READ_SIZES.length ? raw!.size! : DEFAULT.size;
    return { size, tone: raw?.tone === "night" ? "night" : "paper" };
  } catch {
    return DEFAULT;
  }
}
let prefs = read();
function apply() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.readSize = String(prefs.size);
  root.dataset.readTone = prefs.tone;
}
apply();

export function setReadingPrefs(update: Partial<ReadingPrefs>) {
  prefs = { ...prefs, ...update };
  apply();
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* the choice lasts for this visit only */
  }
  listeners.forEach((listener) => listener());
}

export function useReadingPrefs() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => prefs,
    () => DEFAULT,
  );
}
