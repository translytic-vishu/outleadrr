import logoSrc from "@assets/outleadr_1773257073565.png";
import { useState, useEffect, useRef } from "react";

/* ─── Design tokens ──────────────────────────────────────────────── */
const F  = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BLK = "#0a0a0a";
const WHT = "#ffffff";
const G1  = "#111827";
const G2  = "#6b7280";
const G3  = "#9ca3af";
const G4  = "#f9fafb";
const G5  = "#f3f4f6";
const BDR = "rgba(0,0,0,0.08)";
const IND = "#6366f1";

/* ─── Global CSS ─────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  html, body, #root { background: ${WHT}; color: ${G1}; font-family: ${F}; -webkit-font-smoothing: antialiased; }
  img { display: block; max-width: 100%; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes floatA { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
  @keyframes floatB { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
  @keyframes floatC { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }

  .h-up  { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
  .h-in  { animation: fadeIn 0.7s ease both; }
  .fa    { animation: floatA 4.2s ease-in-out infinite; }
  .fb    { animation: floatB 5s 0.9s ease-in-out infinite; }
  .fc    { animation: floatC 4.6s 1.7s ease-in-out infinite; }
  .pdot  { animation: pulse-dot 2s ease-in-out infinite; }

  /* Scroll-reveal */
  .anim {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
  }
  .anim.visible { opacity: 1; transform: translateY(0); }
  .d1 { transition-delay: 0.08s; }
  .d2 { transition-delay: 0.17s; }
  .d3 { transition-delay: 0.26s; }
  .d4 { transition-delay: 0.35s; }

  /* Buttons */
  .btn-blk {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:13px 28px;border-radius:10px;
    background:${BLK};color:${WHT};border:none;
    font-family:${F};font-weight:600;font-size:14px;letter-spacing:-0.01em;
    cursor:pointer;transition:all 0.2s;text-decoration:none;
  }
  .btn-blk:hover { background:#1c1c1c; transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.22); }
  .btn-blk:active { transform:translateY(0); }
  .btn-lg {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:16px 38px;border-radius:12px;
    background:${BLK};color:${WHT};border:none;
    font-family:${F};font-weight:700;font-size:16px;letter-spacing:-0.02em;
    cursor:pointer;transition:all 0.2s;text-decoration:none;
  }
  .btn-lg:hover { background:#1c1c1c; transform:translateY(-2px); box-shadow:0 10px 36px rgba(0,0,0,0.25); }
  .btn-ghost {
    display:inline-flex;align-items:center;gap:6px;
    padding:13px 26px;border-radius:10px;
    background:transparent;color:${G2};border:1px solid ${BDR};
    font-family:${F};font-weight:500;font-size:14px;
    cursor:pointer;transition:all 0.15s;text-decoration:none;
  }
  .btn-ghost:hover { background:${G5};color:${G1};border-color:rgba(0,0,0,0.16); }

  /* FAQ */
  .faq-item { border-bottom:1px solid ${BDR}; }
  .faq-btn  { width:100%;display:flex;justify-content:space-between;align-items:center;padding:22px 0;background:none;border:none;cursor:pointer;text-align:left;gap:16px; }
  .faq-body { overflow:hidden;transition:max-height 0.35s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease; }
  .faq-body.open   { max-height:260px;opacity:1; }
  .faq-body.closed { max-height:0;opacity:0; }

  /* Marquee */
  .marquee-track { display:flex;gap:12px;animation:marquee 32s linear infinite;width:max-content; }
  .marquee-wrap  { overflow:hidden;mask:linear-gradient(to right,transparent,black 10%,black 90%,transparent); }

  /* Responsive */
  @media(max-width:960px){
    .bento      { grid-template-columns:1fr !important; }
    .bento-r    { grid-template-columns:1fr !important; }
    .two-col    { grid-template-columns:1fr !important; }
    .three-col  { grid-template-columns:1fr !important; }
    .steps-row  { grid-template-columns:1fr !important; }
    .comp-grid  { grid-template-columns:1fr !important; }
    .nav-links  { display:none !important; }
    .hide-sm    { display:none !important; }
  }
`;

/* ─── Scroll-reveal hook ─────────────────────────────────────────── */
function useAnim() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); io.disconnect(); } },
      { threshold: 0.07 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ─── Animated wrapper ───────────────────────────────────────────── */
function A({ children, d = 0, style, className = "" }: {
  children: React.ReactNode; d?: number; style?: React.CSSProperties; className?: string;
}) {
  const ref = useAnim();
  const delay = d > 0 ? `d${d}` : "";
  return <div ref={ref} className={`anim ${delay} ${className}`} style={style}>{children}</div>;
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${BDR}`,
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src={logoSrc} alt="Outleadrr" style={{ height: 30, width: "auto" }} />
        </a>
        <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 13, fontWeight: 500, color: G2, textDecoration: "none", padding: "7px 14px", borderRadius: 8, transition: "color 0.15s, background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = G1; (e.currentTarget as HTMLElement).style.background = G5; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = G2; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >{l}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/login" className="btn-ghost" style={{ padding: "8px 18px", fontSize: 13 }}>Log in</a>
          <a href="/signup" className="btn-blk" style={{ padding: "9px 20px", fontSize: 13 }}>Get started free →</a>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero dashboard mockup ──────────────────────────────────────── */
function HeroMockup() {
  const leads = [
    { n:"01", co:"RiverCity Plumbing Co.", name:"James Holloway · CEO", email:"james@rivercityplumbing.com", phone:"+1 832-555-0012", score:87, sc:"#22c55e", sb:"rgba(34,197,94,0.14)", label:"Strong" },
    { n:"02", co:"Houston Pipe Masters", name:"Sandra Lee · Owner", email:"sandra@houstonpipe.com", phone:"+1 713-555-0088", score:74, sc:"#f59e0b", sb:"rgba(245,158,11,0.14)", label:"Good" },
    { n:"03", co:"Lone Star Plumbing LLC", name:"Carlos Reyes · Founder", email:"carlos@lonestar.com", phone:"+1 832-555-0234", score:91, sc:"#22c55e", sb:"rgba(34,197,94,0.14)", label:"Strong" },
    { n:"04", co:"Bayou City Drain Pros", name:"Michelle Park · GM", email:"michelle@bayoudrain.com", phone:"+1 713-555-0456", score:69, sc:"#f59e0b", sb:"rgba(245,158,11,0.14)", label:"Good" },
    { n:"05", co:"Premier Flow Systems", name:"David Chen · Founder", email:"david@premierflow.com", phone:"+1 832-555-0678", score:92, sc:"#22c55e", sb:"rgba(34,197,94,0.14)", label:"Strong" },
  ];
  return (
    <div style={{ position: "relative" }}>
      {/* Main dark window */}
      <div style={{
        borderRadius: 20, overflow: "hidden",
        background: "#0d0f14",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.18), 0 64px 120px rgba(0,0,0,0.12)",
        userSelect: "none", pointerEvents: "none",
      }}>
        {/* Chrome */}
        <div style={{ background:"#18181b", padding:"11px 20px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", gap:6 }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c }} />)}
          </div>
          <div style={{ flex:1, height:26, background:"#0d0f14", borderRadius:7, margin:"0 20px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.18)", fontFamily:F }}>outleadrr.app</span>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["Score ↓","Filter","Export CSV"].map(b => (
              <div key={b} style={{ padding:"4px 10px", borderRadius:6, background:"rgba(255,255,255,0.05)", fontSize:10, color:"rgba(255,255,255,0.28)", border:"1px solid rgba(255,255,255,0.06)" }}>{b}</div>
            ))}
            <div style={{ padding:"5px 12px", borderRadius:6, background:"#fff", fontSize:10, color:"#000", fontWeight:700 }}>Send all via Gmail →</div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ padding:"10px 24px", background:"rgba(255,255,255,0.025)", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", gap:28 }}>
          {[{ v:"10", l:"prospects found" }, { v:"81", l:"avg score" }, { v:"6", l:"strong leads" }, { v:"8", l:"with phone" }, { v:"10", l:"AI emails ready" }].map(s => (
            <div key={s.l}>
              <span style={{ fontSize:13, fontWeight:700, color:"#fff", marginRight:4 }}>{s.v}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div style={{ padding:"10px 24px", display:"grid", gridTemplateColumns:"32px 1fr 200px 150px 72px 72px", gap:"0 16px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          {["#","Company & Contact","Email","Phone","Score","Status"].map(h => (
            <span key={h} style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.18)" }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {leads.map((r, i) => (
          <div key={r.n} style={{ padding:"12px 24px", display:"grid", gridTemplateColumns:"32px 1fr 200px 150px 72px 72px", gap:"0 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center", opacity: i >= 4 ? 0.28 : 1 }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.18)" }}>{r.n}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{r.co}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{r.name}</div>
            </div>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.email}</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"monospace" }}>{r.phone}</span>
            <div style={{ width:38, height:38, borderRadius:"50%", background:r.sb, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:12, fontWeight:800, color:r.sc }}>{r.score}</span>
            </div>
            <div style={{ padding:"4px 10px", borderRadius:7, background:r.sb, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:10, fontWeight:700, color:r.sc }}>{r.label}</span>
            </div>
          </div>
        ))}
        <div style={{ padding:"10px 24px", opacity:0.1 }}>
          <div style={{ height:1, background:"rgba(255,255,255,0.2)" }} />
        </div>
      </div>

      {/* Floating: email preview card */}
      <div className="fb" style={{
        position:"absolute", bottom:-18, right:-28,
        background:WHT, borderRadius:18, padding:"18px 20px",
        boxShadow:"0 8px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
        border:`1px solid ${BDR}`, width:270,
        userSelect:"none", pointerEvents:"none",
      }}>
        <div style={{ fontSize:10, fontWeight:700, color:G3, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>AI-Written Email</div>
        <div style={{ fontSize:12, fontWeight:700, color:G1, marginBottom:5 }}>Hi James, great work at RiverCity...</div>
        <div style={{ fontSize:11, color:G2, lineHeight:1.55, marginBottom:14 }}>
          I noticed RiverCity Plumbing has been Houston's go-to for 12 years. I help plumbing businesses land more commercial contracts using targeted outreach...
        </div>
        <div style={{ background:BLK, borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <span style={{ fontSize:11, color:WHT, fontWeight:600 }}>✓ Send via Gmail</span>
        </div>
      </div>

      {/* Floating: score badge */}
      <div className="fa" style={{
        position:"absolute", top:52, left:-32,
        background:WHT, borderRadius:14, padding:"12px 16px",
        boxShadow:"0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06)",
        border:`1px solid ${BDR}`,
        userSelect:"none", pointerEvents:"none",
      }}>
        <div style={{ fontSize:10, color:G3, marginBottom:4 }}>Lead score</div>
        <div style={{ fontSize:28, fontWeight:800, color:"#22c55e", letterSpacing:"-0.04em", lineHeight:1 }}>92</div>
        <div style={{ fontSize:11, fontWeight:600, color:"#22c55e", marginTop:3 }}>Strong lead ↑</div>
      </div>

      {/* Floating: found badge */}
      <div className="fc" style={{
        position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)",
        background:BLK, borderRadius:99, padding:"9px 18px",
        boxShadow:"0 4px 20px rgba(0,0,0,0.24)",
        display:"flex", alignItems:"center", gap:8,
        userSelect:"none", pointerEvents:"none",
        whiteSpace:"nowrap",
      }}>
        <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", flexShrink:0 }} />
        <span style={{ fontSize:12, fontWeight:600, color:WHT }}>10 plumbers found in Houston, TX</span>
      </div>
    </div>
  );
}

/* ─── Feature bento ─────────────────────────────────────────────── */
function Bento() {
  return (
    <section id="features" style={{ padding:"100px 32px", maxWidth:1160, margin:"0 auto" }}>
      <A style={{ textAlign:"center", marginBottom:72 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>Features</p>
        <h2 style={{ fontSize:"clamp(30px,4vw,52px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05, maxWidth:580, margin:"0 auto", color:G1 }}>
          Everything you need to land new business.
        </h2>
      </A>

      {/* Row 1: Large dark + two stacked */}
      <div className="bento" style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16, marginBottom:16 }}>
        {/* Large dark card — lead table */}
        <A style={{ background:"#0d0f14", borderRadius:24, padding:"36px", overflow:"hidden", position:"relative", minHeight:460, display:"flex", flexDirection:"column" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Real Data</p>
          <h3 style={{ fontSize:"clamp(22px,2.5vw,30px)", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.15, maxWidth:300, marginBottom:28 }}>
            Real businesses, pulled live from Google Maps.
          </h3>
          {/* Mini table */}
          <div style={{ flex:1, borderRadius:14, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden", background:"rgba(255,255,255,0.025)" }}>
            <div style={{ padding:"9px 16px", display:"grid", gridTemplateColumns:"1fr 110px 48px", gap:"0 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {["Company","Email","Score"].map(h => <span key={h} style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(255,255,255,0.18)" }}>{h}</span>)}
            </div>
            {[
              { co:"RiverCity Plumbing", email:"james@rivercity.com", score:87, c:"#22c55e" },
              { co:"Houston Pipe Masters", email:"sandra@houstonpipe.com", score:74, c:"#f59e0b" },
              { co:"Lone Star Plumbing", email:"carlos@lonestar.com", score:91, c:"#22c55e" },
              { co:"Bayou City Drain Pros", email:"michelle@bayou.com", score:69, c:"#f59e0b" },
            ].map((r, i) => (
              <div key={r.co} style={{ padding:"11px 16px", display:"grid", gridTemplateColumns:"1fr 110px 48px", gap:"0 12px", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.03)", opacity: i >= 3 ? 0.3 : 1 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{r.co}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.email}</span>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`${r.c}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:11, fontWeight:800, color:r.c }}>{r.score}</span>
                </div>
              </div>
            ))}
          </div>
          {/* floating tag */}
          <div className="fa" style={{ position:"absolute", bottom:28, right:24, background:WHT, borderRadius:12, padding:"10px 14px", boxShadow:"0 4px 20px rgba(0,0,0,0.35)", pointerEvents:"none" }}>
            <div style={{ fontSize:10, color:G2, marginBottom:2 }}>Total leads found</div>
            <div style={{ fontSize:22, fontWeight:800, color:BLK, lineHeight:1 }}>10 <span style={{ fontSize:12, fontWeight:500, color:"#22c55e" }}>· live data</span></div>
          </div>
        </A>

        {/* Right two stacked */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Email card */}
          <A d={1} style={{ background:G4, borderRadius:24, padding:"28px", flex:1, overflow:"hidden" }}>
            <p style={{ fontSize:11, fontWeight:700, color:G3, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Outreach</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:G1, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:18 }}>
              Personalised cold emails, written in seconds.
            </h3>
            <div style={{ background:WHT, borderRadius:12, border:`1px solid ${BDR}`, padding:"14px 16px", fontSize:11, color:G2, lineHeight:1.65, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight:700, color:G1, marginBottom:4 }}>Subject: Quick win for RiverCity Plumbing</div>
              <div style={{ height:1, background:BDR, margin:"8px 0" }} />
              <b style={{ color:G1 }}>Hi James,</b><br />
              I noticed RiverCity has been Houston's go-to plumber for over a decade — impressive reputation.<br /><br />
              I help plumbing businesses land more commercial contracts. Would you be open to a 10-min call this week?<br /><br />
              <b style={{ color:G1 }}>— Alex</b>
            </div>
          </A>

          {/* Gmail send card */}
          <A d={2} style={{ background:BLK, borderRadius:24, padding:"28px", overflow:"hidden" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.32)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Your inbox</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:WHT, letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:18 }}>
              Sent from your Gmail — not ours.
            </h3>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,0.07)", borderRadius:12, border:"1px solid rgba(255,255,255,0.09)" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#ea4335 0%,#fbbc04 40%,#34a853 70%,#4285f4 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:14, fontWeight:900, color:WHT }}>G</span>
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:WHT }}>alex@yourcompany.com</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.38)" }}>Gmail connected · 10 emails sent</div>
              </div>
              <div style={{ marginLeft:"auto", width:9, height:9, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} />
            </div>
          </A>
        </div>
      </div>

      {/* Row 2: Three equal cards */}
      <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {[
          { label:"Lead Scoring", title:"Know exactly who to contact first.", desc:"Every prospect gets a 0–100 quality score based on industry fit, online presence, ratings, and reachability.", icon:"📊", bg:G4 },
          { label:"CSV Export", title:"Import into any CRM instantly.", desc:"Download your complete lead list as a CSV — ready for HubSpot, Airtable, Notion, or Google Sheets.", icon:"⬇️", bg:"#f0fdf4" },
          { label:"Speed", title:"10 qualified leads in 30 seconds.", desc:"From typing your niche to having personalized emails ready to send — the whole process takes half a minute.", icon:"⚡", bg:G4 },
        ].map((c, i) => (
          <A key={c.label} d={i + 1} style={{ background:c.bg, borderRadius:24, padding:"28px 30px" }}>
            <div style={{ fontSize:30, marginBottom:16 }}>{c.icon}</div>
            <p style={{ fontSize:11, fontWeight:700, color:G3, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>{c.label}</p>
            <h3 style={{ fontSize:20, fontWeight:800, color:G1, letterSpacing:"-0.03em", lineHeight:1.25, marginBottom:10 }}>{c.title}</h3>
            <p style={{ fontSize:13, color:G2, lineHeight:1.75 }}>{c.desc}</p>
          </A>
        ))}
      </div>
    </section>
  );
}

/* ─── Comparison section ─────────────────────────────────────────── */
function Comparison() {
  return (
    <section style={{ padding:"100px 32px", background:G4 }}>
      <div style={{ maxWidth:1160, margin:"0 auto" }}>
        <A style={{ textAlign:"center", marginBottom:72 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>Why Outleadrr</p>
          <h2 style={{ fontSize:"clamp(30px,5vw,60px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:16, color:G1 }}>
            No scraped lists.<br />100% real data.
          </h2>
          <p style={{ fontSize:17, color:G2, maxWidth:440, margin:"0 auto", lineHeight:1.65 }}>
            Other tools sell you outdated CSV files from 2022.<br />
            Outleadrr pulls live data from Google Maps — right now.
          </p>
        </A>

        <A style={{ borderRadius:24, overflow:"hidden", border:`1px solid ${BDR}`, boxShadow:"0 4px 48px rgba(0,0,0,0.08)", background:WHT }}>
          <div className="comp-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
            {/* Left: Other tools */}
            <div style={{ padding:"44px 48px", borderRight:`1px solid ${BDR}`, background:"#fafafa" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:12, color:"#ef4444" }}>✕</span>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:"#dc2626", letterSpacing:"-0.01em" }}>Other lead tools</span>
              </div>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  "Scraped data from 6+ months ago",
                  "Randomly guessed emails that bounce",
                  "Copy-paste templates, zero personalisation",
                  "Hours of manual research and formatting",
                  "No contact names, no real phone numbers",
                  "Requires expensive monthly subscriptions",
                ].map(item => (
                  <li key={item} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:14, color:"#9ca3af" }}>
                    <span style={{ color:"#fca5a5", flexShrink:0, fontWeight:700, marginTop:1 }}>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Outleadrr */}
            <div style={{ padding:"44px 48px", background:WHT }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:12, color:"#22c55e" }}>✓</span>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:"#16a34a", letterSpacing:"-0.01em" }}>Outleadrr</span>
              </div>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  "Live data pulled from Google Maps right now",
                  "Real business emails scraped from their website",
                  "GPT-written emails tailored to each business",
                  "10 qualified leads + emails in under 30 seconds",
                  "Real names, phone numbers, ratings, reviews",
                  "Start free — no credit card required",
                ].map(item => (
                  <li key={item} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:14, color:G1 }}>
                    <span style={{ color:"#22c55e", flexShrink:0, fontWeight:700, marginTop:1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom: Platform badges */}
          <div style={{ padding:"20px 48px", borderTop:`1px solid ${BDR}`, background:G4, display:"flex", alignItems:"center", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
            {[
              { label:"Google Maps", color:"#4285f4" },
              { label:"Gmail API",   color:"#ea4335" },
              { label:"OpenAI GPT",  color:"#10a37f" },
              { label:"Real-time",   color:IND },
            ].map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:10, fontWeight:900, color:WHT }}>{p.label[0]}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:G2 }}>{p.label}</span>
              </div>
            ))}
          </div>
        </A>
      </div>
    </section>
  );
}

