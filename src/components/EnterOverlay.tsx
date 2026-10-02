import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { takeGrownDestination, useEnterState } from "../lib/enterTransition";

export default function EnterOverlay() {
  const navigate = useNavigate();
  const current = useEnterState();
  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="enter-overlay"
          className={`enter-overlay enter-${current.theme}`}
          aria-hidden="true"
          initial={{ ...current.rect, opacity: 1, borderRadius: 4 }}
          animate={{
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
          }}
          exit={{ opacity: 0, transition: { duration: 0.55 } }}
          transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => {
            const to = takeGrownDestination();
            if (to) navigate(to);
          }}
        >
          <span className="enter-overlay-mark">The New Journal</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
