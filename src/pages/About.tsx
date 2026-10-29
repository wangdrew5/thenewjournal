import { motion } from "framer-motion";

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-36 pb-24 sm:px-10">
      <motion.div
        className="paper-sheet"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>
          About
        </h1>
        <p>
          The New Journal is an online publication by and for incarcerated
          youth and adults.
        </p>
      </motion.div>
    </main>
  );
}
