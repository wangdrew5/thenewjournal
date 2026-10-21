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
}: {
  publication: Publication;
  index: number;
  lifted: boolean;
  side: number;
  onLift: (id: string | null) => void;
  covers: Map<string, Element>;
}) {
  const reduced = useReducedMotion();
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
    startEnter(cover.current, theme, to);
  }
  return (
    <Link
      to={to}
      className={`tc tc-${theme} ${lifted ? "is-lifted" : ""}`}
      style={
        {
          "--r": `${lie.r}deg`,
          "--x": `${lie.x}px`,
          "--y": `${lie.y}px`,
          "--side": side,
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
    </Link>
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
  const reduced = useReducedMotion();
  const transition = useEnterState();
  const returning = transition?.kind === "return" ? transition.id : null;

  // The lifted copy: hovered, focused, or coming back from a read.
  const [lifted, setLifted] = useState<string | null>(returning);
  const [covers] = useState(() => new Map<string, Element>());
  const tableRef = useRef<HTMLDivElement>(null);

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

  // The desk lamp follows the pointer across the table.
  function moveLight(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const table = tableRef.current;
    table?.style.setProperty("--lx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    table?.style.setProperty("--ly", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  }

  const liftedAt = publications.findIndex((publication) => publication.id === lifted);
  const featured = liftedAt >= 0 ? publications[liftedAt] : null;
  return (
    <section className="cover-table" aria-label="Issues">
      <div className="table-top" ref={tableRef} onPointerMove={moveLight}>
        <div className="table-light" aria-hidden="true" />
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
              {themeNames[featured.theme ?? "surreal"]} edition, {featured.pieces.length}{" "}
              {featured.pieces.length === 1 ? "piece" : "pieces"}. Click to read.
            </span>
          </>
        ) : publications.length ? (
          <span>{finePointer ? "Pick up an issue to read it." : "Tap an issue to read it."}</span>
        ) : null}
      </p>
    </section>
  );
}
