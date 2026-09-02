import { motion } from "framer-motion";
import { publications } from "../data/publications";
import PublicationCard from "../components/PublicationCard";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-36 pb-24 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16"
      >
        <h1 className="font-display text-glow-white text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Publications
        </h1>
        <p className="mt-4 max-w-xl text-white/60">
          Writing, art, and voices from incarcerated youth — published one issue at a time.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {publications.map((pub, i) => (
          <PublicationCard key={pub.id} publication={pub} index={i} />
        ))}
      </div>
    </main>
  );
}
