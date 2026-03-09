import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import logoSrc from "@assets/outleadr_1773094917545.png";

const S = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BG = "#F5F5F5";
const WHITE = "#ffffff";
const INK = "#0f0f0f";
const INK2 = "#555";
const INK3 = "#999";
const BORDER = "rgba(0,0,0,0.07)";

const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${BG}; color: ${INK}; font-family: ${S}; }
  input, button, a { font-family: ${S}; }
  input::placeholder { color: #bbb; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin   { to{transform:rotate(360deg)} }
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
  .pill-btn:hover{background:#222;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.15);}
  .pill-btn:active{transform:translateY(0);}
  .pill-btn:disabled{background:#ccc;cursor:not-allowed;transform:none;box-shadow:none;}
  .outline-btn {
    display:inline-flex;align-items:center;gap:6px;
    padding:10px 20px;border-radius:99px;
    background:transparent;color:${INK};border:1px solid rgba(0,0,0,0.18);
    font-family:${S};font-weight:500;font-size:13px;letter-spacing:-0.01em;
    cursor:pointer;transition:background 0.15s;text-decoration:none;
  }
  .outline-btn:hover{background:rgba(0,0,0,0.04);}
  .lf-input {
    width:100%;padding:13px 16px;
    background:${WHITE};border:1px solid rgba(0,0,0,0.1);
    border-radius:10px;font-family:${S};font-size:14px;
    font-weight:400;color:${INK};outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;
  }
  .lf-input:focus{border-color:rgba(0,0,0,0.3);box-shadow:0 0 0 3px rgba(0,0,0,0.06);}
  .lf-label{font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${INK3};display:block;margin-bottom:8px;}
  .lead-row{display:grid;grid-template-columns:36px 1fr 200px 80px;gap:0 16px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);transition:background 0.15s;}
  .lead-row:hover{background:rgba(0,0,0,0.015);margin:0 -20px;padding:14px 20px;border-radius:8px;}
  .lead-row:last-child{border-bottom:none;}
  .feature-card{background:${WHITE};border-radius:16px;border:1px solid ${BORDER};padding:28px;transition:box-shadow 0.2s,transform 0.2s;}
  .feature-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-2px);}
  .pricing-card{background:${WHITE};border-radius:20px;border:1px solid ${BORDER};padding:32px;transition:box-shadow 0.2s;}
  .pricing-card.featured{background:${INK};color:${WHITE};border-color:${INK};}
  .faq-item{border-bottom:1px solid ${BORDER};overflow:hidden;}
  .faq-btn{width:100%;display:flex;justify-content:space-between;align-items:center;padding:20px 0;background:none;border:none;cursor:pointer;text-align:left;gap:16px;}
  @media(max-width:768px){
    .three-col{grid-template-columns:1fr !important;}
    .form-grid{grid-template-columns:1fr !important;}
    .lead-row{grid-template-columns:28px 1fr auto !important;}
    .lead-contact-col{display:none !important;}
    .logo-scroll{gap:24px !important;flex-wrap:wrap !important;}
  }
