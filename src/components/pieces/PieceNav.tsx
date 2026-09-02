import { motion } from "framer-motion";
import type { Piece } from "../../data/publications";
import { glowVar } from "../../lib/glow";

interface Props {
  pieces: Piece[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onNext: () => void;
}

export default function PieceNav({ pieces, currentIndex, onSelect, onNext }: Props) {
  return (
    <>
      <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center">
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
          {pieces.map((p, i) => {
            const active = i === currentIndex;
            return (
              <motion.button
                key={p.id}
                type="button"
                aria-label={`Go to ${p.type} ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(i);
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: active ? 1.25 : 1 }}
                style={
                  {
                    backgroundColor: active ? glowVar[p.glow] : "rgba(255,255,255,0.25)",
                    boxShadow: active ? `0 0 10px 2px ${glowVar[p.glow]}` : "none",
                  } as React.CSSProperties
                }
                className="h-2 w-2 rounded-full transition-shadow duration-300"
              />
            );
          })}
        </div>
      </div>

      <motion.button
        type="button"
        aria-label="Next piece"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        whileHover={{ scale: 1.1, x: 4 }}
        whileTap={{ scale: 0.92 }}
        animate={{ x: [0, 6, 0] }}
        transition={{ x: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
        className="fixed right-6 bottom-8 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition-colors duration-300 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] sm:right-10"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </motion.button>
    </>
  );
}
