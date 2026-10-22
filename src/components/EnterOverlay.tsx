import { useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  finishReturn,
  startReturn,
  markGrown,
  useEnterState,
} from "../lib/enterTransition";
import { useJournal } from "../lib/useJournal";

const EASE = [0.76, 0, 0.24, 1] as const;

export default function EnterOverlay() {
  const { pathname } = useLocation();
  const { publications } = useJournal();
  const reduced = useReducedMotion();
  const current = useEnterState();

  // Leaving an issue for the home page (by link or the back button) covers the
  // reader in its palette while it fades, then the shelf shrinks it onto the book.
  const previous = useRef(pathname);
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (reduced || pathname !== "/" || !from.startsWith("/publication/")) return;
    const id = decodeURIComponent(from.split("/")[2] ?? "");
    const publication = publications.find((p) => p.id === id);
    if (publication) startReturn(id, publication.theme ?? "surreal");
  }, [pathname, publications, reduced]);

  const full = {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  return (
    <AnimatePresence>
      {current?.kind === "enter" && (
        <motion.div
          key="enter-overlay"
          className={`enter-overlay enter-${current.theme}`}
          aria-hidden="true"
          initial={{ ...current.rect, opacity: 1, borderRadius: 4 }}
          animate={{ ...full, borderRadius: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.28 } }}
          transition={{ duration: 0.4, ease: EASE }}
          onAnimationComplete={markGrown}
        >
          <span className="enter-overlay-mark">The New Journal</span>
        </motion.div>
      )}
      {current?.kind === "return" && (
        <motion.div
          key="return-overlay"
          className={`enter-overlay enter-${current.theme}`}
          aria-hidden="true"
          initial={{ ...full, opacity: 0, borderRadius: 0 }}
          animate={
            current.target
              ? { ...current.target, opacity: 1, borderRadius: 4 }
              : { ...full, opacity: 1, borderRadius: 0 }
          }
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{
            duration: current.target ? 0.45 : 0.15,
            ease: current.target ? EASE : "easeOut",
          }}
          onAnimationComplete={() => {
            if (current.target) finishReturn();
          }}
        />
      )}
    </AnimatePresence>
  );
}
