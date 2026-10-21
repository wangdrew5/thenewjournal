import { createContext } from "react";

/**
 * Where each page's scenery is in its looping animation, shared by every copy of that scene
 * the reader draws (the page at rest, and the copies on a turning leaf), so a hand-over
 * between copies continues from the exact same moment instead of being re-guessed.
 *
 * A scene's phase at time `t` is `t - offset`. An offset of 0 (the default) follows the
 * document clock, which is how scenes stay in step when they are drawn more than once.
 */
export interface SceneClock {
  /** Per scene: the start time its animations are pinned to. */
  offsets: Map<string, number>;
  /** Per scene: the phase a turning copy froze at, waiting for whatever replaces it. */
  held: Map<string, number>;
}

export const createSceneClock = (): SceneClock => ({ offsets: new Map(), held: new Map() });

/** Provided by the reader; scenes drawn without one simply follow the document clock. */
export const SceneClockContext = createContext<SceneClock | null>(null);
