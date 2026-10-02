import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import { COMEDY_ID } from "../data/comedyExample";
import { PREVIEW_ID } from "../lib/preview";
import PublicationCard from "../components/PublicationCard";

export default function Home() {
  const reduced = useReducedMotion();
  const { publications } = useJournal();
  const [savedPieces] = useState(() =>
    publications.flatMap((publication) =>
      publication.pieces
        .filter((piece) => {
          try {
            return localStorage.getItem(`tnj:saved:v1:${piece.id}`) === "true";
          } catch {
            return false;
          }
        })
        .map((piece) => ({ ...piece, publicationId: publication.id })),
    ),
  );
  return (
    <main className="home-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="home-heading"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <h1 className="font-display text-glow-white text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Publications
        </h1>
        <p>
          Writing, art, and voices from incarcerated youth — published one issue
          at a time.
        </p>
      </motion.header>
      <div className="magazine-grid">
        {publications.map((publication, i) => (
          <section
            key={publication.id}
            className="publication-tile-group"
            aria-label={publication.caption}
          >
            <PublicationCard publication={publication} index={i} />
            {publication.id === COMEDY_ID && (
              <p className="tile-note">
                Fictional example · Try the gallery edition
              </p>
            )}
            {publication.id === PREVIEW_ID && (
              <Link to="/preview" className="preview-issue-label">
                Your preview · Edit issue →
              </Link>
            )}
            <details className="tile-contents">
              <summary>Inside this issue</summary>
              <ol>
                {publication.pieces.map((piece, index) => (
                  <li key={piece.id}>
                    <Link
                      to={`/publication/${publication.id}?piece=${encodeURIComponent(piece.id)}`}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        {piece.title}
                        <small>
                          {piece.author} ·{" "}
                          {piece.type === "poem"
                            ? "Writing"
                            : piece.type === "art"
                              ? "Art"
                              : "Film"}
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          </section>
        ))}
      </div>
      <section className="try-issue" aria-labelledby="try-heading">
        <div>
          <h2 id="try-heading" className="font-display">
            Try your own issue
          </h2>
          <p>Add your writing and images, then open it as a reader.</p>
        </div>
        <Link to="/preview" className="issue-entry">
          Try it out <span aria-hidden="true">→</span>
        </Link>
      </section>
      {savedPieces.length > 0 && (
        <section aria-labelledby="saved-heading" className="saved-section">
          <h2 id="saved-heading" className="font-display text-xl text-white/80">
            Your saved pieces
          </h2>
          <div className="flex flex-wrap gap-3">
            {savedPieces.map((piece) => (
              <Link
                key={piece.id}
                to={`/publication/${piece.publicationId}?piece=${piece.id}`}
                className="saved-link inline-flex min-h-11 items-center gap-3 rounded-xl border border-green/25 bg-green/5 px-5 py-2 text-sm text-white/80"
              >
                <span className="text-green capitalize">{piece.type}</span>
                <span className="saved-work">
                  <span>{piece.title}</span>
                  {piece.type === "poem" && (
                    <span className="contents-preview">{piece.lines[0]}</span>
                  )}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
