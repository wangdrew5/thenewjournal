import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import type { Publication } from "../../data/publications";
import {
  finishReturn,
  setReturnTarget,
  startEnter,
  useEnterState,
} from "../../lib/enterTransition";
import { issueName } from "../../lib/issueLabel";
import { themeNames } from "../../lib/magazine";
import { useMediaQuery } from "../../lib/useIssueNav";
import { DreamScene } from "../surreal/DreamScape";
import IssueArtwork from "../magazine/IssueArtwork";
import "./shelf.css";

/* ---------- Shelf layout ---------- */

// Plain, untitled volumes and objects that make the shelf feel lived in.
// They are decoration only: hidden from assistive tech and not interactive.
type Prop =
  | { kind: "issue"; publication: Publication; index: number }
  | { kind: "volume"; tone: number; height: number; thickness: number; lean?: boolean }
  | { kind: "bookend" }
  | { kind: "candle" }
  | { kind: "plant" }
  | { kind: "note" };

const volume = (tone: number, height: number, thickness: number, lean = false): Prop => ({
  kind: "volume",
  tone,
  height,
  thickness,
  lean,
});

function shelfRows(publications: Publication[], perRow: number, compact: boolean): Prop[][] {
  const issues: Prop[] = publications.map((publication, index) => ({
    kind: "issue",
    publication,
    index,
  }));
  const rows: Prop[][] = [];
  for (let i = 0; i < Math.max(issues.length, 1); i += perRow)
    rows.push(issues.slice(i, i + perRow));
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (compact) {
    // Phones: just enough to read as a shelf without crowding the issues.
    first.unshift(volume(1, 0.9, 22));
    if (!publications.length) first.push(volume(2, 0.86, 26), { kind: "note" });
    last.push(volume(3, 0.84, 22, true), { kind: "bookend" });
  } else {
    first.unshift({ kind: "candle" }, volume(0, 0.86, 30), volume(1, 0.92, 24));
    if (!publications.length) first.push(volume(2, 0.9, 34), volume(3, 0.82, 26, true), { kind: "note" });
    last.push(volume(2, 0.94, 28), volume(3, 0.84, 22), volume(1, 0.8, 32, true), { kind: "bookend" }, { kind: "plant" });
  }
  rows.slice(1, -1).forEach((row) => row.push({ kind: "bookend" }));
  return rows;
}

/* ---------- Books ---------- */

// A stable jewel tone per surreal issue so each spine looks like its own volume.
const SURREAL_TONES = ["#123c46", "#262b61", "#5a1f2c", "#1d3f2d", "#3d2a5c"];
function toneFor(publication: Publication, index: number) {
  const number = Number.parseInt(publication.issueNumber ?? "", 10);
  return SURREAL_TONES[(Number.isNaN(number) ? index : number) % SURREAL_TONES.length];
}

function Spine({ publication }: { publication: Publication }) {
  const museum = publication.theme === "museum";
  return (
    <div className="bk-face bk-spine">
      <span className="bk-spine-no">{publication.issueNumber ?? "·"}</span>
      <span className="bk-spine-title">{publication.caption}</span>
      <span className="bk-spine-mark" aria-hidden="true">
        {museum ? "TNJ" : "☾"}
      </span>
    </div>
  );
}

function Cover({ publication }: { publication: Publication }) {
  const museum = publication.theme === "museum";
  return (
    <div className="bk-face bk-cover">
      {museum ? (
        <>
          <div className="bk-cover-mast">
            <span>The New Journal</span>
            <span>{publication.issueNumber ?? ""}</span>
          </div>
          <div className="bk-cover-work">
            {publication.coverSrc ? (
              <img src={publication.coverSrc} alt="" />
            ) : (
              <IssueArtwork />
            )}
          </div>
          <div className="bk-cover-title">
            <h3>{publication.caption}</h3>
            <span>Gallery edition</span>
          </div>
        </>
      ) : (
        <>
          {publication.coverSrc ? (
            <img className="bk-cover-art" src={publication.coverSrc} alt="" />
          ) : (
            <DreamScene scene={publication.issueNumber === "01" ? 1 : 0} className="bk-cover-art" />
          )}
          <div className="bk-cover-shade" />
          <div className="bk-cover-mast">
            <span>The New Journal</span>
            <span>{issueName(publication, "No.")}</span>
          </div>
          <div className="bk-cover-title">
            <h3>{publication.caption}</h3>
            <span>Surreal edition</span>
          </div>
        </>
      )}
      <span className="bk-cover-open">
        {museum ? "Enter the gallery" : "Open the magazine"} <b aria-hidden="true">↗</b>
      </span>
    </div>
  );
}

