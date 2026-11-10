import { useState } from "react";
import { Link } from "react-router-dom";
import type { Piece, Publication } from "../../data/publications";
import { issueName } from "../../lib/issueLabel";
import { DreamScene } from "../surreal/DreamScape";
import "../surreal/surreal.css";
import "./inside.css";

const kind: Record<Piece["type"], string> = {
  poem: "Writing",
  art: "Artwork",
  film: "Film",
  song: "Song",
};

function pieceUrl(publication: Publication, piece: Piece) {
  return `/publication/${publication.id}?${new URLSearchParams({ piece: piece.id })}`;
}

function action(piece: Piece) {
  if (piece.type === "song" && piece.audioSrc) return "Listen to the song";
  if (piece.type === "film" && piece.videoSrc) return "Watch the film";
  if (piece.type === "poem") return "Read the writing";
  if (piece.type === "art") return "View the artwork";
  return "View the work";
}

function WorkPreview({ piece }: { piece: Piece }) {
  if (piece.type === "art" && piece.imageSrc) {
    return <img className="inside-artwork" src={piece.imageSrc} alt={piece.imageAlt ?? `${piece.title} by ${piece.author}`} loading="lazy" decoding="async" />;
  }
  if (piece.type === "poem" || piece.type === "song") {
    const source = piece.type === "poem" ? piece.lines : piece.transcript;
    const start = source.findIndex((line) => line.trim());
    const lines = start < 0 ? [] : source.slice(start, start + (piece.type === "poem" ? 4 : 2));
    if (lines.length) return (
      <blockquote className="inside-verse">
        {lines.map((line, index) => <span key={index}>{line || "\u00a0"}</span>)}
      </blockquote>
    );
  }
  return (
    <div className="inside-portal-symbol" aria-hidden="true">
      {piece.type === "film" ? <svg viewBox="0 0 48 48"><path d="M17 9v30l24-15z" /></svg> : <span>{kind[piece.type]}</span>}
    </div>
  );
}

/** A portal into the real published issue, with one work visible at a time. */
export default function InsideIssue({ publication }: { publication?: Publication }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!publication || !publication.pieces.length) return null;
  const works = publication.pieces.slice(0, 4);
  const defaultWork = works.find((piece) => piece.type === "art" && piece.imageSrc) ?? works[0];
  const selected = works.find((piece) => piece.id === selectedId) ?? defaultWork;
  const hasExcerpt = (selected.type === "poem" && selected.lines.some((line) => line.trim())) ||
    (selected.type === "song" && selected.transcript.some((line) => line.trim()));

  return (
    <section className={`inside-portal${publication.theme === "museum" ? " inside-portal-gallery" : ""}`} aria-labelledby="inside-heading">
      {publication.theme !== "museum" && (
        <div className="inside-world" aria-hidden="true">
          <DreamScene scene={publication.issueNumber === "01" ? 1 : 0} /> {/* taste-skill-ignore: this matches the published cover's actual issue number. */}
        </div>
      )}
      <div className="inside-veil" aria-hidden="true" />
      <div className="inside-inner">
        <header className="inside-header">
          <div>
            <p>{issueName(publication)} · Explore the work</p>
            <h2 id="inside-heading">Inside <i>{publication.caption}</i></h2>
          </div>
          <Link className="inside-all" to="/gallery">Explore the gallery <span aria-hidden="true">↗</span></Link>
        </header>
        <div className={`inside-layout${works.length === 1 ? " inside-layout-solo" : ""}`}>
          {works.length > 1 && (
            <nav className="inside-index" aria-label="Explore selected works">
              <p>Choose a work</p>
              <div className="inside-options">
                {works.map((piece) => (
                  <button key={piece.id} type="button" aria-pressed={selected.id === piece.id} onClick={() => setSelectedId(piece.id)}>
                    <span>{kind[piece.type]}</span>
                    <strong>{piece.title}</strong>
                  </button>
                ))}
              </div>
            </nav>
          )}
          <div className="inside-stage" key={selected.id}>
            <Link className={`inside-visual inside-visual-${selected.type}`} to={pieceUrl(publication, selected)} aria-label={`${action(selected)}: ${selected.title}`}>
              <WorkPreview piece={selected} />
            </Link>
            <div className="inside-detail">
              <p className="inside-kind">{kind[selected.type]}{hasExcerpt ? " · excerpt" : ""}</p>
              <h3 aria-live="polite">{selected.title}</h3>
              <p className="inside-author">{selected.author}</p>
              {selected.type === "film" && selected.logline && <p className="inside-logline">{selected.logline}</p>}
              <Link className="inside-open" to={pieceUrl(publication, selected)}>
                {action(selected)} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
