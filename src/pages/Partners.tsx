import { motion } from "framer-motion";
import { partnerLogoUrl, partners } from "../data/partners";

export default function Partners() {
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
            <li key={partner.name} className="partner">
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
                <p key={text}>{text}</p>
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