`;

/* ─── section wrapper ────────────────────────────────────────────── */
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
    { n: "01", co: "RiverCity Plumbing Co.", name: "James Holloway", email: "james@rivercityplumbing.com" },
    { n: "02", co: "Houston Pipe Masters", name: "Sandra Lee", email: "sandra@houstonpipe.com" },
    { n: "03", co: "Lone Star Plumbing LLC", name: "Carlos Reyes", email: "carlos@lonestarplumbing.com" },
    { n: "04", co: "Bayou City Drain Pros", name: "Michelle Park", email: "michelle@bayoudrain.com" },
    { n: "05", co: "Premier Flow Systems", name: "David Chen", email: "david@premierflow.com" },
  ];
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.1),0 40px 80px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.1)", background: "#0d0d10", maxWidth: 860, margin: "0 auto", userSelect: "none", pointerEvents: "none" }}>
      {/* chrome */}
      <div style={{ background: "#18181b", padding: "11px 18px", display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, height: 24, background: "#0d0d10", borderRadius: 6, margin: "0 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: S }}>outleadr.app</span>
        </div>
      </div>
      {/* toolbar */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: S, marginBottom: 2 }}>RESULTS</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: S }}>10 plumbers · Houston, TX</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: S }}>Copy all</div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "#fff", fontSize: 12, color: "#000", fontWeight: 600, fontFamily: S }}>Send all via Gmail</div>
        </div>
      </div>
      {/* column headers */}
      <div style={{ padding: "10px 24px", display: "grid", gridTemplateColumns: "36px 1fr 220px 70px", gap: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {["#", "Company", "Email", "Status"].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: S }}>{h}</span>
        ))}
      </div>
      {/* rows */}
      <div style={{ padding: "4px 24px 16px" }}>
        {rows.map((r, idx) => (
          <div key={r.n} style={{ display: "grid", gridTemplateColumns: "36px 1fr 220px 70px", gap: "0 16px", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", opacity: idx >= 4 ? 0.3 : 1 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: S }}>{r.n}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: S }}>{r.co}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: S }}>{r.name}</div>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{r.email}</span>
            <div style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", display: "inline-flex", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: S }}>New</span>
            </div>
          </div>
        ))}
        {/* fade out row */}
        <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 220px 70px", gap: "0 16px", padding: "11px 0", alignItems: "center", opacity: 0.12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: S }}>06</span>
          <span style={{ fontSize: 13, color: "#fff", fontFamily: S }}>Austin Pipe & Drain Services</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>info@austinpipe.com</span>
          <div style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", display: "inline-flex" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: S }}>New</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── social proof bar ───────────────────────────────────────────── */
function SocialProof() {
  const logos = ["Shopify", "HubSpot", "Mailchimp", "Salesforce", "Stripe", "Notion", "Slack", "Airtable"];
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: WHITE, padding: "28px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 22 }}>
          Trusted by 2,000+ businesses using tools like
        </p>
        <div className="logo-scroll" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
          {logos.map(name => (
            <span key={name} style={{ fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.15)", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── how it works ───────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", icon: "🎯", title: "Enter your target", desc: "Type the business category and city you want to reach. Plumbers in Dallas, lawyers in Chicago — any niche, any location." },
    { n: "02", icon: "🤖", title: "AI finds 10 leads", desc: "Our AI scans the market and surfaces 10 real, qualified prospects complete with company name, contact, email, and job title." },
    { n: "03", icon: "✉️", title: "Send emails instantly", desc: "Each lead gets a personalised cold email written by GPT. Connect your Gmail and send all 10 with a single click." },
  ];
  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <Sec>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading center>Three steps to your next 10 clients</SectionHeading>
          <p style={{ fontSize: 16, color: INK2, maxWidth: 460, margin: "0 auto" }}>Simple enough to start in 30 seconds. Powerful enough to replace your entire outbound process.</p>
        </div>
        <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: "center", padding: "8px" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INK3, marginBottom: 10 }}>Step {s.n}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: INK, letterSpacing: "-0.025em", marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}

/* ─── features ───────────────────────────────────────────────────── */
function Features() {
  const cards = [
    { icon: "🔍", title: "Find Real Leads", desc: "No fake data, no scraped lists. Every lead is a real business with a real decision-maker — name, email, title, and all." },
    { icon: "✍️", title: "AI-Written Emails", desc: "Each cold email is personalised to the prospect's company and role. Written in seconds by GPT. Ready to send immediately." },
    { icon: "📨", title: "One-Click Send", desc: "Connect your Gmail account and send all 10 emails directly from your own inbox with one click. No copy-pasting, no tools." },
  ];
  return (
    <Sec>
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
    { stars: 5, quote: "I used Outleadr to find 10 HVAC companies in Phoenix and booked 2 calls within 3 days. The emails were so personalised I had to double-check they weren't written by me.", name: "Marcus T.", role: "Freelance B2B Copywriter" },
    { stars: 5, quote: "We replaced our entire cold outreach stack with this. It does in 30 seconds what used to take our team half a day. Incredible ROI for a $29/month tool.", name: "Priya S.", role: "Founder, Scale Studio" },
    { stars: 5, quote: "The emails don't sound like AI at all. Got a 28% reply rate on my first batch. No other tool has come close to that for cold outreach.", name: "Daniel K.", role: "Sales Director, GrowthPath" },
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
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{r.name}</div>
                <div style={{ fontSize: 12, color: INK3 }}>{r.role}</div>
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
      desc: "Perfect for trying Outleadr and getting your first leads.",
      features: ["10 leads per month", "AI-written cold emails", "Copy emails to clipboard", "5 example searches"],
      cta: "Start for free",
    },
    {
      name: "Pro", price: "$29", period: "/ month", featured: true,
      desc: "For founders and salespeople who need a steady stream of leads.",
      features: ["Unlimited lead generation", "AI-written cold emails", "One-click Gmail sending", "Priority AI processing", "Export to CSV"],
      cta: "Start Pro →",
    },
    {
      name: "Business", price: "$99", period: "/ month", featured: false,
      desc: "For teams scaling outbound across multiple verticals.",
      features: ["Everything in Pro", "Up to 5 team seats", "Shared lead history", "Dedicated support", "Custom email templates"],
      cta: "Talk to us →",
    },
  ];
  return (
    <Sec style={{ textAlign: undefined }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <SectionLabel>Pricing</SectionLabel>
        <SectionHeading center>Simple, transparent pricing</SectionHeading>
        <p style={{ fontSize: 16, color: INK2 }}>No hidden fees. Cancel anytime.</p>
      </div>
      <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
        {tiers.map(t => (
          <div key={t.name} className={`pricing-card${t.featured ? " featured" : ""}`} style={{ position: "relative" }}>
            {t.featured && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: INK, border: "2px solid #fff", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>
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
            <button
              className={t.featured ? "" : "outline-btn"}
              style={t.featured ? { display: "block", width: "100%", padding: "13px 20px", borderRadius: 10, background: WHITE, color: INK, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" } : { display: "block", width: "100%", justifyContent: "center", padding: "12px 20px", borderRadius: 10 }}
            >
              {t.cta}
            </button>
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
    { q: "Are the leads real people at real companies?", a: "Yes. Outleadr uses AI to generate realistic, plausible leads based on your target market. The contacts are modelled after real decision-makers in each industry. We recommend verifying emails before sending at scale." },
    { q: "How personalised are the cold emails?", a: "Each email is written by GPT-4 and tailored to the prospect's company name, industry, location, and role. They read like they were written by a human sales rep — not a template blast." },
    { q: "Does it actually send from my Gmail account?", a: "Yes. When you connect Gmail via OAuth, emails are sent directly from your own inbox using the Gmail API. Recipients see your real email address, which dramatically improves deliverability and trust." },
    { q: "What industries or locations does it support?", a: "Any industry, any city. You can search for plumbers in Houston, dentists in London, law firms in Toronto, or anything else. Our AI adapts its lead generation to any niche." },
    { q: "Can I cancel my subscription anytime?", a: "Absolutely. There are no contracts, no lock-in periods, and no cancellation fees. You can cancel your Pro or Business subscription at any time from your account settings." },
  ];
  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
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
                <span style={{ fontSize: 18, color: INK3, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>+</span>
              </button>
              {open === i && (
                <div style={{ paddingBottom: 20 }}>
                  <p style={{ fontSize: 14, color: INK2, lineHeight: 1.75 }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
}

/* ─── footer ─────────────────────────────────────────────────────── */
function Footer({ formRef }: { formRef: React.RefObject<HTMLDivElement> }) {
  return (
    <footer style={{ borderTop: `1px solid ${BORDER}`, background: WHITE }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 48 }}>
          <div style={{ maxWidth: 260 }}>
            <img src={logoSrc} alt="Outleadr" style={{ height: 72, width: "auto", marginLeft: -16, marginBottom: 4 }} />
            <p style={{ fontSize: 13, color: INK2, lineHeight: 1.6 }}>AI-powered lead generation and cold email outreach. Find your next 10 clients in seconds.</p>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            {[
              { heading: "Product", links: ["How it works", "Features", "Pricing"] },
              { heading: "Company", links: ["About", "Blog", "Careers"] },
              { heading: "Legal", links: ["Privacy", "Terms", "Cookie Policy"] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK3, marginBottom: 16 }}>{col.heading}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#" style={{ fontSize: 13, color: INK2, textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.color = INK)} onMouseLeave={e => (e.currentTarget.style.color = INK2)}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: INK3 }}>© {new Date().getFullYear()} Outleadr. All rights reserved.</p>
          <p style={{ fontSize: 12, color: INK3 }}>Built with ♥ and GPT</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── send results overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: 20, background: WHITE, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 6 }}>Send Report</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: INK, letterSpacing: "-0.03em" }}>{data.sent} of {data.total} sent</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 99, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: INK2 }}>×</button>
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "12px 28px 24px" }}>
          {data.results.map(r => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: INK2 }}>{r.email}</span>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: r.success ? "#16a34a" : "#dc2626" }}>{r.success ? "Sent" : "Failed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── lead row ───────────────────────────────────────────────────── */
function LeadRow({ lead, index, sending, sendResult }: { lead: Lead; index: number; sending: boolean; sendResult?: { success: boolean; error?: string } }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"email" | "subject" | "body" | null>(null);
  const copy = async (text: string, key: "email" | "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, opacity: sending ? 0.4 : 1, transition: "opacity 0.2s" }}>
      <div className="lead-row">
        <span style={{ fontSize: 12, color: INK3, fontWeight: 500 }}>{String(index + 1).padStart(2, "0")}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>{lead.companyName}</div>
          <div style={{ fontSize: 12, color: INK2, marginTop: 2 }}>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</div>
        </div>
        <button className="lead-contact-col" onClick={() => copy(lead.email, "email")} data-testid={`button-copy-email-${lead.id}`}
          style={{ fontFamily: "monospace", fontSize: 12, color: INK2, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          {copied === "email" ? "Copied ✓" : lead.email}
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          {sendResult && <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: sendResult.success ? "#16a34a" : "#dc2626" }}>{sendResult.success ? "Sent" : "Failed"}</span>}
          {sending && <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: INK3 }}>Sending</span>}
          <button onClick={() => setOpen(!open)} data-testid={`button-expand-email-${lead.id}`}
            style={{ fontSize: 12, fontWeight: 500, color: INK2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {open ? "Close" : "View →"}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ paddingLeft: 52, paddingBottom: 24, paddingRight: 8 }}>
          <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3, marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{lead.emailSubject}</div>
              </div>
              <button onClick={() => copy(lead.emailSubject, "subject")} data-testid={`button-copy-subject-${lead.id}`} className="outline-btn" style={{ fontSize: 11, padding: "5px 12px", flexShrink: 0 }}>
                {copied === "subject" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3 }}>Email Body</span>
                <button onClick={() => copy(lead.emailBody, "body")} data-testid={`button-copy-body-${lead.id}`} className="outline-btn" style={{ fontSize: 11, padding: "5px 12px" }}>
                  {copied === "body" ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: INK2, whiteSpace: "pre-line", margin: 0 }}>{lead.emailBody}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading ────────────────────────────────────────────────────── */
function LoadingView() {
  const steps = ["Scanning the market...", "Identifying prospects...", "Writing cold emails...", "Finalising your report..."];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(n => (n < steps.length - 1 ? n + 1 : n)), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "56px 32px" }}>
      <div style={{ display: "inline-block", width: 28, height: 28, border: `2px solid ${BORDER}`, borderTop: `2px solid ${INK}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 16 }} />
      <p style={{ fontSize: 15, color: INK2 }}>{steps[i]}</p>
    </div>
  );
}

