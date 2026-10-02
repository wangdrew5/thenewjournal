import { useEffect, useId, useMemo, useRef, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SCENE_COUNT } from "./scenes";

// Decorative, hand-built surreal scenes for the Surreal edition. They are
// brand artwork, never contributor work, and are hidden from assistive tech.
type Depth = { d: number; children: React.ReactNode; className?: string };
function Layer({ d, children, className = "" }: Depth) {
  return (
    <g className={`dl ${className}`} style={{ "--d": d } as CSSProperties}>
      {children}
    </g>
  );
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Stars({
  count,
  seed,
  maxY,
  color = "#fff",
  big = 1.6,
}: {
  count: number;
  seed: number;
  maxY: number;
  color?: string;
  big?: number;
}) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      x: r() * 1600,
      y: r() * maxY,
      r: 0.5 + r() * big,
      delay: r() * 6,
      dur: 3 + r() * 5,
    }));
  }, [count, seed, maxY, big]);
  return (
    <g fill={color}>
      {stars.map((s, i) => (
        <circle
          key={i}
          className="twinkle"
          cx={s.x}
          cy={s.y}
          r={s.r}
          style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </g>
  );
}

function Cloud({
  x,
  y,
  s = 1,
  fill,
  opacity = 1,
}: {
  x: number;
  y: number;
  s?: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="0" cy="0" rx="120" ry="34" />
      <circle cx="-50" cy="-18" r="40" />
      <circle cx="10" cy="-34" r="52" />
      <circle cx="70" cy="-14" r="36" />
    </g>
  );
}

/* ---------- Scene 0 · The tide door (dusk ocean) ---------- */
function TideDoor({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x2="0" y2="1">
          <stop stopColor="#0c1f30" />
          <stop offset=".38" stopColor="#2b4a66" />
          <stop offset=".72" stopColor="#c98a7a" />
          <stop offset="1" stopColor="#f3c99d" />
        </linearGradient>
        <linearGradient id={`${id}w`} x2="0" y2="1">
          <stop stopColor="#efc39a" />
          <stop offset=".22" stopColor="#8a6f7d" />
          <stop offset="1" stopColor="#14263a" />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop stopColor="#fff6e0" />
          <stop offset=".35" stopColor="#ffd9a0" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffb07a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}door`} x2="0" y2="1">
          <stop stopColor="#070f2b" />
          <stop offset="1" stopColor="#2b3a7a" />
        </linearGradient>
        <linearGradient id={`${id}spill`} x2="0" y2="1">
          <stop stopColor="#ffe6b8" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffe6b8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id}s)`} />
      <Layer d={3}>
        <Stars count={40} seed={7} maxY={360} color="#ffe9cf" />
      </Layer>
      <Layer d={5}>
        <circle cx="1060" cy="640" r="430" fill={`url(#${id}sun)`} opacity=".55" />
        <circle cx="1060" cy="640" r="118" fill="#fff1d6" />
      </Layer>
      <Layer d={9}>
        <g className="drift-slow">
          <Cloud x={260} y={520} s={1.6} fill="#f7d6bd" opacity={0.32} />
          <Cloud x={1380} y={470} s={1.2} fill="#f7d6bd" opacity={0.28} />
          <Cloud x={760} y={300} s={0.9} fill="#7a7194" opacity={0.35} />
        </g>
      </Layer>
      <rect y="640" width="1600" height="360" fill={`url(#${id}w)`} />
      <Layer d={6}>
        <g fill="#fff0d4" className="shimmer">
          <rect x="980" y="660" width="160" height="3" rx="1.5" opacity=".7" />
          <rect x="940" y="690" width="240" height="3" rx="1.5" opacity=".5" />
          <rect x="1000" y="725" width="130" height="2" rx="1" opacity=".55" />
          <rect x="900" y="770" width="320" height="3" rx="1.5" opacity=".3" />
          <rect x="960" y="830" width="200" height="2" rx="1" opacity=".25" />
        </g>
      </Layer>
      <Layer d={16}>
        {Array.from({ length: 9 }, (_, i) => {
          const x = 250 + i * 44;
          const y = 760 - i * 46;
          return (
            <g key={i}>
              <path d={`M${x} ${y}h70l-12 18h-70Z`} fill="#f1cfab" />
              <path d={`M${x - 12} ${y + 18}h70v26h-70Z`} fill="#a77b6b" />
            </g>
          );
        })}
        <Cloud x={680} y={350} s={0.55} fill="#f8dcc4" opacity={0.85} />
      </Layer>
      <Layer d={22}>
        <path d="M842 690 1020 690 1180 1000 640 1000Z" fill={`url(#${id}spill)`} />
        <rect x="868" y="380" width="160" height="300" fill="#f0d8bc" />
        <rect x="886" y="398" width="124" height="282" fill={`url(#${id}door)`} />
        <g fill="#f8f1ff">
          <circle cx="910" cy="430" r="1.6" />
          <circle cx="960" cy="470" r="1.1" />
          <circle cx="990" cy="420" r="1.4" />
          <circle cx="925" cy="540" r="1.2" />
          <circle cx="975" cy="600" r="1" />
        </g>
        <circle cx="955" cy="500" r="20" fill="#f3e8c7" />
        <circle cx="964" cy="494" r="18" fill="#141e4b" />
        <path d="M1010 398 1078 372V706L1010 680Z" fill="#c69d80" />
        <circle cx="1022" cy="540" r="5" fill="#7b5847" />
        <g opacity=".22" transform="matrix(1 0 0 -1 0 1372)">
          <rect x="868" y="380" width="160" height="300" fill="#f0d8bc" />
          <rect x="886" y="398" width="124" height="282" fill="#2b3a7a" />
        </g>
      </Layer>
      <Layer d={30}>
        <g className="bob">
          <path d="M120 250h230l-30 22-60 110-40-20-60-70Z" fill="#5b4a5a" />
          <path d="M120 250h230l-20 14H140Z" fill="#7b9b78" />
          <path d="M228 250v-60" stroke="#3b3036" strokeWidth="6" />
          <circle cx="228" cy="180" r="34" fill="#5f8a6a" />
          <circle cx="206" cy="196" r="22" fill="#6f9c78" />
          <g stroke="#4a3b46" strokeWidth="2" fill="none" opacity=".8">
            <path d="M200 340q-6 40 6 80" />
            <path d="M250 370q8 30-4 64" />
            <path d="M170 310q-10 30 0 54" />
          </g>
        </g>
      </Layer>
      <Layer d={38}>
        <g className="swim-fish">
          <path d="M1330 330q40-30 90 0-50 30-90 0Z" fill="#f08a4b" />
          <path d="M1330 330l-30-22v44Z" fill="#e0703a" />
          <circle cx="1400" cy="326" r="3" fill="#2b1c18" />
        </g>
        <g stroke="#2a2633" strokeWidth="2.4" fill="none" className="birds">
          <path d="M560 170q12-10 22 0 10-10 22 0" />
          <path d="M620 140q9-8 17 0 8-8 17 0" />
          <path d="M520 120q7-6 13 0 6-6 13 0" />
        </g>
      </Layer>
    </>
  );
}

