import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import { matchesPublished } from "../data/publishedIssues";
import { PREVIEW_ID } from "../lib/preview";
import { issueName } from "../lib/issueLabel";
import { useDialogFocus } from "../lib/useDialogFocus";
import type { Piece, Publication } from "../data/publications";
import "../components/gallerywall/gallerywall.css";

interface Work {
  piece: Piece;
  publication: Publication;
}

// A few opening lines for the wall. Song lyrics run long, so fewer of them.
function snippet(piece: Piece) {
  const lines =
    piece.type === "poem" ? piece.lines : piece.type === "song" ? piece.transcript : [];
  return lines.filter((line) => line.trim()).slice(0, piece.type === "song" ? 2 : 4);
}

function WorkCard({ work, onOpen }: { work: Work; onOpen: (element: HTMLElement) => void }) {
  const { piece, publication } = work;
  const label = piece.type === "poem" ? "Writing" : piece.type[0].toUpperCase() + piece.type.slice(1);
  return (
    <li className={`gw-item gw-${piece.type}`}>
      <button
        type="button"
        className="gw-card"
        onClick={(event) => onOpen(event.currentTarget)}
        aria-label={`Open ${piece.title} by ${piece.author}, ${label}`}
      >
        {piece.type === "art" && (
          <span className="gw-frame">
            {piece.imageSrc ? (
              <img src={piece.imageSrc} alt="" loading="lazy" />
            ) : (
              <span className="gw-blank">{piece.title}</span>
            )}
          </span>
        )}
        {piece.type === "poem" && (
          <span className="gw-sheet">
            {snippet(piece).map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </span>
        )}
        {piece.type === "film" && (
          <span className="gw-screen">
            <span className="gw-play" aria-hidden="true" />
          </span>
        )}
        {piece.type === "song" && (
          <span className="gw-tape">
            {snippet(piece).map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </span>
        )}
        <span className="gw-plate">
          <strong>{piece.title}</strong>
          <span>{piece.author}</span>
          <small>
            {label}, {publication.caption}
          </small>
        </span>
      </button>
    </li>
  );
}

const sourceVerb: Record<Piece["type"], string> = {
  poem: "Read",
  art: "See",
  film: "Watch",
  song: "Listen to",
};

// A work looked at closely. Every kind shares one column: its title and maker, then the work.
function Look({ piece }: { piece: Piece }) {
  const [audioFailed, setAudioFailed] = useState(false);
  return (
    <article className={`gw-look gw-look-${piece.type}`}>
      <header className="gw-look-head">
        <h2>{piece.title}</h2>
        <span>{piece.author}</span>
      </header>
      {piece.type === "art" && (
        <>
          {piece.imageSrc ? (
            <img className="gw-look-image" src={piece.imageSrc} alt={piece.imageAlt ?? `${piece.title} by ${piece.author}`} />
          ) : (
            <p className="gw-look-missing">Artwork not yet available.</p>
          )}
          {piece.imageCaption && <p className="gw-look-note gw-art-caption">{piece.imageCaption}</p>}
          {piece.pageText && piece.pageText.trim() !== piece.imageCaption.trim() && (
            <p className="gw-art-context">{piece.pageText}</p>
          )}
        </>
      )}
      {piece.type === "poem" && (
        <div className="gw-look-lines">
          {piece.lines.map((line, index) => (
            <p key={index}>{line || "\u00a0"}</p>
          ))}
        </div>
      )}
      {piece.type === "film" && (
        <>
          {piece.videoSrc ? (
            <video className="gw-look-video" src={piece.videoSrc} controls preload="metadata" />
          ) : (
            <p className="gw-look-missing">Film not yet available.</p>
          )}
          {piece.logline && <p className="gw-look-note">{piece.logline}</p>}
        </>
      )}
      {piece.type === "song" && (
        <>
          {piece.audioSrc ? (
            <audio
              className="gw-look-audio"
              src={piece.audioSrc}
              controls
              preload="metadata"
              aria-label={`Play ${piece.title}`}
              onError={() => setAudioFailed(true)}
              onLoadedMetadata={() => setAudioFailed(false)}
            />
          ) : (
            <p className="gw-look-missing">Song not yet available.</p>
          )}
          {audioFailed && (
            <p role="alert" className="gw-look-note">
              This song could not play. Check your connection and try reloading the page.
            </p>
          )}
          {piece.transcript.some((line) => line.trim()) && (
            <section className="gw-look-lines" aria-label={`Transcript of ${piece.title}`}>
              <h3 className="gw-transcript-heading">Transcript</h3>
              {piece.transcript.map((line, index) => (
                <p key={index}>{line || "\u00a0"}</p>
              ))}
            </section>
          )}
        </>
      )}
    </article>
  );
}

function WorkDialog({
  works,
  index,
  onClose,
  onStep,
}: {
  works: Work[];
  index: number;
  onClose: () => void;
  onStep: (offset: -1 | 1) => void;
}) {
  const reduced = useReducedMotion();
  const close = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(dialog, close);
  const { piece, publication } = works[index];
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
        !(event.target instanceof HTMLElement && event.target.closest("audio, video, input, textarea, select, [contenteditable]"))) {
        if (event.key === "ArrowRight") { event.preventDefault(); onStep(1); }
        else if (event.key === "ArrowLeft") { event.preventDefault(); onStep(-1); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, onStep]);
  return (
    <motion.div
      ref={dialog}
      tabIndex={-1}
      className="gw-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={piece.title}
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="gw-dialog-bar">
        <div>
          <span>
            {index + 1} of {works.length}
          </span>
          <button ref={close} type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="gw-dialog-body">
        <Look key={piece.id} piece={piece} />
        <Link
          className="gw-source"
          to={`/publication/${publication.id}?piece=${encodeURIComponent(piece.id)}`}
        >
          {sourceVerb[piece.type]} it in {publication.caption}, {issueName(publication)}
        </Link>
      </div>
      {works.length > 1 && (
        <div className="gw-dialog-nav">
          <button type="button" onClick={() => onStep(-1)}>
            Previous work
          </button>
          <button type="button" onClick={() => onStep(1)}>
            Next work
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function Gallery() {
  const reduced = useReducedMotion();
  const journal = useJournal();
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const all = useMemo<Work[]>(
    () =>
      journal.publications
        .filter((p) => p.id !== PREVIEW_ID || !journal.draft || !matchesPublished(journal.draft))
        .flatMap((publication) => publication.pieces.map((piece) => ({ piece, publication }))),
    [journal.publications, journal.draft],
  );
  const works = all;

  function step(offset: -1 | 1) {
    setOpen((current) =>
      current === null ? null : (current + offset + works.length) % works.length,
    );
  }
  function close() {
    setOpen(null);
  }
  return (
    <main className="gw-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="gw-heading"
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <h1>Gallery</h1>
        <p>Writing, artwork, films, and songs from The New Journal.</p>
      </motion.header>
      {all.length === 0 ? (
        <p className="gw-empty">The first works are on their way.</p>
      ) : (
        <>
          <ul className="gw-wallgrid">
            {works.map((work, index) => (
              <WorkCard
                key={`${work.publication.id}:${work.piece.id}`}
                work={work}
                onOpen={(element) => {
                  opener.current = element;
                  setOpen(index);
                }}
              />
            ))}
          </ul>
        </>
      )}
      <AnimatePresence>
        {open !== null && works[open] && (
          <WorkDialog key="dialog" works={works} index={open} onClose={close} onStep={step} />
        )}
      </AnimatePresence>
    </main>
  );
}
