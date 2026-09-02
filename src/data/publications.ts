export type GlowColor = "cyan" | "pink" | "violet" | "amber" | "lime" | "blue";

export interface Publication {
  id: string;
  caption: string;
  glow: GlowColor;
}

export const publications: Publication[] = [
  { id: "pub-1", caption: "Untitled Publication — coming soon", glow: "cyan" },
  { id: "pub-2", caption: "Untitled Publication — coming soon", glow: "pink" },
  { id: "pub-3", caption: "Untitled Publication — coming soon", glow: "violet" },
  { id: "pub-4", caption: "Untitled Publication — coming soon", glow: "amber" },
  { id: "pub-5", caption: "Untitled Publication — coming soon", glow: "lime" },
  { id: "pub-6", caption: "Untitled Publication — coming soon", glow: "blue" },
];
