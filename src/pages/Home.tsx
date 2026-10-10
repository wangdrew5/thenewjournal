import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import { COMEDY_ID } from "../data/comedyExample";
import { PREVIEW_ID } from "../lib/preview";
import PublicationCard from "../components/PublicationCard";
import { readingPosition, READING_KEY } from "../lib/readingPosition";

export default function Home() {
  const reduced = useReducedMotion();
  const { publications } = useJournal();
  const [recent] = useState(() => {
    try { return readingPosition(localStorage.getItem(READING_KEY), publications); }
    catch { return null; }
  });
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
    <main className="home-page journal-home mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="journal-masthead"
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <div className="masthead-rule"><span>Writing / Art / Film</span><span>An online publication</span></div>
        <h1>The <i>New</i> Journal<span aria-hidden="true">.</span></h1>
        <div className="masthead-intro">
          <span className="journal-mark" aria-hidden="true">✳</span>
          <p>Writing, art, and films by incarcerated youth.<br />Published one issue at a time.</p>
          <a href="#issues" className="archive-jump">Explore the issues <span aria-hidden="true">↓</span></a>
        </div>
      </motion.header>
      {recent && <Link className="continue-reading" to={recent.to}>
        <span className="continue-marker" aria-hidden="true">↳</span>
        <span><small>Pick up where you left off</small><strong>{recent.page.piece!.title}</strong><em>{recent.publication.caption} · Page {recent.index} of {recent.total}</em></span>
        <span className="continue-arrow" aria-hidden="true">→</span>
      </Link>}
      <div className="archive-heading" id="issues"><h2>Publications</h2><span>{String(publications.length).padStart(2, "0")} issues / Two ways to read</span></div>
      <div className="magazine-grid journal-shelf">
        {publications.map((publication, i) => (
          <motion.section
            key={publication.id}
            className="publication-tile-group"
            aria-label={publication.caption}
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: reduced ? 0 : 0.65 }}
          >
            <div className="edition-heading"><span>{publication.issueNumber ?? "Yours"}</span><h3>{publication.theme === "museum" ? "The gallery edition" : "The surreal edition"}</h3><span aria-hidden="true">↗</span></div>
            <PublicationCard publication={publication} index={i} />
            <p className="edition-description">{publication.theme === "museum" ? "A white room. Works on the wall. Move through at your own pace." : "An illustrated world, paper pages, and a little room to get lost."}</p>
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
          </motion.section>
        ))}
      </div>
      <motion.section className="journal-desk" aria-labelledby="try-heading" initial={{ opacity: reduced ? 1 : 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="desk-paper" aria-hidden="true"><span>The New Journal / Your issue</span><i>It starts<br />with a page.</i><div className="desk-lines"><b /><b /><b /><b /></div><span>01</span></div>
        <div className="desk-copy">
          <span className="desk-kicker">The editor’s desk</span>
          <h2 id="try-heading" className="font-display">
            Make something<br /><i>of your own.</i>
          </h2>
          <p>Add writing, images, or film. Choose your edition and see your work become a magazine.</p>
          <Link to="/preview" className="desk-link">Open the editor <span aria-hidden="true">↗</span></Link>
          <small>Your draft stays in this browser. Download a copy to keep or share it.</small>
        </div>
      </motion.section>
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
      <footer className="journal-colophon"><Link to="/">The New Journal</Link><span>Writing. Art. Film.</span><Link to="/about">About the journal ↗</Link><small className="site-credit">Site design by Ethan</small></footer>
    </main>
  );
}
