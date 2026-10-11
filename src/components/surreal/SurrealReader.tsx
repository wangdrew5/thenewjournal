import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { Publication } from "../../data/publications";
import type { MagazinePage } from "../../lib/magazine";
import {
  CONTROLS,
  pad,
  pieceKind,
  useIssueNav,
  useMediaQuery,
} from "../../lib/useIssueNav";
import { useFinishEnterOnMount } from "../../lib/enterTransition";
import { PREVIEW_ID } from "../../lib/preview";
import IssueContents from "../pieces/IssueContents";
import SavePieceButton from "../pieces/SavePieceButton";
import DreamScape, { DreamScene } from "./DreamScape";
import { SCENE_COUNT, sceneNames } from "./scenes";
import "./surreal.css";

const FLIP_SECONDS = 0.95;
const sceneFor = (index: number) => index % SCENE_COUNT;

interface Flip {
  id: number;
  from: number;
  to: number;
}

/* ---------- Page faces ---------- */

// Plain on purpose: the turning leaf and the page beneath it each render their own copy of
// the text, and any per-copy reveal made them differ (and pop) at every handoff.
function Lines({ lines, dropCap }: { lines: string[]; dropCap: boolean }) {
  return (
    <div className={`sr-poem ${dropCap ? "has-dropcap" : ""}`}>
      {lines.map((line, i) => (
        <p key={i}>{line || " "}</p>
      ))}
    </div>
  );
}

function Folio({ publication, index }: { publication: Publication; index: number }) {
  return (
    <header className="sr-folio">
      <span>The New Journal</span>
      <span>
        {publication.issueNumber ? `Issue ${publication.issueNumber}` : "Your issue"} ·{" "}
        {pad(index)}
      </span>
    </header>
  );
}

function CoverFace({ publication }: { publication: Publication }) {
  return (
    <div className="sr-cover">
      {publication.coverSrc ? (
        <img className="sr-cover-img" src={publication.coverSrc} alt={publication.coverAlt ?? ""} />
      ) : (
        <DreamScene scene={0} className="sr-cover-art" />
      )}
      <div className="sr-cover-shade" />
      <div className="sr-cover-mast">
        <span className="sr-cover-brand">The New Journal</span>
        <span className="sr-cover-issue">
          {publication.issueNumber ? `No. ${publication.issueNumber}` : "Your issue"}
        </span>
      </div>
      <div className="sr-cover-title">
        <h1>{publication.caption}</h1>
        <p>
          {publication.pieces.length} {publication.pieces.length === 1 ? "piece" : "pieces"} ·
          Surreal edition
        </p>
      </div>
      <div className="sr-cover-open">
        Open the issue <span aria-hidden="true">→</span>
      </div>
    </div>
  );
}

function PlateFace({ page, index }: { page: MagazinePage; index: number }) {
  const piece = page.piece!;
  const image =
    piece.type === "poem" ? piece.editorArtSrc : piece.type === "art" ? piece.imageSrc : undefined;
  const alt =
    piece.type === "poem"
      ? piece.editorArtAlt ?? piece.editorArtCaption
      : piece.type === "art"
        ? piece.imageAlt ?? `${piece.title} by ${piece.author}`
        : "";
  const isArt = piece.type === "art";
  return (
    <div className={`sr-plate ${isArt ? "is-art" : ""} crop-${index % 4}`}>
      <DreamScene scene={(sceneFor(index) + 2) % SCENE_COUNT} className="sr-plate-art" />
      <div className="sr-plate-shade" />
      {isArt ? (
        <figure className="sr-hung">
          {image ? (
            <img src={image} alt={alt} />
          ) : (
            <div className="sr-hung-empty">
              <span>Artwork forthcoming</span>
            </div>
          )}
          {piece.imageCaption && <figcaption>{piece.imageCaption}</figcaption>}
        </figure>
      ) : (
        <>
          {image && (
            <figure className="sr-plate-figure">
              <img src={image} alt={alt} />
            </figure>
          )}
          <div className="sr-plate-copy">
            <span className="sr-plate-no">
              No. {pad(index)} <i>·</i> {pieceKind[piece.type]}
            </span>
            <h2>{piece.title}</h2>
            <p>by {piece.author}</p>
          </div>
        </>
      )}
      {piece.type === "film" && (
        <div className="sr-filmstrip" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      )}
      <span className="sr-plate-scene">{sceneNames[(sceneFor(index) + 2) % SCENE_COUNT]}</span>
    </div>
  );
}

