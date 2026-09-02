import type { GlowColor } from "../data/publications";

export const glowVar: Record<GlowColor, string> = {
  cyan: "var(--color-cyan)",
  pink: "var(--color-pink)",
  violet: "var(--color-violet)",
  amber: "var(--color-amber)",
  lime: "var(--color-lime)",
  blue: "var(--color-blue)",
};

export const glowText: Record<GlowColor, string> = {
  cyan: "text-cyan",
  pink: "text-pink",
  violet: "text-violet",
  amber: "text-amber",
  lime: "text-lime",
  blue: "text-blue",
};