/* ---------- Scene 1 · Night whale (indigo) ---------- */
function NightWhale({ id }: { id: string }) {
  const windows = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 70 }, () => ({
      x: r() * 1600,
      y: 850 + r() * 140,
      on: r() > 0.45,
    }));
  }, []);
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x2="0" y2="1">
          <stop stopColor="#050817" />
          <stop offset=".45" stopColor="#151b49" />
          <stop offset=".8" stopColor="#3f2f6d" />
          <stop offset="1" stopColor="#a8698f" />
        </linearGradient>
        <linearGradient id={`${id}whale`} x2="0" y2="1">
          <stop stopColor="#2b3a7c" />
          <stop offset="1" stopColor="#141c48" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop stopColor="#bfe3ff" stopOpacity=".9" />
          <stop offset="1" stopColor="#bfe3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}lamp`}>
          <stop stopColor="#ffd88a" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id}s)`} />
      <Layer d={3}>
        <Stars count={110} seed={3} maxY={760} color="#e9e6ff" big={1.8} />
      </Layer>
      <Layer d={6}>
        <circle cx="1260" cy="210" r="150" fill={`url(#${id}glow)`} opacity=".35" />
        <circle cx="1260" cy="210" r="96" fill="#f4ecd2" />
        <circle cx="1300" cy="186" r="90" fill="#0b1032" />
      </Layer>
      <Layer d={10}>
        <g className="drift-slow">
          <Cloud x={200} y={720} s={2.4} fill="#5a3f7a" opacity={0.55} />
          <Cloud x={900} y={760} s={2.8} fill="#6a4a85" opacity={0.5} />
          <Cloud x={1500} y={700} s={2} fill="#5a3f7a" opacity={0.5} />
        </g>
      </Layer>
      <Layer d={20}>
        <g className="swim-whale">
          <g transform="translate(330 330) scale(1.15)">
            <path
              d="M0 70C50 10 220-14 360 14c100 20 170 50 240 34L690 0c10 34-10 64-40 84 38 18 58 48 48 72l-86-44c-70 30-190 52-310 42C150 146 30 128 0 70Z"
              fill={`url(#${id}whale)`}
            />
            <path
              d="M40 96c80 40 220 54 360 30"
              stroke="#5f73c4"
              strokeWidth="3"
              fill="none"
              opacity=".5"
            />
            <path d="M60 108c80 32 210 42 330 22" stroke="#5f73c4" strokeWidth="2" fill="none" opacity=".35" />
            <path d="M210 130c10 40 50 60 90 54-20-20-34-40-36-62Z" fill="#1b2560" />
            <circle cx="96" cy="66" r="5" fill="#dfe8ff" />
          </g>
          <g fill="#bfe3ff" className="twinkle">
            <circle cx="1140" cy="380" r="3" />
            <circle cx="1180" cy="350" r="2" />
            <circle cx="1210" cy="400" r="2.4" />
            <circle cx="1250" cy="360" r="1.6" />
            <circle cx="1290" cy="390" r="1.3" />
          </g>
        </g>
      </Layer>
      <Layer d={26}>
        {[
          [220, 300, 1],
          [1420, 520, 0.8],
          [640, 230, 0.6],
        ].map(([x, y, s], i) => (
          <g key={i} className="bob" style={{ animationDelay: `${i * 1.7}s` }}>
            <g transform={`translate(${x} ${y}) scale(${s})`}>
              <circle r="60" fill={`url(#${id}glow)`} opacity=".45" />
              <path d="M-30 0a30 26 0 0 1 60 0q-15 8-30 0-15 8-30 0Z" fill="#a8d8ff" opacity=".8" />
              <g stroke="#a8d8ff" strokeWidth="1.6" fill="none" opacity=".6">
                <path d="M-20 4q-6 30 4 60" />
                <path d="M-4 6q6 34-2 70" />
                <path d="M12 4q-4 26 6 52" />
              </g>
            </g>
          </g>
        ))}
      </Layer>
      <Layer d={34}>
        <path
          d="M0 880h120v-50h60v-40h90v60h70v-90h110v80h60v-40h120v70h80v-110h50v-30h40v30h40v120h100v-60h90v40h130v-80h70v60h120v-30h110v60h70V1000H0Z"
          fill="#090d26"
        />
        <g fill="#ffcf7a">
          {windows.map(
            (w, i) =>
              w.on && (
                <rect key={i} x={w.x} y={w.y} width="7" height="10" opacity={0.55 + (i % 4) * 0.1} />
              ),
          )}
        </g>
        <circle cx="1185" cy="760" r="70" fill={`url(#${id}lamp)`} />
        <path d="M1185 760v120" stroke="#1b1f3c" strokeWidth="5" />
        <circle cx="1185" cy="758" r="7" fill="#ffe2a2" />
        <g stroke="#1b1f3c" strokeWidth="4" fill="none">
          <path d="M1230 880v-36h26v36m-26-18h26m0-18v-30" />
        </g>
      </Layer>
    </>
  );
}

