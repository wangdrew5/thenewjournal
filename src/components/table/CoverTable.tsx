import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import type { Publication } from "../../data/publications";
import {
  finishReturn,
  setReturnTarget,
  startEnter,
  useEnterState,
} from "../../lib/enterTransition";
import { issueMark, issueName } from "../../lib/issueLabel";
import { themeNames } from "../../lib/magazine";
import { useMediaQuery } from "../../lib/useIssueNav";
import { DreamScene } from "../surreal/DreamScape";
import IssueArtwork from "../magazine/IssueArtwork";
import "./table.css";

// How each copy was dropped on the table: a tilt and a nudge, stable per position
// so the spread looks casual but never reshuffles between visits.
const LIE = [
  { r: -5.5, x: 0, y: 10 },
  { r: 3.5, x: -6, y: -8 },
  { r: -2, x: 4, y: 18 },
  { r: 6, x: -4, y: 0 },
  { r: -4, x: 6, y: -12 },
  { r: 2.5, x: 0, y: 14 },
  { r: -6.5, x: -6, y: 4 },
];

function OpenRow({ label }: { label: string }) {
  return (
    <div className="tc-open">
      <span>{label}</span>
      <span aria-hidden="true">↗</span>
    </div>
  );
}

// The first visit to the table in a session: copies are set down one after another.
// Coming back from reading, or visiting again, finds them already there.
let arrived = false;

function Cover({ publication }: { publication: Publication }) {
  if (publication.theme === "museum")
    return (
      <>
        <div className="tc-mast">
          <span>The New Journal</span>
          <span>{publication.issueNumber ?? ""}</span>
        </div>
        <div className="tc-work">
          {publication.coverSrc ? <img src={publication.coverSrc} alt="" /> : <IssueArtwork />}
        </div>
        <h3 className="tc-title">{publication.caption}</h3>
        <p className="tc-sub">The New Journal, {issueName(publication)}</p>
        <OpenRow label="Enter the gallery" />
      </>
    );
  return (
    <>
      {publication.coverSrc ? (
        <img className="tc-art" src={publication.coverSrc} alt="" />
      ) : (
        <DreamScene scene={publication.issueNumber === "01" ? 1 : 0} className="tc-art" />
      )}
      <div className="tc-shade" />
      <div className="tc-mast">
        <span>The New Journal</span>
        <span>{issueName(publication, "No.")}</span>
      </div>
      <h3 className="tc-title">{publication.caption}</h3>
      <OpenRow label="Open the magazine" />
    </>
  );
}

function TableCover({
  publication,
  index,
  lifted,
  side,
  onLift,
  covers,
  arriving,
}: {
  publication: Publication;
  index: number;
  lifted: boolean;
  side: number;
  onLift: (id: string | null) => void;
  covers: Map<string, Element>;
  arriving: boolean;
}) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const theme = publication.theme ?? "surreal";
  const cover = useRef<HTMLDivElement>(null);
  const to = `/publication/${publication.id}`;
  const lie = LIE[index % LIE.length];

  // The table measures this cover when a reader comes back to it.
  useLayoutEffect(() => {
    if (cover.current) covers.set(publication.id, cover.current);
    return () => {
      covers.delete(publication.id);
    };
  }, [covers, publication.id]);

  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (reduced || !cover.current) return;
    event.preventDefault();
    startEnter(cover.current, theme);
    navigate(to);
  }
  return (
    <Link
      to={to}
      className={`tc tc-${theme} ${lifted ? "is-lifted" : ""} ${arriving ? "is-arriving" : ""}`}
      style={
        {
          "--r": `${lie.r}deg`,
          "--x": `${lie.x}px`,
          "--y": `${lie.y}px`,
          "--side": side,
          "--i": index,
          zIndex: lifted ? 50 : index + 1,
        } as CSSProperties
      }
      aria-label={`Open ${publication.caption}, ${issueName(publication)}, ${themeNames[theme]} edition`}
      onClick={click}
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType === "mouse") onLift(publication.id);
      }}
      onPointerLeave={(event: PointerEvent) => {
        if (event.pointerType === "mouse") onLift(null);
      }}
      onFocus={() => onLift(publication.id)}
      onBlur={() => onLift(null)}
    >
      <div className="tc-copy" ref={cover}>
        <Cover publication={publication} />
      </div>
      <span className="tc-heading">
        <span>{issueMark(publication)}</span>
        <span>{publication.theme === "museum" ? "The gallery edition" : publication.caption}</span>
      </span>
    </Link>
  );
}

