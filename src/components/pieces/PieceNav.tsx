import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Piece } from "../../data/publications";

interface Props {
  pieces: Piece[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function PieceNav({ pieces, currentIndex, onSelect }: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const container = strip.current;
    const active = container?.children[currentIndex];
    if (!container || !active) return;
    const bounds = container.getBoundingClientRect();
    const selected = active.getBoundingClientRect();
    let adjustment = 0;
    if (selected.left < bounds.left) adjustment = selected.left - bounds.left;
    else if (selected.right > bounds.right)
      adjustment = selected.right - bounds.right;
    if (adjustment)
      container.scrollTo({
        left: container.scrollLeft + adjustment,
        behavior: reduced ? "instant" : "smooth",
      });
  }, [currentIndex, reduced]);
  return (
    <nav
      aria-label="Issue pages"
      className="reader-dock fixed inset-x-0 z-40 flex justify-center px-3"
    >
      <div className="flex max-w-full items-center rounded-full border border-white/15 bg-[#090c09]/90 p-1.5 shadow-[0_8px_40px_#0008] backdrop-blur-xl">
        <motion.button
          type="button"
          aria-label="Previous piece"
          onClick={() => onSelect(currentIndex - 1)}
          whileTap={reduced ? undefined : { scale: 0.9 }}
          className="dock-arrow micro-button"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
        </motion.button>
        <div ref={strip} className="flex min-w-0 overflow-x-auto">
          {pieces.map((piece, i) => (
            <motion.button
              key={piece.id}
              type="button"
              aria-label={`Go to ${piece.type} ${i + 1}: ${piece.title}`}
              title={`${i + 1}. ${piece.type}: ${piece.title}`}
              aria-current={i === currentIndex ? "step" : undefined}
              onClick={() => onSelect(i)}
              whileTap={reduced ? undefined : { scale: 0.9 }}
              className="piece-dot micro-button relative shrink-0"
            >
              {i === currentIndex && (
                <motion.span
                  layoutId="active-piece"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-1 rounded-full bg-green/15"
                />
              )}
              <span className="dot-light relative h-2 w-2 rounded-full" />
            </motion.button>
          ))}
        </div>
        <motion.button
          type="button"
          aria-label="Next piece"
          onClick={() => onSelect(currentIndex + 1)}
          whileTap={reduced ? undefined : { scale: 0.9 }}
          className="dock-arrow micro-button"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </motion.button>
      </div>
    </nav>
  );
}
