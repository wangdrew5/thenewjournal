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

// A stable cloth colour per surreal issue so each spine looks like its own volume.
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
  if (publication.theme === "museum")
    return (
      <div className="bk-face bk-cover">
        <div className="bk-cover-mast">
          <span>The New Journal</span>
          <span>{publication.issueNumber ?? ""}</span>
        </div>
        <div className="bk-cover-work">
          {publication.coverSrc ? <img src={publication.coverSrc} alt="" /> : <IssueArtwork />}
        </div>
        <h3 className="bk-cover-title">{publication.caption}</h3>
      </div>
    );
  return (
    <div className="bk-face bk-cover">
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
      <h3 className="bk-cover-title">{publication.caption}</h3>
    </div>
  );
}

// The inside of the front cover, seen once the book is open.
function Endpaper({ publication }: { publication: Publication }) {
  return (
    <div className="bk-face bk-inside">
      {publication.theme !== "museum" && <DreamScene scene={3} className="bk-inside-art" />}
      <div className="bk-plate">
        <i>Ex libris</i>
        <span>The New Journal</span>
        <small>{issueName(publication)}</small>
      </div>
    </div>
  );
}

// The first page: what is inside this issue.
function ContentsPage({ publication }: { publication: Publication }) {
  const shown = publication.pieces.slice(0, 6);
  const more = publication.pieces.length - shown.length;
  return (
    <div className="bk-face bk-page">
      <p className="bk-page-issue">{issueName(publication)}</p>
      <h4>{publication.caption}</h4>
      <ol>
        {shown.map((piece) => (
          <li key={piece.id}>
            <span>{piece.title}</span>
            <i>{piece.author}</i>
          </li>
        ))}
      </ol>
      {more > 0 && <p className="bk-page-more">and {more} more</p>}
      <p className="bk-page-read">
        {publication.theme === "museum" ? "Enter the gallery" : "Open the issue"}
      </p>
    </div>
  );
}

