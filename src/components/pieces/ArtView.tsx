import { motion } from "framer-motion";
import type { ArtPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";
import { glowVar, glowText } from "../../lib/glow";

interface Props {
  piece: ArtPiece;
}

export default function ArtView({ piece }: Props) {
  const hasNote = Boolean(piece.editorNote);

  return (
    <div>
      <PieceHeader label="Art" title={piece.title} author={piece.author} glow={piece.glow} />

      <div className={`grid grid-cols-1 gap-12 ${hasNote ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.015, rotate: -0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ "--glow-color": glowVar[piece.glow] } as React.CSSProperties}
          className="glow-ring group relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-panel"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-panel-2 via-panel to-black/60">
            <svg
              viewBox="0 0 24 24"
              className={`h-12 w-12 opacity-60 transition-transform duration-500 group-hover:scale-110 ${glowText[piece.glow]}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent px-5 py-4 transition-transform duration-400 group-hover:translate-y-0">
            <span className="font-display text-xs font-medium tracking-[0.25em] text-white/60 uppercase">
              {piece.imageCaption}
            </span>
          </div>
        </motion.div>

        {hasNote && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <span className={`font-display mb-3 text-xs font-semibold tracking-[0.2em] uppercase ${glowText[piece.glow]}`}>
              Editor's Note
            </span>
            <p className="leading-relaxed text-white/70">{piece.editorNote}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