// A cup of coffee seen from above, left at the edge of the spread.
function Mug() {
  return (
    <svg className="table-mug" viewBox="0 0 220 180" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="mug-rim" cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fbf8f2" />
          <stop offset="1" stopColor="#ddd5c8" />
        </radialGradient>
        <radialGradient id="mug-coffee" cx="40%" cy="38%" r="65%">
          <stop offset="0" stopColor="#6b4022" />
          <stop offset="0.7" stopColor="#3d2312" />
          <stop offset="1" stopColor="#2a170b" />
        </radialGradient>
      </defs>
      <path d="M150 74c34-6 52 6 52 22s-18 28-52 22" fill="none" stroke="#e8e1d6" strokeWidth="16" strokeLinecap="round" />
      <circle cx="90" cy="90" r="78" fill="url(#mug-rim)" />
      <circle cx="90" cy="90" r="64" fill="url(#mug-coffee)" />
      <ellipse cx="70" cy="66" rx="22" ry="9" fill="#fff" opacity="0.16" transform="rotate(-30 70 66)" />
      <circle cx="90" cy="90" r="64" fill="none" stroke="#c9a27a" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}

// Things that stand for what is inside the issues: writing, art, and songs.
function Letter() {
  return (
    <div className="table-letter" aria-hidden="true">
      <svg viewBox="0 0 260 330" focusable="false">
        <rect width="260" height="330" fill="#fbf7ee" />
        <path d="M0 110h260M0 220h260" stroke="#d9cfbd" strokeWidth="1.5" />
        <g fill="none" stroke="#2c3e66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.82">
          <path d="M28 40c6-8 10 6 16-2s9 4 14-1 8 3 12 0" />
          <path d="M28 70c10-4 18 3 28-1s14 2 24-1 16 3 26 0 18 2 30-1 14 2 22 0 12 2 20 0 10 2 18 0" />
          <path d="M28 92c12-3 20 2 30-1s16 3 28 0 14-2 24 1 18-2 28 0 12 2 22-1" />
          <path d="M28 136c8-3 18 3 28 0s14 2 26-1 16 3 26 0 20 2 30-1 12 2 24 0 14 2 22 0" />
          <path d="M28 158c10-2 16 3 26 0s20 2 28-1 14 3 26 0 16-2 26 1 10-2 20 0" />
          <path d="M28 180c12-3 18 2 30 0s14 3 24 0 18 2 28-1" />
          <path d="M28 246c10-3 16 2 26 0s18 3 28 0 12-2 24 1 16-2 26 0 14 2 24-1 14 2 20 0" />
          <path d="M28 268c8-2 18 3 28 0s16 2 24-1 18 3 28 0 10 2 22 0" />
          <path d="M150 300c6-6 12 4 18-2s8 6 14 0 10 4 16-1" />
        </g>
      </svg>
    </div>
  );
}

function Polaroid() {
  return (
    <div className="table-polaroid" aria-hidden="true">
      <DreamScene scene={2} className="table-polaroid-art" />
    </div>
  );
}

function Cassette() {
  return (
    <svg className="table-cassette" viewBox="0 0 200 128" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="198" height="126" rx="8" fill="#26231f" />
      <rect x="14" y="12" width="172" height="74" rx="4" fill="#efe3c8" />
      <rect x="14" y="12" width="172" height="16" rx="4" fill="#c4553a" />
      <path d="M26 44h148" stroke="#b8a888" strokeWidth="1" />
      <text x="28" y="40" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="13" fill="#3b2a1c">songs, side A</text>
      <rect x="50" y="50" width="100" height="30" rx="15" fill="#1a1815" />
      <circle cx="66" cy="65" r="11" fill="#efe3c8" />
      <circle cx="134" cy="65" r="11" fill="#efe3c8" />
      <circle cx="66" cy="65" r="5" fill="#1a1815" />
      <circle cx="134" cy="65" r="5" fill="#1a1815" />
      <path d="M44 126l10-26h92l10 26" fill="#34302a" />
      <circle cx="74" cy="114" r="4" fill="#1a1815" />
      <circle cx="126" cy="114" r="4" fill="#1a1815" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg className="table-pencil" viewBox="0 0 300 16" aria-hidden="true" focusable="false">
      <path d="M0 8 22 2h232v12H22Z" fill="#d8b47a" />
      <path d="M0 8l22-6v12Z" fill="#e9cfa4" />
      <path d="M0 8l7-2v4Z" fill="#2b2622" />
      <path d="M22 2h232v4H22Z" fill="#e6be6e" />
      <path d="M22 10h232v4H22Z" fill="#b58a3f" />
      <path d="M254 1h22v14h-22Z" fill="#b9b4a8" />
      <path d="M276 1h22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-22Z" fill="#d98d84" />
    </svg>
  );
}

export default function CoverTable({ publications }: { publications: Publication[] }) {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const transition = useEnterState();
  const returning = transition?.kind === "return" ? transition.id : null;

  // The lifted copy: hovered, focused, or coming back from a read.
  const [lifted, setLifted] = useState<string | null>(returning);
  const [covers] = useState(() => new Map<string, Element>());

  // Coming back from an issue: hand the overlay the cover it shrinks onto.
  const returnId = useRef(returning);
  useLayoutEffect(() => {
    const id = returnId.current;
    if (!id) return;
    const cover = covers.get(id);
    if (!cover) return finishReturn();
    const rect = cover.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight)
      cover.scrollIntoView({ block: "center", behavior: "instant" });
    setReturnTarget(cover);
  }, [covers]);
  // Once the overlay has gone, set the copy back down on the table.
  useEffect(() => {
    if (returning || !returnId.current) return;
    returnId.current = null;
    const timer = window.setTimeout(() => setLifted(null), 380);
    return () => window.clearTimeout(timer);
  }, [returning]);

  const [arriving] = useState(() => !arrived && !returning);
  useEffect(() => {
    arrived = true;
  }, []);

  const liftedAt = publications.findIndex((publication) => publication.id === lifted);
  const featured = liftedAt >= 0 ? publications[liftedAt] : null;
  return (
    <section className="cover-table" aria-label="Issues">
      <div className="table-spread">
        <Polaroid />
        <Letter />
        <Mug />
        <Cassette />
        <Pencil />
        {publications.length ? (
          <div className="table-covers">
            {publications.map((publication, index) => (
              <TableCover
                key={publication.id}
                publication={publication}
                index={index}
                lifted={lifted === publication.id}
                // Copies either side of the lifted one shuffle out of its way.
                side={liftedAt < 0 || index === liftedAt ? 0 : index < liftedAt ? -1 : 1}
                onLift={setLifted}
                covers={covers}
                arriving={arriving}
              />
            ))}
          </div>
        ) : (
          <p className="table-note">The first issue is on its way.</p>
        )}
      </div>
      <p className="table-caption" aria-live="polite">
        {featured ? (
          <>
            <strong>{featured.caption}</strong>
            <span>
              {featured.pieces.length} {featured.pieces.length === 1 ? "page" : "pages"},{" "}
              {finePointer ? "click" : "tap"} to read!
            </span>
          </>
        ) : publications.length ? (
          <span>{finePointer ? "Pick up an issue to read it." : "Tap an issue to read it."}</span>
        ) : null}
      </p>
    </section>
  );
}
