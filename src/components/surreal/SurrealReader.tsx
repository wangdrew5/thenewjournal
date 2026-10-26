import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { Publication, SongPiece } from "../../data/publications";
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
import SongPlayer from "../pieces/SongPlayer";
import ReadingControls from "./ReadingControls";
import { useCurrentSong } from "../../lib/useSongAudio";
import DreamScape, { DreamScene } from "./DreamScape";
import { SCENE_COUNT } from "./scenes";
import { SceneClockContext, createSceneClock } from "./sceneClock";
import "./surreal.css";
import { issueName } from "../../lib/issueLabel";

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
        <p key={i}>{line || "\u00a0"}</p>
      ))}
    </div>
  );
}

// Longer writing says how long it takes, at a relaxed 180 words a minute.
function readMinutes(lines: string[]) {
  const words = lines.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function Transcript({ song }: { song: SongPiece }) {
  return (
    <div className="sr-transcript">
      <p className="sr-transcript-label">Transcript</p>
      {song.transcript.length ? (
        <Lines lines={song.transcript} dropCap={false} />
      ) : (
        <p className="sr-transcript-empty">No transcript has been added for this song.</p>
      )}
    </div>
  );
}

function Folio({ publication, index }: { publication: Publication; index: number }) {
  return (
    <header className="sr-folio">
      <span>The New Journal</span>
      <span>
        {issueName(publication)} ·{" "}
        {pad(index)}
      </span>
    </header>
  );
}

function CoverFace({ publication, frozenAhead }: { publication: Publication; frozenAhead?: number }) {
  return (
    <div className="sr-cover">
      {publication.coverSrc ? (
        <img className="sr-cover-img" src={publication.coverSrc} alt={publication.coverAlt ?? ""} />
      ) : (
        <DreamScene scene={0} className="sr-cover-art" frozenAhead={frozenAhead} clockKey="cover" />
      )}
      <div className="sr-cover-shade" />
      <div className="sr-cover-mast">
        <span className="sr-cover-brand">The New Journal</span>
        <span className="sr-cover-issue">
          {issueName(publication, "No.")}
        </span>
      </div>
      <div className="sr-cover-title">
        <h1>{publication.caption}</h1>
      </div>
      <div className="sr-cover-open">
        Open the issue <span aria-hidden="true">→</span>
      </div>
    </div>
  );
}

// `live` is false for the copies of a page drawn on the turning leaf: they show the same
// song state but cannot be used, so the page at rest stays the only working player.
function PlateFace({
  page,
  index,
  live,
  frozenAhead,
}: {
  page: MagazinePage;
  index: number;
  live: boolean;
  frozenAhead?: number;
}) {
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
    <div className={`sr-plate ${isArt ? "is-art" : ""} ${piece.type === "song" ? "is-song" : ""} crop-${index % 4}`}>
      <DreamScene
        scene={(sceneFor(index) + 2) % SCENE_COUNT}
        className="sr-plate-art"
        frozenAhead={frozenAhead}
        clockKey={`plate-${index}`}
      />
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
            {piece.type === "song" && <SongPlayer song={piece} live={live} tone="dark" />}
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
    </div>
  );
}

function TextFace({
  publication,
  page,
  index,
  last,
  startAt,
  scrolls,
  onRestart,
}: {
  publication: Publication;
  page: MagazinePage;
  index: number;
  last: boolean;
  startAt: number;
  scrolls: Map<string, number>;
  onRestart: () => void;
}) {
  const piece = page.piece!;
  const body = useRef<HTMLDivElement>(null);
  const firstStart = useRef(startAt);
  // Every copy of a page (the one at rest and the one on the turning leaf) is its own
  // element, so a copy begins where the reader says rather than wherever a scroll
  // container happened to be left, and records that start so the others can match it.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    if (firstStart.current) el.scrollTop = firstStart.current;
    scrolls.set(page.id, el.scrollTop);
  }, [scrolls, page.id]);
  return (
    <div className="sr-paper">
      <Folio publication={publication} index={index} />
      <div
        ref={body}
        className="sr-body"
        tabIndex={0}
        role="region"
        aria-label={piece.type === "song" ? `Transcript of ${piece.title}, scroll to read` : `${piece.title}, scroll to read`}
        onScroll={(event) => scrolls.set(page.id, event.currentTarget.scrollTop)}
      >
        <p className="sr-kicker">
          {pieceKind[piece.type]}
          {piece.type === "poem" && readMinutes(piece.lines) >= 2 && (
            <span className="sr-readtime"> · {readMinutes(piece.lines)} min read</span>
          )}
        </p>
        <h1 className="sr-title">{piece.title}</h1>
        {piece.type === "poem" && <Lines lines={piece.lines} dropCap />}
        {piece.type === "song" && <Transcript song={piece} />}
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
            {(piece.pageText ?? piece.imageCaption) && (
              <p className="sr-caption">{piece.pageText ?? piece.imageCaption}</p>
            )}
            {piece.signatureSrc && (
              <img className="sr-signature" src={piece.signatureSrc} alt={`Signature of ${piece.author}`} />
            )}
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
        <span>{index}</span>
      </footer>
    </div>
  );
}

