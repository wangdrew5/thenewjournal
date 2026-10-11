import { useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Publication } from "../../data/publications";
import type { MagazinePage } from "../../lib/magazine";
import { CONTROLS, pad, pieceKind, useIssueNav } from "../../lib/useIssueNav";
import { useFinishEnterOnMount } from "../../lib/enterTransition";
import { PREVIEW_ID } from "../../lib/preview";
import IssueContents from "../pieces/IssueContents";
import SavePieceButton from "../pieces/SavePieceButton";
import IssueArtwork from "../magazine/IssueArtwork";
import "./gallery.css";

const WINDOW = 2;

function CoverWork({
  publication,
  onEnter,
}: {
  publication: Publication;
  onEnter: () => void;
}) {
  const count = publication.pieces.length;
  return (
    <div className="gal-work gal-cover">
      <div className="gal-cover-copy">
        <p className="gal-eyebrow">The New Journal</p>
        {publication.issueNumber && (
          <p className="gal-numeral" aria-hidden="true">
            {publication.issueNumber}
          </p>
        )}
        <h1>{publication.caption}</h1>
        <p className="gal-cover-meta">
          Gallery edition · {count} {count === 1 ? "work" : "works"}
          {publication.id === "comedy-example" && " · A fictional comedy example"}
        </p>
        <button type="button" className="gal-begin" onClick={onEnter}>
          Begin the exhibition <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="gal-cover-art">
        {publication.coverSrc ? (
          <img src={publication.coverSrc} alt={publication.coverAlt ?? ""} />
        ) : (
          <IssueArtwork />
        )}
      </div>
    </div>
  );
}