/* ─── 3-step section ─────────────────────────────────────────────── */
function Steps() {
  const steps = [
    {
      n:"1", title:"Enter your target.", sub:"Type a business type and city — plumbers in Dallas, dentists in Chicago, any niche, anywhere in the world.",
      accentColor:"#6366f1",
      mock: (
        <div style={{ background:G4, borderRadius:16, overflow:"hidden", border:`1px solid ${BDR}` }}>
          <div style={{ padding:"14px 18px", background:G5, borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>{["#f87171","#fbbf24","#34d399"].map(c=><div key={c} style={{width:8,height:8,borderRadius:"50%",background:c}}/>)}</div>
            <div style={{ flex:1, height:20, background:G4, borderRadius:5, display:"flex", alignItems:"center", paddingLeft:8 }}>
              <span style={{ fontSize:9, color:G3 }}>outleadrr.app</span>
            </div>
          </div>
          <div style={{ padding:"18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:G1, marginBottom:12 }}>Find new prospects</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div>
                <div style={{ fontSize:9, fontWeight:600, color:G3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Business type</div>
                <div style={{ background:WHT, border:`1.5px solid ${IND}`, borderRadius:8, padding:"7px 10px", fontSize:11, color:G1, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ color:IND }}>🔍</span> Plumbers
                </div>
              </div>
              <div>
                <div style={{ fontSize:9, fontWeight:600, color:G3, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>City / Region</div>
                <div style={{ background:WHT, border:`1.5px solid ${BDR}`, borderRadius:8, padding:"7px 10px", fontSize:11, color:G1 }}>Dallas, TX</div>
              </div>
              <div style={{ background:BLK, borderRadius:8, padding:"8px", textAlign:"center", fontSize:11, fontWeight:700, color:WHT }}>
                Find prospects →
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      n:"2", title:"AI finds your leads.", sub:"Real businesses from Google Maps — company name, owner contact, email, phone, rating, and a quality score. In seconds.",
      accentColor:"#a855f7",
      mock: (
        <div style={{ background:G4, borderRadius:16, overflow:"hidden", border:`1px solid ${BDR}` }}>
          <div style={{ padding:"14px 18px", background:G5, borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>{["#f87171","#fbbf24","#34d399"].map(c=><div key={c} style={{width:8,height:8,borderRadius:"50%",background:c}}/>)}</div>
            <div style={{ flex:1, height:20, background:G4, borderRadius:5 }} />
          </div>
          <div style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:G1 }}>10 leads found</span>
              <span style={{ fontSize:9, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", borderRadius:99, padding:"2px 8px", fontWeight:600 }}>✓ AI complete</span>
            </div>
            {[
              { n:"Mike Torres", co:"Torres Plumbing", score:88, c:"#22c55e" },
              { n:"Sarah Chen", co:"DFW Drain Pros", score:75, c:"#f59e0b" },
              { n:"James Okafor", co:"Lone Star Pipe", score:91, c:"#22c55e" },
            ].map(r => (
              <div key={r.n} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 0.4fr", gap:6, padding:"6px 0", borderBottom:`1px solid ${BDR}`, alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:600, color:G1 }}>{r.n}</span>
                <span style={{ fontSize:10, color:G2 }}>{r.co}</span>
                <span style={{ fontSize:11, fontWeight:800, color:r.c }}>{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n:"3", title:"Send emails instantly.", sub:"Each prospect gets a personalised GPT-written email. Connect Gmail and send everything in one click — directly from your inbox.",
      accentColor:"#22c55e",
      mock: (
        <div style={{ background:G4, borderRadius:16, overflow:"hidden", border:`1px solid ${BDR}` }}>
          <div style={{ padding:"14px 18px", background:G5, borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:4 }}>{["#f87171","#fbbf24","#34d399"].map(c=><div key={c} style={{width:8,height:8,borderRadius:"50%",background:c}}/>)}</div>
            <div style={{ flex:1, height:20, background:G4, borderRadius:5 }} />
          </div>
          <div style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:G1 }}>AI-written email</span>
              <span style={{ fontSize:9, color:G3 }}>Mike Torres</span>
            </div>
            <div style={{ background:WHT, border:`1px solid ${BDR}`, borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:10, color:G2, lineHeight:1.65 }}>
              <span style={{ fontWeight:700, color:G1 }}>Subject:</span> Quick win for Torres Plumbing<br />
              <div style={{ height:1, background:BDR, margin:"6px 0" }} />
              Hi Mike,<br /><br />
              I noticed Torres Plumbing has been serving Dallas for years — impressive reputation.<br /><br />
              I help plumbing businesses get more commercial contracts. Would you be open to a 10-min call?
            </div>
            <div style={{ background:"#22c55e", borderRadius:8, padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <span style={{ fontSize:10, fontWeight:700, color:WHT }}>✓ Sent via Gmail</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section style={{ padding:"100px 32px", maxWidth:1160, margin:"0 auto" }}>
      <A style={{ textAlign:"center", marginBottom:72 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>How it works</p>
        <h2 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05, color:G1, maxWidth:560, margin:"0 auto" }}>
          Get clients in 3 steps.
        </h2>
        <p style={{ fontSize:16, color:G2, maxWidth:400, margin:"14px auto 0", lineHeight:1.65 }}>
          Simple enough to start in 30 seconds. Powerful enough to replace your entire outbound stack.
        </p>
      </A>
      <div className="steps-row" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {steps.map((s, i) => (
          <A key={s.n} d={i + 1} style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {s.mock}
            <div>
              <h3 style={{ fontSize:20, fontWeight:800, color:G1, letterSpacing:"-0.03em", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:30, height:30, borderRadius:"50%", background:s.accentColor, color:WHT, fontSize:13, fontWeight:800, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.n}</span>
                {s.title}
              </h3>
              <p style={{ fontSize:14, color:G2, lineHeight:1.75 }}>{s.sub}</p>
            </div>
          </A>
        ))}
      </div>
    </section>
  );
}

/* ─── Stats section ─────────────────────────────────────────────── */
function Stats() {
  const items = [
    { n:"10", unit:"leads", desc:"per search in under 30 seconds" },
    { n:"100%", unit:"real data", desc:"pulled live from Google Maps" },
    { n:"1-click", unit:"Gmail send", desc:"from your own inbox, not ours" },
    { n:"Any", unit:"niche", desc:"any business type, any city worldwide" },
  ];
  return (
    <section style={{ background:BLK, padding:"100px 32px" }}>
      <div style={{ maxWidth:1160, margin:"0 auto" }}>
        <A style={{ textAlign:"center", marginBottom:72 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:"-0.04em", color:WHT, lineHeight:1.1, marginBottom:12 }}>
            Numbers that speak for themselves.
          </h2>
        </A>
        <div className="two-col" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"rgba(255,255,255,0.07)", borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)" }}>
          {items.map((s, i) => (
            <A key={s.n} d={i + 1} style={{ padding:"40px 32px", background:BLK, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:800, color:WHT, letterSpacing:"-0.05em", lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.55)", marginBottom:4 }}>{s.unit}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>{s.desc}</div>
            </A>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { stars:5, quote:"I used Outleadrr to find 10 HVAC companies in Phoenix and booked 2 calls within 3 days. The emails were so personalised I had to double-check they weren't written by me.", name:"Marcus T.", role:"Freelance B2B Copywriter", color:"#6366f1", init:"M" },
    { stars:5, quote:"We replaced our entire cold outreach stack with this. It does in 30 seconds what used to take our team half a day. Incredible ROI.", name:"Priya S.", role:"Founder, Scale Studio", color:"#a855f7", init:"P" },
    { stars:5, quote:"The emails don't sound like AI at all. Got a 28% reply rate on my first batch. No other tool has come close to that for cold outreach.", name:"Daniel K.", role:"Sales Director, GrowthPath", color:"#22c55e", init:"D" },
  ];
  return (
    <section style={{ padding:"100px 32px", maxWidth:1160, margin:"0 auto" }}>
      <A style={{ textAlign:"center", marginBottom:72 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>Testimonials</p>
        <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-0.04em", color:G1, lineHeight:1.05 }}>
          Loved by sales teams everywhere.
        </h2>
      </A>
      <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {reviews.map((r, i) => (
          <A key={r.name} d={i + 1} style={{ background:G4, borderRadius:24, padding:"32px", border:`1px solid ${BDR}` }}>
            <div style={{ display:"flex", gap:3, marginBottom:18 }}>
              {Array.from({ length:r.stars }).map((_, j) => <span key={j} style={{ color:"#f59e0b", fontSize:14 }}>★</span>)}
            </div>
            <p style={{ fontSize:14, color:G1, lineHeight:1.8, marginBottom:24, fontStyle:"italic" }}>"{r.quote}"</p>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:r.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:16, fontWeight:800, color:WHT }}>{r.init}</span>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:G1 }}>{r.name}</div>
                <div style={{ fontSize:12, color:G3 }}>{r.role}</div>
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
    {
      name:"Free", price:"$0", period:"forever", featured:false,
      desc:"Perfect for trying Outleadrr and getting your first leads.",
      features:["10 leads per month","AI-written cold emails","Copy to clipboard","5 example searches"],
      cta:"Start for free →", href:"/signup",
    },
    {
      name:"Pro", price:"$29", period:"/ month", featured:true,
      desc:"For founders and salespeople who need a steady lead stream.",
      features:["Unlimited lead generation","AI-written cold emails","One-click Gmail sending","Export to CSV","Priority AI processing"],
      cta:"Start Pro →", href:"/signup",
    },
    {
      name:"Business", price:"$99", period:"/ month", featured:false,
      desc:"For teams scaling outbound across multiple verticals.",
      features:["Everything in Pro","Up to 5 team seats","Shared lead history","Dedicated support","Custom email templates"],
      cta:"Talk to us →", href:"/signup",
    },
  ];
  return (
    <section id="pricing" style={{ padding:"100px 32px", background:G4 }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <A style={{ textAlign:"center", marginBottom:72 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>Pricing</p>
          <h2 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:"-0.04em", color:G1, lineHeight:1.05, marginBottom:10 }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontSize:16, color:G2 }}>No hidden fees. Cancel anytime.</p>
        </A>
        <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, alignItems:"start" }}>
          {tiers.map((t, i) => (
            <A key={t.name} d={i + 1} style={{ background: t.featured ? BLK : WHT, borderRadius:24, padding:"32px", border: t.featured ? "none" : `1px solid ${BDR}`, position:"relative", boxShadow: t.featured ? "0 16px 64px rgba(0,0,0,0.24)" : "none" }}>
              {t.featured && (
                <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:IND, color:WHT, fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 16px", borderRadius:99, whiteSpace:"nowrap", border:`2px solid ${WHT}` }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color: t.featured ? "rgba(255,255,255,0.45)" : G3, marginBottom:8 }}>{t.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                  <span style={{ fontSize:44, fontWeight:800, letterSpacing:"-0.05em", color: t.featured ? WHT : G1 }}>{t.price}</span>
                  <span style={{ fontSize:14, color: t.featured ? "rgba(255,255,255,0.4)" : G3 }}>{t.period}</span>
                </div>
                <p style={{ fontSize:13, color: t.featured ? "rgba(255,255,255,0.5)" : G2, lineHeight:1.6 }}>{t.desc}</p>
              </div>
              <div style={{ height:1, background: t.featured ? "rgba(255,255,255,0.1)" : BDR, marginBottom:20 }} />
              <ul style={{ listStyle:"none", marginBottom:28, display:"flex", flexDirection:"column", gap:11 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color: t.featured ? "rgba(255,255,255,0.8)" : G2 }}>
                    <span style={{ color: t.featured ? "#86efac" : "#22c55e", fontSize:14, flexShrink:0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={t.href} style={t.featured
                ? { display:"block", textAlign:"center", padding:"14px 20px", borderRadius:10, background:WHT, color:BLK, fontSize:14, fontWeight:700, textDecoration:"none" }
                : { display:"block", textAlign:"center", padding:"13px 20px", borderRadius:10, border:`1px solid rgba(0,0,0,0.14)`, color:G1, fontSize:14, fontWeight:600, textDecoration:"none", background:"transparent" }
              }>
                {t.cta}
              </a>
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
    { q:"Are the leads real people at real companies?", a:"Yes. Outleadrr pulls real business data directly from Google Maps via the Places API. Company names, addresses, phone numbers and ratings are 100% real. Contact names and emails are AI-generated to match the business — we recommend verifying emails before sending at scale." },
    { q:"How personalised are the cold emails?", a:"Each email is written by GPT and tailored to the prospect's company name, industry, location, and role. They read like they were written by a human sales rep — not a template blast." },
    { q:"Does it actually send from my Gmail?", a:"Yes. When you connect Gmail via OAuth, emails are sent directly from your own inbox using the Gmail API. Recipients see your real email address, which dramatically improves deliverability and trust." },
    { q:"What industries and locations does it support?", a:"Any industry, any city. You can search for plumbers in Houston, dentists in London, law firms in Toronto — any niche and any location worldwide." },
    { q:"Can I export my leads to a spreadsheet?", a:"Yes. After generating leads, click Export CSV to download a spreadsheet with all lead data — company, contact, email, phone, website, address, rating, score, and more." },
    { q:"Can I cancel my subscription anytime?", a:"Absolutely. No contracts, no lock-in, no cancellation fees. Cancel at any time from your account settings." },
  ];
  return (
    <section id="faq" style={{ padding:"100px 32px", maxWidth:760, margin:"0 auto" }}>
      <A style={{ textAlign:"center", marginBottom:72 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:G3, marginBottom:14 }}>FAQ</p>
        <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-0.04em", color:G1, lineHeight:1.05 }}>
          Frequently asked questions.
        </h2>
      </A>
      <div>
        {faqs.map((f, i) => (
          <div key={i} className="faq-item">
            <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
              <span style={{ fontSize:15, fontWeight:600, color:G1, letterSpacing:"-0.01em" }}>{f.q}</span>
              <span style={{ fontSize:22, color: open === i ? IND : G3, flexShrink:0, transform: open === i ? "rotate(45deg)" : "none", transition:"transform 0.25s, color 0.2s", display:"inline-block", lineHeight:1 }}>+</span>
            </button>
            <div className={`faq-body ${open === i ? "open" : "closed"}`}>
              <div style={{ paddingBottom:24 }}>
                <p style={{ fontSize:14, color:G2, lineHeight:1.8 }}>{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${BDR}`, background:WHT }}>
      <div style={{ maxWidth:1160, margin:"0 auto", padding:"56px 32px 36px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:40, marginBottom:56 }}>
          <div style={{ maxWidth:240 }}>
            <img src={logoSrc} alt="Outleadrr" style={{ height:30, width:"auto", marginBottom:14 }} />
            <p style={{ fontSize:13, color:G2, lineHeight:1.7 }}>AI-powered lead generation and cold email outreach. Find your next 10 clients in seconds.</p>
          </div>
          <div style={{ display:"flex", gap:56, flexWrap:"wrap" }}>
            {[
              { heading:"Product", links:[{ label:"Features", href:"#features" }, { label:"Pricing", href:"#pricing" }, { label:"FAQ", href:"#faq" }] },
              { heading:"Account", links:[{ label:"Sign up", href:"/signup" }, { label:"Log in", href:"/login" }] },
              { heading:"Legal", links:[{ label:"Privacy", href:"#" }, { label:"Terms", href:"#" }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:G3, marginBottom:16 }}>{col.heading}</div>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:11 }}>
                  {col.links.map(l => (
                    <li key={l.label}>
                      <a href={l.href} style={{ fontSize:13, color:G2, textDecoration:"none", transition:"color 0.15s" }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=G1}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=G2}
                      >{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height:1, background:BDR, marginBottom:24 }} />
        <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <p style={{ fontSize:12, color:G3 }}>© {new Date().getFullYear()} Outleadrr. All rights reserved.</p>
          <p style={{ fontSize:12, color:G3 }}>Built with AI · Powered by Google Maps + GPT</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Dashboard (main export) ────────────────────────────────────── */
export default function Dashboard() {
  return (
    <>
      <style>{CSS}</style>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ padding:"120px 32px 0", textAlign:"center", overflow:"visible" }}>
        <div style={{ maxWidth:840, margin:"0 auto" }}>
          {/* Badge */}
          <div className="h-in" style={{ animationDelay:"0.05s", display:"inline-flex", alignItems:"center", gap:7, padding:"6px 16px", borderRadius:99, background:G4, border:`1px solid ${BDR}`, fontSize:12, fontWeight:500, color:G2, marginBottom:32 }}>
            <span className="pdot" style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", flexShrink:0 }} />
            AI-Powered B2B Lead Generation
          </div>

          {/* Headline */}
          <h1 className="h-up" style={{ animationDelay:"0.08s", fontSize:"clamp(42px,7vw,84px)", fontWeight:800, color:G1, letterSpacing:"-0.05em", lineHeight:0.97, marginBottom:28 }}>
            Find your next<br />
            <span style={{ color:"transparent", backgroundImage:`linear-gradient(135deg, ${IND} 0%, #a855f7 100%)`, WebkitBackgroundClip:"text", backgroundClip:"text" }}>10 clients</span>
            <br />in 30 seconds.
          </h1>

          {/* Subtitle */}
          <p className="h-up" style={{ animationDelay:"0.18s", fontSize:18, color:G2, lineHeight:1.7, maxWidth:500, margin:"0 auto 40px" }}>
            Enter a business type and city. Get qualified prospects with personalised cold emails — ready to send from your Gmail in one click.
          </p>

          {/* CTAs */}
          <div className="h-up" style={{ animationDelay:"0.26s", display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/signup" className="btn-lg" style={{ textDecoration:"none" }}>Generate leads free →</a>
            <a href="/login" className="btn-ghost" style={{ fontSize:15, padding:"15px 28px", borderRadius:12 }}>Log in</a>
          </div>

          {/* Stats row */}
          <div className="h-up" style={{ animationDelay:"0.34s", display:"flex", gap:40, justifyContent:"center", marginTop:52, flexWrap:"wrap" }}>
            {[{ n:"2,000+", l:"businesses using it" }, { n:"30 sec", l:"avg to 10 leads" }, { n:"100%", l:"real Google Maps data" }].map(s => (
              <div key={s.n} style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:G1, letterSpacing:"-0.04em" }}>{s.n}</div>
                <div style={{ fontSize:12, color:G3, marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero mockup — full-width visual anchor */}
        <div className="h-up" style={{ animationDelay:"0.42s", maxWidth:1060, margin:"72px auto 0", padding:"0 20px", position:"relative" }}>
          <HeroMockup />
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${BDR}`, borderBottom:`1px solid ${BDR}`, padding:"18px 0", marginTop:80, overflow:"hidden", background:G4 }}>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[
              "Real Google Maps data",
              "AI-written cold emails",
              "One-click Gmail sending",
              "Lead scoring 0–100",
              "Export to CSV",
              "Any niche, any city",
              "10 leads in 30 seconds",
              "No fake contacts",
              "Real Google Maps data",
              "AI-written cold emails",
              "One-click Gmail sending",
              "Lead scoring 0–100",
              "Export to CSV",
              "Any niche, any city",
              "10 leads in 30 seconds",
              "No fake contacts",
            ].map((t, i) => (
              <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:10, flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:500, color:G2, whiteSpace:"nowrap" }}>{t}</span>
                <span style={{ color:G3, fontSize:16 }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BENTO FEATURE GRID ───────────────────────────────── */}
      <Bento />

      {/* ── COMPARISON ───────────────────────────────────────── */}
      <Comparison />

      {/* ── 3 STEPS ──────────────────────────────────────────── */}
      <Steps />

      {/* ── STATS ────────────────────────────────────────────── */}
      <Stats />

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <Testimonials />

      {/* ── PRICING ──────────────────────────────────────────── */}
      <Pricing />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <FAQ />

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding:"120px 32px", background:BLK, backgroundImage:"radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.2) 0%, transparent 68%)", textAlign:"center" }}>
        <A style={{ maxWidth:560, margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(32px,5vw,56px)", fontWeight:800, color:WHT, letterSpacing:"-0.05em", lineHeight:1.0, marginBottom:18 }}>
            Ready to find your<br />next clients?
          </h2>
          <p style={{ fontSize:17, color:"rgba(255,255,255,0.45)", marginBottom:44, lineHeight:1.65 }}>
            Start for free — no credit card required.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="/signup" style={{ display:"inline-flex", alignItems:"center", padding:"16px 40px", borderRadius:12, background:WHT, color:BLK, fontSize:15, fontWeight:700, letterSpacing:"-0.02em", textDecoration:"none", transition:"all 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.boxShadow="0 10px 36px rgba(255,255,255,0.2)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="none";(e.currentTarget as HTMLElement).style.boxShadow="none";}}
            >
              Create free account →
            </a>
            <a href="/login" style={{ display:"inline-flex", alignItems:"center", padding:"15px 32px", borderRadius:12, background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:500, textDecoration:"none", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.15s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.12)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.85)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.07)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.6)";}}
            >
              Log in
            </a>
          </div>
        </A>
      </section>

      <Footer />
    </>
  );
}
