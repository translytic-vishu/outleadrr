import logoSrc from "@assets/outleadr_1773257073565.png";
import { useState } from "react";

const S = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BG = "#F5F5F5";
const WHITE = "#ffffff";
const INK = "#0f0f0f";
const INK2 = "#555";
const INK3 = "#999";
const BORDER = "rgba(0,0,0,0.07)";
const ACCENT = "#6366f1";

const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${BG}; color: ${INK}; font-family: ${S}; }
  a, button { font-family: ${S}; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .hero-fade { animation: fadeIn 0.7s ease both; }
  .hero-up   { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .pill-btn {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:14px 32px;border-radius:99px;
    background:${INK};color:${WHITE};border:none;
    font-family:${S};font-weight:600;font-size:15px;letter-spacing:-0.01em;
    cursor:pointer;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
    box-shadow:0 1px 3px rgba(0,0,0,0.12);text-decoration:none;
  }
  .pill-btn:hover{background:#222;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.18);}
  .pill-btn:active{transform:translateY(0);}
  .outline-btn {
    display:inline-flex;align-items:center;gap:6px;
    padding:10px 20px;border-radius:99px;
    background:transparent;color:${INK};border:1px solid rgba(0,0,0,0.18);
    font-family:${S};font-weight:500;font-size:13px;
    cursor:pointer;transition:background 0.15s;text-decoration:none;
  }
  .outline-btn:hover{background:rgba(0,0,0,0.04);}
  .feature-card{background:${WHITE};border-radius:16px;border:1px solid ${BORDER};padding:28px;transition:box-shadow 0.2s,transform 0.2s;}
  .feature-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-2px);}
  .pricing-card{background:${WHITE};border-radius:20px;border:1px solid ${BORDER};padding:32px;transition:box-shadow 0.2s;}
  .pricing-card.featured{background:${INK};color:${WHITE};border-color:${INK};}
  .faq-item{border-bottom:1px solid ${BORDER};overflow:hidden;}
  .faq-btn{width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 0;background:none;border:none;cursor:pointer;text-align:left;gap:16px;}
  .faq-content{overflow:hidden;transition:max-height 0.32s cubic-bezier(0.16,1,0.3,1),opacity 0.28s ease;}
  .faq-content.open{max-height:200px;opacity:1;}
  .faq-content.closed{max-height:0;opacity:0;}
  .stat-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:99px;background:${WHITE};border:1px solid rgba(0,0,0,0.07);font-size:12px;font-weight:500;color:${INK2};white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
  .stat-pill .dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0;}
  @media(max-width:768px){
    .three-col{grid-template-columns:1fr !important;}
    .how-grid{grid-template-columns:1fr !important;}
    .how-arrow{display:none !important;}
    .stat-row{flex-wrap:wrap !important;justify-content:center !important;}
  }
