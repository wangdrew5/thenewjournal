import { motion, type Variants } from "framer-motion";
import type { PoemPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";
import EditorArt from "./EditorArt";

interface Props {
  piece: PoemPiece;
}

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function PoemView({ piece }: Props) {
  return (
    <div>
      <PieceHeader label="Poem" title={piece.title} author={piece.author} glow={piece.glow} />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
        <div className="font-display space-y-3 text-lg leading-relaxed text-white/85 sm:text-xl">
          {piece.lines.map((line, i) => (
            <motion.p
              key={i}
              custom={i}
              initial="hidden"
              animate="show"
              variants={lineVariants}
              className="transition-colors duration-300 hover:text-white"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <EditorArt caption={piece.editorArtCaption} glow={piece.glow} />
        </motion.div>
      </div>
    </div>
  );
}
