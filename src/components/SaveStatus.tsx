import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function SaveStatus({ status }: { status: string }) {
  const reduced = useReducedMotion();
  const state =
    status === "Saving…"
      ? "saving"
      : status === "Saved in this browser"
        ? "saved"
        : status.includes("could not")
          ? "error"
          : "idle";
  return (
    <div className="editor-save-status" data-state={state}>
      <span className="editor-save-icon" aria-hidden="true">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.1 }}
          >
            {state === "saved" ? (
              <svg viewBox="0 0 20 20" fill="none">
                <motion.path
                  d="m4 10 4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduced ? 0 : 0.25 }}
                />
              </svg>
            ) : state === "saving" ? (
              <span className="save-dots">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <span className="save-idle-dot" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      <p className="preview-save" role="status">
        {status}
      </p>
    </div>
  );
}
