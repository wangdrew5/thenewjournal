import { useEffect, useId, useRef, useState } from "react";
import type { Piece, Publication } from "../../data/publications";
import "./share.css";

export default function ShareButton({ publication, piece }: { publication: Publication; piece?: Piece }) {
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const label = piece?.title ?? publication.caption;
  const origin = typeof window === "undefined" ? "https://thenewjournal.org" : window.location.origin;
  const url = new URL(`${import.meta.env.BASE_URL}publication/${encodeURIComponent(publication.id)}`, origin);
  if (piece) url.searchParams.set("piece", piece.id);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${label} | The New Journal`, url: url.href });
        return;
      } catch (error) {
        if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      dialog.current?.showModal();
      input.current?.select();
    }
  }

  return (
    <div className="share-control">
      <button
        type="button"
        className="share-button micro-button"
        aria-label={`Share ${label}`}
        title={`Share ${label}`}
        onClick={share}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {copied ? <path d="m5 12 4 4L19 6" /> : <><path d="M12 16V3m-5 5 5-5 5 5" /><path d="M5 13v7h14v-7" /></>}
        </svg>
      </button>
      {copied && <span className="share-status" role="status">Link copied</span>}
      <dialog
        ref={dialog}
        className="share-link-dialog"
        aria-labelledby={headingId}
        onCancel={(event) => event.stopPropagation()}
        onClose={(event) => event.stopPropagation()}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            dialog.current?.close();
        }}
      >
        <h2 id={headingId}>{piece ? "Share this work" : "Share this issue"}</h2>
        <p>Select and copy the link to {label}.</p>
        <input ref={input} readOnly value={url.href} aria-label="Sharing link" onFocus={(event) => event.currentTarget.select()} />
        <button type="button" className="share-done" onClick={() => dialog.current?.close()}>Done</button>
      </dialog>
    </div>
  );
}
