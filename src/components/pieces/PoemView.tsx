import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { PoemPiece } from "../../data/publications";
import PieceHeader from "./PieceHeader";
import EditorArt from "./EditorArt";

interface Props {
  piece: PoemPiece;
  animateLines?: boolean;
}

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 + Math.min(i * 0.035, 0.55),
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function PoemView({ piece, animateLines = true }: Props) {
  const reduced = useReducedMotion();
  return (
    <div>
      <PieceHeader
        label="Poem"
        title={piece.title}
        author={piece.author}
        glow={piece.glow}
      />

      <div
        className={`poem-layout ${piece.editorArtSrc ? "" : "without-illustration"}`}
      >
        <div className="poem-text font-display space-y-3 text-white/85">
          {piece.lines.map((line, i) => (
            <motion.p
              key={i}
              custom={i}
              initial="hidden"
              animate="show"
              variants={
                reduced || !animateLines
                  ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                  : lineVariants
              }
              className="transition-colors duration-300 hover:text-white"
            >
              {line || "\u00a0"}
            </motion.p>
          ))}
        </div>

        {piece.editorArtSrc && (
          <motion.div
            className="poem-illustration"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <EditorArt
              caption={piece.editorArtCaption}
              glow={piece.glow}
              imageSrc={piece.editorArtSrc}
              imageAlt={piece.editorArtAlt}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
