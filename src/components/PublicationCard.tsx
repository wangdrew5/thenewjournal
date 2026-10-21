import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Link } from "react-router-dom";
import { useRef, type MouseEvent, type PointerEvent } from "react";
import type { Publication } from "../data/publications";
import IssueArtwork from "./magazine/IssueArtwork";
import { DreamScene } from "./surreal/DreamScape";
import { startEnter } from "../lib/enterTransition";
import { themeNames } from "../lib/magazine";
import { issueName } from "../lib/issueLabel";

function OpenRow({ label }: { label: string }) {
  return (
    <div className="cover-open">
      <span>{label}</span>
      <span aria-hidden="true">↗</span>
    </div>
  );
}

function SurrealCover({ publication }: { publication: Publication }) {
  return (
    <div className="tile-book">
      <div className="tile-book-page" aria-hidden="true">
        <span>{issueName(publication, "No.")} · Writing</span>
        <i>Turn the page</i>
        <span className="tile-book-lines">
          <b />
          <b />
          <b />
          <b />
          <b />
        </span>
      </div>
      <div className="tile-book-cover">
        {publication.coverSrc ? (
          <img className="issue-cover-image" src={publication.coverSrc} alt={publication.coverAlt ?? ""} />
        ) : (
          <DreamScene scene={publication.issueNumber === "01" ? 1 : 0} className="tile-dream" />
        )}
        <div className="tile-book-shade" />
        <div className="cover-masthead">
          <span>The New Journal</span>
          <span>{issueName(publication, "No.")}</span>
        </div>
        <div className="cover-title">
          <h2>{publication.caption}</h2>
        </div>
        <OpenRow label="Open the magazine" />
      </div>
    </div>
  );
}

function GalleryCover({ publication }: { publication: Publication }) {
  return (
    <div className="tile-wall">
      <div className="tile-wall-spot" />
      <div className="tile-wall-floor" />
      <div className="tile-wall-track">
        <span className="tile-wall-peek" aria-hidden="true" />
        <div className="tile-wall-work">
          {publication.coverSrc ? (
            <img src={publication.coverSrc} alt={publication.coverAlt ?? ""} />
          ) : (
            <IssueArtwork />
          )}
        </div>
        <span className="tile-wall-peek" aria-hidden="true" />
      </div>
      <div className="tile-wall-label">
        <strong>{publication.caption}</strong>
        <span>
          The New Journal, {issueName(publication)}
        </span>
      </div>
      <div className="tile-wall-mast">
        <span>The New Journal</span>
        <span>{publication.issueNumber ?? "—"}</span>
      </div>
      <OpenRow label="Enter the gallery" />
    </div>
  );
}

export default function PublicationCard({
  publication,
  index,
}: {
  publication: Publication;
  index: number;
}) {
  const reduced = useReducedMotion();
  const theme = publication.theme ?? "surreal";
  const cover = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [3, -3]), {
    stiffness: 160,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-4, 4]), {
    stiffness: 160,
    damping: 22,
  });
  const to = `/publication/${publication.id}`;
  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }
  function enter(event: MouseEvent<HTMLAnchorElement>) {
    if (
      reduced ||
      !cover.current ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    startEnter(cover.current, theme, to);
  }
  return (
    <motion.article
      className={`magazine-tile tile-${theme}`}
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: reduced ? 0 : Math.min(index * 0.1, 0.3),
      }}
    >
      <Link
        to={to}
        className="magazine-cover-link"
        aria-label={`Open ${publication.caption}, ${themeNames[theme]} edition`}
        onClick={enter}
        onPointerMove={move}
        onPointerLeave={() => {
          x.set(0.5);
          y.set(0.5);
        }}
      >
        <motion.div
          ref={cover}
          className="magazine-cover"
          style={reduced ? {} : { rotateX, rotateY }}
        >
          {theme === "museum" ? (
            <GalleryCover publication={publication} />
          ) : (
            <SurrealCover publication={publication} />
          )}
        </motion.div>
      </Link>
    </motion.article>
  );
}
