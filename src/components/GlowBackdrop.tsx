interface Props {
  glow: string;
  radius?: string;
}

export default function GlowBackdrop({ glow, radius = "rounded-3xl" }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${radius}`}
      style={{
        background: "linear-gradient(135deg, var(--color-panel-2), var(--color-panel) 55%, #000)",
        boxShadow: `0 0 30px 8px color-mix(in srgb, ${glow} 32%, transparent), 0 0 80px 20px color-mix(in srgb, ${glow} 15%, transparent)`,
        filter: "blur(22px)",
      }}
    />
  );
}
