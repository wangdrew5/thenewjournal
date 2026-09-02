import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { publications } from "../data/publications";
import PoemView from "../components/pieces/PoemView";
import FilmView from "../components/pieces/FilmView";
import ArtView from "../components/pieces/ArtView";
import PieceNav from "../components/pieces/PieceNav";

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
};

export default function PublicationViewer() {
  const { pubId } = useParams();
  const publication = publications.find((p) => p.id === pubId);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [pubId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, publication]);

  if (!publication) return <Navigate to="/" replace />;

  const total = publication.pieces.length;

  function goTo(target: number) {
    setDirection(target >= index ? 1 : -1);
    setIndex(((target % total) + total) % total);
  }

  const piece = publication.pieces[index];

  return (
    <div
      className="min-h-screen w-full cursor-pointer"
      onClick={(e) => {
        const isLeftHalf = e.clientX < window.innerWidth / 2;
        goTo(isLeftHalf ? index - 1 : index + 1);
      }}
    >
      <main className="mx-auto max-w-6xl px-6 pt-36 pb-40 sm:px-10">
        <div className="mb-6 flex justify-end">
          <span className="text-xs font-medium tracking-widest text-white/35">
            {index + 1} / {total}
          </span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={piece.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {piece.type === "poem" && <PoemView piece={piece} />}
            {piece.type === "film" && <FilmView piece={piece} />}
            {piece.type === "art" && <ArtView piece={piece} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <PieceNav pieces={publication.pieces} currentIndex={index} onSelect={goTo} />
    </div>
  );
}