/* ---------- Scene 2 · Desert of clocks ---------- */
function ClockFace({ x, y, r = 46 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r * 0.78}
            y1={Math.sin(a) * r * 0.62}
            x2={Math.cos(a) * r * 0.9}
            y2={Math.sin(a) * r * 0.72}
            stroke="#6d5330"
            strokeWidth="2"
          />
        );
      })}
      <path d={`M0 0L${r * 0.5} ${-r * 0.2}M0 0L${-r * 0.1} ${r * 0.5}`} stroke="#3c2c18" strokeWidth="3" />
    </g>
  );
}
function ClockDesert({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x2="0" y2="1">
          <stop stopColor="#2c4c7b" />
          <stop offset=".45" stopColor="#7f9db8" />
          <stop offset=".62" stopColor="#efcfa0" />
          <stop offset=".66" stopColor="#f6dcb2" />
        </linearGradient>
        <linearGradient id={`${id}g`} x2="0" y2="1">
          <stop stopColor="#dca570" />
          <stop offset="1" stopColor="#7d4a2f" />
        </linearGradient>
        <radialGradient id={`${id}ball`} cx=".35" cy=".3">
          <stop stopColor="#fff4e2" />
          <stop offset=".6" stopColor="#d9a983" />
          <stop offset="1" stopColor="#8b5a44" />
        </radialGradient>
        <linearGradient id={`${id}clock`} x2="1" y2="1">
          <stop stopColor="#f6ead0" />
          <stop offset="1" stopColor="#c9ad7d" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id}s)`} />
      <Layer d={4}>
        <g className="drift-slow">
          <Cloud x={300} y={200} s={1.1} fill="#fff" opacity={0.5} />
          <Cloud x={1240} y={140} s={0.8} fill="#fff" opacity={0.45} />
        </g>
      </Layer>
      <Layer d={7}>
        <path d="M0 640h140l30-50h120l26 50h420l40-34h90l30 34h704v20H0Z" fill="#b28672" opacity=".6" />
      </Layer>
      <rect y="650" width="1600" height="350" fill={`url(#${id}g)`} />
      <Layer d={12}>
        <ellipse cx="1300" cy="760" rx="260" ry="18" fill="#5a3322" opacity=".35" />
        <g className="bob">
          <circle cx="1140" cy="430" r="72" fill={`url(#${id}ball)`} />
        </g>
      </Layer>
      <Layer d={18}>
        <g stroke="#6b4a2d" strokeWidth="7" strokeLinecap="round">
          <path d="M860 900 930 150M940 905 1010 155" />
          {Array.from({ length: 14 }, (_, i) => {
            const t = i / 14;
            const y = 880 - t * 720;
            const x1 = 860 + t * 70;
            return <path key={i} d={`M${x1 + 2} ${y}h78`} strokeWidth="5" />;
          })}
        </g>
        <Cloud x={980} y={150} s={0.9} fill="#fff7ec" opacity={0.95} />
        <ellipse cx="1010" cy="905" rx="140" ry="10" fill="#5a3322" opacity=".3" />
      </Layer>
      <Layer d={26}>
        <path
          d="M330 900c10-120 30-220 60-300 18-50 40-70 60-90M440 520c50-20 120-14 200-36M390 600c-40-20-70-50-80-90"
          stroke="#4a3020"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <g className="melt">
          <path
            d="M500 470c40-40 140-40 170 0 14 20 6 46-6 74-10 26-6 70-20 80-12 8-20-30-26-56-6-20-24-26-44-20-30 8-44 26-62 10-24-20-30-60-12-88Z"
            fill={`url(#${id}clock)`}
            stroke="#8a6b3e"
            strokeWidth="3"
          />
          <ClockFace x={585} y={510} r={50} />
        </g>
        <ellipse cx="400" cy="905" rx="150" ry="12" fill="#5a3322" opacity=".35" />
      </Layer>
      <Layer d={32}>
        <rect x="1260" y="760" width="200" height="90" fill="#c99366" />
        <rect x="1260" y="760" width="200" height="12" fill="#e0b083" />
        <path
          d="M1290 760c0-40 120-44 130 0 6 26-4 30-2 70 1 24-14 28-18 0-4-24-20-30-40-18-24 14-44 8-50-12-6-18-20-20-20-40Z"
          fill={`url(#${id}clock)`}
          stroke="#8a6b3e"
          strokeWidth="3"
        />
        <ClockFace x={1356} y={752} r={36} />
      </Layer>
    </>
  );
}

