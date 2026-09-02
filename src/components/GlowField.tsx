export default function GlowField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink bg-noise">
      <div className="animate-drift absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet/25 blur-[110px]" />
      <div
        className="animate-drift absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan/20 blur-[110px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-drift absolute -bottom-32 left-1/4 h-[26rem] w-[26rem] rounded-full bg-pink/20 blur-[110px]"
        style={{ animationDelay: "-11s" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/60" />
    </div>
  );
}
