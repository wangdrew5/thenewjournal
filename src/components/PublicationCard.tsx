import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Publication } from "../data/publications";
import { glowVar, glowText } from "../lib/glow";
import GlowBackdrop from "./GlowBackdrop";

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
      <Link to={`/publication/${publication.id}`}>
        <div className="relative aspect-[3/4] w-full">
          <GlowBackdrop glow={glow} />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl">
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <motion.span
              initial={{ opacity: 0, y: 6 }}
              className="absolute right-4 bottom-4 flex items-center gap-1.5 text-xs font-medium tracking-wide text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:[transform:translateY(0)]"
            >
              Read issue
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </motion.span>
          </div>
        </div>
      </Link>

      <p className="mt-4 px-1 text-sm font-medium text-white/70 transition-colors duration-300 group-hover:text-white">
        {publication.caption}
      </p>
    </motion.article>
  );
}