function TextFace({
  publication,
  page,
  index,
  last,
  onRestart,
}: {
  publication: Publication;
  page: MagazinePage;
  index: number;
  last: boolean;
  onRestart: () => void;
}) {
  const piece = page.piece!;
  return (
    <div className="sr-paper">
      <Folio publication={publication} index={index} />
      <div className="sr-body" tabIndex={0} role="region" aria-label={`${piece.title}, scroll to read`}>
        <p className="sr-kicker">
          {pieceKind[piece.type]}
          {page.parts > 1 && (
            <>
              {" "}
              · {page.part ? "continued" : "part"} {page.part + 1} of {page.parts}
            </>
          )}
        </p>
        {page.part === 0 ? (
          <>
            <h1 className="sr-title">{piece.title}</h1>
            <p className="sr-byline">by {piece.author}</p>
            <span className="sr-rule" aria-hidden="true">
              ❦
            </span>
          </>
        ) : (
          <h2 className="sr-title is-small">{piece.title}</h2>
        )}
        {piece.type === "poem" && (
          <Lines lines={piece.lines} dropCap={page.part === 0} />
        )}
        {piece.type === "film" && (
          <div className="sr-film">
            {piece.videoSrc ? (
              <video src={piece.videoSrc} controls preload="metadata" />
            ) : (
              <div className="sr-film-empty">
                <span>Film forthcoming</span>
              </div>
            )}
            <p>{piece.logline}</p>
          </div>
        )}
        {piece.type === "art" && (
          <div className="sr-art-notes">
            {piece.imageCaption && <p className="sr-caption">{piece.imageCaption}</p>}
            {piece.editorNote && (
              <blockquote>
                <span>Editor’s note</span>
                {piece.editorNote}
              </blockquote>
            )}
          </div>
        )}
        {last && (
          <div className="sr-fin">
            <span aria-hidden="true">— fin —</span>
            <div>
              <button type="button" onClick={onRestart}>
                Back to the cover
              </button>
              <Link to="/">All issues</Link>
            </div>
          </div>
        )}
      </div>
      <footer className="sr-foot">
        <span>{piece.author}</span>
        <span>{index}</span>
      </footer>
    </div>
  );
}

function BlankFace() {
  return <div className="sr-paper is-blank" />;
}

/* ---------- Reader ---------- */