/* ---------- Scene 3 · Lantern isles (green) ---------- */
function Island({
  x,
  y,
  s = 1,
  house = false,
  fall = false,
  id,
}: {
  x: number;
  y: number;
  s?: number;
  house?: boolean;
  fall?: boolean;
  id: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {fall && (
        <rect x="70" y="-6" width="16" height="420" fill={`url(#${id}fall)`} className="shimmer" />
      )}
      <path d="M-140 0h280l-40 40-50 120-40 60-30-70-60-70Z" fill="#0b2a22" />
      <path d="M-140 0h280l-30 30H-110Z" fill="#14402f" />
      <path d="M-150 -4h300v10h-300Z" fill="#2f7a54" />
      <g stroke="#0a241c" strokeWidth="2" fill="none" opacity=".9">
        <path d="M-20 200q-8 50 6 100" />
        <path d="M30 160q12 40 0 90" />
        <path d="M-60 120q-14 40-4 70" />
      </g>
      <g fill="#1f5c40">
        <path d="M-100-4 -80-70-60-4Z" />
        <path d="M-70-4 -50-100-30-4Z" />
        <path d="M90-4 105-60 120-4Z" />
      </g>
      {house && (
        <g>
          <rect x="-10" y="-56" width="60" height="52" fill="#1a3b30" />
          <path d="M-18-56 20-92 58-56Z" fill="#0d2a22" />
          <rect x="8" y="-42" width="16" height="16" fill="#ffcf7a" className="window-glow" />
        </g>
      )}
    </g>
  );
}
function LanternIsles({ id }: { id: string }) {
  const lanterns = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 18 }, () => ({
      x: 80 + r() * 1440,
      s: 0.5 + r() * 0.9,
      delay: -r() * 26,
      dur: 18 + r() * 16,
    }));
  }, []);
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x2="0" y2="1">
          <stop stopColor="#020c0a" />
          <stop offset=".45" stopColor="#08261e" />
          <stop offset=".8" stopColor="#13493a" />
          <stop offset="1" stopColor="#2c6e57" />
        </linearGradient>
        <linearGradient id={`${id}fall`} x2="0" y2="1">
          <stop stopColor="#bdf0d6" stopOpacity=".8" />
          <stop offset="1" stopColor="#bdf0d6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}l`}>
          <stop stopColor="#ffe3a8" />
          <stop offset=".25" stopColor="#ffb84d" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffb84d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id}s)`} />
      <Layer d={3}>
        <Stars count={60} seed={19} maxY={500} color="#d6ffe9" />
      </Layer>
      <Layer d={8}>
        <g className="drift-slow" fill="#9fe0bf">
          <ellipse cx="400" cy="760" rx="600" ry="40" opacity=".07" />
          <ellipse cx="1200" cy="640" rx="520" ry="30" opacity=".06" />
          <ellipse cx="800" cy="900" rx="900" ry="60" opacity=".08" />
        </g>
      </Layer>
      <Layer d={14}>
        <g className="bob" style={{ animationDuration: "11s" }}>
          <Island x={1280} y={330} s={0.6} id={id} />
        </g>
      </Layer>
      <Layer d={22}>
        <g className="bob" style={{ animationDelay: "-3s" }}>
          <Island x={780} y={540} s={1.05} house fall id={id} />
        </g>
      </Layer>
      <Layer d={30}>
        <g className="bob" style={{ animationDelay: "-6s", animationDuration: "13s" }}>
          <Island x={260} y={400} s={0.8} id={id} />
        </g>
      </Layer>
      <Layer d={36}>
        {lanterns.map((l, i) => (
          <g
            key={i}
            className="rise"
            style={{ animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}
          >
            <g transform={`translate(${l.x} 1060) scale(${l.s})`}>
              <circle r="46" fill={`url(#${id}l)`} opacity=".7" />
              <path d="M-9-14h18l4 26h-26Z" fill="#ffcf7a" />
              <path d="M-9-14h18l1 6h-20Z" fill="#e8963a" />
            </g>
          </g>
        ))}
        <Stars count={24} seed={5} maxY={1000} color="#d8ff9a" big={1.2} />
      </Layer>
    </>
  );
}

