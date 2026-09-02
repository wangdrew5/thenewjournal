import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Props {
  style: React.CSSProperties;
  size: number;
  radius?: number;
  delay?: number;
}

export default function Lantern({ style, size, radius = 380, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const proximity = useMotionValue(0);

  const scale = useSpring(useTransform(proximity, [0, 1], [1, 1.5]), { stiffness: 90, damping: 16 });
  const boost = useSpring(useTransform(proximity, [0, 1], [0, 0.55]), { stiffness: 90, damping: 18 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      proximity.set(Math.max(0, 1 - dist / radius));
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [proximity, radius]);

  return (
    <motion.div
      ref={ref}
      className="animate-flicker bg-lantern pointer-events-none absolute rounded-full opacity-[0.14]"
      style={{ ...style, width: size, height: size, filter: "blur(90px)", scale, animationDelay: `${delay}s` }}
    >
      <motion.div className="bg-lantern absolute inset-0 rounded-full" style={{ filter: "blur(60px)", opacity: boost }} />
    </motion.div>
  );
}
