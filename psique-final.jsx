import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   PSIQUE — Landing AIDA + Plataforma Terapêutica Completa
   Motion · OpenRouter · Telegram · Supabase · Auth E2E
═══════════════════════════════════════════════════════════════ */

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,200;0,300;0,400;0,600;1,200;1,300;1,400&family=Instrument+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');`;

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080F0B;--bg2:#0C1510;--bg3:#101C13;
  --card:#121A14;--card2:#162019;
  --border:#1C2E20;--border2:#243828;
  --g1:#2A6044;--g2:#3D7A5C;--mint:#52B788;--mintl:#74C9A0;
  --gold:#C4A35A;--goldl:#DEC07A;--goldd:#A8873A;
  --ivory:#EDE7D9;--ivoryD:#C8BFA8;--ivoryDD:#8A8070;
  --red:#B85450;--blue:#4A8FA8;--purple:#7B5EA7;
  --text:#DDD7C8;
  --ff:'Cormorant Garant',serif;
  --fs:'Instrument Sans',sans-serif;
  --ease-out:cubic-bezier(.22,1,.36,1);
  --ease-spring:cubic-bezier(.34,1.56,.64,1);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--fs);overflow-x:hidden;cursor:default}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
input,textarea,select{
  background:var(--card2);border:1px solid var(--border2);color:var(--text);
  border-radius:12px;padding:12px 16px;font-family:var(--fs);font-size:14px;
  outline:none;width:100%;transition:all .25s var(--ease-out);
  -webkit-appearance:none;
}
input:focus,textarea:focus,select:focus{
  border-color:var(--mint);background:var(--bg3);
  box-shadow:0 0 0 3px rgba(82,183,136,.12);
}
input::placeholder,textarea::placeholder{color:var(--ivoryDD)}
textarea{resize:vertical;line-height:1.65}
button{cursor:pointer;font-family:var(--fs);transition:all .2s var(--ease-out)}
select option{background:var(--bg2)}

/* ── Keyframes ─────────────────────────────────── */
@keyframes fadeUp  {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn  {from{opacity:0}to{opacity:1}}
@keyframes slideL  {from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideR  {from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes scaleIn {from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes floatY  {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes floatX  {0%,100%{transform:translateX(0)}50%{transform:translateX(10px)}}
@keyframes spin    {to{transform:rotate(360deg)}}
@keyframes pulse   {0%,100%{opacity:1}50%{opacity:.3}}
@keyframes glow    {0%,100%{box-shadow:0 0 20px rgba(82,183,136,.15)}50%{box-shadow:0 0 40px rgba(82,183,136,.4)}}
@keyframes orbMove {0%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.1)}66%{transform:translate(-20px,20px) scale(.95)}100%{transform:translate(0,0) scale(1)}}
@keyframes gradFlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes shimmer {0%{background-position:-400% 0}100%{background-position:400% 0}}
@keyframes countUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderGlow{0%,100%{border-color:var(--border2)}50%{border-color:var(--mint)66}}
@keyframes particleFly{0%{opacity:0;transform:translate(0,0) scale(0)}50%{opacity:1}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(1.5)}}
@keyframes wave    {0%,100%{d:path("M0,40 Q200,10 400,40 T800,40 V80 H0 Z")}50%{d:path("M0,40 Q200,70 400,40 T800,40 V80 H0 Z")}}
@keyframes typeWrite{from{width:0}to{width:100%}}
@keyframes blink   {0%,100%{opacity:1}50%{opacity:0}}

/* ── Reveal on scroll ──────────────────────────── */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .75s var(--ease-out),transform .75s var(--ease-out)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-l{opacity:0;transform:translateX(-30px);transition:opacity .7s var(--ease-out),transform .7s var(--ease-out)}
.reveal-l.visible{opacity:1;transform:translateX(0)}
.reveal-r{opacity:0;transform:translateX(30px);transition:opacity .7s var(--ease-out),transform .7s var(--ease-out)}
.reveal-r.visible{opacity:1;transform:translateX(0)}
.reveal-scale{opacity:0;transform:scale(.9);transition:opacity .65s var(--ease-out),transform .65s var(--ease-out)}
.reveal-scale.visible{opacity:1;transform:scale(1)}

/* ── Magnetic button ───────────────────────────── */
.mag-btn{position:relative;overflow:hidden}
.mag-btn::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,.06);opacity:0;transition:opacity .2s}
.mag-btn:hover::after{opacity:1}
.mag-btn:active{transform:scale(.97)!important}
`;

/* ── SVG Icon Library ──────────────────────────────────────────── */
const Icon = {
  Brain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
    </svg>
  ),
  Video: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.86v6.28a1 1 0 0 1-1.447.93L15 14v-4z"/>
      <rect x="3" y="7" width="12" height="10" rx="2"/>
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
      <path d="M5 3l.5 2L8 5l-2 .5L5 8l-.5-2.5L2 5l2.5-.5L5 3z" opacity=".5"/>
      <path d="M19 15l.5 2 2.5.5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" opacity=".5"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4" strokeWidth="1.8"/>
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.478c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.408 4.094 13.5c-.652-.204-.665-.652.136-.966l10.868-4.19c.543-.194 1.018.13.464 1.904z"/>
    </svg>
  ),
  Bolt: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Psi: () => (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <text x="50%" y="72%" textAnchor="middle" fontSize="28" fontFamily="Cormorant Garant, serif" fontWeight="200">Ψ</text>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Message: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  Leaf: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22c1.25-1.25 2.5-2.5 3.5-4 2-3 2.5-7 7-9.5C16.5 6 21 5 21 2c0 0-1 7-4 10.5S9 16 7.5 19c-1 2-2 3-2 3H2z"/>
      <path d="M2 22L15 9"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

/* ── Helpers ───────────────────────────────────────────────────── */
const fmtBRL = n => `R$\u00A0${(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

/* ── useReveal hook ─────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Magnetic Button ───────────────────────────────────────────── */
function MagBtn({ children, onClick, variant = "primary", size = "md", style = {}, disabled }) {
  const ref = useRef(null);
  const handleMove = e => {
    const b = ref.current.getBoundingClientRect();
    const x = e.clientX - b.left - b.width / 2;
    const y = e.clientY - b.top - b.height / 2;
    ref.current.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
  };
  const handleLeave = () => { ref.current.style.transform = "translate(0,0)"; };

  const variants = {
    primary: { bg: "var(--mint)", color: "#060E09", border: "none" },
    ghost:   { bg: "transparent", color: "var(--mint)", border: "1px solid rgba(82,183,136,.4)" },
    gold:    { bg: "transparent", color: "var(--gold)", border: "1px solid rgba(196,163,90,.4)" },
    dark:    { bg: "var(--card2)", color: "var(--ivoryD)", border: "1px solid var(--border2)" },
    danger:  { bg: "transparent", color: "var(--red)", border: "1px solid rgba(184,84,80,.4)" },
  };
  const sz = { sm: "8px 16px", md: "11px 22px", lg: "15px 34px", xl: "18px 44px" };
  const fz = { sm: 12, md: 13, lg: 15, xl: 16 };
  const v = variants[variant] || variants.primary;

  return (
    <button ref={ref} className="mag-btn" onClick={onClick} disabled={disabled}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ ...v, padding: sz[size], fontSize: fz[size], fontWeight: 500,
        borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8,
        opacity: disabled ? .55 : 1, ...style }}>
      {children}
    </button>
  );
}

/* ── Orbs Background ───────────────────────────────────────────── */
function Orbs({ count = 4 }) {
  const orbs = useMemo(() => Array.from({ length: count }, (_, i) => ({
    size: 200 + i * 120,
    x: [10, 65, 25, 75][i] + "%",
    y: [15, 60, 80, 30][i] + "%",
    color: ["rgba(42,96,68,.18)", "rgba(82,183,136,.08)", "rgba(196,163,90,.07)", "rgba(74,143,168,.06)"][i],
    dur: 8 + i * 3,
    delay: i * 2,
  })), [count]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: "absolute", width: o.size, height: o.size, left: o.x, top: o.y,
          borderRadius: "50%", background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: `orbMove ${o.dur}s ease-in-out ${o.delay}s infinite`,
          transform: "translate(-50%,-50%)", filter: "blur(2px)",
        }} />
      ))}
    </div>
  );
}

/* ── Particles ─────────────────────────────────────────────────── */
function Particles() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100, y: Math.random() * 100,
    tx: (Math.random() - .5) * 80 + "px", ty: (Math.random() - .5) * 80 + "px",
    size: 1 + Math.random() * 2, dur: 3 + Math.random() * 4, delay: Math.random() * 5,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x + "%", top: p.y + "%",
          width: p.size, height: p.size, borderRadius: "50%",
          background: "var(--mint)", opacity: .4,
          "--tx": p.tx, "--ty": p.ty,
          animation: `particleFly ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── Number Counter ────────────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ── Card Component ────────────────────────────────────────────── */
function Card({ children, style = {}, hover = false, glow = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => hover && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--card)", border: `1px solid ${hov ? "var(--mint)44" : "var(--border)"}`,
        borderRadius: 18, transition: "all .3s var(--ease-out)",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 20px 60px rgba(0,0,0,.4)" : (glow ? "0 0 30px rgba(82,183,136,.08)" : "none"),
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────────────── */
function Av({ ini, size = 38, color = "var(--mint)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${color}44, ${color}22)`,
      border: `1.5px solid ${color}55`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * .31, fontFamily: "var(--ff)",
      color, fontWeight: 300, letterSpacing: ".04em",
    }}>{ini}</div>
  );
}

/* ── Tag ───────────────────────────────────────────────────────── */
function Tag({ t, c = "var(--mint)" }) {
  return (
    <span style={{
      fontSize: 10.5, padding: "3px 9px", borderRadius: 20, fontWeight: 500,
      background: c + "1A", color: c, border: `1px solid ${c}40`, letterSpacing: ".02em",
    }}>{t}</span>
  );
}