function PieceWork({ page, index }: { page: MagazinePage; index: number }) {
  const piece = page.piece!;
  if (piece.type === "art")
    return (
      <div className="gal-work gal-art">
        <div className="gal-frame">
          {piece.imageSrc ? (
            <img
              src={piece.imageSrc}
              alt={piece.imageAlt ?? `${piece.title} by ${piece.author}`}
              draggable={false}
            />
          ) : (
            <div className="gal-frame-empty">Work forthcoming</div>
          )}
        </div>
      </div>
    );
  if (piece.type === "film")
    return (
      <div className="gal-work gal-film">
        <span className="gal-film-tag">Now showing</span>
        {piece.videoSrc ? (
          <video src={piece.videoSrc} controls preload="metadata" />
        ) : (
          <div className="gal-film-empty">
            <span className="gal-play" aria-hidden="true" />
            Screening forthcoming
          </div>
        )}
        <p>{piece.logline}</p>
      </div>
    );
  return (
    <div className="gal-work gal-text">
      <div className="gal-text-meta">
        <span>{pad(index)}</span>
        <span>{pieceKind[piece.type]}</span>
        {page.parts > 1 && (
          <span>
            Sheet {page.part + 1} / {page.parts}
          </span>
        )}
      </div>
      <div className="gal-text-body" tabIndex={0} role="region" aria-label={`${piece.title}, scroll to read`}>
        <h2>{piece.title}</h2>
        <p className="gal-text-author">{piece.author}</p>
        <div className="gal-poem">
          {piece.lines.map((line, i) => (
            <p key={i} style={{ "--l": Math.min(i, 18) } as CSSProperties}>
              {line || " "}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function WallLabel({ page, publication }: { page: MagazinePage; publication: Publication }) {
  const piece = page.piece;
  const issue = publication.issueNumber ? `Issue ${publication.issueNumber}` : "Your issue";
  if (!piece)
    return (
      <aside className="gal-label">
        <strong>{publication.caption}</strong>
        <span>The New Journal, {issue}</span>
        <em>Use ← → or drag to walk through</em>
      </aside>
    );
  const medium =
    piece.type === "poem" ? "Writing on paper" : piece.type === "art" ? "Artwork" : "Moving image";
  return (
    <aside className="gal-label">
      <strong>{piece.title}</strong>
      <span>{piece.author}</span>
      <em>
        {medium} · {issue}
      </em>
      {piece.type === "art" && (piece.editorNote || piece.imageCaption) && (
        <p>{piece.editorNote ?? piece.imageCaption}</p>
      )}
    </aside>
  );
}

export default function GalleryReader({ publication }: { publication: Publication }) {
  useFinishEnterOnMount();
  const { pages, index, page, goTo, goToPiece } = useIssueNav(publication);
  const last = pages.length - 1;
  const [drag, setDrag] = useState(0);
  const dragging = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  function down(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    // Mouse users can select text on the current work; touch can swipe anywhere.
    if (
      event.button !== 0 ||
      target.closest(CONTROLS) ||
      (event.pointerType === "mouse" && target.closest(".gal-slide.is-current .gal-work"))
    )
      return;
    dragging.current = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false };
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const d = dragging.current;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - d.y)) {
      d.moved = true;
      stage.current?.setPointerCapture(event.pointerId);
    }
    if (d.moved) {
      // Resist at the ends of the exhibition.
      const edge = (dx > 0 && index === 0) || (dx < 0 && index === last);
      setDrag(edge ? dx * 0.25 : dx);
    }
  }
  function up(event: React.PointerEvent<HTMLDivElement>) {
    const d = dragging.current;
    dragging.current = null;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.x;
    setDrag(0);
    if (d.moved && Math.abs(dx) > Math.min(120, window.innerWidth * 0.12))
      goTo(index + (dx < 0 ? 1 : -1));
  }

  const piece = page.piece;
  const visible = pages
    .map((p, n) => ({ p, n }))
    .filter(({ n }) => Math.abs(n - index) <= WINDOW);

  return (
    <div className="gal-reader">
      <div className="gal-wall" aria-hidden="true">
        <div className="gal-spot" />
        <div className="gal-floor" />
      </div>
      <header className="gal-top">
        <Link to="/" className="gal-back">
          <span aria-hidden="true">←</span> All issues
        </Link>
        <p className="gal-title">
          The New Journal <i>—</i>{" "}
          {publication.issueNumber ? `Issue ${publication.issueNumber}` : "Your issue"}
        </p>
        <div className="gal-actions reader-actions">
          {import.meta.env.DEV && publication.id === PREVIEW_ID && (
            <Link className="contents-trigger micro-button" to="/preview">
              Edit issue
            </Link>
          )}
          <IssueContents
            pieces={publication.pieces}
            currentIndex={publication.pieces.findIndex((p) => p.id === piece?.id)}
            onSelect={goToPiece}
            onCover={() => goTo(0)}
          />
          {piece && <SavePieceButton key={piece.id} pieceId={piece.id} />}
        </div>
      </header>

      <main
        ref={stage}
        className={`gal-stage ${drag ? "is-dragging" : ""}`}
        style={{ "--drag": `${drag}px` } as CSSProperties}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          dragging.current = null;
          setDrag(0);
        }}
      >
        {visible.map(({ p, n }) => {
          const current = n === index;
          return (
            <div
              key={p.id}
              className={`gal-slide ${current ? "is-current" : "is-near"}`}
              style={{ "--off": n - index } as CSSProperties}
              aria-hidden={current ? undefined : true}
            >
              <div className="gal-hang" inert={!current}>
                {p.piece ? (
                  <PieceWork page={p} index={n} />
                ) : (
                  <CoverWork publication={publication} onEnter={() => goTo(1)} />
                )}
                <WallLabel page={p} publication={publication} />
              </div>
              {!current && (
                <button
                  type="button"
                  className="gal-slide-hit"
                  tabIndex={-1}
                  aria-label={`Go to ${p.piece?.title ?? "cover"}`}
                  onClick={() => goTo(n)}
                />
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="gal-side gal-side-prev"
          aria-label="Previous work"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="gal-side gal-side-next"
          aria-label="Next work"
          disabled={index === last}
          onClick={() => goTo(index + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </main>

      <nav className="gal-bottom" aria-label="Exhibition">
        <button type="button" className="gal-step" disabled={index === 0} onClick={() => goTo(index - 1)}>
          <span aria-hidden="true">←</span> <span className="gal-step-label">Previous</span>
        </button>
        <div className="gal-index">
          <span className="gal-count" aria-live="polite" aria-atomic="true">
            {index === 0 ? "Entrance" : `${pad(index)} / ${pad(last)}`}
          </span>
          {pages.length <= 40 && (
            <div className="gal-ticks">
              {pages.map((p, n) => (
                <button
                  key={p.id}
                  type="button"
                  className={n === index ? "is-on" : ""}
                  aria-label={n === 0 ? "Entrance" : `${p.piece?.title}${p.parts > 1 ? `, sheet ${p.part + 1} of ${p.parts}` : ""}`}
                  aria-current={n === index ? "step" : undefined}
                  onClick={() => goTo(n)}
                />
              ))}
            </div>
          )}
          <span className="gal-now">{piece ? `${piece.title} — ${piece.author}` : publication.caption}</span>
        </div>
        <button type="button" className="gal-step" disabled={index === last} onClick={() => goTo(index + 1)}>
          <span className="gal-step-label">Next</span> <span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  );
}
