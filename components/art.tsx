// Illustrated placeholder artwork. Every "photo" on the site is one of these
// until a real image is set in lib/mock-data.ts (see `image` fields).

import Image from "next/image";
import { tones, type Art, type Tone } from "@/lib/mock-data";

type Colours = (typeof tones)[Tone];
const INK = "#3a2218";

export function Placeholder({
  art,
  tone,
  image,
  alt = "",
  festive,
  className = "",
  artClassName = "",
  children,
}: {
  art: Art;
  tone: Tone;
  image?: string;
  alt?: string;
  festive?: boolean;
  className?: string;
  artClassName?: string;
  children?: React.ReactNode;
}) {
  const c = tones[tone];
  return (
    <div
      className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} isolate overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 30% 15%, ${c.bg[0]} 0%, ${c.bg[0]} 30%, ${c.bg[1]} 100%)` }}
    >
      {image ? (
        <Image src={image} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      ) : (
        <>
          <div className="paper-grain absolute inset-0 opacity-70" />
          <div
            className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full opacity-60 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(255,253,249,0.9), transparent 70%)" }}
          />
          <div className={`absolute inset-0 grid place-items-center ${artClassName}`} data-art>
            <Illustration art={art} c={c} festive={festive} label={alt} />
          </div>
        </>
      )}
      {children}
    </div>
  );
}

export function Illustration({ art, c, festive, label }: { art: Art; c: Colours; festive?: boolean; label?: string }) {
  const Art = ART[art];
  return (
    <svg viewBox="0 0 200 200" className="h-[78%] w-[78%] max-h-full overflow-visible" role="img" aria-label={label || art}>
      <Art c={c} />
      {festive && <Holly />}
    </svg>
  );
}

const outline = { stroke: INK, strokeOpacity: 0.55, strokeWidth: 1.4, strokeLinejoin: "round" as const };

function Shadow({ cy = 166, rx = 56 }: { cy?: number; rx?: number }) {
  return <ellipse className="art-shadow" cx="100" cy={cy} rx={rx} ry="7" fill={INK} opacity="0.12" />;
}

function Cookie({ c }: { c: Colours }) {
  const body = "M100 42C134 41 159 66 158 100C158 133 133 158 99 158C66 158 41 134 42 100C43 66 67 43 100 42Z";
  return (
    <g>
      <Shadow cy={164} />
      <path d={body} fill={c.base} />
      <path d="M100 48C130 48 151 70 151 100" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 98C74 88 90 106 105 96C120 87 133 100 146 93L144 109C130 117 118 104 104 113C89 122 74 106 60 113Z" fill={c.accent} />
      <path d="M60 113C74 106 89 122 104 113C118 104 130 117 144 109" fill="none" {...outline} strokeOpacity="0.35" />
      {[
        [74, 70, 12],
        [120, 66, -18],
        [86, 132, 28],
        [127, 128, -8],
        [103, 62, 40],
        [66, 124, -30],
      ].map(([x, y, r], i) => (
        <rect key={i} x={x - 5} y={y - 4} width="10" height="8" rx="2.5" fill={c.detail} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {[
        [90, 78],
        [138, 84],
        [110, 140],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#fffdf9" opacity="0.8" />
      ))}
      <path d={body} fill="none" {...outline} />
    </g>
  );
}

function Cupcake({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={172} rx={44} />
      <path d="M62 112H138L127 168H73Z" fill={c.base} {...outline} />
      {[76, 88, 100, 112, 124].map((x, i) => (
        <line key={i} x1={x} y1="114" x2={80 + i * 10} y2="166" stroke={INK} strokeOpacity="0.2" strokeWidth="1.2" />
      ))}
      <path d="M56 114C54 96 76 90 100 90C124 90 146 96 144 114C130 121 70 121 56 114Z" fill={c.accent} {...outline} />
      <path d="M69 95C69 78 86 71 100 71C114 71 131 78 131 95C120 101 80 101 69 95Z" fill={c.accent} {...outline} />
      <path d="M82 75C84 61 94 55 100 50C106 55 116 61 118 75C110 80 90 80 82 75Z" fill={c.accent} {...outline} />
      <path d="M72 108C86 112 112 112 128 107M80 90C92 93 110 93 122 89" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="100" cy="47" r="7" fill={c.detail} {...outline} />
      <circle cx="97.5" cy="44.5" r="2" fill="#fff" opacity="0.6" />
      {[
        [78, 104, 30],
        [118, 100, -40],
        [96, 84, 70],
        [110, 66, 20],
        [88, 68, -30],
        [130, 110, 60],
      ].map(([x, y, r], i) => (
        <rect key={i} x={x - 3.5} y={y - 1} width="7" height="2.4" rx="1.2" fill={c.detail} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

function dripPath(x0: number, x1: number, y: number, drips: [number, number][]) {
  let d = `M${x0} ${y - 2}L${x0} ${y + 6}`;
  for (const [x, len] of drips) d += `L${x - 4} ${y + 6}L${x - 4} ${y + len}A4 4 0 0 0 ${x + 4} ${y + len}L${x + 4} ${y + 6}`;
  return `${d}L${x1} ${y + 6}L${x1} ${y - 2}Z`;
}

function Cake({ c }: { c: Colours }) {
  const beads = Array.from({ length: 13 }, (_, i) => {
    const x = 50 + i * (100 / 12);
    const y = 92 + 12 * Math.sqrt(Math.max(0, 1 - ((x - 100) / 54) ** 2));
    return [x, y];
  });
  return (
    <g>
      <ellipse cx="100" cy="178" rx="28" ry="5" fill={INK} opacity="0.12" />
      <rect x="93" y="156" width="14" height="20" fill="#fffdf9" {...outline} />
      <ellipse cx="100" cy="156" rx="72" ry="9" fill="#fffdf9" {...outline} />
      <rect x="46" y="92" width="108" height="60" rx="4" fill={c.base} {...outline} />
      <rect x="47" y="114" width="106" height="5" fill={c.detail} opacity="0.55" />
      <rect x="47" y="132" width="106" height="5" fill={c.detail} opacity="0.55" />
      <path d={dripPath(46, 154, 92, [[58, 18], [74, 26], [92, 14], [110, 30], [128, 18], [144, 24]])} fill={c.accent} />
      <ellipse cx="100" cy="92" rx="54" ry="12" fill={c.accent} {...outline} />
      {beads.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill="#fffdf9" {...outline} strokeOpacity="0.3" />
      ))}
      <rect x="97" y="58" width="6" height="30" rx="2" fill="#fffdf9" {...outline} />
      <path d="M100 44C105 50 106 55 100 58C94 55 95 50 100 44Z" fill="#e8b24a" />
      <circle cx="78" cy="86" r="4" fill={c.detail} />
      <circle cx="122" cy="88" r="4" fill={c.detail} />
    </g>
  );
}

const HEART = "M100 150C60 122 38 100 40 76C42 56 58 46 74 48C86 50 95 58 100 68C105 58 114 50 126 48C142 46 158 56 160 76C162 100 140 122 100 150Z";

function HeartCake({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={166} rx={52} />
      <path d={HEART} transform="translate(0 12)" fill={c.accent} {...outline} />
      <path d={HEART} fill={c.base} {...outline} />
      <path d={HEART} transform="translate(100 98) scale(0.84) translate(-100 -98)" fill="none" stroke={c.accent} strokeWidth="6" strokeDasharray="0.1 8.6" strokeLinecap="round" />
      <path d="M78 96C84 86 92 104 100 94C108 84 114 102 122 92" fill="none" stroke={c.detail} strokeWidth="2" strokeLinecap="round" />
      <Bow x={64} y={70} s={0.5} fill={c.detail} />
      <Bow x={136} y={70} s={0.5} fill={c.detail} />
      <circle cx="100" cy="120" r="4" fill={c.detail} />
    </g>
  );
}

function Bento({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={170} rx={58} />
      <rect x="44" y="52" width="112" height="40" rx="3" fill="#fbf3e6" transform="rotate(-9 100 72)" {...outline} />
      <rect x="66" y="96" width="68" height="34" fill={c.accent} {...outline} />
      <ellipse cx="100" cy="96" rx="34" ry="9" fill={c.base} {...outline} />
      <path d="M86 95C90 91 94 99 99 95C104 91 108 99 113 95" fill="none" stroke={c.detail} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M42 114H158L151 168H49Z" fill="#ead5ba" {...outline} />
      <path d="M50 124H150" stroke={INK} strokeOpacity="0.12" />
      <rect x="86" y="134" width="28" height="16" rx="2" fill="#fffdf9" opacity="0.85" />
      <path d="M96 142C98 139 100 140 100 143C100 140 102 139 104 142C104 145 100 147 100 147C100 147 96 145 96 142Z" fill={c.detail} />
    </g>
  );
}

function Bow({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0C-14 -20 -36 -16 -32 -2C-29 10 -12 6 0 0Z" fill={fill} {...outline} />
      <path d="M0 0C14 -20 36 -16 32 -2C29 10 12 6 0 0Z" fill={fill} {...outline} />
      <path d="M-2 2L-14 26M2 2L14 26" stroke={fill} strokeWidth="6" strokeLinecap="round" />
      <circle r="5" fill={fill} {...outline} />
    </g>
  );
}

function Box({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={168} rx={60} />
      <rect x="50" y="94" width="100" height="70" fill={c.base} {...outline} />
      <rect x="44" y="78" width="112" height="22" rx="2" fill={c.base} {...outline} />
      <rect x="93" y="78" width="14" height="86" fill={c.accent} {...outline} strokeOpacity="0.3" />
      <rect x="50" y="122" width="100" height="12" fill={c.accent} {...outline} strokeOpacity="0.3" />
      <Bow x={100} y={78} s={0.9} fill={c.accent} />
      <path d="M124 72L142 96" stroke={c.detail} strokeWidth="1" />
      <g transform="rotate(14 146 108)">
        <rect x="134" y="94" width="24" height="32" rx="3" fill="#fffdf9" {...outline} />
        <circle cx="146" cy="100" r="2" fill="none" {...outline} />
        <path d="M141 112C143 108 146 109 146 112C146 109 149 108 151 112C151 116 146 119 146 119C146 119 141 116 141 112Z" fill={c.detail} />
      </g>
    </g>
  );
}

function FavourBag({ c, x = 0, y = 0, s = 1 }: { c: Colours; x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M70 92H130L137 166H63Z" fill={c.base} {...outline} />
      <path d="M72 92C70 80 76 70 82 74C86 64 94 66 96 72C100 62 108 64 108 72C114 66 122 70 120 78C128 76 132 84 128 92Z" fill={c.base} {...outline} />
      <path d="M68 96H132" stroke={c.accent} strokeWidth="6" />
      <Bow x={100} y={94} s={0.55} fill={c.accent} />
      <rect x="88" y="124" width="24" height="18" rx="2" fill="#fffdf9" {...outline} strokeOpacity="0.3" />
      <path d="M96 132C98 129 100 130 100 133C100 130 102 129 104 132C104 135 100 137 100 137C100 137 96 135 96 132Z" fill={c.detail} />
    </g>
  );
}

function Favour({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={170} rx={64} />
      <FavourBag c={c} x={-34} y={30} s={0.8} />
      <FavourBag c={c} x={6} y={2} />
    </g>
  );
}

function Stack({ c }: { c: Colours }) {
  return (
    <g>
      <Shadow cy={168} rx={60} />
      {[0, 1, 2].map((i) => {
        const y = 148 - i * 30;
        return (
          <g key={i}>
            <path d={`M44 ${y}C44 ${y + 20} 156 ${y + 20} 156 ${y}L156 ${y - 8}C156 ${y + 10} 44 ${y + 10} 44 ${y - 8}Z`} fill={c.base} {...outline} />
            {i < 2 && (
              <path d={`M52 ${y - 12}C64 ${y - 4} 76 ${y - 2} 88 ${y + 2}C96 ${y + 10} 104 ${y + 2} 112 ${y}C126 ${y - 2} 138 ${y - 6} 148 ${y - 12}Z`} fill={c.accent} />
            )}
            <ellipse cx="100" cy={y - 8} rx="56" ry="15" fill={c.base} {...outline} />
          </g>
        );
      })}
      {[
        [76, 86],
        [118, 82],
        [98, 94],
        [132, 92],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 5} y={y - 3} width="10" height="6" rx="2" fill={c.detail} />
      ))}
    </g>
  );
}

function Holly() {
  return (
    <g transform="translate(146 52) rotate(-16)">
      <path d="M0 0C-10 -6 -22 -4 -26 4C-18 4 -10 8 0 0Z" fill="#5f7a5a" />
      <path d="M0 0C6 -10 18 -14 26 -10C20 -4 14 2 0 0Z" fill="#6f8a69" />
      <circle cx="-2" cy="4" r="4" fill="#c4433f" />
      <circle cx="5" cy="6" r="3.6" fill="#b5383a" />
      <circle cx="1" cy="-3" r="3.4" fill="#d14d47" />
    </g>
  );
}

const ART: Record<Art, (p: { c: Colours }) => React.ReactElement> = {
  cookie: Cookie,
  cupcake: Cupcake,
  cake: Cake,
  "heart-cake": HeartCake,
  bento: Bento,
  box: Box,
  favour: Favour,
  stack: Stack,
};

// ── Ornaments ────────────────────────────────────────────────────────────────
export function Sparkle({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" fill="currentColor" />
    </svg>
  );
}

export function Heart({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M12 21C5 16 1 12.5 1 8C1 4.7 3.6 2.5 6.5 2.5C8.8 2.5 10.8 3.9 12 6C13.2 3.9 15.2 2.5 17.5 2.5C20.4 2.5 23 4.7 23 8C23 12.5 19 16 12 21Z" fill="currentColor" />
    </svg>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <Sparkle size={10} />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

export function DemoTag({ className = "", children = "Demo price" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-dashed border-mocha/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-mocha ${className}`}>
      {children}
    </span>
  );
}