function BlankFace() {
  return <div className="sr-paper is-blank" />;
}

/* ---------- Reader ---------- */

// The scene clock is shared by every copy of a page's scenery, so hand-overs between them
// continue at the exact same phase. One per visit to the reader.
export default function SurrealReader({ publication }: { publication: Publication }) {
  const [sceneClock] = useState(createSceneClock);
  return (
    <SceneClockContext.Provider value={sceneClock}>
      <SurrealBook publication={publication} />
    </SceneClockContext.Provider>
  );
}

function SurrealBook({ publication }: { publication: Publication }) {
  useFinishEnterOnMount();
  const reduced = useReducedMotion();
  const { pages, index, page, goTo, goToPiece } = useIssueNav(publication);
  useCurrentSong(page.piece);
  // The cover only uses italic Cormorant. Fetch the faces the pages use as soon as the reader
  // opens; otherwise they load during the first turn and the text swaps font (and rewraps)
  // mid-flip on both copies of the page.
  useEffect(() => {
    for (const face of ['400 1em "Cormorant Garamond"', '600 1em "Cormorant Garamond"', '700 1em "Lato"'])
      document.fonts?.load(face).catch(() => {});
  }, []);
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

  const [scrolls] = useState(() => new Map<string, number>());
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
  // `copy` marks faces drawn on the turning leaf rather than the page at rest: "start" for
  // the page seen as the turn begins, "end" for the one seen as it lands. Their scenes hold
  // still at that moment (see DreamScene's frozenAhead).
  type Copy = false | "start" | "end";
  const frozen = (copy: Copy) => (copy === "start" ? 0 : copy === "end" ? FLIP_SECONDS * 1000 : undefined);
  const face = (i: number, side: "L" | "R" | "P", copy: Copy = false): ReactNode => {
    const p = pages[i];
    if (!p) return <BlankFace />;
    if (!p.piece) return side === "L" ? null : <CoverFace publication={publication} frozenAhead={frozen(copy)} />;
    if (side === "L") return <PlateFace page={p} index={i} live={!copy} frozenAhead={frozen(copy)} />;
    return (
      <TextFace
        key={p.id}
        publication={publication}
        page={p}
        index={i}
        last={i === last}
        // Only the page being turned away carries its scroll onto the turning leaf;
        // an arriving page always opens at the top, on the leaf and once landed.
        startAt={flip && i === flip.from ? scrolls.get(p.id) ?? 0 : 0}
        scrolls={scrolls}
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
      leaf = { side: "right", front: face(flip.from, "R", "start"), back: face(flip.to, "L", "end") };
    } else {
      left = face(flip.to, "L");
      right = face(flip.from, "R");
      leaf = { side: "left", front: face(flip.from, "L", "start"), back: face(flip.to, "R", "end") };
    }
  } else {
    const single = (i: number, copy: Copy = false) =>
      pages[i]?.piece ? (
        <div className={`sr-single ${pages[i].piece!.type === "song" ? "is-song" : ""}`}>
          <div className="sr-single-plate">{face(i, "L", copy)}</div>
          {face(i, "R", copy)}
        </div>
      ) : (
        face(i, "R", copy)
      );
    if (!flip) right = single(shown);
    else if (forward) {
      right = single(flip.to);
      leaf = { side: "single", front: single(flip.from, "start"), back: <BlankFace /> };
    } else {
      right = single(flip.from);
      leaf = { side: "single", front: single(flip.to, "end"), back: <BlankFace /> };
    }
  }

  const touch = useRef<{ x: number; y: number; at: number } | null>(null);
  const skipTouchClick = useRef(false);
  function onClick(event: React.MouseEvent<HTMLDivElement>) {
    if (skipTouchClick.current) { skipTouchClick.current = false; return; }
    if (
      // Element, not HTMLElement: a click on an icon inside a control targets the SVG.
      (event.target instanceof Element && event.target.closest(CONTROLS)) ||
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
    // The backdrop changes once a turn has landed, so its crossfade never competes with the turn.
    <div className="sr-reader" data-scene={sceneFor(shown)}>
      <DreamScape scene={sceneFor(shown)} paused={flip !== null} />
      <div className="sr-chrome sr-top">
        <Link to="/" className="sr-pill sr-back">
          <span aria-hidden="true">←</span> All issues
        </Link>
        <p className="sr-edition">
          <Link to="/" aria-label="The New Journal, back to the home page">
            The New Journal
          </Link>
        </p>
        <div className="sr-actions reader-actions">
          {import.meta.env.DEV && publication.id === PREVIEW_ID && (
            <Link className="contents-trigger micro-button sr-pill" to="/preview">
              Edit issue
            </Link>
          )}
          <ReadingControls />
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
    </div>
  );
}
