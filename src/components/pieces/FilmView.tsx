import { motion } from "framer-motion";
import type { FilmPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";
import FilmPlayer from "./FilmPlayer";

interface Props {
  piece: FilmPiece;
}

export default function FilmView({ piece }: Props) {
  return (
    <div>
      <PieceHeader
        label="Film"
        title={piece.title}
        author={piece.author}
        glow={piece.glow}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl"
      >
        <FilmPlayer glow={piece.glow} videoSrc={piece.videoSrc} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-5 text-center text-white/60"
        >
          {piece.logline}
        </motion.p>
      </motion.div>
    </div>
  );
}