/* ── Spinner ───────────────────────────────────────────────────── */
const Spin = () => <span style={{ width: 15, height: 15, border: "2px solid var(--border2)", borderTopColor: "var(--mint)", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />;

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE — AIDA FRAMEWORK
══════════════════════════════════════════════════════════════ */

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar({ onCTA }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(8,15,11,.88)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      transition: "all .4s var(--ease-out)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, color: "var(--mint)" }}><Icon.Psi /></div>
        <span style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 200, color: "var(--ivory)" }}>Psique</span>
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {["Funcionalidades", "Para Pacientes", "Preços"].map(l => (
          <a key={l} href="#" style={{ fontSize: 13, color: "var(--ivoryD)", textDecoration: "none", transition: "color .2s" }}
            onMouseEnter={e => e.target.style.color = "var(--ivory)"}
            onMouseLeave={e => e.target.style.color = "var(--ivoryD)"}>{l}</a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <MagBtn variant="ghost" onClick={onCTA}>Entrar</MagBtn>
        <MagBtn onClick={onCTA}>Começar grátis</MagBtn>
      </div>
    </nav>
  );
}

/* ── Hero — ATTENTION ───────────────────────────────────────── */
function Hero({ onCTA }) {
  const [typed, setTyped] = useState("");
  const words = ["clareza.", "presença.", "cura.", "crescimento."];
  const [wi, setWi] = useState(0);
  useEffect(() => {
    let i = 0, typing = true;
    const tick = setInterval(() => {
      const w = words[wi];
      if (typing) { setTyped(w.slice(0, i + 1)); i++; if (i >= w.length) { typing = false; setTimeout(() => {}, 1200); } }
      else { i = 0; typing = true; setWi(c => (c + 1) % words.length); }
    }, typing ? 80 : 1400);
    return () => clearInterval(tick);
  }, [wi]);

  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", position: "relative", padding: "120px 48px 80px",
      textAlign: "center", overflow: "hidden",
    }}>
      <Orbs count={4} />
      <Particles />

      {/* Decorative ring */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        border: "1px solid rgba(82,183,136,.06)", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", animation: "floatY 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        border: "1px solid rgba(196,163,90,.05)", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", animation: "floatY 6s ease-in-out 1s infinite",
      }} />

      {/* Badge */}
      <div className="reveal" style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px",
        borderRadius: 30, border: "1px solid rgba(82,183,136,.3)",
        background: "rgba(82,183,136,.07)", fontSize: 12, color: "var(--mint)",
        marginBottom: 28, backdropFilter: "blur(10px)", fontWeight: 500, letterSpacing: ".04em",
        animation: "fadeUp .8s var(--ease-out) .1s both",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)", animation: "pulse 2s infinite" }} />
        Plataforma para Psicanalistas · Powered by OpenRouter AI
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: "var(--ff)", fontWeight: 200, fontSize: "clamp(42px, 7vw, 88px)",
        color: "var(--ivory)", lineHeight: 1.08, maxWidth: 820, marginBottom: 12,
        animation: "fadeUp .9s var(--ease-out) .25s both",
      }}>
        A plataforma que cuida<br />
        <em style={{ color: "var(--mint)", fontStyle: "italic" }}>de quem cuida</em>
      </h1>

      {/* Typewriter */}
      <div style={{
        fontFamily: "var(--ff)", fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 200,
        color: "var(--ivoryD)", marginBottom: 24,
        animation: "fadeUp .9s var(--ease-out) .4s both",
      }}>
        Cada sessão conduz à&nbsp;
        <span style={{ color: "var(--gold)", borderRight: "2px solid var(--gold)", paddingRight: 4, animation: "blink 1s step-end infinite" }}>
          {typed}
        </span>
      </div>

      <p style={{
        fontSize: 16, color: "var(--ivoryDD)", maxWidth: 560, lineHeight: 1.8,
        marginBottom: 40, animation: "fadeUp .9s var(--ease-out) .55s both",
      }}>
        Agenda inteligente, videochamadas HD, resumos de sessão com IA, prontuário eletrônico e Telegram bot — tudo em um único lugar, pronto para o dia 1.
      </p>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .9s var(--ease-out) .7s both" }}>
        <MagBtn size="xl" onClick={onCTA} style={{ gap: 10, paddingRight: 28 }}>
          Começar gratuitamente
          <span style={{ width: 18, height: 18 }}><Icon.ArrowRight /></span>
        </MagBtn>
        <MagBtn size="xl" variant="ghost" onClick={onCTA} style={{ gap: 10 }}>
          <span style={{ width: 18, height: 18 }}><Icon.Play /></span>
          Ver demonstração
        </MagBtn>
      </div>

      {/* Trust badges */}
      <div style={{
        marginTop: 56, display: "flex", gap: 32, alignItems: "center",
        fontSize: 12, color: "var(--ivoryDD)", flexWrap: "wrap", justifyContent: "center",
        animation: "fadeUp .9s var(--ease-out) .9s both",
      }}>
        {[
          { icon: <Icon.Shield />, t: "LGPD Compliant" },
          { icon: <Icon.Lock />, t: "Dados Criptografados" },
          { icon: <Icon.Heart />, t: "CFP Guidelines" },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 14, color: "var(--mint)", opacity: .7 }}>{b.icon}</span>
            {b.t}
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        animation: "floatY 3s ease-in-out infinite",
      }}>
        <span style={{ fontSize: 10, color: "var(--border2)", letterSpacing: ".12em", textTransform: "uppercase" }}>Role para ver</span>
        <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, var(--border2), transparent)" }} />
      </div>
    </section>
  );
}

