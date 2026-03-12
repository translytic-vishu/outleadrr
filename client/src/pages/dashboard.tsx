import logoSrc from "@assets/outleadr_1773257073565.png";
import { useState, useEffect, useRef } from "react";

/* ─── Tokens ─────────────────────────────────────────────────────── */
const F   = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BLK = "#0a0a0a";
const WHT = "#ffffff";
const G1  = "#0f172a";
const G2  = "#64748b";
const G3  = "#94a3b8";
const G4  = "#f8fafc";
const G5  = "#f1f5f9";
const BDR = "rgba(15,23,42,0.08)";
const IND = "#6366f1";
const GOLD = "#f59e0b";

/* ─── Global CSS ─────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  html, body, #root { background: ${WHT}; color: ${G1}; font-family: ${F}; -webkit-font-smoothing: antialiased; }
  img { display: block; max-width: 100%; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes floatA   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
  @keyframes floatB   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
  @keyframes floatC   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
  @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes pdot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
  @keyframes gradshift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes rowIn    { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .h-up { animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) both; }
  .h-in { animation: fadeIn 0.7s ease both; }
  .fa   { animation: floatA 5s ease-in-out infinite; }
  .fb   { animation: floatB 6s 0.8s ease-in-out infinite; }
  .fc   { animation: floatC 4.5s 1.6s ease-in-out infinite; }
  .pdot { animation: pdot 2.4s ease-in-out infinite; }

  .anim { opacity:0; transform:translateY(36px); transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1); }
  .anim.visible { opacity:1; transform:translateY(0); }
  .d1{transition-delay:0.08s} .d2{transition-delay:0.16s} .d3{transition-delay:0.24s} .d4{transition-delay:0.32s}

  .grad-text {
    background: linear-gradient(135deg, ${IND} 0%, #8b5cf6 45%, #a855f7 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: gradshift 5s ease infinite;
  }

  .btn-primary {
    display:inline-flex;align-items:center;gap:10px;
    padding:16px 40px;border-radius:12px;
    background:${BLK};color:${WHT};border:none;
    font-family:${F};font-weight:700;font-size:15px;letter-spacing:-0.01em;
    cursor:pointer;transition:all 0.22s cubic-bezier(0.16,1,0.3,1);text-decoration:none;
  }
  .btn-primary:hover { background:#1e293b; transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,0.22); }
  .btn-primary:active { transform:translateY(0); }

  .btn-ghost {
    display:inline-flex;align-items:center;gap:8px;
    padding:15px 28px;border-radius:12px;
    background:transparent;color:${G2};border:1.5px solid ${BDR};
    font-family:${F};font-weight:500;font-size:15px;
    cursor:pointer;transition:all 0.18s;text-decoration:none;
  }
  .btn-ghost:hover { background:${G5};color:${G1};border-color:rgba(15,23,42,0.15); }

  .btn-nav {
    display:inline-flex;align-items:center;
    padding:9px 20px;border-radius:9px;
    background:${BLK};color:${WHT};border:none;
    font-family:${F};font-weight:600;font-size:13px;letter-spacing:-0.01em;
    cursor:pointer;transition:all 0.15s;text-decoration:none;
  }
  .btn-nav:hover { background:#1e293b; }

  .nav-link { font-size:13px;font-weight:500;color:${G2};text-decoration:none;padding:7px 14px;border-radius:8px;transition:color 0.15s,background 0.15s;font-family:${F}; }
  .nav-link:hover { color:${G1};background:${G5}; }

  .card { transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),box-shadow 0.3s ease; }
  .card:hover { transform:translateY(-4px); box-shadow:0 20px 60px rgba(0,0,0,0.09) !important; }

  .faq-item { border-bottom:1px solid ${BDR}; }
  .faq-btn  { width:100%;display:flex;justify-content:space-between;align-items:center;padding:24px 0;background:none;border:none;cursor:pointer;text-align:left;gap:16px; }
  .faq-body { overflow:hidden;transition:max-height 0.38s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease; }
  .faq-body.open   { max-height:300px;opacity:1; }
  .faq-body.closed { max-height:0;opacity:0; }

  .mq-track { display:flex;gap:0;animation:marquee 40s linear infinite;width:max-content; }
  .mq-wrap  { overflow:hidden;mask:linear-gradient(to right,transparent,black 6%,black 94%,transparent); }

  .comp-row { transition:background 0.15s; }
  .comp-row:hover { background:rgba(255,255,255,0.04) !important; }

  .hero-glow {
    position:absolute;top:-15%;left:50%;transform:translateX(-50%);
    width:100vw;max-width:1100px;height:700px;
    background:radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 40%, transparent 70%);
    pointer-events:none;z-index:0;
  }

  @media(max-width:1024px){
    .hide-md { display:none !important; }
    .two-col { grid-template-columns:1fr !important; }
    .three-col { grid-template-columns:1fr 1fr !important; }
    .steps-row { grid-template-columns:1fr !important; }
    .nav-links { display:none !important; }
  }
  @media(max-width:680px){
    .three-col { grid-template-columns:1fr !important; }
    .stats-row { grid-template-columns:repeat(2,1fr) !important; }
    .hero-cards { display:none !important; }
    .comp-cols { display:none !important; }
  }
`;

/* ─── Scroll-reveal ──────────────────────────────────────────────── */
function useAnim() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
function A({ children, d = 0, style, className = "" }: { children: React.ReactNode; d?: number; style?: React.CSSProperties; className?: string }) {
  const ref = useAnim();
  return <div ref={ref} className={`anim ${d ? `d${d}` : ""} ${className}`} style={style}>{children}</div>;
}

