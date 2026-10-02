import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function SavePieceButton({ pieceId }: { pieceId: string }) {
  const reduced = useReducedMotion();
  const storageKey = `tnj:saved:v1:${pieceId}`;
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2400);
    return () => window.clearTimeout(timer);
  }, [message]);

  function toggle() {
    const next = !saved;
    try {
      if (next) localStorage.setItem(storageKey, "true");
      else localStorage.removeItem(storageKey);
      setSaved(next);
      setMessage(next ? "Saved on this device" : "Removed from saved pieces");
    } catch {
      setMessage("Saving is unavailable in this browser");
    }
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        aria-pressed={saved}
        onClick={toggle}
        whileTap={reduced ? undefined : { scale: 0.94 }}
        className={`save-piece micro-button ${saved ? "is-saved" : ""}`}
      >
        <motion.svg
          initial={false}
          animate={reduced ? {} : { scale: saved ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </motion.svg>
        {saved ? "Saved" : "Save piece"}
      </motion.button>
      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            role="status"
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            className="save-toast"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
