import Lantern from "./Lantern";

const lanterns = [
  { style: { top: "8%", left: "12%" }, size: 260, delay: 0 },
  { style: { top: "22%", right: "10%" }, size: 200, delay: 1.2 },
  { style: { top: "58%", left: "6%" }, size: 220, delay: 2.4 },
  { style: { top: "68%", right: "18%" }, size: 260, delay: 0.6 },
  { style: { top: "40%", left: "48%" }, size: 180, delay: 3.1 },
];

export default function GlowField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink bg-noise">
      {lanterns.map((l, i) => (
        <Lantern key={i} style={l.style} size={l.size} delay={l.delay} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/70" />
    </div>
  );
}