function IssueBook({
  publication,
  index,
  out,
  onPull,
  onHover,
  covers,
}: {
  publication: Publication;
  index: number;
  out: boolean;
  onPull: (id: string | null) => void;
  onHover: (publication: Publication | null) => void;
  covers: Map<string, Element>;
}) {
  const reduced = useReducedMotion();
  const theme = publication.theme ?? "surreal";
  const pointer = useRef<string>("mouse");
  const book = useRef<HTMLDivElement>(null);
  const thickness = Math.min(70, 40 + publication.pieces.length * 4);
  const to = `/publication/${publication.id}`;
  // The shelf measures this cover when a reader returns to it.
  useLayoutEffect(() => {
    const cover = book.current?.querySelector(".bk-cover");
    if (cover) covers.set(publication.id, cover);
    return () => {
      covers.delete(publication.id);
    };
  }, [covers, publication.id]);

  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    // On touch screens the first tap pulls the book out; the second opens it.
    if (pointer.current === "touch" && !out) {
      event.preventDefault();
      onPull(publication.id);
      return;
    }
    if (reduced) return;
    const cover = book.current?.querySelector(".bk-cover");
    if (!cover) return;
    event.preventDefault();
    startEnter(cover, theme, to);
  }
  return (
    <Link
      to={to}
      className={`bk-slot bk-issue bk-${theme} ${out ? "is-out" : ""}`}
      style={
        {
          "--t": `${thickness}px`,
          "--hf": 1 - (index % 3) * 0.035,
          "--tone": theme === "museum" ? undefined : toneFor(publication, index),
          "--hang": `${18 + (index % 2) * 10}px`,
        } as CSSProperties
      }
      aria-label={`Open ${publication.caption}, ${issueName(publication)}, ${themeNames[theme]} edition`}
      onClick={click}
      onPointerDown={(event: PointerEvent) => {
        pointer.current = event.pointerType;
      }}
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType === "mouse") onHover(publication);
      }}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(publication)}
      onBlur={() => onHover(null)}
    >
      <div className="bk" ref={book}>
        <Cover publication={publication} />
        <Spine publication={publication} />
        <div className="bk-face bk-back" />
        <div className="bk-face bk-edge" />
        <div className="bk-face bk-top" />
      </div>
    </Link>
  );
}

function Volume({ prop }: { prop: Extract<Prop, { kind: "volume" }> }) {
  return (
    <div
      className={`bk-slot bk-volume tone-${prop.tone} ${prop.lean ? "is-leaning" : ""}`}
      style={{ "--t": `${prop.thickness}px`, "--hf": prop.height, "--hang": "0px" } as CSSProperties}
      aria-hidden="true"
    >
      <div className="bk">
        <div className="bk-face bk-spine">
          <i />
          <i />
        </div>
        <div className="bk-face bk-cover" />
        <div className="bk-face bk-edge" />
        <div className="bk-face bk-top" />
      </div>
    </div>
  );
}

