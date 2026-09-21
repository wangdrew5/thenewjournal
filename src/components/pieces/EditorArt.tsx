import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { GlowColor } from "../../data/publications";
import { glowVar, glowText } from "../../lib/glow";

interface Props {
  caption: string;
  glow: GlowColor;
}

export default function EditorArt({ caption, glow }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(x, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(y, [-0.5, 0.5], ["20%", "80%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, "--glow-color": glowVar[glow] } as React.CSSProperties}
        className="glow-ring relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-panel"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, color-mix(in srgb, ${glowVar[glow]} 22%, transparent), transparent 60%)`,
            ),
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-panel-2 via-panel to-black/60">
          <svg
            viewBox="0 0 24 24"
            className={`h-9 w-9 opacity-60 ${glowText[glow]}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
          <span className="font-display px-8 text-center text-xs font-medium tracking-[0.25em] text-white/35 uppercase">
            {caption}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
