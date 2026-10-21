import { motion } from "framer-motion";

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
          The organizations that make The New Journal possible will be listed
          here soon.
        </p>
      </motion.div>
    </main>
  );
}
