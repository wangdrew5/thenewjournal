import { motion } from "framer-motion";
import type { GlowColor } from "../../data/publications";
import { glowText } from "../../lib/glow";

interface Props {
  label: string;
  title: string;
  author: string;
  glow: GlowColor;
}

export default function PieceHeader({ label, title, author, glow }: Props) {
  return (
    <div className="mb-10">
      <motion.h1
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-glow-white text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        <span className={glowText[glow]}>{label}:</span> {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2 text-sm tracking-wide text-white/50 italic"
      >
        By {author}
      </motion.p>
    </div>
  );
}
