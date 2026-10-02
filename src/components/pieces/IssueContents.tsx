import { useRef, useState } from "react";
import type { Piece } from "../../data/publications";
interface Props {
  pieces: Piece[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onCover?: () => void;
}
export default function IssueContents({
  pieces,
  currentIndex,
  onSelect,
  onCover,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  function show() {
    dialog.current?.showModal();
    setOpen(true);
  }
  function close() {
    dialog.current?.close();
  }
  return (
    <>
      <button
        className="contents-trigger micro-button"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M8 6h12M8 12h12M8 18h12M3 6h1M3 12h1M3 18h1" />
        </svg>
        Contents
      </button>
      <dialog
        ref={dialog}
        className="issue-dialog"
        aria-labelledby="issue-contents-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }}
      >
        <div className="issue-dialog-heading">
          <h2 id="issue-contents-title" className="font-display">
            Contents
          </h2>
          <button
            type="button"
            className="micro-button"
            aria-label="Close contents"
            onClick={close}
            autoFocus
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </div>
        {onCover && (
          <button
            className="dialog-cover-link"
            type="button"
            onClick={() => {
              onCover();
              close();
            }}
          >
            ← Front cover
          </button>
        )}
        <ol>
          {pieces.map((piece, i) => (
            <li key={piece.id}>
              <button
                className="dialog-piece"
                type="button"
                aria-current={i === currentIndex ? "step" : undefined}
                onClick={() => {
                  onSelect(i);
                  close();
                }}
              >
                <span className="contents-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="dialog-piece-copy">
                  <span className="contents-type">
                    {piece.type === "poem"
                      ? "Poem"
                      : piece.type === "film"
                        ? "Film"
                        : "Art"}
                  </span>
                  <span className="font-display">{piece.title}</span>
                  {piece.type === "poem" && (
                    <span className="contents-preview">{piece.lines[0]}</span>
                  )}
                  {piece.type === "film" && !piece.videoSrc && (
                    <span className="contents-preview">Video coming soon</span>
                  )}
                  {piece.type === "art" && !piece.imageSrc && (
                    <span className="contents-preview">
                      Artwork coming soon
                    </span>
                  )}
                  <span className="contents-author">{piece.author}</span>
                </span>
                <span className="dialog-selection">
                  {i === currentIndex ? "Reading" : "→"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
