import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
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
    <main className="home-page journal-home mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="journal-masthead"
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <h1>The <i>New</i> Journal<span aria-hidden="true">.</span></h1>
      </motion.header>
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
            <div className="edition-heading"><span>{publication.issueNumber ?? "Yours"}</span><h3>{publication.theme === "museum" ? "The gallery edition" : publication.caption}</h3><span aria-hidden="true">↗</span></div>
            <PublicationCard publication={publication} index={i} />
          </motion.section>
        ))}
      </div>
      {import.meta.env.DEV && <motion.section className="journal-desk" aria-labelledby="try-heading" initial={{ opacity: reduced ? 1 : 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
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
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <small className="site-credit">Site design by Ethan and Andrew</small>
    </main>
  );
}
