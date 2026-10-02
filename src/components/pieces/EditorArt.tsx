import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { GlowColor } from "../../data/publications";
import { glowVar } from "../../lib/glow";
import GlowBackdrop from "../GlowBackdrop";

interface Props {
  caption: string;
  glow: GlowColor;
  imageSrc: string;
  imageAlt?: string;
}

export default function EditorArt({
  caption,
  glow,
  imageSrc,
  imageAlt,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });
  const glowX = useTransform(x, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(y, [-0.5, 0.5], ["20%", "80%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
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
        style={reduced ? {} : { rotateX, rotateY }}
        className="editor-art relative aspect-[4/5] w-full"
      >
        <GlowBackdrop glow={glowVar[glow]} />

        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background: useTransform(
                [glowX, glowY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx} ${gy}, color-mix(in srgb, ${glowVar[glow]} 22%, transparent), transparent 60%)`,
              ),
            }}
          />
          <img
            src={imageSrc}
            alt={imageAlt ?? caption}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      </motion.div>
    </div>
  );
}
