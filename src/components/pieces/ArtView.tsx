import { motion } from "framer-motion";
import type { ArtPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";
import { glowVar, glowText } from "../../lib/glow";
import GlowBackdrop from "../GlowBackdrop";

interface Props {
  piece: ArtPiece;
}

export default function ArtView({ piece }: Props) {
  const hasNote = Boolean(piece.editorNote);

  return (
    <div>
      <PieceHeader
        label="Art"
        title={piece.title}
        author={piece.author}
        glow={piece.glow}
      />

      {!piece.imageSrc ? (
        <p className="media-unavailable">Artwork not yet available.</p>
      ) : (
        <div
          className={`grid grid-cols-1 gap-12 ${hasNote ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.015, rotate: -0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative aspect-4/3 w-full"
          >
            <GlowBackdrop glow={glowVar[piece.glow]} />

            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <img
                src={piece.imageSrc}
                alt={piece.imageAlt ?? `${piece.title} by ${piece.author}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
              {piece.imageCaption && (
                <div className="art-caption absolute inset-x-0 bottom-0 translate-y-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-4 transition-transform duration-400 group-hover:translate-y-0">
                  <span className="font-display text-xs font-medium tracking-[0.25em] whitespace-pre-line text-white/60 uppercase">
                    {piece.imageCaption}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {hasNote && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col justify-center"
            >
              <span
                className={`font-display mb-3 text-xs font-semibold tracking-[0.2em] uppercase ${glowText[piece.glow]}`}
              >
                Editor's Note
              </span>
              <p className="leading-relaxed text-white/70">
                {piece.editorNote}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