export default function SurrealReader({ publication }: { publication: Publication }) {
  useFinishEnterOnMount();
  const reduced = useReducedMotion();
  const { pages, index, page, goTo, goToPiece } = useIssueNav(publication);
  const spread = useMediaQuery("(min-width: 900px)");
  const last = pages.length - 1;

  // `shown` is the page at rest and the URL `index` is the latest page asked for. A flip
  // runs to completion untouched; whatever was asked for meanwhile is simply the newest
  // `index`, so any number of quick requests collapse into one follow-up flip. Replacing a
  // flip mid-turn made the leaf jump, and the faster you paged the worse it got.
  const [view, setView] = useState<{ shown: number; flip: Flip | null; n: number }>(
    { shown: index, flip: null, n: 0 },
  );
  if (!view.flip && view.shown !== index) {
    setView(
      reduced
        ? { shown: index, flip: null, n: view.n }
        : { shown: view.shown, flip: { id: view.n + 1, from: view.shown, to: index }, n: view.n + 1 },
    );
  }
  const { shown, flip } = view;

  const rot = useMotionValue(0);
  const forward = flip ? flip.to > flip.from : true;
  // Layout effect, not useEffect: the new leaf mounts in this commit, and `rot` still holds
  // the last flip's end angle. Resetting after paint showed it backwards for one frame.
  useLayoutEffect(() => {
    if (!flip) return;
    const fwd = flip.to > flip.from;
    const singleBack = !spread && !fwd;
    rot.set(singleBack ? -180 : 0);
    const controls = animate(rot, singleBack ? 0 : fwd ? -180 : 180, {
      duration: FLIP_SECONDS,
      ease: [0.45, 0.05, 0.2, 1],
      onComplete: () =>
        setView((v) => (v.flip?.id === flip.id ? { ...v, shown: flip.to, flip: null } : v)),
    });
    return () => controls.stop();
  }, [flip, rot, spread]);

  const abs = useTransform(rot, (r) => Math.abs(r));
  const leafShade = useTransform(abs, (a) => Math.sin((a * Math.PI) / 180) * 0.42);
  const revealShade = useTransform(abs, (a) => (a < 90 ? (1 - a / 90) * 0.55 : 0));
  const coverShade = useTransform(abs, (a) => (a > 90 ? ((a - 90) / 90) * 0.35 : 0));
  const leafLift = useTransform(abs, (a) => Math.sin((a * Math.PI) / 180) * 24);

  const settledIndex = flip ? flip.to : shown;
  const closed = spread && settledIndex === 0;

  const restart = () => goTo(0);
  const face = (i: number, side: "L" | "R" | "P"): ReactNode => {
    const p = pages[i];
    if (!p) return <BlankFace />;
    if (!p.piece) return side === "L" ? null : <CoverFace publication={publication} />;
    if (side === "L") return <PlateFace page={p} index={i} />;
    return (
      <TextFace
        publication={publication}
        page={p}
        index={i}
        last={i === last}
        onRestart={restart}
      />
    );
  };

  // Static halves and the turning leaf for the current state.
  let left: ReactNode = null;
  let right: ReactNode = null;
  let leaf: { side: "left" | "right" | "single"; front: ReactNode; back: ReactNode } | null = null;
  if (spread) {
    if (!flip) {
      left = face(shown, "L");
      right = face(shown, "R");
    } else if (forward) {
      left = face(flip.from, "L");
      right = face(flip.to, "R");
      leaf = { side: "right", front: face(flip.from, "R"), back: face(flip.to, "L") };
    } else {
      left = face(flip.to, "L");
      right = face(flip.from, "R");
      leaf = { side: "left", front: face(flip.from, "L"), back: face(flip.to, "R") };
    }
  } else {
    const single = (i: number) =>
      pages[i]?.piece ? (
        <div className="sr-single">
          <div className="sr-single-plate">{face(i, "L")}</div>
          {face(i, "R")}
        </div>
      ) : (
        face(i, "R")
      );
    if (!flip) right = single(shown);
    else if (forward) {
      right = single(flip.to);
      leaf = { side: "single", front: single(flip.from), back: <BlankFace /> };
    } else {
      right = single(flip.from);
      leaf = { side: "single", front: single(flip.to), back: <BlankFace /> };
    }
  }

  const touch = useRef<{ x: number; y: number; at: number } | null>(null);
  const skipTouchClick = useRef(false);
  function onClick(event: React.MouseEvent<HTMLDivElement>) {
    if (skipTouchClick.current) { skipTouchClick.current = false; return; }
    if (
      (event.target instanceof HTMLElement && event.target.closest(CONTROLS)) ||
      window.getSelection()?.toString()
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    if (closed) return goTo(1);
    goTo(index + (ratio < (spread ? 0.5 : 0.3) ? -1 : 1));
  }

  const piece = page.piece;
  return (
    <div className="sr-reader" data-scene={sceneFor(settledIndex)}>
      <DreamScape scene={sceneFor(settledIndex)} />
      <div className="sr-chrome sr-top">
        <Link to="/" className="sr-pill sr-back">
          <span aria-hidden="true">←</span> All issues
        </Link>
        <p className="sr-edition">
          <span>The New Journal</span>
          <i>{publication.issueNumber ? `Issue ${publication.issueNumber}` : "Your issue"} · Surreal edition</i>
        </p>
        <div className="sr-actions reader-actions">
          {import.meta.env.DEV && publication.id === PREVIEW_ID && (
            <Link className="contents-trigger micro-button sr-pill" to="/preview">
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
      </div>

      <main className="sr-stage">
        <motion.div
          className={`sr-book ${spread ? "is-spread" : "is-single"} ${closed ? "is-closed" : ""}`}
          initial={false}
          animate={{ x: closed ? "-25%" : "0%" }}
          transition={{ duration: reduced ? 0 : FLIP_SECONDS, ease: [0.45, 0.05, 0.2, 1] }}
          onClick={onClick}
          onPointerDown={(e) => {
            skipTouchClick.current = false;
            if (e.pointerType === "touch" && !(e.target as HTMLElement).closest(CONTROLS))
              touch.current = { x: e.clientX, y: e.clientY, at: e.timeStamp };
          }}
          onPointerUp={(e) => {
            const start = touch.current;
            touch.current = null;
            if (!start || e.pointerType !== "touch") return;
            const dx = e.clientX - start.x;
            if (Math.abs(dx) > 60 && Math.abs(e.clientY - start.y) < 50 && e.timeStamp - start.at < 700) {
              skipTouchClick.current = true;
              goTo(index + (dx < 0 ? 1 : -1));
            }
          }}
          onPointerCancel={() => { touch.current = null; }}
        >
          {spread && (
            <div className={`sr-half sr-left ${left ? "" : "is-empty"}`}>
              {left}
              {leaf && left && (
                <motion.div
                  className="sr-shade from-right"
                  style={{ opacity: leaf.side === "right" ? coverShade : revealShade }}
                />
              )}
            </div>
          )}
          <div className={`sr-half sr-right ${spread ? "" : "is-single"}`}>
            {right}
            {leaf && (
              <motion.div
                className="sr-shade"
                style={{ opacity: leaf.side === "left" ? coverShade : revealShade }}
              />
            )}
          </div>
          {spread && <div className="sr-gutter" aria-hidden="true" />}
          {leaf && (
            <motion.div
              key={flip!.id}
              className={`sr-leaf on-${leaf.side}`}
              style={{ rotateY: rot, z: leafLift }}
              aria-hidden="true"
            >
              <div className="sr-face sr-face-front">
                {leaf.front}
                <motion.div className="sr-leaf-shade" style={{ opacity: leafShade }} />
              </div>
              <div className="sr-face sr-face-back">
                {leaf.back}
                <motion.div className="sr-leaf-shade is-back" style={{ opacity: leafShade }} />
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      <nav className="sr-chrome sr-bottom" aria-label="Pages">
        <button type="button" className="sr-round" aria-label="Previous page" disabled={index === 0} onClick={() => goTo(index - 1)}>
          ←
        </button>
        <div className="sr-progress">
          <span className="sr-count" aria-live="polite" aria-atomic="true">
            {index === 0 ? "Cover" : `Page ${index} of ${last}`}
          </span>
          <span className="sr-stars" aria-hidden="true">
            {pages.length <= 24 &&
              pages.map((p, i) => (
                <i key={p.id} className={i === index ? "is-on" : i < index ? "is-past" : ""} />
              ))}
          </span>
          <span className="sr-now">{piece?.title ?? publication.caption}</span>
        </div>
        <button type="button" className="sr-round" aria-label="Next page" disabled={index === last} onClick={() => goTo(index + 1)}>
          →
        </button>
      </nav>
      <p className="sr-hint">Click a page or use ← → to turn · Swipe on your phone</p>
    </div>
  );
}