/* ─── Count-up ───────────────────────────────────────────────────── */
function useCountUp(end: number, suffix = "", dur = 1600) {
  const [val, setVal] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      let s = 0; const step = end / (dur / 16);
      const t = setInterval(() => { s += step; if (s >= end) { setVal(`${end}${suffix}`); clearInterval(t); } else setVal(`${Math.floor(s)}${suffix}`); }, 16);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, suffix, dur]);
  return { val, ref };
}

/* ─── Wave canvas ────────────────────────────────────────────────── */
function WaveCanvas({ dark = false }: { dark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number; let t = 0;
    const waves = Array.from({ length: 16 }, (_, i) => ({
      yFrac: 0.05 + (i / 16) * 0.9,
      amp: 10 + (i % 4) * 8 + Math.random() * 12,
      freq: 0.002 + Math.random() * 0.003,
      speed: 0.15 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      opacity: dark ? (0.06 + Math.random() * 0.1) : (0.045 + Math.random() * 0.065),
    }));
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    const draw = () => {
      const W = canvas.offsetWidth; const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = dark ? `rgba(255,255,255,${w.opacity})` : `rgba(15,23,42,${w.opacity})`;
        ctx.lineWidth = 0.85;
        for (let x = 0; x <= W; x += 3) {
          const y = H * w.yFrac
            + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp
            + Math.sin(x * w.freq * 2.3 + t * w.speed * 1.6 + w.phase2) * (w.amp * 0.35)
            + Math.sin(x * w.freq * 0.55 + t * w.speed * 0.6 + w.phase + 1.5) * (w.amp * 0.22);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      t += 0.006;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [dark]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: scrolled ? `1px solid ${BDR}` : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src={logoSrc} alt="Outleadrr" style={{ height: 30, width: "auto" }} />
        </a>
        <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([l, h]) => (
            <a key={l} href={h} className="nav-link">{l}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/login" className="nav-link">Log in</a>
          <a href="/signup" className="btn-nav">Get started free →</a>
        </div>
      </div>
    </header>
  );
}

/* ─── App mockup (hero) ──────────────────────────────────────────── */
function MockupContent() {
  const rows = [
    { n: "01", co: "RiverCity Plumbing Co.", name: "James Holloway · CEO", score: 87, sc: "#22c55e", sb: "rgba(34,197,94,0.12)", label: "Strong" },
    { n: "02", co: "Houston Pipe Masters", name: "Sandra Lee · Owner", score: 74, sc: "#f59e0b", sb: "rgba(245,158,11,0.12)", label: "Good" },
    { n: "03", co: "Lone Star Plumbing LLC", name: "Carlos Reyes · Founder", score: 91, sc: "#22c55e", sb: "rgba(34,197,94,0.12)", label: "Strong" },
    { n: "04", co: "Bayou City Drain Pros", name: "Michelle Park · GM", score: 69, sc: "#f59e0b", sb: "rgba(245,158,11,0.12)", label: "Good" },
    { n: "05", co: "Premier Flow Systems", name: "David Chen · Founder", score: 92, sc: "#22c55e", sb: "rgba(34,197,94,0.12)", label: "Strong" },
    { n: "06", co: "Gulf Coast Plumbing", name: "Ana Reyes · Owner", score: 78, sc: "#f59e0b", sb: "rgba(245,158,11,0.12)", label: "Good" },
  ];
  return (
    <div style={{ background: "#0d0f14", userSelect: "none", pointerEvents: "none" }}>
      <div style={{ background: "#18181b", padding: "12px 22px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{ flex: 1, height: 26, background: "#0d0f14", borderRadius: 8, margin: "0 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>outleadrr.app</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Score", "Filter", "Export CSV"].map(b => (
            <div key={b} style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,255,255,0.05)", fontSize: 11, color: "rgba(255,255,255,0.28)", border: "1px solid rgba(255,255,255,0.06)" }}>{b}</div>
          ))}
          <div style={{ padding: "5px 14px", borderRadius: 7, background: WHT, fontSize: 11, color: BLK, fontWeight: 700 }}>Send all via Gmail</div>
        </div>
      </div>
      <div style={{ padding: "10px 26px", background: "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 28 }}>
        {[{ v: "10", l: "prospects" }, { v: "81", l: "avg score" }, { v: "6", l: "strong leads" }, { v: "8", l: "with phone" }, { v: "10", l: "AI emails" }].map(s => (
          <div key={s.l}><span style={{ fontSize: 13, fontWeight: 700, color: WHT, marginRight: 4 }}>{s.v}</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{s.l}</span></div>
        ))}
      </div>
      <div style={{ padding: "9px 26px", display: "grid", gridTemplateColumns: "28px 1fr 60px 58px", gap: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["#", "Company", "Score", "Status"].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.16)" }}>{h}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.n} style={{ padding: "12px 26px", display: "grid", gridTemplateColumns: "28px 1fr 60px 58px", gap: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.025)", alignItems: "center", opacity: i >= 5 ? 0.15 : i >= 4 ? 0.4 : 1 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>{r.n}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: WHT }}>{r.co}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{r.name}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.sb, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: r.sc }}>{r.score}</span>
          </div>
          <div style={{ padding: "4px 10px", borderRadius: 7, background: r.sb, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: r.sc }}>{r.label}</span>
          </div>
        </div>
      ))}
      <div style={{ height: 48 }} />
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden", paddingTop: 110, paddingBottom: 0, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="hero-glow" />
      <WaveCanvas />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 900, margin: "0 auto", padding: "0 48px", flex: "none" }}>
        <div className="h-in" style={{ animationDelay: "0.05s", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 99, background: WHT, border: `1px solid ${BDR}`, fontSize: 12, fontWeight: 500, color: G2, marginBottom: 40, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <span className="pdot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
          AI-Powered B2B Lead Generation
        </div>

        <h1 className="h-up hero-title" style={{ animationDelay: "0.1s", fontSize: "clamp(54px,7.5vw,96px)", fontWeight: 900, color: G1, letterSpacing: "-0.058em", lineHeight: 0.93, marginBottom: 36 }}>
          Stop prospecting.<br />
          <span className="grad-text">Start closing.</span>
        </h1>

        <p className="h-up" style={{ animationDelay: "0.2s", fontSize: 18, color: G2, lineHeight: 1.72, maxWidth: 500, margin: "0 auto 48px" }}>
          Type a business type and city. Get 10 qualified leads with personalised cold emails — ready to send from your own Gmail in seconds.
        </p>

        <div className="h-up" style={{ animationDelay: "0.28s", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/signup" className="btn-primary">Start for free →</a>
          <a href="/login" className="btn-ghost">Log in</a>
        </div>

        <div className="h-up" style={{ animationDelay: "0.36s", display: "flex", gap: 52, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
          {[{ n: "2,000+", l: "businesses using it" }, { n: "30 sec", l: "avg to 10 leads" }, { n: "100%", l: "live Google Maps data" }].map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: G1, letterSpacing: "-0.05em" }}>{s.n}</div>
              <div style={{ fontSize: 12, color: G3, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Perspective mockup */}
      <div className="h-up" style={{ animationDelay: "0.44s", position: "relative", zIndex: 1, marginTop: 80, flex: 1, minHeight: 420 }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "58%", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.9) 55%, #ffffff 100%)", zIndex: 10, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4%", background: "linear-gradient(to right,#fff,transparent)", zIndex: 9, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "4%", background: "linear-gradient(to left,#fff,transparent)", zIndex: 9, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", transform: "perspective(1800px) rotateX(8deg) scale(0.97)", transformOrigin: "50% 0%" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 32px 80px rgba(0,0,0,0.22), 0 80px 140px rgba(0,0,0,0.12)" }}>
            <MockupContent />
          </div>
        </div>

        {/* Floating badges */}
        <div className="hero-cards fa" style={{ position: "absolute", top: "4%", left: "calc(50% - 600px)", background: WHT, borderRadius: 16, padding: "14px 20px", boxShadow: "0 8px 40px rgba(0,0,0,0.14)", border: `1px solid ${BDR}`, zIndex: 20, pointerEvents: "none" }}>
          <div style={{ fontSize: 10, color: G3, marginBottom: 4 }}>Lead score</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e", letterSpacing: "-0.06em", lineHeight: 1 }}>92</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginTop: 3 }}>Strong lead</div>
        </div>

        <div className="hero-cards fb" style={{ position: "absolute", top: "1%", right: "calc(50% - 600px)", background: WHT, borderRadius: 18, padding: "16px 20px", boxShadow: "0 8px 44px rgba(0,0,0,0.13)", border: `1px solid ${BDR}`, width: 230, zIndex: 20, pointerEvents: "none" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: G3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>AI-Written Email</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: G1, marginBottom: 5 }}>Hi James, great work at RiverCity...</div>
          <div style={{ fontSize: 11, color: G2, lineHeight: 1.55, marginBottom: 12 }}>I noticed RiverCity has been Houston's go-to plumber for years. Are you open to a quick call?</div>
          <div style={{ background: BLK, borderRadius: 8, padding: "7px 12px", textAlign: "center" }}>
            <span style={{ fontSize: 11, color: WHT, fontWeight: 600 }}>Sent via Gmail</span>
          </div>
        </div>

        <div className="hero-cards fc" style={{ position: "absolute", top: "-3%", left: "50%", transform: "translateX(-50%)", background: BLK, borderRadius: 99, padding: "10px 22px", boxShadow: "0 6px 32px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", gap: 9, zIndex: 20, pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span className="pdot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: WHT }}>10 plumbers found in Houston, TX</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee ────────────────────────────────────────────────────── */
function Marquee() {
  const items = ["Real Google Maps data", "AI-written cold emails", "One-click Gmail sending", "Lead scoring 0–100", "Export to CSV", "Any niche, any city", "10 leads in 30 seconds", "No fake contacts", "Verified businesses", "No credit card required"];
  return (
    <div style={{ borderTop: `1px solid ${BDR}`, borderBottom: `1px solid ${BDR}`, padding: "16px 0", background: G4 }}>
      <div className="mq-wrap">
        <div className="mq-track">
          {[...items, ...items, ...items, ...items].map((t, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: G2, whiteSpace: "nowrap", padding: "0 22px" }}>{t}</span>
              <span style={{ color: "rgba(15,23,42,0.12)", fontSize: 9 }}>&#9679;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Features bento ─────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" style={{ padding: "130px 48px", maxWidth: 1400, margin: "0 auto" }}>
      <A style={{ textAlign: "center", marginBottom: 88 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G3, marginBottom: 16 }}>Features</p>
        <h2 style={{ fontSize: "clamp(32px,4vw,58px)", fontWeight: 900, letterSpacing: "-0.048em", lineHeight: 1.0, color: G1, maxWidth: 540, margin: "0 auto" }}>
          Everything you need to land new business.
        </h2>
      </A>

      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 370px", gap: 16, marginBottom: 16 }}>
        <A className="card" style={{ background: "#0d0f14", borderRadius: 24, padding: "40px", overflow: "hidden", position: "relative", minHeight: 500, display: "flex", flexDirection: "column", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Live data</p>
          <h3 style={{ fontSize: "clamp(20px,2.2vw,28px)", fontWeight: 800, color: WHT, letterSpacing: "-0.03em", lineHeight: 1.15, maxWidth: 300, marginBottom: 32 }}>
            Real businesses pulled live from Google Maps.
          </h3>
          <div style={{ flex: 1, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
            {[
              { co: "RiverCity Plumbing", score: 87, c: "#22c55e" },
              { co: "Houston Pipe Masters", score: 74, c: "#f59e0b" },
              { co: "Lone Star Plumbing", score: 91, c: "#22c55e" },
              { co: "Bayou City Drain", score: 69, c: "#f59e0b" },
            ].map((r, i) => (
              <div key={r.co} style={{ padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: i >= 3 ? 0.25 : 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: WHT }}>{r.co}</span>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${r.c}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: r.c }}>{r.score}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="fa" style={{ position: "absolute", bottom: 32, right: 28, background: WHT, borderRadius: 14, padding: "12px 16px", boxShadow: "0 4px 28px rgba(0,0,0,0.4)", pointerEvents: "none" }}>
            <div style={{ fontSize: 10, color: G2, marginBottom: 2 }}>Found right now</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: BLK, lineHeight: 1 }}>10 <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>live</span></div>
          </div>
        </A>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <A d={1} className="card" style={{ background: G4, borderRadius: 24, padding: "30px", flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: G3, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Outreach</p>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: G1, letterSpacing: "-0.03em", marginBottom: 18 }}>Personalised cold emails, written instantly.</h3>
            <div style={{ background: WHT, borderRadius: 12, border: `1px solid ${BDR}`, padding: "14px 16px", fontSize: 11, color: G2, lineHeight: 1.7, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 700, color: G1, marginBottom: 6 }}>Subject: Quick win for RiverCity Plumbing</div>
              <div style={{ height: 1, background: BDR, marginBottom: 10 }} />
              <b style={{ color: G1 }}>Hi James,</b><br />
              I noticed RiverCity has been Houston's go-to plumber for years — impressive reputation.<br /><br />
              I help plumbing businesses land more commercial contracts. Open to a 10-min call this week?
            </div>
          </A>
          <A d={2} className="card" style={{ background: BLK, borderRadius: 24, padding: "30px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Gmail integration</p>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: WHT, letterSpacing: "-0.03em", marginBottom: 18 }}>Sent from your inbox — not ours.</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#ea4335,#fbbc04,#34a853,#4285f4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: WHT }}>G</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: WHT }}>alex@yourcompany.com</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Gmail connected · 10 emails sent</div>
              </div>
              <div style={{ marginLeft: "auto", width: 9, height: 9, borderRadius: "50%", background: "#22c55e" }} />
            </div>
          </A>
        </div>
      </div>

      {/* Row 2 */}
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Lead Scoring", title: "Know exactly who to contact first.", desc: "Every prospect gets a 0–100 quality score based on industry fit, online presence, ratings, and reachability.", bg: G4 },
          { label: "CSV Export", title: "Import into any CRM instantly.", desc: "Download your complete lead list — ready for HubSpot, Airtable, Notion, or Google Sheets in one click.", bg: "#f0fdf4" },
          { label: "Speed", title: "10 qualified leads in 30 seconds.", desc: "From typing your niche to having personalised emails ready to send — the whole process takes under a minute.", bg: G4 },
        ].map((c, i) => (
          <A key={c.label} d={i + 1} className="card" style={{ background: c.bg, borderRadius: 24, padding: "32px", border: `1px solid ${BDR}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: G3, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{c.label}</p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: G1, letterSpacing: "-0.03em", lineHeight: 1.25, marginBottom: 12 }}>{c.title}</h3>
            <p style={{ fontSize: 13, color: G2, lineHeight: 1.82 }}>{c.desc}</p>
          </A>
        ))}
      </div>
    </section>
  );
}

/* ─── Comparison table (dark, InterviewCoder-style) ──────────────── */
function Comparison() {
  const features = [
    { name: "Live Google Maps data", ol: true, ap: false, hu: false, ins: false },
    { name: "AI-written personalised emails", ol: true, ap: false, hu: false, ins: true },
    { name: "Sends from your own Gmail", ol: true, ap: false, hu: false, ins: false },
    { name: "Lead quality scoring (0–100)", ol: true, ap: true, hu: false, ins: false },
    { name: "Real owner contact names", ol: true, ap: false, hu: false, ins: false },
    { name: "Phone numbers included", ol: true, ap: true, hu: false, ins: false },
    { name: "Export to CSV", ol: true, ap: true, hu: true, ins: true },
    { name: "Works in any country", ol: true, ap: true, hu: true, ins: false },
    { name: "No per-lead credits", ol: true, ap: false, hu: false, ins: false },
    { name: "Setup in under 2 minutes", ol: true, ap: false, hu: false, ins: false },
  ];

  const Yes = () => (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,158,11,0.18)", border: "1.5px solid rgba(245,158,11,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
  const No = () => (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </div>
  );

  return (
    <section style={{ padding: "130px 0", background: "#080a0f", position: "relative", overflow: "hidden" }}>
      <WaveCanvas dark />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", position: "relative", zIndex: 1 }}>
        <A style={{ textAlign: "center", marginBottom: 88 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 16 }}>Why Outleadrr</p>
          <h2 style={{ fontSize: "clamp(32px,5vw,68px)", fontWeight: 900, letterSpacing: "-0.055em", lineHeight: 0.96, color: WHT, marginBottom: 20 }}>
            The proof is in<br />the comparison.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            See exactly where Outleadrr wins against every alternative.
          </p>
        </A>

        <A style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 80px rgba(0,0,0,0.5)" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4,160px)", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 28px" }}>
            <div style={{ padding: "20px 0 20px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Feature
            </div>
            {/* Outleadrr col header - highlighted */}
            <div style={{ padding: "16px 0", textAlign: "center", background: "rgba(245,158,11,0.06)", borderLeft: "1px solid rgba(245,158,11,0.15)", borderRight: "1px solid rgba(245,158,11,0.08)", marginBottom: -1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: "-0.01em", marginBottom: 2 }}>Outleadrr</div>
              <div style={{ fontSize: 10, color: "rgba(245,158,11,0.5)", fontWeight: 500 }}>You are here</div>
            </div>
            {[["Apollo.io", "Most popular"], ["Hunter.io", "Email finder"], ["Instantly", "Cold email"]].map(([name, sub]) => (
              <div key={name} style={{ padding: "16px 0", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {features.map((f, i) => (
            <div key={f.name} className="comp-row" style={{ display: "grid", gridTemplateColumns: "1fr repeat(4,160px)", padding: "0 28px", borderBottom: i < features.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", animation: `rowIn 0.5s ${i * 0.04}s both` }}>
              <div style={{ padding: "16px 0", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, display: "flex", alignItems: "center" }}>{f.name}</div>
              {/* Outleadrr */}
              <div style={{ padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.04)", borderLeft: "1px solid rgba(245,158,11,0.1)", borderRight: "1px solid rgba(245,158,11,0.06)" }}>
                {f.ol ? <Yes /> : <No />}
              </div>
              {[f.ap, f.hu, f.ins].map((v, j) => (
                <div key={j} style={{ padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                  {v ? (
                    <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  ) : <No />}
                </div>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4,160px)", padding: "0 28px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ padding: "20px 0" }} />
            <div style={{ padding: "20px 0 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.06)", borderLeft: "1px solid rgba(245,158,11,0.15)", borderRight: "1px solid rgba(245,158,11,0.08)" }}>
              <a href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "9px 20px", borderRadius: 9, background: GOLD, color: BLK, fontSize: 12, fontWeight: 800, textDecoration: "none", letterSpacing: "-0.01em" }}>
                Start free →
              </a>
            </div>
            {["From $49/mo", "From $34/mo", "From $37/mo"].map(p => (
              <div key={p} style={{ padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{p}</span>
              </div>
            ))}
          </div>
        </A>
      </div>
    </section>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────── */
function Steps() {
  const steps = [
    {
      n: "01", title: "Enter your target.", sub: "Type a business type and city — plumbers in Dallas, dentists in Chicago, any niche, anywhere in the world.",
      mock: (
        <div style={{ background: G4, borderRadius: 16, overflow: "hidden", border: `1px solid ${BDR}` }}>
          <div style={{ background: G5, padding: "10px 14px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>{["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}</div>
            <div style={{ flex: 1, height: 20, background: G4, borderRadius: 5 }} />
          </div>
          <div style={{ padding: "18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: G1, marginBottom: 12 }}>Find new prospects</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div><div style={{ fontSize: 8, fontWeight: 600, color: G3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Business type</div>
                <div style={{ background: WHT, border: `1.5px solid ${IND}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: G1 }}>Plumbers</div></div>
              <div><div style={{ fontSize: 8, fontWeight: 600, color: G3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>City</div>
                <div style={{ background: WHT, border: `1.5px solid ${BDR}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: G1 }}>Dallas, TX</div></div>
              <div style={{ background: BLK, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: WHT }}>Find prospects →</div>
            </div>
          </div>
        </div>
      )
    },
    {
      n: "02", title: "AI finds your leads.", sub: "Real businesses from Google Maps — company, owner contact, email, phone, rating, and a quality score in seconds.",
      mock: (
        <div style={{ background: G4, borderRadius: 16, overflow: "hidden", border: `1px solid ${BDR}` }}>
          <div style={{ background: G5, padding: "10px 14px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>{["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}</div>
            <div style={{ flex: 1, height: 20, background: G4, borderRadius: 5 }} />
          </div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: G1 }}>10 leads found</span>
              <span style={{ fontSize: 9, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>AI complete</span>
            </div>
            {[{ n: "Mike Torres", co: "Torres Plumbing", score: 88, c: "#22c55e" }, { n: "Sarah Chen", co: "DFW Drain Pros", score: 75, c: "#f59e0b" }, { n: "James Okafor", co: "Lone Star Pipe", score: 91, c: "#22c55e" }].map(r => (
              <div key={r.n} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.4fr", gap: 6, padding: "7px 0", borderBottom: `1px solid ${BDR}`, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: G1 }}>{r.n}</span>
                <span style={{ fontSize: 10, color: G2 }}>{r.co}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: r.c }}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      n: "03", title: "Send emails instantly.", sub: "Each prospect gets a GPT-written personalised email. Connect Gmail and send everything in one click — from your own inbox.",
      mock: (
        <div style={{ background: G4, borderRadius: 16, overflow: "hidden", border: `1px solid ${BDR}` }}>
          <div style={{ background: G5, padding: "10px 14px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>{["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}</div>
            <div style={{ flex: 1, height: 20, background: G4, borderRadius: 5 }} />
          </div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: G1 }}>AI email ready</span>
              <span style={{ fontSize: 9, color: G3 }}>Mike Torres</span>
            </div>
            <div style={{ background: WHT, border: `1px solid ${BDR}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 10, color: G2, lineHeight: 1.65 }}>
              <span style={{ fontWeight: 700, color: G1 }}>Subject:</span> Quick win for Torres Plumbing
              <div style={{ height: 1, background: BDR, margin: "6px 0" }} />
              Hi Mike,<br /><br />Torres Plumbing's reputation in Dallas is impressive. I help plumbing businesses get more commercial contracts. Would you be open to a 10-min call?
            </div>
            <div style={{ background: "#22c55e", borderRadius: 8, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: WHT }}>Sent via Gmail</span>
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <section style={{ padding: "130px 48px", maxWidth: 1400, margin: "0 auto" }}>
      <A style={{ textAlign: "center", marginBottom: 88 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G3, marginBottom: 16 }}>How it works</p>
        <h2 style={{ fontSize: "clamp(30px,4vw,58px)", fontWeight: 900, letterSpacing: "-0.048em", lineHeight: 1.0, color: G1, maxWidth: 460, margin: "0 auto" }}>
          New clients in 3 steps.
        </h2>
      </A>
      <div className="steps-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
        {steps.map((s, i) => (
          <A key={s.n} d={i + 1} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {s.mock}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: G3, letterSpacing: "0.04em" }}>{s.n}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: G1, letterSpacing: "-0.03em" }}>{s.title}</h3>
              </div>
              <p style={{ fontSize: 14, color: G2, lineHeight: 1.82 }}>{s.sub}</p>
            </div>
          </A>
        ))}
      </div>
    </section>
  );
}

/* ─── Stats ──────────────────────────────────────────────────────── */
function Stats() {
  const { val: v1, ref: r1 } = useCountUp(10);
  const { val: v2, ref: r2 } = useCountUp(30);
  const { val: v3, ref: r3 } = useCountUp(100, "%");
  const { val: v4, ref: r4 } = useCountUp(2000, "+");
  return (
    <section style={{ background: "#080a0f", padding: "130px 48px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 25% 50%, rgba(99,102,241,0.1) 0%, transparent 55%), radial-gradient(ellipse at 75% 50%, rgba(168,85,247,0.07) 0%, transparent 55%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <A style={{ textAlign: "center", marginBottom: 88 }}>
          <h2 style={{ fontSize: "clamp(30px,4vw,58px)", fontWeight: 900, letterSpacing: "-0.048em", color: WHT, lineHeight: 1.0 }}>
            Numbers that speak for themselves.
          </h2>
        </A>
        <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { ref: r1, val: v1, unit: "leads", desc: "per search, in under 30 seconds" },
            { ref: r2, val: v2, unit: "seconds", desc: "from search to 10 personalised emails" },
            { ref: r3, val: v3, unit: "real data", desc: "live from Google Maps, every time" },
            { ref: r4, val: v4, unit: "users", desc: "growing their pipeline with Outleadrr" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "52px 40px", background: "rgba(255,255,255,0.02)", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span ref={s.ref} style={{ fontSize: "clamp(40px,4vw,60px)", fontWeight: 900, color: WHT, letterSpacing: "-0.07em", lineHeight: 1, display: "block", marginBottom: 8 }}>{s.val}</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>{s.unit}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { stars: 5, quote: "I used Outleadrr to find 10 HVAC companies in Phoenix and booked 2 calls within 3 days. The emails were so personalised I had to double-check they weren't written by me.", name: "Marcus T.", role: "Freelance B2B Copywriter", color: IND, init: "M" },
    { stars: 5, quote: "We replaced our entire cold outreach stack with this. It does in 30 seconds what used to take our team half a day. Incredible ROI.", name: "Priya S.", role: "Founder, Scale Studio", color: "#a855f7", init: "P" },
    { stars: 5, quote: "The emails don't sound like AI at all. Got a 28% reply rate on my first batch. No other tool has come close to that for cold outreach.", name: "Daniel K.", role: "Sales Director, GrowthPath", color: "#22c55e", init: "D" },
  ];
  return (
    <section style={{ padding: "130px 48px", maxWidth: 1400, margin: "0 auto" }}>
      <A style={{ textAlign: "center", marginBottom: 88 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G3, marginBottom: 16 }}>Testimonials</p>
        <h2 style={{ fontSize: "clamp(30px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.048em", color: G1, lineHeight: 1.0 }}>
          Loved by sales teams everywhere.
        </h2>
      </A>
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {reviews.map((r, i) => (
          <A key={r.name} d={i + 1} className="card" style={{ background: G4, borderRadius: 24, padding: "36px", border: `1px solid ${BDR}` }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 22 }}>
              {Array.from({ length: r.stars }).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 16 }}>&#9733;</span>)}
            </div>
            <p style={{ fontSize: 14, color: G1, lineHeight: 1.86, marginBottom: 28, fontStyle: "italic" }}>"{r.quote}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: WHT }}>{r.init}</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: G1 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: G3 }}>{r.role}</div>
              </div>
            </div>
          </A>
        ))}
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────── */
function Pricing() {
  const tiers = [
    { name: "Free", price: "$0", period: "forever", featured: false, desc: "Try Outleadrr and get your first leads today.", features: ["10 leads per month", "AI-written cold emails", "Copy emails to clipboard", "5 example searches"], cta: "Start for free →", href: "/signup" },
    { name: "Pro", price: "$29", period: "/ month", featured: true, desc: "For founders who need a steady lead stream.", features: ["Unlimited lead generation", "AI-written cold emails", "One-click Gmail sending", "Export to CSV", "Priority AI processing"], cta: "Start Pro →", href: "/signup" },
    { name: "Business", price: "$99", period: "/ month", featured: false, desc: "For teams scaling outbound across multiple niches.", features: ["Everything in Pro", "Up to 5 team seats", "Shared lead history", "Dedicated support", "Custom email templates"], cta: "Talk to us →", href: "/signup" },
  ];
  return (
    <section id="pricing" style={{ padding: "130px 48px", background: G4 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <A style={{ textAlign: "center", marginBottom: 88 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G3, marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(30px,4vw,58px)", fontWeight: 900, letterSpacing: "-0.048em", color: G1, lineHeight: 1.0, marginBottom: 12 }}>Simple, transparent pricing.</h2>
          <p style={{ fontSize: 16, color: G2 }}>No hidden fees. Cancel anytime.</p>
        </A>
        <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
          {tiers.map((t, i) => (
            <A key={t.name} d={i + 1} style={{ background: t.featured ? BLK : WHT, borderRadius: 24, padding: "36px", border: t.featured ? "none" : `1px solid ${BDR}`, position: "relative", boxShadow: t.featured ? "0 0 0 1px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1)" : "none" }}>
              {t.featured && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: IND, color: WHT, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 18px", borderRadius: 99, whiteSpace: "nowrap", border: `2px solid ${G4}` }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.featured ? "rgba(255,255,255,0.36)" : G3, marginBottom: 8 }}>{t.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                  <span style={{ fontSize: 50, fontWeight: 900, letterSpacing: "-0.07em", color: t.featured ? WHT : G1 }}>{t.price}</span>
                  <span style={{ fontSize: 14, color: t.featured ? "rgba(255,255,255,0.32)" : G3 }}>{t.period}</span>
                </div>
                <p style={{ fontSize: 13, color: t.featured ? "rgba(255,255,255,0.44)" : G2, lineHeight: 1.65 }}>{t.desc}</p>
              </div>
              <div style={{ height: 1, background: t.featured ? "rgba(255,255,255,0.08)" : BDR, marginBottom: 22 }} />
              <ul style={{ listStyle: "none", marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: t.featured ? "rgba(255,255,255,0.75)" : G2 }}>
                    <span style={{ color: t.featured ? "#86efac" : "#22c55e", fontSize: 14, flexShrink: 0 }}>&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <a href={t.href} style={t.featured
                ? { display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 11, background: WHT, color: BLK, fontSize: 14, fontWeight: 700, textDecoration: "none" }
                : { display: "block", textAlign: "center", padding: "13px 20px", borderRadius: 11, border: `1px solid rgba(0,0,0,0.13)`, color: G1, fontSize: 14, fontWeight: 600, textDecoration: "none" }
              }>{t.cta}</a>
            </A>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Are the leads real people at real companies?", a: "Yes. Outleadrr pulls real business data directly from Google Maps via the Places API. Company names, addresses, phone numbers and ratings are 100% real. Contact names and emails are AI-generated to match the business." },
    { q: "How personalised are the cold emails?", a: "Each email is written by GPT and tailored to the prospect's company name, industry, location, and role. They read like they were written by a human sales rep — not a template blast." },
    { q: "Does it actually send from my Gmail?", a: "Yes. When you connect Gmail via OAuth, emails are sent directly from your own inbox using the Gmail API. Recipients see your real email address, which dramatically improves deliverability and trust." },
    { q: "What industries and locations does it support?", a: "Any industry, any city. You can search for plumbers in Houston, dentists in London, law firms in Toronto — any niche and any location worldwide." },
    { q: "Can I export my leads to a spreadsheet?", a: "Yes. After generating leads, click Export CSV to download a spreadsheet with all lead data — company, contact, email, phone, website, address, rating, score, and more." },
    { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no lock-in, no cancellation fees. Cancel at any time from your account settings." },
  ];
  return (
    <section id="faq" style={{ padding: "130px 48px", maxWidth: 800, margin: "0 auto" }}>
      <A style={{ textAlign: "center", marginBottom: 88 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G3, marginBottom: 16 }}>FAQ</p>
        <h2 style={{ fontSize: "clamp(30px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.048em", color: G1, lineHeight: 1.0 }}>
          Frequently asked questions.
        </h2>
      </A>
      {faqs.map((f, i) => (
        <div key={i} className="faq-item">
          <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
            <span style={{ fontSize: 15, fontWeight: 600, color: G1, letterSpacing: "-0.01em" }}>{f.q}</span>
            <span style={{ fontSize: 26, color: open === i ? IND : G3, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.28s, color 0.2s", display: "inline-block", lineHeight: 1 }}>+</span>
          </button>
          <div className={`faq-body ${open === i ? "open" : "closed"}`}>
            <p style={{ paddingBottom: 28, fontSize: 14, color: G2, lineHeight: 1.88 }}>{f.a}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BDR}`, background: WHT }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "64px 48px 44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 48, marginBottom: 64 }}>
          <div style={{ maxWidth: 260 }}>
            <img src={logoSrc} alt="Outleadrr" style={{ height: 28, width: "auto", marginBottom: 18 }} />
            <p style={{ fontSize: 13, color: G2, lineHeight: 1.78 }}>AI-powered lead generation and cold email outreach. Find your next 10 clients in seconds.</p>
          </div>
          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            {[
              { heading: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" }] },
              { heading: "Account", links: [{ label: "Sign up", href: "/signup" }, { label: "Log in", href: "/login" }] },
              { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G3, marginBottom: 20 }}>{col.heading}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {col.links.map(l => (
                    <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: G2, textDecoration: "none" }}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: BDR, marginBottom: 28 }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: G3 }}>© {new Date().getFullYear()} Outleadrr. All rights reserved.</p>
          <p style={{ fontSize: 12, color: G3 }}>Built with AI · Powered by Google Maps + GPT</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function Dashboard() {
  return (
    <>
      <style>{CSS}</style>
      <Navbar />
      <Hero />
      <Marquee />
      <Features />
      <Comparison />
      <Steps />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />

      {/* Final CTA */}
      <section style={{ padding: "160px 48px", background: "#080a0f", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at 25% 65%, rgba(168,85,247,0.1) 0%, transparent 55%)", pointerEvents: "none" }} />
        <WaveCanvas dark />
        <A style={{ maxWidth: 620, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(40px,6vw,72px)", fontWeight: 900, color: WHT, letterSpacing: "-0.058em", lineHeight: 0.94, marginBottom: 24 }}>
            Ready to fill your pipeline?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.38)", marginBottom: 52, lineHeight: 1.7 }}>
            Start for free — no credit card required.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "17px 44px", borderRadius: 13, background: WHT, color: BLK, fontSize: 15, fontWeight: 800, textDecoration: "none", letterSpacing: "-0.01em", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              Create free account →
            </a>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "16px 36px", borderRadius: 13, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 500, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.1)", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}>
              Log in
            </a>
          </div>
        </A>
      </section>

      <Footer />
    </>
  );
}
