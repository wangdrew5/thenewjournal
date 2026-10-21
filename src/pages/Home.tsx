import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import CoverTable from "../components/table/CoverTable";
import { matchesPublished } from "../data/publishedIssues";
import { PREVIEW_ID } from "../lib/preview";

export default function Home() {
  const reduced = useReducedMotion();
  const journal = useJournal();
  // In development the local draft has its own tile, unless it is exactly what is published.
  const publications = journal.publications.filter(
    (p) => p.id !== PREVIEW_ID || !journal.draft || !matchesPublished(journal.draft),
  );
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
        <h1>The <i>New</i> Journal<span aria-hidden="true">.</span></h1>
      </motion.header>
      <CoverTable publications={publications} />
      {import.meta.env.DEV && <motion.section className="journal-desk" aria-labelledby="try-heading" initial={{ opacity: reduced ? 1 : 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="desk-paper" aria-hidden="true"><span>The New Journal / Your issue</span><i>It starts<br />with a page.</i><div className="desk-lines"><b /><b /><b /><b /></div><span>01</span></div>
        <div className="desk-copy">
          <span className="desk-kicker">The editor’s desk</span>
          <h2 id="try-heading" className="font-display">
            Make something<br /><i>of your own.</i>
          </h2>
          <p>Add writing, artwork, film, and songs, choose an edition, then publish the issue to this site from the editor.</p>
          <Link to="/preview" className="desk-link">Open the editor <span aria-hidden="true">↗</span></Link>
          <small>Drafts save in this browser. Publish writes the issue into the project; Commit and push puts it online.</small>
        </div>
      </motion.section>}
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
                  {piece.type === "song" && piece.transcript.some((line) => line.trim()) && (
                    <span className="contents-preview">
                      {piece.transcript.find((line) => line.trim())}
                    </span>
                  )}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <small className="site-credit">Special thanks to Ethan Birchenall for helping design the website</small>
    </main>
  );
}
