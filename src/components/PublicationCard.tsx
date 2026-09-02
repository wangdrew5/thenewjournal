import { motion } from "framer-motion";
import type { Publication } from "../data/publications";

const glowVar: Record<Publication["glow"], string> = {
  cyan: "var(--color-cyan)",
  pink: "var(--color-pink)",
  violet: "var(--color-violet)",
  amber: "var(--color-amber)",
  lime: "var(--color-lime)",
  blue: "var(--color-blue)",
};

const glowText: Record<Publication["glow"], string> = {
  cyan: "text-cyan",
  pink: "text-pink",
  violet: "text-violet",
  amber: "text-amber",
  lime: "text-lime",
  blue: "text-blue",
};

interface Props {
  publication: Publication;
  index: number;
}

export default function PublicationCard({ publication, index }: Props) {
  const glow = glowVar[publication.glow];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <div
        style={{ "--glow-color": glow } as React.CSSProperties}
        className="glow-ring relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/10 bg-panel transition-shadow duration-500"
      >
        {/* Placeholder cover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-panel-2 via-panel to-black/60">
          <svg
            viewBox="0 0 24 24"
            className={`h-10 w-10 opacity-70 transition-transform duration-500 group-hover:scale-110 ${glowText[publication.glow]}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="18" height="16" rx="2.2" />
            <path d="M3 9h18" />
            <path d="M8 4v5" />
          </svg>
          <span className="font-display text-xs font-medium tracking-[0.3em] text-white/35 uppercase">
            Cover Placeholder
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <p className="mt-4 px-1 text-sm font-medium text-white/70 transition-colors duration-300 group-hover:text-white">
        {publication.caption}
      </p>
    </motion.article>
  );
}