`;

const Sec = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <section style={{ padding: "80px 32px", maxWidth: 1100, margin: "0 auto", ...style }}>
    {children}
  </section>
);

const SectionLabel = ({ children }: { children: string }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3, marginBottom: 12 }}>{children}</div>
);

const SectionHeading = ({ children, center }: { children: React.ReactNode; center?: boolean }) => (
  <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: INK, letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 16, textAlign: center ? "center" : "left" }}>
    {children}
  </h2>
);

/* ─── product mockup ─────────────────────────────────────────────── */
function ProductMockup() {
  const rows = [
    { n: "01", co: "RiverCity Plumbing Co.", name: "James Holloway", email: "james@rivercityplumbing.com", score: 87 },
    { n: "02", co: "Houston Pipe Masters", name: "Sandra Lee", email: "sandra@houstonpipe.com", score: 74 },
    { n: "03", co: "Lone Star Plumbing LLC", name: "Carlos Reyes", email: "carlos@lonestarplumbing.com", score: 81 },
    { n: "04", co: "Bayou City Drain Pros", name: "Michelle Park", email: "michelle@bayoudrain.com", score: 69 },
    { n: "05", co: "Premier Flow Systems", name: "David Chen", email: "david@premierflow.com", score: 92 },
  ];
  const scoreColor = (s: number) => s >= 80 ? "#16a34a" : s >= 60 ? "#ea580c" : "#dc2626";
  const scoreBg = (s: number) => s >= 80 ? "rgba(22,163,74,0.15)" : s >= 60 ? "rgba(234,88,12,0.15)" : "rgba(220,38,38,0.15)";
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.12),0 40px 80px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.1)", background: "#0d0d10", maxWidth: 860, margin: "0 auto", userSelect: "none", pointerEvents: "none" }}>
      {/* browser chrome */}
      <div style={{ background: "#18181b", padding: "11px 18px", display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, height: 24, background: "#0d0d10", borderRadius: 6, margin: "0 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: S }}>outleadrr.app</span>
        </div>
      </div>
      {/* toolbar */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: S, marginBottom: 2 }}>RESULTS</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: S }}>10 plumbers · Houston, TX</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: S }}>Export CSV</div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "#fff", fontSize: 12, color: "#000", fontWeight: 600, fontFamily: S }}>Send all via Gmail</div>
        </div>
      </div>
      {/* table header */}
      <div style={{ padding: "10px 24px", display: "grid", gridTemplateColumns: "36px 1fr 200px 60px 60px", gap: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["#", "Company", "Email", "Score", "Status"].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: S }}>{h}</span>
        ))}
      </div>
      {/* rows */}
      <div style={{ padding: "4px 24px 16px" }}>
        {rows.map((r, idx) => (
          <div key={r.n} style={{ display: "grid", gridTemplateColumns: "36px 1fr 200px 60px 60px", gap: "0 16px", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", opacity: idx >= 4 ? 0.3 : 1 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: S }}>{r.n}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: S }}>{r.co}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: S }}>{r.name}</div>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{r.email}</span>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: scoreBg(r.score) }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(r.score), fontFamily: S }}>{r.score}</span>
            </div>
            <div style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", display: "inline-flex" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: S }}>New</span>
            </div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 200px 60px 60px", gap: "0 16px", padding: "11px 0", alignItems: "center", opacity: 0.12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: S }}>06</span>
          <span style={{ fontSize: 13, color: "#fff", fontFamily: S }}>Austin Pipe & Drain Services</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>info@austinpipe.com</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", fontFamily: S }}>—</span>
          <div style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", display: "inline-flex" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: S }}>New</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── social proof / stat pills ─────────────────────────────────── */
function SocialProof() {
  const stats = [
    { dot: "#22c55e", text: "Real Google Maps data — no fake lists" },
    { dot: "#6366f1", text: "10 qualified leads in under 30 seconds" },
    { dot: "#f59e0b", text: "Emails sent directly from your Gmail" },
    { dot: "#3b82f6", text: "AI-written, personalized for each business" },
    { dot: "#ec4899", text: "Works for any niche, any city worldwide" },
  ];
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: WHITE, padding: "28px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 20 }}>
          What makes Outleadrr different
        </p>
        <div className="stat-row" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.text} className="stat-pill">
              <span className="dot" style={{ background: s.dot }} />
              {s.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── how it works ─ ui mockup helpers ──────────────────────────── */
const MockChrome = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
    <div style={{ background: "#f3f4f6", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", gap: 5 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f87171" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#fbbf24" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#34d399" }} />
      </div>
      <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 6, padding: "3px 10px", fontSize: 9, color: "#9ca3af", fontFamily: "monospace" }}>outleadrr.app</div>
    </div>
    {children}
  </div>
);

const Step1Mock = () => (
  <MockChrome>
    <div style={{ padding: "18px", background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontWeight: 800, fontSize: 11, color: INK, letterSpacing: "-0.02em" }}>Outleadrr</div>
        <div style={{ fontSize: 9, background: "#f3f4f6", padding: "3px 8px", borderRadius: 99, color: "#6b7280" }}>Free plan</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: INK, marginBottom: 10 }}>Find new prospects</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Business type</div>
          <div style={{ background: "#fff", border: `1.5px solid ${ACCENT}`, borderRadius: 7, padding: "6px 9px", fontSize: 10, color: INK, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: ACCENT }}>🔍</span> Plumbers
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>City / Region</div>
          <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 7, padding: "6px 9px", fontSize: 10, color: INK }}>Dallas, TX</div>
        </div>
        <div style={{ background: INK, borderRadius: 7, padding: "7px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginTop: 4 }}>
          Find prospects →
        </div>
      </div>
    </div>
  </MockChrome>
);

const Step2Mock = () => {
  const leads = [
    { name: "Mike Torres", co: "Torres Plumbing", email: "mike@torresplumbing.com", score: 88 },
    { name: "Sarah Chen", co: "DFW Drain Pros", email: "s.chen@dfwdrain.com", score: 75 },
    { name: "James Okafor", co: "Lone Star Pipe", email: "james@lspipe.com", score: 91 },
  ];
  const sc = (s: number) => s >= 80 ? "#16a34a" : "#ea580c";
  return (
    <MockChrome>
      <div style={{ padding: "14px", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: INK }}>10 leads found</div>
          <div style={{ fontSize: 8, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "2px 7px", fontWeight: 600 }}>✓ AI complete</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 0.5fr", gap: 4, borderBottom: "1px solid #e5e7eb", paddingBottom: 5, marginBottom: 5 }}>
          {["Name", "Company", "Email", "Score"].map(h => (
            <div key={h} style={{ fontSize: 7, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
        {leads.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 0.5fr", gap: 4, padding: "5px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: INK }}>{l.name}</div>
            <div style={{ fontSize: 9, color: "#6b7280" }}>{l.co}</div>
            <div style={{ fontSize: 8, color: ACCENT }}>{l.email}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: sc(l.score) }}>{l.score}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 8, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <span>+7 more</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>
      </div>
    </MockChrome>
  );
};

const Step3Mock = () => (
  <MockChrome>
    <div style={{ padding: "14px", background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: INK }}>AI-written email</div>
        <div style={{ fontSize: 8, color: "#9ca3af" }}>Mike Torres</div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px", marginBottom: 9, fontSize: 8, color: "#374151", lineHeight: 1.6 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: INK, marginBottom: 4 }}>Subject: Quick question about Torres Plumbing</div>
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 6, color: "#6b7280" }}>
          Hi Mike,<br /><br />
          I noticed Torres Plumbing has been serving Dallas for years — impressive reputation.<br /><br />
          I help plumbing businesses get more commercial contracts using targeted outreach. Would you be open to a quick 10-min call?
          <br /><br />
          <span style={{ color: INK, fontWeight: 600 }}>Best, Alex</span>
        </div>
      </div>
      <div style={{ background: "#16a34a", borderRadius: 7, padding: "7px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <span style={{ fontSize: 9 }}>✓</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Sent via Gmail</span>
      </div>
    </div>
  </MockChrome>
);

function HowItWorks() {
  const steps = [
    { n: 1, title: "Enter your target", desc: "Type the business category and city you want to reach. Plumbers in Dallas, lawyers in Chicago — any niche, any location.", accentColor: ACCENT, mock: <Step1Mock /> },
    { n: 2, title: "AI finds qualified leads", desc: "Our AI surfaces real, qualified prospects from Google Maps — company name, contact, email, and job title — instantly.", accentColor: "#a855f7", mock: <Step2Mock /> },
    { n: 3, title: "Send emails instantly", desc: "Each prospect gets a personalised cold email written by GPT. Connect your Gmail and hit send — one click away.", accentColor: "#22c55e", mock: <Step3Mock /> },
  ];
  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <Sec>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading center>Three steps to your next clients</SectionHeading>
          <p style={{ fontSize: 16, color: INK2, maxWidth: 460, margin: "12px auto 0" }}>Simple enough to start in 30 seconds. Powerful enough to replace your entire outbound process.</p>
        </div>
        <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr 40px 1fr", gap: 0, alignItems: "start" }}>
          {steps.flatMap((s, i) => {
            const col = (
              <div key={`step-${s.n}`} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {s.mock}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: "-0.03em", marginBottom: 8, display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: s.accentColor, color: "#fff", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: INK2, lineHeight: 1.75 }}>{s.desc}</p>
                </div>
              </div>
            );
            const arrow = i < steps.length - 1 ? (
              <div key={`arrow-${i}`} className="how-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                  <path d="M1 10 Q8 5, 16 10 Q24 15, 31 10" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M26 6 L31 10 L26 14" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            ) : null;
            return arrow ? [col, arrow] : [col];
          })}
        </div>
      </Sec>
    </div>
  );
}

/* ─── features ───────────────────────────────────────────────────── */
function Features() {
  const cards = [
    { icon: "🔍", title: "Find Real Leads", desc: "No fake data, no scraped lists. Every lead is a real business pulled from Google Maps — with ratings, reviews, and contact info." },
    { icon: "✍️", title: "AI-Written Emails", desc: "Each cold email is personalised to the prospect's company and role. Written in seconds by GPT. Ready to send immediately." },
    { icon: "📨", title: "One-Click Send", desc: "Connect your Gmail and send every personalised email directly from your own inbox in one click. No copy-pasting, no tools." },
    { icon: "📊", title: "Lead Scoring", desc: "Every lead gets a quality score (0–100) based on industry fit, business size, reachability, and review health." },
    { icon: "⬇️", title: "Export to CSV", desc: "Download your full lead list as a CSV file to import into any CRM — HubSpot, Notion, Airtable, Google Sheets." },
    { icon: "⚡", title: "30-Second Results", desc: "From typing your search to having 10 qualified leads with personalised emails ready to send — under 30 seconds." },
  ];
  return (
    <Sec id="features">
      <div style={{ marginBottom: 48 }}>
        <SectionLabel>Features</SectionLabel>
        <SectionHeading>Everything you need to<br />land new business</SectionHeading>
        <p style={{ fontSize: 16, color: INK2, maxWidth: 440 }}>Built for solo founders, agencies, and sales teams who want results fast.</p>
      </div>
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {cards.map(c => (
          <div key={c.title} className="feature-card">
            <div style={{ fontSize: 28, marginBottom: 16 }}>{c.icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: "-0.02em", marginBottom: 8 }}>{c.title}</h3>
            <p style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ─── testimonials ───────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { stars: 5, quote: "I used Outleadrr to find 10 HVAC companies in Phoenix and booked 2 calls within 3 days. The emails were so personalised I had to double-check they weren't written by me.", name: "Marcus T.", role: "Freelance B2B Copywriter", avatarColor: "#6366f1", initial: "M" },
    { stars: 5, quote: "We replaced our entire cold outreach stack with this. It does in 30 seconds what used to take our team half a day. Incredible ROI for a $29/month tool.", name: "Priya S.", role: "Founder, Scale Studio", avatarColor: "#a855f7", initial: "P" },
    { stars: 5, quote: "The emails don't sound like AI at all. Got a 28% reply rate on my first batch. No other tool has come close to that for cold outreach.", name: "Daniel K.", role: "Sales Director, GrowthPath", avatarColor: "#22c55e", initial: "D" },
  ];
  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <Sec>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <SectionLabel>Testimonials</SectionLabel>
          <SectionHeading center>Loved by sales teams everywhere</SectionHeading>
        </div>
        <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {reviews.map(r => (
            <div key={r.name} style={{ background: BG, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "28px" }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {Array.from({ length: r.stars }).map((_, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>"{r.quote}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: r.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{r.initial}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: INK3 }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}

/* ─── pricing ────────────────────────────────────────────────────── */
function Pricing() {
  const tiers = [
    {
      name: "Free", price: "$0", period: "forever", featured: false,
      desc: "Perfect for trying Outleadrr and getting your first leads.",
      features: ["10 leads per month", "AI-written cold emails", "Copy emails to clipboard", "5 example searches"],
      cta: "Start for free", href: "/signup",
    },
    {
      name: "Pro", price: "$29", period: "/ month", featured: true,
      desc: "For founders and salespeople who need a steady stream of leads.",
      features: ["Unlimited lead generation", "AI-written cold emails", "One-click Gmail sending", "Export to CSV", "Priority AI processing"],
      cta: "Start Pro →", href: "/signup",
    },
    {
      name: "Business", price: "$99", period: "/ month", featured: false,
      desc: "For teams scaling outbound across multiple verticals.",
      features: ["Everything in Pro", "Up to 5 team seats", "Shared lead history", "Dedicated support", "Custom email templates"],
      cta: "Talk to us →", href: "/signup",
    },
  ];
  return (
    <Sec id="pricing">
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <SectionLabel>Pricing</SectionLabel>
        <SectionHeading center>Simple, transparent pricing</SectionHeading>
        <p style={{ fontSize: 16, color: INK2 }}>No hidden fees. Cancel anytime.</p>
      </div>
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
        {tiers.map(t => (
          <div key={t.name} className={`pricing-card${t.featured ? " featured" : ""}`} style={{ position: "relative" }}>
            {t.featured && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: ACCENT, border: "2px solid #fff", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.featured ? "rgba(255,255,255,0.6)" : INK3, marginBottom: 8 }}>{t.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: t.featured ? WHITE : INK }}>{t.price}</span>
                <span style={{ fontSize: 14, color: t.featured ? "rgba(255,255,255,0.5)" : INK3 }}>{t.period}</span>
              </div>
              <p style={{ fontSize: 13, color: t.featured ? "rgba(255,255,255,0.6)" : INK2, lineHeight: 1.6 }}>{t.desc}</p>
            </div>
            <div style={{ height: 1, background: t.featured ? "rgba(255,255,255,0.12)" : BORDER, marginBottom: 20 }} />
            <ul style={{ listStyle: "none", marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              {t.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: t.featured ? "rgba(255,255,255,0.85)" : INK2 }}>
                  <span style={{ color: t.featured ? "#86efac" : "#16a34a", fontSize: 14, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href={t.href}
              style={t.featured
                ? { display: "block", textAlign: "center", padding: "13px 20px", borderRadius: 10, background: WHITE, color: INK, fontSize: 14, fontWeight: 700, textDecoration: "none" }
                : { display: "block", textAlign: "center", padding: "12px 20px", borderRadius: 10, border: `1px solid rgba(0,0,0,0.15)`, color: INK, fontSize: 14, fontWeight: 600, textDecoration: "none", background: "transparent" }
              }>
              {t.cta}
            </a>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ─── faq ────────────────────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Are the leads real people at real companies?", a: "Yes. Outleadrr pulls real business data directly from Google Maps via the Places API. Company names, addresses, phone numbers and ratings are 100% real. Contact names and emails are AI-generated to match the business — we recommend verifying emails before sending at scale." },
    { q: "How personalised are the cold emails?", a: "Each email is written by GPT and tailored to the prospect's company name, industry, location, and role. They read like they were written by a human sales rep — not a template blast." },
    { q: "Does it actually send from my Gmail account?", a: "Yes. When you connect Gmail via OAuth, emails are sent directly from your own inbox using the Gmail API. Recipients see your real email address, which dramatically improves deliverability and trust." },
    { q: "What industries or locations does it support?", a: "Any industry, any city. You can search for plumbers in Houston, dentists in London, law firms in Toronto, or anything else. Outleadrr adapts to any niche and any location worldwide." },
    { q: "Can I export my leads to a spreadsheet?", a: "Yes. After generating leads, click the Export CSV button to download a spreadsheet with all lead data — company name, contact, email, phone, website, address, rating, score, and more." },
    { q: "Can I cancel my subscription anytime?", a: "Absolutely. There are no contracts, no lock-in periods, and no cancellation fees. Cancel your Pro or Business subscription at any time from your account settings." },
  ];
  return (
    <div id="faq" style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <Sec style={{ maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionLabel>FAQ</SectionLabel>
          <SectionHeading center>Common questions</SectionHeading>
        </div>
        <div>
          {faqs.map((f, i) => (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
                <span style={{ fontSize: 15, fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>{f.q}</span>
                <span style={{ fontSize: 20, color: open === i ? ACCENT : INK3, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.25s, color 0.2s", display: "inline-block" }}>+</span>
              </button>
              <div className={`faq-content ${open === i ? "open" : "closed"}`}>
                <div style={{ paddingBottom: 20 }}>
                  <p style={{ fontSize: 14, color: INK2, lineHeight: 1.75 }}>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}

/* ─── footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BORDER}`, background: WHITE }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 48 }}>
          <div style={{ maxWidth: 260 }}>
            <img src={logoSrc} alt="Outleadrr" style={{ height: 32, width: "auto", marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: INK2, lineHeight: 1.6 }}>AI-powered lead generation and cold email outreach. Find your next 10 clients in seconds.</p>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            {[
              { heading: "Product", links: [{ label: "How it works", href: "#features" }, { label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }] },
              { heading: "Account", links: [{ label: "Sign up", href: "/signup" }, { label: "Log in", href: "/login" }] },
              { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Cookie Policy", href: "#" }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK3, marginBottom: 16 }}>{col.heading}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: INK2, textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.color = INK)} onMouseLeave={e => (e.currentTarget.style.color = INK2)}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: INK3 }}>© {new Date().getFullYear()} Outleadrr. All rights reserved.</p>
          <p style={{ fontSize: 12, color: INK3 }}>Built with ♥ and GPT</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── landing page ───────────────────────────────────────────────── */
export default function Dashboard() {
  return (
    <>
      <style>{GLOBAL}</style>

      {/* ── navbar ─────────────────────────────────────────────── */}
      <header style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <img src={logoSrc} alt="Outleadrr" style={{ height: 32, width: "auto" }} />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["Features", "Pricing", "FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: "none", padding: "6px 12px" }}
                onMouseEnter={e => (e.currentTarget.style.color = INK)} onMouseLeave={e => (e.currentTarget.style.color = INK2)}>{l}</a>
            ))}
            <a href="/login" className="outline-btn" style={{ textDecoration: "none", marginLeft: 8 }}>Log in</a>
            <a href="/signup" className="pill-btn" style={{ padding: "9px 22px", fontSize: 13, textDecoration: "none" }}>Sign up free</a>
          </nav>
        </div>
      </header>

      {/* ── hero ───────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "96px 32px 72px", maxWidth: 780, margin: "0 auto" }}>
        <div className="hero-fade" style={{ animationDelay: "0.05s", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 99, background: WHITE, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 500, color: INK2, marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          AI-Powered · Qualified Leads in Seconds
        </div>
        <h1 className="hero-up" style={{ animationDelay: "0.1s", fontSize: "clamp(38px,6vw,68px)", fontWeight: 800, color: INK, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 22 }}>
          The #1{" "}
          <span style={{ color: ACCENT }}>AI Sales Tool</span>
          <br />for Finding Clients
        </h1>
        <p className="hero-up" style={{ animationDelay: "0.2s", fontSize: 18, color: INK2, lineHeight: 1.65, maxWidth: 520, margin: "0 auto 36px" }}>
          Enter a business type and city. Find qualified prospects with personalised cold emails — ready to send from your Gmail in one click.
        </p>
        <div className="hero-up" style={{ animationDelay: "0.28s", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/signup" className="pill-btn" style={{ padding: "15px 38px", fontSize: 15, textDecoration: "none" }} data-testid="button-hero-cta">
            Generate leads free →
          </a>
          <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "15px 28px", borderRadius: 99, background: "rgba(0,0,0,0.05)", color: INK2, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Log in
          </a>
        </div>
        {/* stats row */}
        <div className="hero-up stat-row" style={{ animationDelay: "0.38s", display: "flex", gap: 24, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          {[
            { n: "2,000+", label: "businesses using it" },
            { n: "30 sec", label: "average to 10 leads" },
            { n: "100%", label: "real Google Maps data" },
          ].map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: "-0.04em" }}>{s.n}</div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── mockup ─────────────────────────────────────────────── */}
      <section className="hero-up" style={{ animationDelay: "0.36s", padding: "0 32px 0", maxWidth: 960, margin: "0 auto" }}>
        <ProductMockup />
      </section>

      <div style={{ marginTop: 64 }}><SocialProof /></div>

      <div id="features"><HowItWorks /></div>

      <Features />

      <Testimonials />

      <div id="pricing"><Pricing /></div>

      <FAQ />

      {/* ── CTA section ────────────────────────────────────────── */}
      <div style={{ background: INK, backgroundImage: "radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.25) 0%, transparent 70%)", padding: "80px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: WHITE, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16 }}>
            Ready to find your next clients?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
            Start for free — no credit card required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "14px 36px", borderRadius: 99, background: WHITE, color: INK, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", textDecoration: "none" }}
              data-testid="button-cta-signup">
              Create free account →
            </a>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "14px 28px", borderRadius: 99, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Log in
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