function Decor({ kind }: { kind: "bookend" | "candle" | "plant" | "note" }) {
  if (kind === "bookend") return <div className="shelf-bookend" aria-hidden="true" />;
  if (kind === "candle")
    return (
      <div className="shelf-candle" aria-hidden="true">
        <span className="shelf-flame" />
        <span className="shelf-wax" />
        <span className="shelf-dish" />
      </div>
    );
  if (kind === "note")
    return (
      <p className="shelf-note">The first issue is on its way.</p>
    );
  return (
    <svg className="shelf-plant" viewBox="0 0 120 210" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#4f7a4a" strokeWidth="2.4" strokeLinecap="round">
        <path d="M58 92c-8-24-26-34-40-36M62 92c4-30 22-44 40-48M60 92c0-22-6-40-2-60" />
        <path d="M44 120c-14 20-20 46-12 78M78 120c12 18 16 40 10 68" />
      </g>
      <g fill="#5f8f55">
        <ellipse cx="18" cy="55" rx="12" ry="6" transform="rotate(-20 18 55)" />
        <ellipse cx="34" cy="66" rx="10" ry="5" transform="rotate(20 34 66)" />
        <ellipse cx="102" cy="44" rx="13" ry="6" transform="rotate(25 102 44)" />
        <ellipse cx="84" cy="56" rx="10" ry="5" transform="rotate(-25 84 56)" />
        <ellipse cx="58" cy="30" rx="7" ry="13" />
        <ellipse cx="66" cy="54" rx="6" ry="11" transform="rotate(20 66 54)" />
        <ellipse cx="36" cy="146" rx="9" ry="5" transform="rotate(60 36 146)" />
        <ellipse cx="30" cy="176" rx="9" ry="5" transform="rotate(-50 30 176)" />
        <ellipse cx="88" cy="140" rx="9" ry="5" transform="rotate(-60 88 140)" />
        <ellipse cx="90" cy="168" rx="9" ry="5" transform="rotate(50 90 168)" />
      </g>
      <path d="M30 88h60l-8 42H38Z" fill="#b5663f" />
      <path d="M26 84h68v10H26Z" fill="#c97a51" />
      <path d="M38 130h44" stroke="#8a4a2c" strokeWidth="2" />
    </svg>
  );
}

/* ---------- Shelf ---------- */

export default function Bookshelf({ publications }: { publications: Publication[] }) {
  const wide = useMediaQuery("(min-width: 1000px)");
  const medium = useMediaQuery("(min-width: 640px)");
  const rows = shelfRows(publications, wide ? 9 : medium ? 6 : 3, !medium);
  const transition = useEnterState();
  const returning = transition?.kind === "return" ? transition.id : null;

  // The book that is out of the shelf: pulled by a tap, or coming back from a read.
  const [out, setOut] = useState<string | null>(returning);
  const [hovered, setHovered] = useState<Publication | null>(null);
  const [covers] = useState(() => new Map<string, Element>());

  // Coming back from an issue: hand the overlay the book's cover to shrink onto.
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
  // Once the overlay has gone, slide the book back into its place.
  useEffect(() => {
    if (returning || !returnId.current) return;
    returnId.current = null;
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [returning]);
  // A tap anywhere else puts a pulled book back.
  useEffect(() => {
    if (!out || returnId.current) return;
    function away(event: globalThis.PointerEvent) {
      if (!(event.target as HTMLElement).closest(".bk-issue")) setOut(null);
    }
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [out]);

  const featured =
    hovered ?? publications.find((publication) => publication.id === out) ?? null;
  return (
    <section className="bookshelf" aria-label="Issues">
      <div className="bookcase">
        <div className="bookcase-plate">
          <span>The New Journal</span>
          <i>Collected issues</i>
        </div>
        {rows.map((row, r) => (
          <div className="shelf-row" key={r}>
            <div className="shelf-light" aria-hidden="true" />
            <div className="shelf-stage">
              <div className="shelf-books">
                {row.map((prop, i) => {
                  if (prop.kind === "issue")
                    return (
                      <IssueBook
                        key={prop.publication.id}
                        publication={prop.publication}
                        index={prop.index}
                        out={out === prop.publication.id}
                        onPull={setOut}
                        onHover={setHovered}
                        covers={covers}
                      />
                    );
                  if (prop.kind === "volume") return <Volume key={`v${i}`} prop={prop} />;
                  return <Decor key={`${prop.kind}${i}`} kind={prop.kind} />;
                })}
              </div>
              <div className="shelf-plank" aria-hidden="true">
                <div className="shelf-plank-top" />
                <div className="shelf-plank-front" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="shelf-caption" aria-live="polite">
        {featured ? (
          <>
            <span>{issueName(featured)}</span>
            <strong>{featured.caption}</strong>
            <span>
              {themeNames[featured.theme ?? "surreal"]} edition · {featured.pieces.length}{" "}
              {featured.pieces.length === 1 ? "piece" : "pieces"}
            </span>
            <em>{hovered ? "Click to open" : "Tap again to open"}</em>
          </>
        ) : publications.length ? (
          <em>Hover over a book to see its cover · tap on a phone · click to open</em>
        ) : null}
      </p>
    </section>
  );
}
