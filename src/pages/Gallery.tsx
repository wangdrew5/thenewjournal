import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import { matchesPublished } from "../data/publishedIssues";
import { PREVIEW_ID } from "../lib/preview";
import { issueName } from "../lib/issueLabel";
import type { Piece, PieceType, Publication } from "../data/publications";
import ArtView from "../components/pieces/ArtView";
import PoemView from "../components/pieces/PoemView";
import FilmView from "../components/pieces/FilmView";
import SongView from "../components/pieces/SongView";
import { SongAudioProvider } from "../lib/SongAudioProvider";
import "../components/gallerywall/gallerywall.css";

interface Work {
  piece: Piece;
  publication: Publication;
}

const KINDS: { type: PieceType | "all"; label: string }[] = [
  { type: "all", label: "Everything" },
  { type: "art", label: "Art" },
  { type: "poem", label: "Writing" },
  { type: "film", label: "Film" },
  { type: "song", label: "Songs" },
];

function snippet(piece: Piece) {
  const lines =
    piece.type === "poem" ? piece.lines : piece.type === "song" ? piece.transcript : [];
  return lines.filter((line) => line.trim()).slice(0, 4);
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
              <span className="gw-blank">{piece.imageCaption || piece.title}</span>
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
            <span className="gw-logline">{piece.logline}</span>
          </span>
        )}
        {piece.type === "song" && (
          <span className="gw-tape">
            <span className="gw-reels" aria-hidden="true">
              <i />
              <i />
            </span>
            {snippet(piece).slice(0, 2).map((line, index) => (
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
  const { piece, publication } = works[index];
  useEffect(() => {
    close.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") onStep(1);
      else if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, onStep]);
  return (
    <motion.div
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
        <span>
          {index + 1} of {works.length}
        </span>
        <button ref={close} type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="gw-dialog-body">
        <SongAudioProvider key={piece.id}>
          {piece.type === "art" && <ArtView piece={piece} />}
          {piece.type === "poem" && <PoemView piece={piece} />}
          {piece.type === "film" && <FilmView piece={piece} />}
          {piece.type === "song" && <SongView piece={piece} />}
        </SongAudioProvider>
        <Link
          className="gw-source"
          to={`/publication/${publication.id}?piece=${encodeURIComponent(piece.id)}`}
        >
          Read it in {publication.caption}, {issueName(publication)}
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
  const [kind, setKind] = useState<PieceType | "all">("all");
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const all = useMemo<Work[]>(
    () =>
      journal.publications
        .filter((p) => p.id !== PREVIEW_ID || !journal.draft || !matchesPublished(journal.draft))
        .flatMap((publication) => publication.pieces.map((piece) => ({ piece, publication }))),
    [journal.publications, journal.draft],
  );
  const counts = (type: PieceType | "all") =>
    type === "all" ? all.length : all.filter((work) => work.piece.type === type).length;
  const works = kind === "all" ? all : all.filter((work) => work.piece.type === kind);

  function step(offset: -1 | 1) {
    setOpen((current) =>
      current === null ? null : (current + offset + works.length) % works.length,
    );
  }
  function close() {
    setOpen(null);
    opener.current?.focus();
  }
  return (
    <main className="gw-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="gw-heading"
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <h1>The Gallery</h1>
        <p>Individual works from across the issues. Pick one to look closer.</p>
      </motion.header>
      {all.length === 0 ? (
        <p className="gw-empty">The first works are on their way.</p>
      ) : (
        <>
          <div className="gw-filters" role="group" aria-label="Show">
            {KINDS.filter((k) => counts(k.type) > 0).map((k) => (
              <button
                key={k.type}
                type="button"
                aria-pressed={kind === k.type}
                onClick={() => {
                  setKind(k.type);
                  setOpen(null);
                }}
              >
                {k.label} <span>{counts(k.type)}</span>
              </button>
            ))}
          </div>
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