/* ---------- Scene 4 · Paper sky (dawn) ---------- */
function PaperBird({ x, y, s, r = 0 }: { x: number; y: number; s: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="flap">
        <path d="M0 0 60-34 40 4Z" fill="#fffdf8" />
        <path d="M0 0 40 4 70 18Z" fill="#eadbcb" />
        <path d="M40 4 52-46 28 2Z" fill="#f6ece0" />
      </g>
    </g>
  );
}
function PaperSky({ id }: { id: string }) {
  const letters = useMemo(() => {
    const r = rng(23);
    const glyphs = "awmoshelrtnyvqi";
    return Array.from({ length: 22 }, (_, i) => ({
      c: glyphs[i % glyphs.length],
      x: 500 + r() * 900,
      y: 300 + r() * 500,
      s: 18 + r() * 26,
      delay: -r() * 20,
    }));
  }, []);
  return (
    <>
      <defs>
        <linearGradient id={`${id}s`} x2="0" y2="1">
          <stop stopColor="#f9eadb" />
          <stop offset=".45" stopColor="#f0c6b6" />
          <stop offset=".8" stopColor="#c897af" />
          <stop offset="1" stopColor="#8e7aa8" />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop stopColor="#fffaf0" />
          <stop offset=".4" stopColor="#fff1de" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff1de" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}page`} x2="1">
          <stop stopColor="#fffaf2" />
          <stop offset="1" stopColor="#e9dac8" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id}s)`} />
      <Layer d={4}>
        <circle cx="380" cy="300" r="300" fill={`url(#${id}sun)`} />
        <circle cx="380" cy="300" r="96" fill="#fff8ec" />
      </Layer>
      <Layer d={9}>
        <g className="drift-slow">
          <Cloud x={1300} y={300} s={1.3} fill="#fff" opacity={0.55} />
          <Cloud x={200} y={560} s={1.1} fill="#fff" opacity={0.4} />
        </g>
      </Layer>
      <Layer d={16}>
        <g fill="#f7ede6">
          <circle cx="160" cy="980" r="220" />
          <circle cx="460" cy="940" r="190" />
          <circle cx="760" cy="1000" r="230" />
          <circle cx="1100" cy="950" r="210" />
          <circle cx="1440" cy="990" r="240" />
        </g>
        <g fill="#d9bfd2" opacity=".55">
          <circle cx="300" cy="1060" r="200" />
          <circle cx="1000" cy="1080" r="230" />
          <circle cx="1560" cy="1080" r="200" />
        </g>
      </Layer>
      <Layer d={22}>
        <g transform="translate(800 820)">
          <ellipse cx="0" cy="40" rx="300" ry="26" fill="#a67f9c" opacity=".35" />
          <path d="M0 30C-80 0-200-4-290 20L-260-90C-170-110-70-100 0-70Z" fill={`url(#${id}page)`} />
          <path d="M0 30C80 0 200-4 290 20L260-90C170-110 70-100 0-70Z" fill="#fffaf2" />
          <path d="M0-70V30" stroke="#d6c2ad" strokeWidth="3" />
          <g stroke="#cdb9a5" strokeWidth="2" opacity=".8">
            {Array.from({ length: 7 }, (_, i) => (
              <g key={i}>
                <path d={`M-240 ${-70 + i * 12}q110-16 210 8`} fill="none" />
                <path d={`M30 ${-62 + i * 12}q100-22 200-8`} fill="none" />
              </g>
            ))}
          </g>
        </g>
      </Layer>
      <Layer d={30}>
        <g className="letters" fill="#8e6f8f" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic">
          {letters.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y}
              fontSize={l.s}
              className="drift-up"
              style={{ animationDelay: `${l.delay}s` }}
              opacity=".5"
            >
              {l.c}
            </text>
          ))}
        </g>
      </Layer>
      <Layer d={38}>
        <PaperBird x={900} y={640} s={0.6} r={-14} />
        <PaperBird x={1020} y={520} s={0.8} r={-20} />
        <PaperBird x={1150} y={380} s={1} r={-18} />
        <PaperBird x={1310} y={240} s={1.25} r={-12} />
        <PaperBird x={760} y={560} s={0.5} r={-30} />
      </Layer>
    </>
  );
}

const scenes = [TideDoor, NightWhale, ClockDesert, LanternIsles, PaperSky];

export function DreamScene({
  scene,
  className = "",
}: {
  scene: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const Scene = scenes[((scene % SCENE_COUNT) + SCENE_COUNT) % SCENE_COUNT];
  return (
    <svg
      className={`dream-svg ${className}`}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <Scene id={id} />
    </svg>
  );
}

// Full-viewport backdrop: crossfades between scenes and leans with the mouse.
export default function DreamScape({ scene }: { scene: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (
      reduced ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    let frame = 0;
    function move(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--mx", String((event.clientX / innerWidth) * 2 - 1));
        el.style.setProperty("--my", String((event.clientY / innerHeight) * 2 - 1));
      });
    }
    window.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [reduced]);
  return (
    <div ref={ref} className="dreamscape" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={scene % SCENE_COUNT}
          className="dreamscape-layer"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <DreamScene scene={scene} />
        </motion.div>
      </AnimatePresence>
      <div className="dreamscape-grain" />
      <div className="dreamscape-vignette" />
    </div>
  );
}
