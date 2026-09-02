import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GlowColor } from "../../data/publications";
import { glowVar, glowText } from "../../lib/glow";

interface Props {
  glow: GlowColor;
  videoSrc?: string;
}

export default function FilmPlayer({ glow, videoSrc }: Props) {
  const [playing, setPlaying] = useState(false);

  if (videoSrc) {
    return (
      <div
        style={{ "--glow-color": glowVar[glow] } as React.CSSProperties}
        className="glow-ring aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black"
      >
        <video src={videoSrc} controls className="h-full w-full" />
      </div>
    );
  }

  return (
    <div
      style={{ "--glow-color": glowVar[glow] } as React.CSSProperties}
      className="glow-ring relative aspect-video w-full cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-black"
      onClick={(e) => {
        e.stopPropagation();
        setPlaying((p) => !p);
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-panel-2 via-panel to-black" />

      <AnimatePresence>
        {playing && (
          <motion.div
            key="reel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-hidden"
          >
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-2/3 skew-x-12"
              style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${glowVar[glow]} 18%, transparent), transparent)` }}
              animate={{ x: ["0%", "260%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <div className="bg-noise absolute inset-0 opacity-30 mix-blend-overlay" />
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-medium tracking-widest text-white/70 uppercase">
              <motion.span
                className="h-2 w-2 rounded-full bg-pink"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              Reel Playing
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <motion.button
          type="button"
          aria-label={playing ? "Pause preview" : "Play preview"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          animate={playing ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={playing ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ "--glow-color": glowVar[glow] } as React.CSSProperties}
          className={`glow-ring flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur ${glowText[glow]}`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>
        <span className="font-display text-xs font-medium tracking-[0.25em] text-white/35 uppercase">
          {playing ? "Full embed coming soon" : "Film placeholder"}
        </span>
      </div>
    </div>
  );
}