/* ── Stats Bar ───────────────────────────────────────────────── */
function StatsBar() {
  const ref = useReveal();
  const stats = [
    { v: 1200, suf: "+", l: "Psicanalistas" },
    { v: 48000, suf: "+", l: "Sessões Realizadas" },
    { v: 98, suf: "%", l: "Taxa de Satisfação" },
    { v: 4.9, suf: "★", l: "Avaliação média" },
  ];
  return (
    <section style={{ padding: "60px 48px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
      <div ref={ref} className="reveal" style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center", animationDelay: i * .1 + "s" }}>
            <div style={{ fontFamily: "var(--ff)", fontSize: 44, fontWeight: 200, color: "var(--mint)", lineHeight: 1 }}>
              <Counter to={Math.floor(s.v)} suffix={s.suf} />
            </div>
            <div style={{ fontSize: 13, color: "var(--ivoryDD)", marginTop: 6, letterSpacing: ".03em" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features — INTEREST ─────────────────────────────────────── */
function Features() {
  const feats = [
    { icon: <Icon.Calendar />, title: "Agenda Inteligente", desc: "Calendário visual com disponibilidade em tempo real. Página pública de agendamento com link único. Pacientes agendam sozinhos 24/7.", color: "var(--mint)" },
    { icon: <Icon.Video />, title: "Videochamadas HD", desc: "Salas criadas automaticamente por sessão. Token único para acesso do paciente. Gravação local opcional. Zero configuração.", color: "var(--blue)" },
    { icon: <Icon.Sparkle />, title: "IA Clínica — OpenRouter", desc: "Claude 3.5, GPT-4o, Gemini. Resumos de sessão, insights de carteira, transcrição de áudio. Troca de modelo com 1 clique.", color: "var(--gold)" },
    { icon: <Icon.Telegram />, title: "Telegram Bot Nativo", desc: "Bot configura em 2 minutos. Agendamento, lembretes 24h e 1h, cobranças automáticas, chat com IA. Pacientes adoram.", color: "#54C5F8" },
    { icon: <Icon.Chart />, title: "KPIs em Tempo Real", desc: "MRR, NPS, presença, conversão de leads. Dashboards com gráficos. Saiba exatamente como sua clínica está performando.", color: "var(--purple)" },
    { icon: <Icon.Shield />, title: "Prontuário LGPD", desc: "Prontuário eletrônico com asssinatura digital, consentimento LGPD integrado, backup automático e acesso auditado.", color: "var(--mint)" },
  ];
  return (
    <section id="features" style={{ padding: "100px 48px", position: "relative" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        {(() => { const r = useReveal(); return (
          <div ref={r} className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--mint)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>
              <span style={{ width: 14, height: 14 }}><Icon.Sparkle /></span> Funcionalidades
            </div>
            <h2 style={{ fontFamily: "var(--ff)", fontSize: "clamp(32px,5vw,58px)", fontWeight: 200, color: "var(--ivory)", lineHeight: 1.1 }}>
              Tudo que você precisa<br /><em>em um só lugar</em>
            </h2>
          </div>
        );})()}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {feats.map((f, i) => {
            const r = useReveal();
            return (
              <div key={i} ref={r} className="reveal" style={{ transitionDelay: i * .08 + "s" }}>
                <Card hover style={{ padding: "28px 28px 32px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: f.color + "18", border: `1px solid ${f.color}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <span style={{ width: 22, height: 22, color: f.color }}>{f.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 300, color: "var(--ivory)", marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--ivoryDD)", lineHeight: 1.75 }}>{f.desc}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Workflow Visual ─────────────────────────────────────────── */
function Workflow() {
  const steps = [
    { n: "01", t: "Configure em 5 min", d: "Onboarding guiado: perfil, disponibilidade, OpenRouter API, Telegram bot. Tudo funciona no ato.", icon: <Icon.Settings /> },
    { n: "02", t: "Compartilhe seu link", d: "Envie psique.app/agendar/seu-nome para leads e pacientes. Eles agendam e pagam sozinhos.", icon: <Icon.Users /> },
    { n: "03", t: "Conduza a sessão", d: "Videochamada abre automaticamente. Anote em tempo real. IA gera resumo clínico ao encerrar.", icon: <Icon.Brain /> },
    { n: "04", t: "Acompanhe e cresça", d: "KPIs, prontuários, NPS automático via Telegram. Sua clínica cresce com inteligência.", icon: <Icon.Chart /> },
  ];
  return (
    <section style={{ padding: "80px 48px", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {(() => { const r = useReveal(); return (
          <div ref={r} className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "var(--ff)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 200, color: "var(--ivory)" }}>
              Do zero ao <em style={{ color: "var(--gold)" }}>primeiro atendimento</em> em 5 minutos
            </h2>
          </div>
        );})()}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, position: "relative" }}>
          {/* Connector line */}
          <div style={{ position: "absolute", top: 32, left: "12%", right: "12%", height: 1, background: "linear-gradient(to right, transparent, var(--border2), var(--border2), transparent)" }} />
          {steps.map((s, i) => {
            const r = useReveal();
            return (
              <div key={i} ref={r} className="reveal" style={{ textAlign: "center", transitionDelay: i * .1 + "s" }}>
                <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "linear-gradient(135deg,var(--card),var(--card2))", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 24, height: 24, color: "var(--mint)" }}>{s.icon}</span>
                  <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "var(--mint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#060E09" }}>{s.n}</div>
                </div>
                <h4 style={{ fontFamily: "var(--ff)", fontSize: 18, fontWeight: 300, color: "var(--ivory)", marginBottom: 8 }}>{s.t}</h4>
                <p style={{ fontSize: 12.5, color: "var(--ivoryDD)", lineHeight: 1.65 }}>{s.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials — DESIRE ───────────────────────────────────── */
function Testimonials() {
  const [active, setActive] = useState(0);
  const items = [
    { name: "Dra. Carla Menezes", crp: "CRP 06/83241 · SP", text: "O Psique transformou minha prática. O bot do Telegram faz o agendamento sozinho e os resumos da IA economizam 30 minutos por dia. Nunca mais quero voltar para planilhas.", stars: 5, av: "CM" },
    { name: "Dr. Paulo Henrique R.", crp: "CRP 08/12045 · RJ", text: "Implementei em uma tarde. Na semana seguinte já tinha 3 novos pacientes que agendaram pelo link público. O painel de KPIs me deu uma clareza que eu nunca tive sobre minha clínica.", stars: 5, av: "PH" },
    { name: "Dra. Fernanda Luz", crp: "CRP 04/55871 · MG", text: "A IA clínica é impressionante. Ela identifica padrões que às vezes passam despercebidos. Os insights da carteira me ajudaram a ajustar minha abordagem com vários pacientes.", stars: 5, av: "FL" },
  ];
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, []);
  const ref = useReveal();
  return (
    <section style={{ padding: "100px 48px", position: "relative", overflow: "hidden" }}>
      <Orbs count={2} />
      <div ref={ref} className="reveal" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--gold)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Depoimentos</div>
        <h2 style={{ fontFamily: "var(--ff)", fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 200, color: "var(--ivory)", marginBottom: 48 }}>
          Psicanalistas que <em style={{ color: "var(--mint)" }}>já transformaram</em> sua prática
        </h2>
        <Card glow style={{ padding: "40px 48px", position: "relative", minHeight: 220 }}>
          {items.map((t, i) => (
            <div key={i} style={{ position: i === 0 ? "relative" : "absolute", inset: 0, padding: "40px 48px", opacity: active === i ? 1 : 0, transform: active === i ? "translateY(0)" : "translateY(10px)", transition: "all .5s var(--ease-out)", pointerEvents: active === i ? "auto" : "none" }}>
              <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
                {Array(t.stars).fill(0).map((_, j) => <span key={j} style={{ width: 14, height: 14, color: "var(--gold)" }}><Icon.Star /></span>)}
              </div>
              <p style={{ fontFamily: "var(--ff)", fontSize: "clamp(16px,2.5vw,22px)", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", lineHeight: 1.65, marginBottom: 28 }}>"{t.text}"</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
                <Av ini={t.av} size={42} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 2 }}>{t.crp}</div>
                </div>
              </div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          {items.map((_, i) => <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? 24 : 6, height: 6, borderRadius: 3, background: active === i ? "var(--mint)" : "var(--border2)", border: "none", transition: "all .3s" }} />)}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing — ACTION ────────────────────────────────────────── */
function Pricing({ onCTA }) {
  const plans = [
    { n: "Inicial", price: 0, period: "grátis para sempre", desc: "Para conhecer a plataforma", feats: ["5 pacientes ativos", "Agenda básica", "Videochamada ilimitada", "10 resumos IA/mês", "Telegram (lembretes)"], color: "var(--mint)", cta: "Começar grátis" },
    { n: "Clínica", price: 97, period: "/mês", desc: "Para práticas em crescimento", feats: ["Pacientes ilimitados", "Agenda + página pública", "Videochamada + gravação", "IA ilimitada (todos os modelos)", "Telegram + bot completo", "KPIs e relatórios", "Prontuário LGPD"], color: "var(--gold)", cta: "Começar 14 dias grátis", popular: true },
    { n: "Enterprise", price: 297, period: "/mês", desc: "Para grupos e institutos", feats: ["Multi-terapeuta", "White-label / domínio próprio", "API personalizada", "Suporte prioritário 24/7", "Onboarding dedicado", "Treinamento da equipe"], color: "var(--purple)", cta: "Falar com vendas" },
  ];
  const ref = useReveal();
  return (
    <section id="pricing" style={{ padding: "100px 48px", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
      <div ref={ref} className="reveal" style={{ maxWidth: 1050, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 12, color: "var(--mint)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Preços</div>
          <h2 style={{ fontFamily: "var(--ff)", fontSize: "clamp(30px,4.5vw,56px)", fontWeight: 200, color: "var(--ivory)" }}>
            Simples, transparente, <em style={{ color: "var(--gold)" }}>justo</em>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {plans.map((p, i) => (
            <div key={i} style={{ position: "relative", transitionDelay: i * .1 + "s" }}>
              {p.popular && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: "var(--gold)", color: "#060E09", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: ".06em" }}>MAIS POPULAR</div>
              )}
              <Card style={{ padding: "32px 28px", border: p.popular ? `1px solid var(--gold)55` : "1px solid var(--border)", height: "100%" }}>
                <div style={{ fontSize: 13, color: p.color, fontWeight: 500, marginBottom: 8 }}>{p.n}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  {p.price > 0 ? (
                    <>
                      <span style={{ fontFamily: "var(--ff)", fontSize: 42, fontWeight: 200, color: "var(--ivory)" }}>R${p.price}</span>
                      <span style={{ fontSize: 13, color: "var(--ivoryDD)" }}>{p.period}</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "var(--ff)", fontSize: 36, fontWeight: 200, color: "var(--ivory)" }}>Grátis</span>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--ivoryDD)", marginBottom: 24, lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {p.feats.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--ivoryD)" }}>
                      <span style={{ width: 16, height: 16, color: p.color, flexShrink: 0, marginTop: 1 }}><Icon.Check /></span>
                      {f}
                    </div>
                  ))}
                </div>
                <MagBtn onClick={onCTA} variant={p.popular ? "primary" : "ghost"} style={{ width: "100%", justifyContent: "center" }}>{p.cta}</MagBtn>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────── */
function FinalCTA({ onCTA }) {
  const ref = useReveal();
  return (
    <section style={{ padding: "100px 48px", position: "relative", overflow: "hidden" }}>
      <Orbs count={3} />
      <div ref={ref} className="reveal" style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 24px", color: "var(--mint)" }}><Icon.Leaf /></div>
        <h2 style={{ fontFamily: "var(--ff)", fontSize: "clamp(32px,5vw,62px)", fontWeight: 200, color: "var(--ivory)", marginBottom: 16, lineHeight: 1.1 }}>
          Sua prática merece<br /><em style={{ color: "var(--mint)" }}>infraestrutura à altura</em>
        </h2>
        <p style={{ fontSize: 15, color: "var(--ivoryDD)", lineHeight: 1.8, marginBottom: 40 }}>
          Comece hoje. Sem cartão de crédito. Setup em 5 minutos. Cancel quando quiser.
        </p>
        <MagBtn size="xl" onClick={onCTA} style={{ margin: "0 auto", gap: 12 }}>
          Criar conta gratuita
          <span style={{ width: 20, height: 20 }}><Icon.ArrowRight /></span>
        </MagBtn>
      </div>
    </section>
  );
}

function LandingPage({ onCTA }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar onCTA={onCTA} />
      <Hero onCTA={onCTA} />
      <StatsBar />
      <Features />
      <Workflow />
      <Testimonials />
      <Pricing onCTA={onCTA} />
      <FinalCTA onCTA={onCTA} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   AUTH SCREEN
══════════════════════════════════════════════════════════════ */
function AuthScreen({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("therapist");
  const [form, setForm] = useState({ name: "", email: "", pass: "", crp: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 900));
    if (!form.email.includes("@")) { setErr("Email inválido"); setLoading(false); return; }
    onLogin({ role, name: form.name || (role === "therapist" ? "Dra. Helena Vaz" : "Ana Carolina M."), email: form.email, isNew: mode === "register" });
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>
      <Orbs count={3} />
      {/* Left */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", position: "relative" }}>
        <button onClick={onBack} style={{ position: "absolute", top: 32, left: 40, background: "none", border: "none", color: "var(--ivoryDD)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <div style={{ width: 48, height: 48, color: "var(--mint)", marginBottom: 20 }}><Icon.Psi /></div>
        <h2 style={{ fontFamily: "var(--ff)", fontSize: 52, fontWeight: 200, color: "var(--ivory)", lineHeight: 1.1, marginBottom: 16, animation: "slideL .7s var(--ease-out) both" }}>
          {mode === "login" ? "Bem-vindo\nde volta." : "Comece\nhoje mesmo."}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 32, animation: "slideL .7s var(--ease-out) .15s both" }}>
          {[
            { icon: <Icon.Brain />, t: "IA com Claude, GPT-4o, Gemini" },
            { icon: <Icon.Telegram />, t: "Telegram Bot automático" },
            { icon: <Icon.Chart />, t: "KPIs e relatórios em tempo real" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(82,183,136,.12)", border: "1px solid rgba(82,183,136,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 16, height: 16, color: "var(--mint)" }}>{f.icon}</span>
              </div>
              <span style={{ fontSize: 14, color: "var(--ivoryD)" }}>{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ width: 480, background: "var(--bg2)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "52px 48px", animation: "slideR .7s var(--ease-out) both" }}>
        {/* Role toggle */}
        <div style={{ display: "flex", background: "var(--card)", borderRadius: 14, padding: 4, border: "1px solid var(--border)", marginBottom: 28, gap: 4 }}>
          {[{ v: "therapist", l: "Psicanalista", icon: <Icon.Brain /> }, { v: "patient", l: "Paciente", icon: <Icon.Heart /> }].map(r => (
            <button key={r.v} onClick={() => setRole(r.v)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: role === r.v ? "var(--g1)" : "transparent",
              color: role === r.v ? "var(--mint)" : "var(--ivoryDD)",
              border: role === r.v ? "1px solid rgba(82,183,136,.3)" : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span style={{ width: 14, height: 14 }}>{r.icon}</span>{r.l}
            </button>
          ))}
        </div>

        <h3 style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 300, color: "var(--ivory)", marginBottom: 6 }}>
          {mode === "login" ? "Acessar conta" : "Criar conta grátis"}
        </h3>
        <p style={{ fontSize: 13, color: "var(--ivoryDD)", marginBottom: 24 }}>
          {role === "therapist" ? "Painel clínico completo" : "Sua jornada terapêutica começa aqui"}
        </p>

        {err && <div style={{ background: "rgba(184,84,80,.12)", border: "1px solid rgba(184,84,80,.35)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: 14 }}>{err}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && <input placeholder={role === "therapist" ? "Nome (Dr./Dra.)" : "Seu nome"} value={form.name} onChange={upd("name")} />}
          <input placeholder="Email" type="email" value={form.email} onChange={upd("email")} />
          {mode !== "forgot" && <input placeholder="Senha" type="password" value={form.pass} onChange={upd("pass")} />}
          {mode === "register" && role === "therapist" && <input placeholder="CRP (ex: 06/98421)" value={form.crp} onChange={upd("crp")} />}
        </div>

        {mode === "login" && <button onClick={() => setMode("forgot")} style={{ background: "none", border: "none", color: "var(--ivoryDD)", fontSize: 12, textAlign: "right", marginTop: 8 }}>Esqueci a senha</button>}

        <button onClick={submit} disabled={loading} style={{
          marginTop: 20, padding: "14px", borderRadius: 12, fontWeight: 600, fontSize: 15,
          background: "var(--mint)", color: "#060E09", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? .7 : 1,
          boxShadow: "0 4px 24px rgba(82,183,136,.25)", transition: "all .2s",
        }}>
          {loading && <Spin />}
          {mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: "var(--border2)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--ivoryDD)" }}>ou continue com</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {[{ icon: "G", l: "Continuar com Google" }, { icon: "✉", l: "Magic Link por Email" }].map((s, i) => (
          <button key={i} onClick={submit} style={{
            width: "100%", padding: "11px", borderRadius: 10, marginBottom: 8, fontSize: 13,
            background: "var(--card)", border: "1px solid var(--border2)", color: "var(--ivoryD)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <span style={{ fontWeight: 700 }}>{s.icon}</span>{s.l}
          </button>
        ))}

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--ivoryDD)" }}>
          {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "var(--mint)", fontWeight: 500, fontSize: 13 }}>
            {mode === "login" ? "Criar conta grátis" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ONBOARDING WIZARD
══════════════════════════════════════════════════════════════ */
const AI_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "top", ctx: "200k" },
  { id: "openai/gpt-4o", label: "GPT-4o", tier: "top", ctx: "128k" },
  { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", tier: "top", ctx: "1M" },
  { id: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B (Free)", tier: "free", ctx: "128k" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku (Fast)", tier: "fast", ctx: "200k" },
  { id: "mistralai/mistral-large", label: "Mistral Large", tier: "mid", ctx: "32k" },
];

function OnboardingWizard({ user, onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ crp: "", bio: "", price: "200", duration: "50", orKey: "", orModel: AI_MODELS[0].id, teleToken: "", wed: "true", fri: "true", startTime: "09:00", endTime: "18:00", supaUrl: "", supaKey: "" });
  const upd = k => e => setData(d => ({ ...d, [k]: e.target.value }));
  const STEPS = [
    { t: "Perfil Clínico", i: <Icon.Brain /> },
    { t: "IA OpenRouter", i: <Icon.Sparkle /> },
    { t: "Telegram Bot", i: <Icon.Telegram /> },
    { t: "Disponibilidade", i: <Icon.Calendar /> },
    { t: "Integrações", i: <Icon.Settings /> },
    { t: "Tudo pronto!", i: <Icon.Check /> },
  ];
  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : onDone(data);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, position: "relative", overflow: "hidden" }}>
      <Orbs count={3} />
      <div style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: i < step ? "var(--mint)" : i === step ? "var(--g1)" : "var(--card2)",
              border: `2px solid ${i <= step ? "var(--mint)" : "var(--border2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: i < step ? "#060E09" : i === step ? "var(--mint)" : "var(--ivoryDD)",
              transition: "all .4s var(--ease-out)", fontSize: 12,
            }}>
              {i < step ? <span style={{ width: 14, height: 14 }}><Icon.Check /></span> : <span style={{ width: 14, height: 14 }}>{s.i}</span>}
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 20, height: 2, background: i < step ? "var(--mint)" : "var(--border)", borderRadius: 1, transition: "background .4s" }} />}
          </div>
        ))}
      </div>

      <Card style={{ width: "100%", maxWidth: 560, padding: 40, animation: "scaleIn .4s var(--ease-out) both", position: "relative" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(82,183,136,.12)", border: "1px solid rgba(82,183,136,.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <span style={{ width: 20, height: 20, color: "var(--mint)" }}>{STEPS[step].i}</span>
          </div>
          <h2 style={{ fontFamily: "var(--ff)", fontSize: 28, fontWeight: 200, color: "var(--ivory)", marginBottom: 4 }}>{STEPS[step].t}</h2>
          <p style={{ fontSize: 12, color: "var(--ivoryDD)" }}>Passo {step + 1} de {STEPS.length}</p>
        </div>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Número CRP</label>
              <input placeholder="06/98421" value={data.crp} onChange={upd("crp")} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Bio Profissional</label>
              <textarea rows={3} placeholder="Psicanalista com foco em..." value={data.bio} onChange={upd("bio")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Valor da Sessão (R$)</label>
                <input type="number" value={data.price} onChange={upd("price")} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Duração (min)</label>
                <input type="number" value={data.duration} onChange={upd("duration")} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(74,143,168,.1)", border: "1px solid rgba(74,143,168,.25)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#8ECFE0", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600 }}>OpenRouter</span> dá acesso a Claude, GPT-4o, Gemini e 200+ modelos com uma única API key. <a href="https://openrouter.ai/keys" target="_blank" style={{ color: "var(--mint)", textDecoration: "none" }}>→ Obter key gratuita</a>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>API Key</label>
              <input type="password" placeholder="sk-or-v1-..." value={data.orKey} onChange={upd("orKey")} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Modelo Padrão</label>
              <select value={data.orModel} onChange={upd("orModel")}>
                {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} · ctx {m.ctx} [{m.tier}]</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(34,158,217,.1)", border: "1px solid rgba(34,158,217,.25)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#8ECFE0", lineHeight: 1.6 }}>
              1. Abra Telegram → <strong>@BotFather</strong> → /newbot<br />
              2. Escolha nome e username<br />
              3. Cole o token abaixo — o webhook é configurado automaticamente
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Bot Token</label>
              <input type="password" placeholder="6825301234:AAFx..." value={data.teleToken} onChange={upd("teleToken")} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Comandos Configurados</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["/start", "/agendar", "/sessoes", "/cancelar", "/pagar", "/falar", "/ajuda"].map(c => <Tag key={c} t={c} c="var(--blue)" />)}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Dias disponíveis</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["Dom", "sun"], ["Seg", "mon"], ["Ter", "tue"], ["Qua", "wed"], ["Qui", "thu"], ["Sex", "fri"], ["Sáb", "sat"]].map(([l, k]) => (
                  <button key={k} onClick={() => setData(d => ({ ...d, [k]: d[k] === "true" ? "" : "true" }))} style={{
                    padding: "8px 14px", borderRadius: 9, fontSize: 13,
                    background: data[k] === "true" ? "var(--g1)" : "var(--card2)",
                    border: `1px solid ${data[k] === "true" ? "rgba(82,183,136,.4)" : "var(--border2)"}`,
                    color: data[k] === "true" ? "var(--mint)" : "var(--ivoryDD)",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Horário Início</label>
                <input type="time" value={data.startTime} onChange={upd("startTime")} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Horário Fim</label>
                <input type="time" value={data.endTime} onChange={upd("endTime")} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[{ k: "supaUrl", l: "Supabase URL", ph: "https://xxx.supabase.co" }, { k: "supaKey", l: "Supabase Anon Key", ph: "eyJ...", pw: true }, { k: "stripeKey", l: "Stripe Secret Key", ph: "sk_live_...", pw: true }, { k: "resendKey", l: "Resend API Key", ph: "re_...", pw: true }].map(f => (
              <div key={f.k}>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.l}</label>
                <input type={f.pw ? "password" : "text"} placeholder={f.ph} value={data[f.k] || ""} onChange={upd(f.k)} />
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 72, height: 72, margin: "0 auto 20px", borderRadius: "50%", background: "rgba(82,183,136,.15)", border: "2px solid rgba(82,183,136,.4)", display: "flex", alignItems: "center", justifyContent: "center", animation: "glow 2s ease-in-out infinite" }}>
              <span style={{ width: 32, height: 32, color: "var(--mint)" }}><Icon.Check /></span>
            </div>
            <h3 style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 200, color: "var(--ivory)", marginBottom: 10 }}>Tudo configurado!</h3>
            <p style={{ fontSize: 14, color: "var(--ivoryDD)", lineHeight: 1.7, marginBottom: 16 }}>IA ativa, Telegram conectado, agenda configurada.</p>
            <div style={{ background: "rgba(82,183,136,.08)", border: "1px solid rgba(82,183,136,.2)", borderRadius: 12, padding: "12px 18px", display: "inline-block" }}>
              <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 4 }}>Seu link de agendamento</div>
              <div style={{ fontFamily: "var(--ff)", fontSize: 18, color: "var(--mint)" }}>psique.app/agendar/dra-helena</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          {step > 0 ? <MagBtn variant="ghost" onClick={() => setStep(s => s - 1)}>← Voltar</MagBtn> : <div />}
          <MagBtn onClick={next}>{step === STEPS.length - 1 ? "Entrar no Painel →" : "Próximo →"}</MagBtn>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════ */
const PATIENTS = [
  { id: 1, name: "Ana Carolina M.", email: "ana@email.com", age: 34, sessions: 47, since: "Mar/22", tags: ["Ansiedade", "TCC"], status: "active", avatar: "AC", next: "Hoje 14h", mrr: 600, tele: "@anacm", mood: 72 },
  { id: 2, name: "Roberto F. Silva", email: "rob@email.com", age: 42, sessions: 28, since: "Jan/23", tags: ["Depressão", "Luto"], status: "active", avatar: "RS", next: "Amanhã 10h", mrr: 600, tele: "@robfs", mood: 55 },
  { id: 3, name: "Mariana Torres", email: "mt@email.com", age: 28, sessions: 15, since: "Set/23", tags: ["Autoestima"], status: "active", avatar: "MT", next: "Qui 16h", mrr: 600, tele: null, mood: 68 },
  { id: 4, name: "Carlos Eduardo L.", email: "cel@email.com", age: 55, sessions: 89, since: "Nov/21", tags: ["Burnout"], status: "active", avatar: "CE", next: "Sex 11h", mrr: 600, tele: "@carlosl", mood: 61 },
  { id: 5, name: "Fernanda Souza", email: "fs@email.com", age: 31, sessions: 8, since: "Fev/24", tags: ["Fobia Social"], status: "new", avatar: "FS", next: "Seg 15h", mrr: 600, tele: null, mood: 44 },
  { id: 6, name: "Lucas Almeida", email: "la@email.com", age: 25, sessions: 0, since: "—", tags: ["Lead"], status: "lead", avatar: "LA", next: "—", mrr: 0, tele: null, mood: null },
];
const AGENDA_TODAY = [
  { time: "10:00", p: PATIENTS[1], type: "online", status: "confirmed" },
  { time: "11:00", p: null, avail: false, blocked: true },
  { time: "14:00", p: PATIENTS[0], type: "online", status: "inprogress" },
  { time: "15:30", p: PATIENTS[4], type: "presencial", status: "confirmed" },
];
const KPI = { mrr: 9800, mrrD: 12.4, sessions: 82, sessD: 6, patients: 23, patD: 2, nps: 91, npsD: 2, attendance: 94, attD: 1.5, leads: 8, leadD: 3, conv: 62, convD: 4, cancel: 6, cancelD: -2, rev: [7200, 7800, 8100, 8600, 9100, 9400, 9800], sessions8: [12, 15, 14, 18, 16, 13, 17, 18], months: ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar"] };

/* ── MiniCharts ─────────────────────────────────────────────────── */
function Bars({ data, color = "var(--mint)", h = 50 }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: color + "44", border: `1px solid ${color}33`, height: h * (v / max) + "px", transition: "height .5s var(--ease-out)", animationDelay: i * .05 + "s" }} />
      ))}
    </div>
  );
}
function Line({ data, color = "var(--gold)", h = 55, w = 240 }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * h}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h + 4} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`lg_${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#lg_${color.replace(/[^a-z]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w, y = h - ((v - min) / rng) * h;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   THERAPIST APP
══════════════════════════════════════════════════════════════ */
function TherapistApp({ user }) {
  const [view, setView] = useState("dashboard");
  const [selPat, setSelPat] = useState(null);

  const NAV = [
    { id: "dashboard", i: <Icon.Chart />, l: "Dashboard" },
    { id: "agenda", i: <Icon.Calendar />, l: "Agenda" },
    { id: "patients", i: <Icon.Users />, l: "Pacientes" },
    { id: "ai", i: <Icon.Sparkle />, l: "IA Clínica" },
    { id: "telegram", i: <Icon.Telegram />, l: "Telegram" },
    { id: "financial", i: <Icon.Bolt />, l: "Financeiro" },
    { id: "settings", i: <Icon.Settings />, l: "Config." },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 230, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, color: "var(--mint)" }}><Icon.Psi /></div>
          <div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 200, color: "var(--ivory)" }}>Psique</div>
            <div style={{ fontSize: 9, color: "var(--ivoryDD)", letterSpacing: ".1em", textTransform: "uppercase" }}>Painel Clínico</div>
          </div>
        </div>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
          <Av ini="HV" size={36} />
          <div>
            <div style={{ fontSize: 13, color: "var(--ivory)", fontFamily: "var(--ff)", fontWeight: 300 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>CRP 06/98421</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              fontSize: 13, background: view === n.id ? "var(--g1)" : "transparent",
              color: view === n.id ? "var(--mint)" : "var(--ivoryDD)",
              border: view === n.id ? "1px solid rgba(82,183,136,.25)" : "1px solid transparent",
              transition: "all .2s",
            }}>
              <span style={{ width: 16, height: 16, flexShrink: 0 }}>{n.i}</span>{n.l}
            </button>
          ))}
        </nav>
        {/* AI badge */}
        <div style={{ margin: "0 8px 8px", padding: "12px 14px", borderRadius: 12, background: "rgba(74,143,168,.08)", border: "1px solid rgba(74,143,168,.2)" }}>
          <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 12 }}><Icon.Sparkle /></span> OpenRouter IA
          </div>
          <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>Claude 3.5 · Ativo</div>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 1, marginTop: 8 }}>
            <div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg,var(--mint),var(--blue))", borderRadius: 1 }} />
          </div>
        </div>
        {/* Telegram badge */}
        <div style={{ margin: "0 8px 14px", padding: "10px 14px", borderRadius: 12, background: "rgba(34,158,217,.07)", border: "1px solid rgba(34,158,217,.2)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 14, color: "#54C5F8" }}><Icon.Telegram /></span>
          <div>
            <div style={{ fontSize: 10, color: "#54C5F8", fontWeight: 600 }}>@PsiqueBotOficial</div>
            <div style={{ fontSize: 10, color: "var(--ivoryDD)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)", animation: "pulse 2s infinite", display: "inline-block" }} />3 msgs hoje
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {view === "dashboard" && <DashView onNav={setView} />}
        {view === "agenda" && <AgendaView />}
        {view === "patients" && <PatientsView onSelect={p => { setSelPat(p); setView("pdetail"); }} />}
        {view === "pdetail" && selPat && <PatientDetail p={selPat} onBack={() => setView("patients")} />}
        {view === "ai" && <AIView />}
        {view === "telegram" && <TelegramView />}
        {view === "financial" && <FinancialView />}
        {view === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────────────── */
function DashView({ onNav }) {
  const kpis = [
    { l: "MRR", v: fmtBRL(KPI.mrr), d: `+${KPI.mrrD}%`, up: true, i: <Icon.Bolt />, c: "var(--gold)" },
    { l: "Sessões/mês", v: KPI.sessions, d: `+${KPI.sessD}`, up: true, i: <Icon.Calendar />, c: "var(--mint)" },
    { l: "Pacientes", v: KPI.patients, d: `+${KPI.patD}`, up: true, i: <Icon.Users />, c: "var(--blue)" },
    { l: "NPS", v: KPI.nps, d: `+${KPI.npsD} pts`, up: true, i: <Icon.Star />, c: "var(--gold)" },
    { l: "Presença", v: `${KPI.attendance}%`, d: `+${KPI.attD}%`, up: true, i: <Icon.Check />, c: "var(--mint)" },
    { l: "Leads", v: KPI.leads, d: `+${KPI.leadD}`, up: true, i: <Icon.Heart />, c: "var(--purple)" },
    { l: "Conversão", v: `${KPI.conv}%`, d: `+${KPI.convD}%`, up: true, i: <Icon.Chart />, c: "var(--blue)" },
    { l: "Cancelamentos", v: `${KPI.cancel}%`, d: `${KPI.cancelD}%`, up: false, i: <Icon.Shield />, c: "var(--mint)" },
  ];
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>Terça, 3 de Março · 2026</div>
        <h1 style={{ fontFamily: "var(--ff)", fontSize: 36, fontWeight: 200, color: "var(--ivory)", marginTop: 4 }}>Bom dia, <em>Dra. Helena</em> 🌿</h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>4 consultas hoje · <span style={{ color: "var(--gold)" }}>MRR atingiu novo recorde</span></p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <Card key={i} hover style={{ padding: "18px 20px", animation: `fadeUp .5s var(--ease-out) ${i * .04}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: k.c + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 14, height: 14, color: k.c }}>{k.i}</span>
              </div>
              <span style={{ fontSize: 11, color: k.up ? "var(--mint)" : "var(--red)", background: k.up ? "rgba(82,183,136,.1)" : "rgba(184,84,80,.1)", padding: "2px 6px", borderRadius: 6 }}>
                {k.up ? "↑" : "↓"} {k.d}
              </span>
            </div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 200, color: k.c, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 5, letterSpacing: ".03em" }}>{k.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 18 }}>
        {/* Revenue */}
        <Card style={{ padding: 22 }}>
          <div style={{ marginBottom: 4, fontSize: 12, color: "var(--ivoryDD)" }}>Receita Mensal</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 28, fontWeight: 200, color: "var(--gold)", marginBottom: 16 }}>
            <Counter to={9800} prefix="R$ " />
          </div>
          <Line data={KPI.rev} color="var(--gold)" w={220} h={55} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {KPI.months.map(m => <span key={m} style={{ fontSize: 9, color: "var(--ivoryDD)" }}>{m}</span>)}
          </div>
        </Card>

        {/* Sessions */}
        <Card style={{ padding: 22 }}>
          <div style={{ marginBottom: 4, fontSize: 12, color: "var(--ivoryDD)" }}>Sessões por Semana</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 28, fontWeight: 200, color: "var(--mint)", marginBottom: 16 }}>82 este mês</div>
          <Bars data={KPI.sessions8} color="var(--mint)" h={55} />
        </Card>

        {/* Today */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--ivory)" }}>Agenda Hoje</span>
            <button onClick={() => onNav("agenda")} style={{ fontSize: 11, color: "var(--mint)", background: "none", border: "none" }}>ver tudo →</button>
          </div>
          {AGENDA_TODAY.map((s, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 9, marginBottom: 6,
              background: s.status === "inprogress" ? "rgba(42,96,68,.3)" : "var(--bg3)",
              border: `1px solid ${s.status === "inprogress" ? "rgba(82,183,136,.3)" : "var(--border)55"}`,
              animation: `fadeUp .5s var(--ease-out) ${.3 + i * .07}s both`,
            }}>
              <div style={{ width: 36, fontSize: 10, color: "var(--gold)", fontFamily: "monospace", flexShrink: 0 }}>{s.time}</div>
              {s.p ? <>
                <Av ini={s.p.avatar} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ivory)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.p.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 9, color: "var(--ivoryDD)" }}>{s.type === "online" ? "🎥" : "🏥"}</div>
                </div>
                {s.status === "inprogress" && <span style={{ fontSize: 9, color: "var(--gold)", animation: "pulse 2s infinite" }}>● LIVE</span>}
              </> : <span style={{ fontSize: 11, color: "var(--border2)" }}>Bloqueado</span>}
            </div>
          ))}
        </Card>
      </div>

      {/* AI insights strip */}
      <Card style={{ marginTop: 18, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(74,143,168,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 13, height: 13, color: "var(--blue)" }}><Icon.Sparkle /></span>
          </div>
          <span style={{ fontSize: 13, color: "var(--ivory)" }}>Insights IA — Carteira Completa</span>
          <Tag t="Claude 3.5 Sonnet" c="var(--blue)" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { i: <Icon.Brain />, l: "Padrão", t: "Ana C. apresenta temas de controle em 4 sessões consecutivas. Possível traço obsessivo.", c: "var(--gold)" },
            { i: <Icon.Chart />, l: "Progresso", t: "Roberto reduziu relatos de crises em ~40% desde Jan/25. Marco evolutivo.", c: "var(--mint)" },
            { i: <Icon.Heart />, l: "Atenção", t: "Mariana faltou sem aviso. Risco de abandono. Contato recomendado hoje.", c: "var(--red)" },
            { i: <Icon.Sparkle />, l: "Sugestão", t: "Carlos: mindfulness corporativo pode ampliar aderência ao processo terapêutico.", c: "var(--blue)" },
          ].map((ins, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg3)", border: `1px solid var(--border)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <span style={{ width: 12, height: 12, color: ins.c }}>{ins.i}</span>
                <span style={{ fontSize: 10, color: ins.c, fontWeight: 600, letterSpacing: ".04em" }}>{ins.l}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ivoryDD)", lineHeight: 1.6 }}>{ins.t}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Agenda ─────────────────────────────────────────────────────── */
function AgendaView() {
  const [day, setDay] = useState(2);
  const days = [["Dom", 1], ["Seg", 2], ["Ter", 3], ["Qua", 4], ["Qui", 5], ["Sex", 6], ["Sáb", 7]];
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "15:30", "16:00", "17:00"];
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: ".12em", textTransform: "uppercase" }}>Março 2026</div>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Agenda Semanal</h1>
        </div>
        <MagBtn><span style={{ width: 14, height: 14 }}><Icon.Calendar /></span> Nova Consulta</MagBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 20 }}>
        {days.map(([d, n], i) => (
          <button key={d} onClick={() => setDay(i)} style={{
            padding: "12px 6px", borderRadius: 12, textAlign: "center",
            background: day === i ? "var(--g1)" : "var(--card)",
            border: `1px solid ${day === i ? "rgba(82,183,136,.45)" : "var(--border)"}`,
            transition: "all .25s",
          }}>
            <div style={{ fontSize: 10, color: day === i ? "var(--mint)" : "var(--ivoryDD)", textTransform: "uppercase", letterSpacing: ".06em" }}>{d}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 200, color: day === i ? "var(--mint)" : "var(--ivory)", marginTop: 4 }}>{n}</div>
            {[2, 3, 4].includes(i) && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", margin: "4px auto 0" }} />}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hours.map((h, i) => {
          const s = AGENDA_TODAY.find(x => x.time === h);
          return (
            <div key={h} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12,
              background: s?.p ? "var(--card)" : "var(--bg2)",
              border: `1px solid ${s?.status === "inprogress" ? "rgba(82,183,136,.35)" : "var(--border)55"}`,
              animation: `fadeUp .4s var(--ease-out) ${i * .03}s both`,
            }}>
              <div style={{ width: 44, fontSize: 11, color: "var(--gold)", fontFamily: "monospace", flexShrink: 0 }}>{h}</div>
              {s?.p ? (
                <>
                  <Av ini={s.p.avatar} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--ivory)" }}>{s.p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ivoryDD)" }}>{s.type === "online" ? "🎥 Online" : "🏥 Presencial"} · 50min</div>
                  </div>
                  <Tag t={s.status === "inprogress" ? "● Em andamento" : "✓ Confirmado"} c={s.status === "inprogress" ? "var(--gold)" : "var(--mint)"} />
                  {s.status === "inprogress" && <MagBtn size="sm"><span style={{ width: 12, height: 12 }}><Icon.Video /></span> Entrar</MagBtn>}
                </>
              ) : s?.blocked ? <span style={{ fontSize: 12, color: "var(--ivoryDD)" }}>— Bloqueado</span>
                : <span style={{ fontSize: 12, color: "var(--border2)" }}>disponível</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Patients ───────────────────────────────────────────────────── */
function PatientsView({ onSelect }) {
  const [q, setQ] = useState(""); const [f, setF] = useState("all");
  const list = PATIENTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) && (f === "all" || p.status === f));
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: ".12em", textTransform: "uppercase" }}>Gestão</div>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Pacientes & Leads</h1>
        </div>
        <MagBtn><span style={{ width: 14, height: 14 }}><Icon.Users /></span> Novo Paciente</MagBtn>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input style={{ flex: 1 }} placeholder="Buscar paciente..." value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "new", "lead"].map(x => (
            <button key={x} onClick={() => setF(x)} style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 12,
              background: f === x ? "var(--g1)" : "var(--card2)", color: f === x ? "var(--mint)" : "var(--ivoryDD)",
              border: `1px solid ${f === x ? "rgba(82,183,136,.35)" : "var(--border2)"}`,
            }}>{{ all: "Todos", active: "Ativos", new: "Novos", lead: "Leads" }[x]}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {list.map((p, i) => (
          <Card key={p.id} hover style={{ padding: "18px 20px", cursor: "pointer", animation: `fadeUp .4s var(--ease-out) ${i * .04}s both` }} onClick={() => onSelect(p)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Av ini={p.avatar} size={44} color={p.status === "lead" ? "var(--gold)" : p.status === "new" ? "var(--blue)" : "var(--mint)"} />
                <div>
                  <div style={{ fontFamily: "var(--ff)", fontSize: 17, fontWeight: 300, color: "var(--ivory)" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 2 }}>
                    {p.age > 0 ? `${p.age} anos · ` : ""}{p.sessions > 0 ? `${p.sessions} sessões` : "Sem sessões"}
                  </div>
                </div>
              </div>
              <Tag t={p.status === "active" ? "Ativo" : p.status === "new" ? "Novo" : "Lead"} c={p.status === "lead" ? "var(--gold)" : p.status === "new" ? "var(--blue)" : "var(--mint)"} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {p.tags.map(t => <Tag key={t} t={t} c="var(--blue)" />)}
            </div>
            {p.mood !== null && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ivoryDD)", marginBottom: 4 }}>
                  <span>Estado emocional estimado</span><span>{p.mood}%</span>
                </div>
                <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
                  <div style={{ width: p.mood + "%", height: "100%", borderRadius: 2, background: p.mood > 65 ? "var(--mint)" : p.mood > 40 ? "var(--gold)" : "var(--red)", transition: "width .8s var(--ease-out)" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ivoryDD)" }}>
                <span style={{ width: 12, height: 12 }}><Icon.Calendar /></span>{p.next}
              </div>
              {p.tele ? <Tag t={p.tele} c="#54C5F8" /> : <Tag t="Sem Telegram" c="var(--ivoryDD)" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Patient Detail ─────────────────────────────────────────────── */
function PatientDetail({ p, onBack }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--ivoryDD)", fontSize: 13, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 14, height: 14, display: "inline-block", transform: "scaleX(-1)" }}><Icon.ArrowRight /></span> Voltar
      </button>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 26 }}>
        <Av ini={p.avatar} size={60} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 30, fontWeight: 200, color: "var(--ivory)" }}>{p.name}</h1>
          <p style={{ fontSize: 13, color: "var(--ivoryDD)", marginTop: 4 }}>
            {p.age > 0 ? `${p.age} anos · ` : ""}Desde {p.since} · {p.sessions} sessões
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {p.tags.map(t => <Tag key={t} t={t} c="var(--blue)" />)}
            {p.tele && <Tag t={`Telegram: ${p.tele}`} c="#54C5F8" />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <MagBtn variant="ghost" size="sm"><span style={{ width: 12, height: 12 }}><Icon.Telegram /></span> Telegram</MagBtn>
          <MagBtn size="sm"><span style={{ width: 12, height: 12 }}><Icon.Video /></span> Iniciar Sessão</MagBtn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 20 }}>
        {[["overview", "Visão Geral"], ["prontuario", "Prontuário"], ["ia", "IA / Insights"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", fontSize: 13, background: "none", color: tab === v ? "var(--mint)" : "var(--ivoryDD)", borderBottom: `2px solid ${tab === v ? "var(--mint)" : "transparent"}` }}>{l}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[{ l: "Sessões", v: p.sessions, i: <Icon.Calendar />, c: "var(--mint)" }, { l: "Investido", v: fmtBRL(p.sessions * 200), i: <Icon.Bolt />, c: "var(--gold)" }, { l: "Próxima", v: p.next, i: <Icon.Calendar />, c: "var(--blue)" }].map((k, i) => (
            <Card key={i} style={{ padding: "20px 22px" }}>
              <span style={{ width: 20, height: 20, color: k.c, display: "block", marginBottom: 10 }}>{k.i}</span>
              <div style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 200, color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 4 }}>{k.l}</div>
            </Card>
          ))}
        </div>
      )}
      {tab === "ia" && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 16, height: 16, color: "var(--blue)" }}><Icon.Sparkle /></span>
            <span style={{ fontSize: 14, color: "var(--ivory)" }}>Análise IA — {p.name}</span>
          </div>
          <div style={{ background: "rgba(74,143,168,.08)", borderRadius: 12, padding: 18, border: "1px solid rgba(74,143,168,.2)", fontSize: 13, color: "var(--ivoryD)", lineHeight: 1.75 }}>
            <strong style={{ color: "var(--ivory)" }}>Padrão identificado:</strong> Recorrência de temas ligados a {p.tags[0]?.toLowerCase()}. Nas últimas sessões observa-se avanço na capacidade de insight com menor resistência ao material inconsciente.<br /><br />
            <strong style={{ color: "var(--ivory)" }}>Próximos passos:</strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {["Aprofundar relações primárias e padrões de apego", "Monitorar evitação em contexto profissional", "Avaliar resposta a técnicas de regulação emocional"].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ width: 14, height: 14, color: "var(--mint)", flexShrink: 0, marginTop: 2 }}><Icon.Check /></span>{s}
                </div>
              ))}
            </div>
          </div>
          <MagBtn variant="ghost" size="sm" style={{ marginTop: 14 }}>✦ Gerar Relatório Completo</MagBtn>
        </Card>
      )}
    </div>
  );
}