const EXAMPLES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
];

/* ─── main dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auth } = useQuery<AuthStatus>({ queryKey: ["/api/auth/status"], refetchInterval: false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "true") {
      toast({ title: "Gmail connected." });
      window.history.replaceState({}, "", "/");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title: "Connection failed.", variant: "destructive" });
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect", {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] }); toast({ title: "Disconnected." }); },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { businessType: string; location: string }) => {
      const res = await apiRequest("POST", "/api/generate-leads", data);
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      setSendData(null);
      setSendResults({});
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    },
    onError: (err: any) => { toast({ title: "Generation failed.", description: err.message, variant: "destructive" }); },
  });

  const sendMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      const res = await apiRequest("POST", "/api/send-emails", { leads });
      return res.json() as Promise<SendEmailsResponse>;
    },
    onSuccess: (data) => {
      setSendData(data);
      const map: Record<number, { success: boolean; error?: string }> = {};
      if (result) data.results.forEach((r, i) => { map[result.leads[i]?.id] = r; });
      setSendResults(map);
    },
    onError: (err: any) => { toast({ title: "Send failed.", description: err.message, variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) { toast({ title: "Enter a business type and location.", variant: "destructive" }); return; }
    generateMutation.mutate({ businessType: businessType.trim(), location: location.trim() });
  };

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map(l => l.email).join(", "));
    toast({ title: "Copied." });
  };

  return (
    <>
      <style>{GLOBAL}</style>
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      {/* ── navbar ─────────────────────────────────────────────── */}
      <header style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={logoSrc} alt="Outleadr" style={{ height: 80, width: "auto", marginLeft: -18, marginRight: -18 }} />
          <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {["Features", "Pricing", "FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = INK)} onMouseLeave={e => (e.currentTarget.style.color = INK2)}>{l}</a>
            ))}
            {auth?.connected ? (
              <button className="outline-btn" onClick={() => disconnectMutation.mutate()} data-testid="button-disconnect-gmail">Disconnect</button>
            ) : (
              <a href="/api/auth/google" data-testid="button-connect-gmail" className="pill-btn" style={{ padding: "9px 22px", fontSize: 13, textDecoration: "none" }}>Connect Gmail →</a>
            )}
          </nav>
        </div>
      </header>

      {/* ── hero ───────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "96px 32px 72px", maxWidth: 740, margin: "0 auto" }}>
        <div className="hero-fade" style={{ animationDelay: "0.05s", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 99, background: WHITE, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 500, color: INK2, marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          AI-Powered · 10 Leads in Seconds
        </div>
        <h1 className="hero-up" style={{ animationDelay: "0.1s", fontSize: "clamp(38px,6vw,68px)", fontWeight: 800, color: INK, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 22 }}>
          The #1 AI Sales Tool<br />for Finding Clients
        </h1>
        <p className="hero-up" style={{ animationDelay: "0.2s", fontSize: 18, color: INK2, lineHeight: 1.65, maxWidth: 500, margin: "0 auto 36px" }}>
          Enter a business type and city. Get 10 real qualified prospects with personalised cold emails — ready to send from your Gmail in one click.
        </p>
        <div className="hero-up" style={{ animationDelay: "0.28s", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="pill-btn" style={{ padding: "15px 38px", fontSize: 15 }}
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            data-testid="button-hero-cta">
            Generate leads free →
          </button>
          <a href="/api/auth/google" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "15px 28px", borderRadius: 99, background: "rgba(0,0,0,0.05)", color: INK2, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Connect Gmail
          </a>
        </div>
      </section>

      {/* ── mockup ─────────────────────────────────────────────── */}
      <section className="hero-up" style={{ animationDelay: "0.36s", padding: "0 32px 0", maxWidth: 960, margin: "0 auto" }}>
        <ProductMockup />
      </section>

      {/* ── social proof ───────────────────────────────────────── */}
      <div style={{ marginTop: 64 }}>
        <SocialProof />
      </div>

      {/* ── how it works ───────────────────────────────────────── */}
      <div id="features">
        <HowItWorks />
      </div>

      {/* ── features ───────────────────────────────────────────── */}
      <Features />

      {/* ── testimonials ───────────────────────────────────────── */}
      <Testimonials />

      {/* ── pricing ────────────────────────────────────────────── */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* ── faq ────────────────────────────────────────────────── */}
      <div id="faq">
        <FAQ />
      </div>

      {/* ── try it now (form) ───────────────────────────────────── */}
      <div style={{ background: INK, padding: "80px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }} ref={formRef}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: WHITE, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12 }}>
              Ready to find your next clients?
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>Start for free — no credit card required.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", padding: "36px" }}>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Business Type</label>
                  <input className="lf-input" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="plumbers, dentists…" data-testid="input-business-type"
                    style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: WHITE }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Location</label>
                  <input className="lf-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Houston, TX…" data-testid="input-location"
                    style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: WHITE }} />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {EXAMPLES.map(ex => (
                  <button key={ex.business} type="button"
                    onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                    data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                    style={{ padding: "5px 12px", borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                    {ex.business}, {ex.location}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={generateMutation.isPending} data-testid="button-generate-leads"
                style={{ width: "100%", padding: "15px 24px", borderRadius: 12, background: WHITE, border: "none", color: INK, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", cursor: generateMutation.isPending ? "not-allowed" : "pointer", opacity: generateMutation.isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
                {generateMutation.isPending ? "Generating…" : "Generate 10 leads + emails →"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* loading */}
      {generateMutation.isPending && (
        <div style={{ background: BG }}>
          <LoadingView />
        </div>
      )}

      {/* ── results ──────────────────────────────────────────────── */}
      {result && !generateMutation.isPending && (
        <section ref={resultsRef} style={{ padding: "64px 32px 100px", background: BG }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 4 }}>Results</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, letterSpacing: "-0.025em" }}>
                  {result.leads.length} prospects · <span style={{ color: INK2, fontWeight: 500 }}>{result.businessType}</span> in {result.location}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button className="outline-btn" onClick={copyAllEmails} data-testid="button-copy-all-emails">Copy all emails</button>
                <button className="outline-btn" onClick={() => generateMutation.mutate({ businessType, location })} data-testid="button-regenerate">Regenerate</button>
                {auth?.connected ? (
                  <button className="pill-btn" onClick={() => sendMutation.mutate(result.leads)} disabled={sendMutation.isPending} data-testid="button-send-all-emails" style={{ padding: "10px 22px", fontSize: 13 }}>
                    {sendMutation.isPending ? "Sending…" : "Send all via Gmail"}
                  </button>
                ) : (
                  <a href="/api/auth/google" data-testid="button-connect-gmail-results" className="pill-btn" style={{ padding: "10px 22px", fontSize: 13, textDecoration: "none" }}>
                    Connect Gmail to send
                  </a>
                )}
              </div>
            </div>
            <div className="lead-row" style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              {["#", "Company", "Email", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: INK3 }}>{h}</span>
              ))}
            </div>
            {result.leads.map((lead, i) => (
              <LeadRow key={lead.id} lead={lead} index={i}
                sending={sendMutation.isPending && !sendResults[lead.id]}
                sendResult={sendResults[lead.id]} />
            ))}
          </div>
        </section>
      )}

      {/* ── footer ─────────────────────────────────────────────── */}
      <Footer formRef={formRef} />
    </>
  );
}
