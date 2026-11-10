import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { partnerLogoUrl, partners } from "../data/partners";

const LINK = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;

/** A write-up paragraph, with any `[words](https://…)` turned into a link. */
function withLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <a key={match.index} className="partner-inline" href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

export default function Partners() {
  // A partner logo in an issue links to /partners#<id>: open the page at that partner.
  const { hash } = useLocation();
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-36 pb-24 sm:px-10">
      <motion.div
        className="paper-sheet"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>
          Our partners
        </h1>
        <p>
          The organizations that make The New Journal possible.
        </p>
        <ul className="partner-list">
          {partners.map((partner) => (
            <li key={partner.name} id={partner.id} className="partner">
              <a className="partner-logo" href={partner.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={partnerLogoUrl(partner)}
                  alt={`${partner.name} logo`}
                  loading="lazy"
                  decoding="async"
                />
              </a>
              <h2>{partner.name}</h2>
              {partner.paragraphs.map((text) => (
                <p key={text}>{withLinks(text)}</p>
              ))}
              <a className="partner-site" href={partner.url} target="_blank" rel="noopener noreferrer">
                Visit {partner.name} <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </main>
  );
}
