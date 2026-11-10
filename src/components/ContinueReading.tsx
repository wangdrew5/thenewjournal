import { useState } from "react";
import { Link } from "react-router-dom";
import type { Publication } from "../data/publications";
import { READING_KEY, readingPosition } from "../lib/readingPosition";
import "./continue-reading.css";

export default function ContinueReading({ publications }: { publications: Publication[] }) {
  const [lastRead] = useState(() => {
    try {
      return localStorage.getItem(READING_KEY);
    } catch {
      return null;
    }
  });
  const position = readingPosition(lastRead, publications);
  if (!position) return null;
  const piece = position.page.piece!;
  return (
    <Link
      to={position.to}
      className="reading-bookmark"
      aria-label={`Continue reading ${piece.title}`}
    >
      <svg className="reading-bookmark-mark" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M5 3h14v22l-7-5-7 5V3Z" />
      </svg>
      <span className="reading-bookmark-copy">
        <span>Continue reading</span>
        <strong>{piece.title}</strong>
        <small>{position.publication.caption} · Page {position.index} of {position.total}</small>
      </span>
      <svg className="reading-bookmark-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </svg>
    </Link>
  );
}