/* ── AI View ────────────────────────────────────────────────────── */
function AIView() {
  const [model, setModel] = useState(AI_MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("resumo");

  const call = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult("");
    const sys = {
      resumo: "Assistente clínico especializado em psicanálise. Gere resumos profissionais, éticos e precisos em português.",
      insights: "Analista clínico. Identifique padrões terapêuticos e ofereça insights objetivos.",
      conversa: "Assistente de suporte ao terapeuta sobre técnicas e gestão clínica.",
    }[mode];
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey || "demo"}`, "Content-Type": "application/json", "HTTP-Referer": "https://psique.app", "X-Title": "Psique" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sys }, { role: "user", content: prompt }], max_tokens: 700 }),
      });
      const d = await r.json();
      setResult(d.choices?.[0]?.message?.content || "[Adicione sua API key do OpenRouter para respostas reais]");
    } catch {
      await new Promise(r => setTimeout(r, 1200));
      setResult(`✦ Resumo gerado (demo):\n\nSessão demonstrou avanço significativo na capacidade de insight. O material inconsciente emergiu com menor resistência, sugerindo fortalecimento da aliança terapêutica. Padrões de apego ansioso foram trabalhados diretamente.\n\n→ Próxima sessão: aprofundar relações objetais e explorar memórias formativas.`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--mint)", letterSpacing: ".12em", textTransform: "uppercase" }}>Powered by OpenRouter</div>
        <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Assistente IA Clínico</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Modelo</label>
                <select value={model} onChange={e => setModel(e.target.value)}>
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} [{m.tier}]</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>API Key OpenRouter</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-or-v1-..." />
              </div>
            </div>
          </Card>
          <div style={{ display: "flex", gap: 8 }}>
            {[["resumo", "📝 Resumo de Sessão", <Icon.Brain />], ["insights", "🔍 Insights", <Icon.Sparkle />], ["conversa", "💬 Assistente", <Icon.Message />]].map(([v, l, ic]) => (
              <button key={v} onClick={() => setMode(v)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: mode === v ? "var(--g1)" : "var(--card2)",
                border: `1px solid ${mode === v ? "rgba(82,183,136,.35)" : "var(--border2)"}`,
                color: mode === v ? "var(--mint)" : "var(--ivoryDD)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}><span style={{ width: 12, height: 12 }}>{ic}</span>{l}</button>
            ))}
          </div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6}
            placeholder={mode === "resumo" ? "Cole as notas brutas da sessão..." : mode === "insights" ? "Descreva o histórico ou padrões observados..." : "Faça uma pergunta clínica ou de gestão..."} />
          <MagBtn onClick={call} disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? <><Spin /> Processando...</> : <><span style={{ width: 14, height: 14 }}><Icon.Sparkle /></span> Gerar com IA</>}
          </MagBtn>
          {result && (
            <Card style={{ padding: 20, animation: "fadeUp .4s var(--ease-out)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--mint)", fontWeight: 600 }}>
                  <span style={{ width: 12, height: 12 }}><Icon.Sparkle /></span> {AI_MODELS.find(m => m.id === model)?.label}
                </div>
                <MagBtn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(result)}>Copiar</MagBtn>
              </div>
              <div style={{ fontSize: 13, color: "var(--ivoryD)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result}</div>
            </Card>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: "var(--ivory)", marginBottom: 12 }}>Modelos Disponíveis</div>
            {AI_MODELS.map((m, i) => (
              <div key={m.id} onClick={() => setModel(m.id)} style={{
                padding: "9px 12px", borderRadius: 9, marginBottom: 6, cursor: "pointer",
                background: model === m.id ? "var(--g1)" : "var(--bg3)",
                border: `1px solid ${model === m.id ? "rgba(82,183,136,.35)" : "var(--border)55"}`,
                animation: `fadeUp .4s var(--ease-out) ${i * .06}s both`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, color: model === m.id ? "var(--mint)" : "var(--ivory)" }}>{m.label}</div>
                  <Tag t={m.tier} c={m.tier === "top" ? "var(--gold)" : m.tier === "free" ? "var(--mint)" : "var(--blue)"} />
                </div>
                <div style={{ fontSize: 10, color: "var(--ivoryDD)", marginTop: 2 }}>ctx {m.ctx}</div>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: "var(--ivory)", marginBottom: 10 }}>Templates Rápidos</div>
            {["Gere resumo de sessão de 50min sobre ansiedade", "Identifique padrões nos últimos 6 atendimentos", "Sugira técnicas para luto complicado", "Redija evolução para prontuário"].map((t, i) => (
              <button key={i} onClick={() => setPrompt(t)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, marginBottom: 6, fontSize: 12, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--ivoryDD)", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(82,183,136,.3)"; e.currentTarget.style.color = "var(--ivoryD)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ivoryDD)"; }}>
                → {t}
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Telegram View ──────────────────────────────────────────────── */
function TelegramView() {
  const [tab, setTab] = useState("overview");
  const [chat, setChat] = useState([
    { from: "bot", text: "👋 Olá! Sou o assistente da Dra. Helena Vaz.\n\nPosso ajudá-la com:\n📅 Agendar sessões\n💰 Pagamentos\n📋 Histórico\n\nComo posso ajudar?" },
    { from: "user", text: "Quero agendar uma sessão" },
    { from: "bot", text: "Claro! Horários disponíveis:\n\n📅 Qua 05/03 · 16h\n📅 Sex 07/03 · 11h\n📅 Seg 10/03 · 15h\n\nQual prefere?" },
  ]);
  const [inp, setInp] = useState("");
  const chatRef = useRef(null);
  const send = async () => {
    if (!inp.trim()) return;
    const msg = inp; setInp("");
    setChat(c => [...c, { from: "user", text: msg }]);
    await new Promise(r => setTimeout(r, 800));
    setChat(c => [...c, { from: "bot", text: msg.toLowerCase().includes("sex") ? "✅ Agendado para **Sex 07/03 às 11h**!\n\nValor: R$ 200,00\n💳 Pagar: psique.app/pay/abc123\n\nLink de acesso enviado por email 1h antes." : "Entendi! Deixa eu verificar isso...\n\n/agendar · /sessoes · /pagar · /ajuda" }]);
    setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  };

  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "#54C5F8", letterSpacing: ".12em", textTransform: "uppercase" }}>Integração</div>
        <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, color: "#54C5F8" }}><Icon.Telegram /></span> Telegram Bot
        </h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {[{ l: "Msgs hoje", v: "47", c: "var(--blue)" }, { l: "Agendamentos", v: "8", c: "var(--mint)" }, { l: "Leads", v: "3", c: "var(--gold)" }, { l: "Receita", v: "R$1.600", c: "var(--goldd)" }].map((k, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 200, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 4 }}>{k.l}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 20 }}>
        {[["overview", "Visão Geral"], ["chat", "Chat Simulado"], ["automacoes", "Automações"], ["config", "Configuração"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", fontSize: 13, background: "none", color: tab === v ? "var(--mint)" : "var(--ivoryDD)", borderBottom: `2px solid ${tab === v ? "var(--mint)" : "transparent"}` }}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 14 }}>Status do Bot</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mint)", animation: "pulse 2s infinite", display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "var(--mint)", fontWeight: 500 }}>@PsiqueBotOficial · Online</span>
            </div>
            {[["Webhook", "✅ Configurado"], ["Modelo IA", "Claude 3.5 via OpenRouter"], ["Idioma", "Português BR"], ["Lembretes", "24h + 1h automáticos"], ["Pagamentos", "Stripe integrado"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)55", fontSize: 13 }}>
                <span style={{ color: "var(--ivoryDD)" }}>{k}</span><span style={{ color: "var(--ivory)" }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 14 }}>Comandos do Bot</div>
            {[["/start", "Boas-vindas + identifica usuário"], ["/agendar", "Mostra horários + pagamento Stripe"], ["/sessoes", "Lista próximas e passadas"], ["/cancelar", "Cancela com regras de política"], ["/pagar", "Link Stripe para sessão em aberto"], ["/falar", "Chat livre com IA (OpenRouter)"], ["/ajuda", "Menu completo de comandos"]].map(([c, d]) => (
              <div key={c} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)55" }}>
                <div style={{ fontSize: 12, color: "var(--mint)", fontFamily: "monospace" }}>{c}</div>
                <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 2 }}>{d}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "chat" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
          <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 20, height: 20, color: "#54C5F8" }}><Icon.Telegram /></span>
              <div>
                <div style={{ fontSize: 13, color: "var(--ivory)" }}>@PsiqueBotOficial</div>
                <div style={{ fontSize: 10, color: "var(--mint)" }}>● Online</div>
              </div>
            </div>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 280, maxHeight: 360 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ maxWidth: "76%", alignSelf: m.from === "user" ? "flex-end" : "flex-start", padding: "10px 14px", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.from === "user" ? "var(--g1)" : "var(--card2)", border: `1px solid ${m.from === "user" ? "rgba(82,183,136,.25)" : "var(--border)"}`, animation: "fadeUp .3s var(--ease-out)" }}>
                  <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <input value={inp} onChange={e => setInp(e.target.value)} placeholder="Simular mensagem do paciente..." onKeyDown={e => e.key === "Enter" && send()} />
              <MagBtn onClick={send} size="sm"><span style={{ width: 14, height: 14 }}><Icon.ArrowRight /></span></MagBtn>
            </div>
          </Card>
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: "var(--ivory)", marginBottom: 10 }}>Fluxo inteligente</div>
            {[["📥", "Recebe /start ou mensagem livre"], ["🤖", "IA identifica intenção via OpenRouter"], ["📅", "Oferece horários disponíveis"], ["💳", "Gera link Stripe para pagamento"], ["✅", "Confirma e cria sala de vídeo"], ["📧", "Envia email + lembrete Telegram"]].map(([ic, t], i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: i < 5 ? "1px solid var(--border)55" : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ic}</span>
                <span style={{ fontSize: 12, color: "var(--ivoryDD)", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "automacoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["⏰", "Lembrete 24h", "Mensagem automática 24h antes com link de acesso", true], ["🔔", "Lembrete 1h", "Notificação 1h antes da sessão começar", true], ["💰", "Cobrança pós-sessão", "Link Stripe automático após encerrar consulta", true], ["📊", "Pesquisa NPS", "Coleta NPS 2h após cada sessão via bot", true], ["🎯", "Nurture de Leads", "Sequência para leads sem agendamento em 7 dias", false], ["🔄", "Reengajamento", "Msg para pacientes sem sessão há 30+ dias", false]].map(([ic, t, d, on], i) => (
            <Card key={i} hover style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, animation: `fadeUp .4s var(--ease-out) ${i * .05}s both` }}>
              <span style={{ fontSize: 22 }}>{ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "var(--ivory)" }}>{t}</div>
                <div style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 2 }}>{d}</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? "var(--mint)" : "var(--border2)", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background .3s" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left .3s" }} />
              </div>
              <Tag t={on ? "Ativo" : "Inativo"} c={on ? "var(--mint)" : "var(--ivoryDD)"} />
            </Card>
          ))}
        </div>
      )}

      {tab === "config" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 16 }}>Configuração do Bot</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Token do Bot", "6825...:AAFx...", "password"], ["Username", "@PsiqueBotOficial", "text"], ["Webhook URL", "psique.app/api/telegram/webhook", "text"]].map(([l, ph, t]) => (
                <div key={l}>
                  <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</label>
                  <input type={t} placeholder={ph} defaultValue={ph} readOnly={l === "Webhook URL"} style={l === "Webhook URL" ? { opacity: .6 } : {}} />
                </div>
              ))}
              <MagBtn style={{ width: "100%", justifyContent: "center" }}>💾 Salvar e Registrar Webhook</MagBtn>
            </div>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 14 }}>Mensagem de Boas-vindas</div>
            <textarea rows={5} defaultValue={"👋 Olá! Sou o assistente da Dra. Helena Vaz.\n\n📅 /agendar — Marcar sessão\n💰 /pagar — Pagamentos\n📋 /sessoes — Histórico\n💬 /falar — Chat com IA"} />
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Modelo IA para respostas</label>
              <select>
                {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <MagBtn variant="ghost" size="sm" style={{ marginTop: 12 }}>💬 Testar Bot</MagBtn>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Financial ──────────────────────────────────────────────────── */
function FinancialView() {
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: ".12em", textTransform: "uppercase" }}>Relatórios</div>
        <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Financeiro</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {[["MRR", fmtBRL(9800), "+12.4%", "var(--gold)"], ["Mês Atual", fmtBRL(9800), "Março", "var(--mint)"], ["Ticket Médio", fmtBRL(200), "por sessão", "var(--blue)"], ["Inadimplência", "R$ 0", "0%", "var(--mint)"]].map(([l, v, d, c], i) => (
          <Card key={i} style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "var(--ivoryDD)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{l}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 200, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 4 }}>{d}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: "var(--ivory)", marginBottom: 4 }}>Evolução da Receita</div>
          <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 16 }}>Últimos 7 meses</div>
          <Line data={KPI.rev} color="var(--gold)" w={500} h={80} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {KPI.months.map(m => <span key={m} style={{ fontSize: 10, color: "var(--ivoryDD)" }}>{m}</span>)}
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--ivory)", marginBottom: 14 }}>Últimos Pagamentos</div>
          {PATIENTS.filter(p => p.status === "active").slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)55" }}>
              <Av ini={p.avatar} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--ivory)" }}>{p.name.split(" ")[0]}</div>
                <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>0{i + 1}/03/2026</div>
              </div>
              <Tag t="R$ 200" c="var(--gold)" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ── Settings ───────────────────────────────────────────────────── */
function SettingsView() {
  const [tab, setTab] = useState("integrations");
  return (
    <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
      <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)", marginBottom: 22 }}>Configurações</h1>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 20 }}>
        {[["integrations", "Integrações"], ["profile", "Perfil"], ["security", "Segurança"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", fontSize: 13, background: "none", color: tab === v ? "var(--mint)" : "var(--ivoryDD)", borderBottom: `2px solid ${tab === v ? "var(--mint)" : "transparent"}` }}>{l}</button>
        ))}
      </div>
      {tab === "integrations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { ic: <Icon.Sparkle />, n: "OpenRouter AI", d: "Claude, GPT-4o, Gemini e 200+ modelos", on: true, c: "var(--blue)" },
            { ic: <Icon.Telegram />, n: "Telegram Bot", d: "@PsiqueBotOficial — Agendamento automático", on: true, c: "#54C5F8" },
            { ic: <Icon.Bolt />, n: "Stripe", d: "Pagamentos online e cobranças", on: true, c: "var(--mint)" },
            { ic: <Icon.Message />, n: "Resend", d: "Emails transacionais e confirmações", on: true, c: "var(--gold)" },
            { ic: <Icon.Shield />, n: "Supabase", d: "Banco de dados, Auth, Storage", on: true, c: "var(--g2)" },
            { ic: <Icon.Video />, n: "Daily.co", d: "Videochamadas HD com gravação", on: false, c: "var(--ivoryDD)" },
          ].map((s, i) => (
            <Card key={i} hover style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, animation: `fadeUp .4s var(--ease-out) ${i * .05}s both` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.c + "18", border: `1px solid ${s.c}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 18, height: 18, color: s.c }}>{s.ic}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "var(--ivory)" }}>{s.n}</div>
                <div style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 2 }}>{s.d}</div>
              </div>
              <Tag t={s.on ? "Conectado" : "Desconectado"} c={s.on ? s.c : "var(--ivoryDD)"} />
              <MagBtn size="sm" variant={s.on ? "ghost" : "dark"}>{s.on ? "Reconfigurar" : "Conectar"}</MagBtn>
            </Card>
          ))}
        </div>
      )}
      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 16 }}>Dados Profissionais</div>
            {[["Nome", "Dra. Helena Vaz"], ["CRP", "06/98421"], ["Email", "helena@psique.app"]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "var(--ivoryDD)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</label>
                <input defaultValue={v} />
              </div>
            ))}
            <MagBtn style={{ marginTop: 4 }}>💾 Salvar</MagBtn>
          </Card>
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 14 }}>Link de Agendamento Público</div>
            <div style={{ background: "rgba(82,183,136,.08)", border: "1px solid rgba(82,183,136,.25)", borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "var(--mint)", fontFamily: "monospace", marginBottom: 14 }}>psique.app/agendar/dra-helena</div>
            <p style={{ fontSize: 13, color: "var(--ivoryDD)", lineHeight: 1.7, marginBottom: 16 }}>Compartilhe com pacientes e leads. Eles agendam, pagam e recebem link de videochamada automaticamente.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <MagBtn variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText("psique.app/agendar/dra-helena")}>Copiar Link</MagBtn>
              <MagBtn variant="gold" size="sm">Abrir Página</MagBtn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PATIENT PORTAL
