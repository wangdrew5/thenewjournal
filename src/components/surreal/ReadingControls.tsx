import { useEffect, useId, useRef, useState } from "react";
import { READ_SIZES, setReadingPrefs, useReadingPrefs } from "../../lib/readingPrefs";

// "Aa": text size and paper tone, for reading comfortably in any light.
export default function ReadingControls() {
  const prefs = useReadingPrefs();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const last = READ_SIZES.length - 1;
  return (
    <div className="sr-read" ref={root}>
      <button
        type="button"
        className="contents-trigger micro-button sr-pill sr-read-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Reading settings"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">
          A<small>a</small>
        </span>
      </button>
      {open && (
        <div className="sr-read-panel" id={panelId} role="group" aria-label="Reading settings">
          <div className="sr-read-row">
            <span>Text size</span>
            <div>
              <button
                type="button"
                aria-label="Smaller text"
                disabled={prefs.size === 0}
                onClick={() => setReadingPrefs({ size: prefs.size - 1 })}
              >
                A<small>−</small>
              </button>
              <button
                type="button"
                aria-label="Larger text"
                disabled={prefs.size === last}
                onClick={() => setReadingPrefs({ size: prefs.size + 1 })}
              >
                A<small>+</small>
              </button>
            </div>
          </div>
          <div className="sr-read-row">
            <span>Paper</span>
            <div>
              <button
                type="button"
                aria-pressed={prefs.tone === "paper"}
                onClick={() => setReadingPrefs({ tone: "paper" })}
              >
                Day
              </button>
              <button
                type="button"
                aria-pressed={prefs.tone === "night"}
                onClick={() => setReadingPrefs({ tone: "night" })}
              >
                Night
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