function IssueBook({
  publication,
  index,
  open,
  onOpen,
  pages,
}: {
  publication: Publication;
  index: number;
  open: boolean;
  onOpen: (id: string | null) => void;
  pages: Map<string, Element>;
}) {
  const reduced = useReducedMotion();
  const theme = publication.theme ?? "surreal";
  const pointer = useRef<string>("mouse");
  const intent = useRef(0);
  const slot = useRef<HTMLAnchorElement>(null);
  const book = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const thickness = Math.min(70, 40 + publication.pieces.length * 4);
  const to = `/publication/${publication.id}`;

  // The shelf measures this page when a reader returns to the book.
  useLayoutEffect(() => {
    const page = book.current?.querySelector(".bk-page");
    if (page) pages.set(publication.id, page);
    return () => {
      pages.delete(publication.id);
    };
  }, [pages, publication.id]);
  useEffect(() => () => window.clearTimeout(intent.current), []);
  // An open book is a two-page spread: keep it inside the shelf instead of
  // letting books near the ends open off the edge (or off a phone screen).
  useLayoutEffect(() => {
    if (!open) return;
    const link = slot.current;
    const row = link?.closest(".shelf-row");
    if (!link || !row || !book.current) return;
    const s = link.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const styles = getComputedStyle(row);
    const pull = Number.parseFloat(styles.getPropertyValue("--pull")) || 0;
    const depth = Number.parseFloat(styles.perspective) || 1700;
    const scale = depth / (depth - pull);
    const half = book.current.offsetWidth * scale + 10;
    const centre = s.left + s.width / 2;
    const target =
      r.width < half * 2
        ? r.left + r.width / 2
        : Math.min(r.right - half, Math.max(r.left + half, centre));
    setShift((target - centre) / scale);
  }, [open]);

  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    // On touch screens the first tap opens the book on the shelf; the second reads it.
    if (pointer.current === "touch" && !open) {
      event.preventDefault();
      onOpen(publication.id);
      return;
    }
    if (reduced) return;
    const page = book.current?.querySelector(open ? ".bk-page" : ".bk-cover");
    if (!page) return;
    event.preventDefault();
    startEnter(page, theme, to);
  }
  return (
    <Link
      ref={slot}
      to={to}
      className={`bk-slot bk-issue bk-${theme} ${open ? "is-open" : ""}`}
      style={
        {
          "--t": `${thickness}px`,
          "--hf": 1 - (index % 3) * 0.035,
          "--tone": theme === "museum" ? undefined : toneFor(publication, index),
          "--hang": `${18 + (index % 2) * 10}px`,
          "--shift": `${open ? shift : 0}px`,
        } as CSSProperties
      }
      aria-label={`Open ${publication.caption}, ${issueName(publication)}, ${themeNames[theme]} edition`}
      onClick={click}
      onPointerDown={(event: PointerEvent) => {
        pointer.current = event.pointerType;
      }}
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        // A short pause, so sweeping across the shelf doesn't open every book.
        window.clearTimeout(intent.current);
        intent.current = window.setTimeout(() => onOpen(publication.id), 110);
      }}
      onPointerLeave={(event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(intent.current);
        // A moment's grace, so slipping off the edge doesn't snap it shut.
        if (open) intent.current = window.setTimeout(() => onOpen(null), 160);
      }}
      onFocus={() => onOpen(publication.id)}
      onBlur={() => {
        if (open) onOpen(null);
      }}
    >
      <span className="bk-ground" aria-hidden="true" />
      <div className="bk" ref={book}>
        <ContentsPage publication={publication} />
        <div className="bk-lid">
          <Cover publication={publication} />
          <Endpaper publication={publication} />
        </div>
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
  if (kind === "note") return <p className="shelf-note">The first issue is on its way.</p>;
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
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const rows = shelfRows(publications, wide ? 9 : medium ? 6 : 3, !medium);
  const transition = useEnterState();
  const returning = transition?.kind === "return" ? transition.id : null;

  // The open book: hovered, focused, tapped, or coming back from a read.
  const [open, setOpen] = useState<string | null>(returning);
  const [pages] = useState(() => new Map<string, Element>());
  const caseRef = useRef<HTMLDivElement>(null);

  // Coming back from an issue: hand the overlay the open book's first page.
  const returnId = useRef(returning);
  useLayoutEffect(() => {
    const id = returnId.current;
    if (!id) return;
    const page = pages.get(id);
    if (!page) return finishReturn();
    const rect = page.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight)
      page.scrollIntoView({ block: "center", behavior: "instant" });
    setReturnTarget(page);
  }, [pages]);
  // Once the overlay has gone, close the book and slide it back into place.
  useEffect(() => {
    if (returning || !returnId.current) return;
    returnId.current = null;
    const timer = window.setTimeout(() => setOpen(null), 380);
    return () => window.clearTimeout(timer);
  }, [returning]);
  // A tap or click anywhere else puts an open book back.
  useEffect(() => {
    if (!open || returnId.current) return;
    function away(event: globalThis.PointerEvent) {
      if (!(event.target as HTMLElement).closest(".bk-issue")) setOpen(null);
    }
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);

  // The lamp follows the pointer along the shelf.
  function moveLight(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    caseRef.current?.style.setProperty(
      "--lx",
      `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`,
    );
  }

  const featured = publications.find((publication) => publication.id === open) ?? null;
  return (
    <section className="bookshelf" aria-label="Issues">
      <div className="bookcase" ref={caseRef} onPointerMove={moveLight}>
        <div className="bookcase-plate">The New Journal</div>
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
                        open={open === prop.publication.id}
                        onOpen={setOpen}
                        pages={pages}
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
            <strong>{featured.caption}</strong>
            <span>
              {themeNames[featured.theme ?? "surreal"]} edition, {featured.pieces.length}{" "}
              {featured.pieces.length === 1 ? "piece" : "pieces"}.{" "}
              {finePointer ? "Click to read." : "Tap again to read."}
            </span>
          </>
        ) : publications.length ? (
          <span>{finePointer ? "Hover over a book to open it." : "Tap a book to open it."}</span>
        ) : null}
      </p>
    </section>
  );
}