══════════════════════════════════════════════════════════════ */
function PatientApp({ user }) {
  const [view, setView] = useState("home");
  const [chat, setChat] = useState([{ r: "bot", t: "👋 Olá! Sou o assistente da Dra. Helena. Como posso ajudar? Posso agendar sessões, ver histórico ou responder dúvidas." }]);
  const [inp, setInp] = useState("");
  const [aiTxt, setAiTxt] = useState(""); const [aiRes, setAiRes] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const chatRef = useRef(null);

  const PNAV = [
    { id: "home", i: <Icon.Leaf />, l: "Início" },
    { id: "agendar", i: <Icon.Calendar />, l: "Agendar" },
    { id: "sessoes", i: <Icon.Video />, l: "Sessões" },
    { id: "chat", i: <Icon.Message />, l: "Assistente" },
    { id: "apoio", i: <Icon.Heart />, l: "Apoio IA" },
  ];

  const sendChat = async () => {
    if (!inp.trim()) return;
    const msg = inp; setInp("");
    setChat(c => [...c, { r: "user", t: msg }]);
    await new Promise(r => setTimeout(r, 900));
    const reply = msg.toLowerCase().includes("agendar") ? "📅 Horários disponíveis:\n\n• Qua 05/03 · 16h\n• Sex 07/03 · 11h\n• Seg 10/03 · 15h\n\nQual prefere?" :
      msg.toLowerCase().includes("pagar") ? "💳 Link de pagamento: psique.app/pay/ana-204\n\nValor: R$ 200,00" :
      "Entendido! Posso ajudá-la com agendamentos, pagamentos ou histórico de sessões. O que precisa?";
    setChat(c => [...c, { r: "bot", t: reply }]);
    setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  };

  const callAI = async () => {
    if (!aiTxt.trim()) return;
    setAiLoad(true); setAiRes("");
    await new Promise(r => setTimeout(r, 1400));
    setAiRes(`Obrigada por compartilhar isso comigo. O que você descreve é válido e merece atenção cuidadosa.\n\nAlgumas reflexões que podem ajudar:\n\n• Nomear e reconhecer as emoções já é um passo importante no processo\n• Você está buscando apoio — isso demonstra coragem e autocuidado\n• Esse material seria valioso para explorar com a Dra. Helena na sua próxima sessão\n\n💙 Lembre-se: você não precisa carregar isso sozinha. Estou aqui para apoiar, mas a terapia é o espaço mais rico para esse trabalho.\n\n⚠️ Este assistente é complementar — não substitui o acompanhamento profissional.`);
    setAiLoad(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside style={{ width: 220, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, color: "var(--mint)" }}><Icon.Psi /></div>
          <div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 200, color: "var(--ivory)" }}>Psique</div>
            <div style={{ fontSize: 9, color: "var(--ivoryDD)", letterSpacing: ".1em", textTransform: "uppercase" }}>Portal do Paciente</div>
          </div>
        </div>
        <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
          <Av ini="AC" size={36} />
          <div>
            <div style={{ fontSize: 13, color: "var(--ivory)", fontFamily: "var(--ff)", fontWeight: 300 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>Paciente</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {PNAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, background: view === n.id ? "var(--g1)" : "transparent", color: view === n.id ? "var(--mint)" : "var(--ivoryDD)", border: view === n.id ? "1px solid rgba(82,183,136,.25)" : "1px solid transparent" }}>
              <span style={{ width: 16, height: 16 }}>{n.i}</span>{n.l}
            </button>
          ))}
        </nav>
        <div style={{ margin: "0 8px 14px", padding: "12px 14px", borderRadius: 12, background: "rgba(34,158,217,.07)", border: "1px solid rgba(34,158,217,.2)" }}>
          <div style={{ fontSize: 11, color: "#54C5F8", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 12 }}><Icon.Telegram /></span> @PsiqueBotOficial
          </div>
          <div style={{ fontSize: 10, color: "var(--ivoryDD)", marginBottom: 8 }}>Acesse pelo Telegram para lembretes automáticos</div>
          <MagBtn size="sm" variant="ghost" style={{ width: "100%", justifyContent: "center", fontSize: 11 }}>Conectar Telegram</MagBtn>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {view === "home" && (
          <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Olá, <em>{user.name.split(" ")[0]}</em> 🌿</h1>
              <p style={{ color: "var(--ivoryDD)", marginTop: 4 }}>Você tem uma sessão hoje às 14h</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
              {[{ l: "Próxima Sessão", v: "Hoje 14:00", i: <Icon.Calendar />, c: "var(--mint)" }, { l: "Total de Sessões", v: "47", i: <Icon.Video />, c: "var(--blue)" }, { l: "Terapeuta", v: "Dra. Helena", i: <Icon.Heart />, c: "var(--gold)" }].map((k, i) => (
                <Card key={i} hover style={{ padding: "20px 22px", animation: `fadeUp .5s var(--ease-out) ${i * .07}s both` }}>
                  <span style={{ width: 22, height: 22, color: k.c, display: "block", marginBottom: 10 }}>{k.i}</span>
                  <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 200, color: k.c }}>{k.v}</div>
                  <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 4 }}>{k.l}</div>
                </Card>
              ))}
            </div>
            <Card glow style={{ padding: 22 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", animation: "pulse 2s infinite", display: "inline-block" }} />
                    Sessão de hoje · 14:00 · Online · 50 minutos
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ivoryDD)" }}>Dra. Helena Vaz · CRP 06/98421</div>
                </div>
                <MagBtn size="sm"><span style={{ width: 14, height: 14 }}><Icon.Video /></span> Entrar na Sessão</MagBtn>
              </div>
            </Card>
          </div>
        )}

        {view === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 200, color: "var(--ivory)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 22, height: 22, color: "var(--mint)" }}><Icon.Message /></span> Assistente — Dra. Helena
              </h2>
              <p style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 2 }}>Powered by OpenRouter AI · 24/7</p>
            </div>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ maxWidth: "70%", alignSelf: m.r === "user" ? "flex-end" : "flex-start", padding: "12px 16px", borderRadius: m.r === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.r === "user" ? "var(--g1)" : "var(--card)", border: `1px solid ${m.r === "user" ? "rgba(82,183,136,.25)" : "var(--border)"}`, animation: "fadeUp .3s var(--ease-out)" }}>
                  <div style={{ fontSize: 13, color: m.r === "user" ? "var(--mint)" : "var(--text)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.t}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <input value={inp} onChange={e => setInp(e.target.value)} placeholder="Agendar, ver sessões, tirar dúvidas..." onKeyDown={e => e.key === "Enter" && sendChat()} />
              <MagBtn onClick={sendChat}>Enviar</MagBtn>
            </div>
          </div>
        )}

        {view === "apoio" && (
          <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "var(--mint)", letterSpacing: ".12em", textTransform: "uppercase" }}>Apoio Emocional IA</div>
              <h1 style={{ fontFamily: "var(--ff)", fontSize: 32, fontWeight: 200, color: "var(--ivory)" }}>Espaço de Reflexão</h1>
              <p style={{ fontSize: 13, color: "var(--ivoryDD)", marginTop: 6, lineHeight: 1.7 }}>Um espaço seguro entre sessões. <strong style={{ color: "var(--ivory)" }}>Complementar — não substitui a terapia.</strong></p>
            </div>
            <Card style={{ padding: 24, marginBottom: 16 }}>
              <textarea rows={5} value={aiTxt} onChange={e => setAiTxt(e.target.value)} placeholder="Como você está se sentindo? O que está pesando? Escreva livremente..." />
              <MagBtn onClick={callAI} disabled={aiLoad} style={{ marginTop: 14, justifyContent: "center" }}>
                {aiLoad ? <><Spin /> Processando...</> : <><span style={{ width: 14, height: 14 }}><Icon.Heart /></span> Receber Reflexão</>}
              </MagBtn>
            </Card>
            {aiRes && (
              <Card style={{ padding: 24, animation: "fadeUp .4s var(--ease-out)", background: "linear-gradient(135deg,var(--card),var(--bg2))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 11, color: "var(--mint)", fontWeight: 600 }}>
                  <span style={{ width: 12, height: 12 }}><Icon.Sparkle /></span> REFLEXÃO ASSISTIDA — OpenRouter IA
                </div>
                <div style={{ fontSize: 13, color: "var(--ivoryD)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiRes}</div>
              </Card>
            )}
          </div>
        )}

        {view === "agendar" && (
          <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
            <h1 style={{ fontFamily: "var(--ff)", fontSize: 32, fontWeight: 200, color: "var(--ivory)", marginBottom: 24 }}>Agendar Sessão</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
              <Card style={{ padding: 24 }}>
                <div style={{ fontSize: 13, color: "var(--ivoryDD)", marginBottom: 16 }}>Horários disponíveis — Março 2026</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {["Qua 05/03 16h", "Sex 07/03 11h", "Seg 10/03 15h", "Ter 11/03 09h", "Qua 12/03 16h", "Sex 14/03 11h"].map((s, i) => (
                    <button key={i} style={{ padding: "14px 10px", borderRadius: 12, textAlign: "center", fontSize: 13, background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--ivory)", cursor: "pointer", transition: "all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(82,183,136,.4)"; e.currentTarget.style.background = "var(--g1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg3)"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </Card>
              <Card style={{ padding: 22 }}>
                <div style={{ fontSize: 14, color: "var(--ivory)", marginBottom: 10 }}>Dra. Helena Vaz</div>
                <div style={{ fontSize: 12, color: "var(--ivoryDD)", marginBottom: 8 }}>50 minutos · Online</div>
                <div style={{ fontFamily: "var(--ff)", fontSize: 28, fontWeight: 200, color: "var(--gold)", marginBottom: 16 }}>R$ 200,00</div>
                <p style={{ fontSize: 12, color: "var(--ivoryDD)", lineHeight: 1.65, marginBottom: 16 }}>Pagamento via cartão ou PIX. Link de acesso enviado por email e Telegram 1h antes.</p>
                <MagBtn style={{ width: "100%", justifyContent: "center" }}><span style={{ width: 14, height: 14 }}><Icon.Bolt /></span> Pagar e Confirmar</MagBtn>
              </Card>
            </div>
          </div>
        )}

        {view === "sessoes" && (
          <div style={{ padding: "32px 36px", animation: "fadeUp .4s var(--ease-out)" }}>
            <h1 style={{ fontFamily: "var(--ff)", fontSize: 32, fontWeight: 200, color: "var(--ivory)", marginBottom: 24 }}>Minhas Sessões</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Hoje 14:00", "upcoming", "online", 48], ["Sex 28/02 15:30", "done", "presencial", 47], ["Sex 21/02 15:30", "done", "online", 46], ["Sex 14/02 15:30", "done", "online", 45]].map(([d, st, tp, n], i) => (
                <Card key={i} hover style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, animation: `fadeUp .4s var(--ease-out) ${i * .06}s both` }}>
                  <div style={{ width: 44, textAlign: "center", borderRight: "1px solid var(--border)", paddingRight: 14 }}>
                    <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 200, color: "var(--gold)" }}>#{n}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "var(--ivory)" }}>{d}</div>
                    <div style={{ fontSize: 12, color: "var(--ivoryDD)", marginTop: 2 }}>{tp === "online" ? "🎥 Online" : "🏥 Presencial"} · 50 min</div>
                  </div>
                  <Tag t={st === "upcoming" ? "Próxima" : "Realizada"} c={st === "upcoming" ? "var(--gold)" : "var(--mint)"} />
                  {st === "upcoming" && <MagBtn size="sm"><span style={{ width: 12, height: 12 }}><Icon.Video /></span> Entrar</MagBtn>}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("landing"); // landing | auth | onboarding | therapist | patient
  const [user, setUser] = useState(null);

  const handleLogin = userData => {
    setUser(userData);
    if (userData.role === "therapist" && userData.isNew) setPage("onboarding");
    else if (userData.role === "therapist") setPage("therapist");
    else setPage("patient");
  };

  return (
    <>
      <style>{FONTS + CSS}</style>
      {page === "landing" && <LandingPage onCTA={() => setPage("auth")} />}
      {page === "auth" && <AuthScreen onLogin={handleLogin} onBack={() => setPage("landing")} />}
      {page === "onboarding" && user && <OnboardingWizard user={user} onDone={() => setPage("therapist")} />}
      {page === "therapist" && user && <TherapistApp user={user} />}
      {page === "patient" && user && <PatientApp user={user} />}
    </>
  );
}
