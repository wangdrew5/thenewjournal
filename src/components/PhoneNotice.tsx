import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "tnj:phone-notice:v1";

// A phone: a touch screen whose shorter side is phone-sized. Tablets and computers never match.
function isPhone() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches && Math.min(window.screen.width, window.screen.height) < 600;
}

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Shown once per phone: the journal reads best on a bigger screen. */
export default function PhoneNotice() {
  const [open, setOpen] = useState(() => isPhone() && !seen());
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    button.current?.focus();
    const key = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Private browsing: it simply shows again next visit.
    }
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div className="phone-notice" onClick={(event) => event.target === event.currentTarget && close()}>
      <div className="phone-notice-card" role="dialog" aria-modal="true" aria-labelledby="phone-notice-title">
        <h2 id="phone-notice-title">Best on a computer</h2>
        <p>You can read The New Journal on your phone, but it looks and works best on a bigger screen.</p>
        <button ref={button} type="button" onClick={close}>
          Got it
        </button>
      </div>
    </div>
  );
}
