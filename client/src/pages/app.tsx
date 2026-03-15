import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";

/* ─── Design Tokens ───────────────────────────────────────────────── */
const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const W    = "#ffffff";
const K    = "#0a0a0a";
const K2   = "#3a3a3a";
const K3   = "#888";
const K4   = "#c4c4c8";
const BDR  = "rgba(0,0,0,0.07)";
const BDR2 = "rgba(0,0,0,0.12)";
const IND  = "#6366f1";
const IND2 = "rgba(99,102,241,0.08)";

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{font-family:${F};}
  input,button,select,textarea{font-family:${F};}
  input::placeholder,textarea::placeholder{color:${K4};}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  .cb-input{
    width:100%;padding:10px 14px;
    background:${W};border:1.5px solid #e4e4e8;
    border-radius:9px;font-size:14px;color:${K};outline:none;
    transition:border-color .18s,box-shadow .18s;
  }
  .cb-input:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  .cb-select{
    width:100%;padding:10px 14px;
    background:${W};border:1.5px solid #e4e4e8;
    border-radius:9px;font-size:14px;color:${K};outline:none;
    appearance:none;cursor:pointer;
    transition:border-color .18s,box-shadow .18s;
  }
  .cb-select:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  @keyframes floatOrb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(22px,-18px) scale(1.06)}66%{transform:translate(-12px,12px) scale(.96)}}
  @keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.15)}50%{box-shadow:0 0 40px rgba(99,102,241,.4)}}
  .lead-card{animation:fadeUp .38s cubic-bezier(.16,1,.3,1) both;}
  .lead-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.11)!important;transition:transform .22s,box-shadow .22s!important;}
  .send-btn{
    padding:11px 24px;border-radius:10px;border:none;
    background:${K};color:${W};font-size:13px;font-weight:700;
    cursor:pointer;font-family:${F};transition:all .18s;
    box-shadow:0 2px 12px rgba(0,0,0,.18);letter-spacing:-.01em;
  }
  .send-btn:hover:not(:disabled){background:#1a1a1a;transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.24);}
  .send-btn:disabled{opacity:.45;cursor:not-allowed;}
  .cb-input:focus{border-color:${IND};box-shadow:0 0 0 3.5px rgba(99,102,241,.1);background:#fafafe;}
  .cb-select:focus{border-color:${IND};box-shadow:0 0 0 3.5px rgba(99,102,241,.1);}
  .field-label{font-size:12px;font-weight:700;color:${K2};margin-bottom:7px;display:block;letter-spacing:-.01em;}
  .section-divider{height:1px;background:rgba(0,0,0,0.06);margin:18px 0;}
`;

/* ─── Persona definitions ─────────────────────────────────────────── */
type Tone = "professional" | "friendly" | "direct" | "humorous" | "persuasive" | "casual" | "consultative" | "bold";

const PERSONAS: { tone: Tone; name: string; title: string; desc: string; photo: string; color: string }[] = [
  { tone: "professional", name: "Alex Morgan", title: "Enterprise AE", desc: "Formal, polished, results-driven", photo: "https://randomuser.me/api/portraits/men/32.jpg", color: "#3b82f6" },
  { tone: "friendly",    name: "Jamie Chen",  title: "SMB Advisor",    desc: "Warm, approachable, conversational", photo: "https://randomuser.me/api/portraits/women/44.jpg", color: "#10b981" },
  { tone: "direct",      name: "Marcus Reid", title: "Sales Director",  desc: "No fluff, straight to the point", photo: "https://randomuser.me/api/portraits/men/55.jpg", color: "#f59e0b" },
  { tone: "humorous",    name: "Zoe Park",    title: "Growth Hacker",   desc: "Witty, memorable, stands out", photo: "https://randomuser.me/api/portraits/women/68.jpg", color: "#ec4899" },
  { tone: "persuasive",  name: "Jordan Blake", title: "Revenue Lead",  desc: "Compelling hooks, urgency-driven", photo: "https://randomuser.me/api/portraits/men/14.jpg", color: "#8b5cf6" },
  { tone: "casual",      name: "Sam Torres",  title: "BDR",             desc: "Relaxed, peer-to-peer energy", photo: "https://randomuser.me/api/portraits/women/22.jpg", color: "#06b6d4" },
  { tone: "consultative",name: "Dana Kim",    title: "Solutions Consul.", desc: "Advisory, insight-led, trusted", photo: "https://randomuser.me/api/portraits/women/37.jpg", color: "#6366f1" },
  { tone: "bold",        name: "Ryder Fox",   title: "Founder",          desc: "Disruptive, confident, direct", photo: "https://randomuser.me/api/portraits/men/78.jpg", color: "#ef4444" },
];

/* ─── Lead score badge ────────────────────────────────────────────── */
function ScoreBadge({ label, score }: { label: string; score: number }) {
  const bg = label === "Strong Lead" ? "#dcfce7" : label === "Good Lead" ? "#fef9c3" : "#fee2e2";
  const col = label === "Strong Lead" ? "#16a34a" : label === "Good Lead" ? "#ca8a04" : "#dc2626";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: bg, color: col, letterSpacing: ".03em" }}>
      {label} · {score}
    </span>
  );
}

/* ─── Email preview panel — real email client look ───────────────── */
function EmailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    const full = `To: ${lead.contactName} <${lead.email}>\nSubject: ${lead.emailSubject}\n\n${lead.emailBody}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Split email body into paragraphs for proper rendering
  const paragraphs = lead.emailBody
    ? lead.emailBody.split(/\n\n+/).filter(p => p.trim())
    : [];

  const firstLetter = lead.contactName?.[0]?.toUpperCase() || "?";
  const avatarColors = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6"];
  const avatarColor = avatarColors[(lead.contactName?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(5,5,10,0.6)", backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "#0d0d12", borderRadius: 18, width: "100%", maxWidth: 620,
        boxShadow: "0 32px 96px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.07)",
        border: "1px solid rgba(255,255,255,0.08)",
        animation: "fadeUp .22s cubic-bezier(.16,1,.3,1)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* ── Toolbar ── */}
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="1.5" stroke="#818cf8" strokeWidth="1.4"/><path d="M1 5l6.5 4.5L14 5" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Email Preview</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{lead.companyName}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={copyEmail}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: copied ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.07)", color: copied ? "#4ade80" : "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            >
              {copied ? (
                <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
              ) : (
                <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3V2a1 1 0 011-1h5a1 1 0 011 1v6a1 1 0 01-1 1H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>Copy</>
              )}
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.13)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
            >×</button>
          </div>
        </div>

        {/* ── Email meta ── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "To", value: `${lead.contactName} — ${lead.title}`, sub: lead.email },
            { label: "Subject", value: lead.emailSubject },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: ".08em", width: 48, flexShrink: 0 }}>{row.label}</div>
              <div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: row.label === "Subject" ? 600 : 400 }}>{row.value}</span>
                {row.sub && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>{row.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Email body ── */}
        <div style={{ padding: "20px 20px 24px", maxHeight: "55vh", overflowY: "auto" }}>
          {/* Avatar + sender line */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: W, flexShrink: 0, boxShadow: `0 0 16px ${avatarColor}40` }}>
              {firstLetter}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>You</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>via connected Gmail</div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Now</div>
              </div>

              {/* The actual email */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "20px 22px",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, i) => {
                    const isSignatureLine = para.includes("{{YourName}}") || para.trim() === "{{YourName}}";
                    const isClosing = /^(warm regards|kind regards|cheers|best|talk soon|sincerely|regards),?$/i.test(para.trim());
                    return (
                      <p key={i} style={{
                        fontSize: 14,
                        lineHeight: 1.8,
                        color: isSignatureLine ? "rgba(255,255,255,0.35)" : isClosing ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.82)",
                        margin: i === 0 ? "0 0 16px 0" : "0 0 16px 0",
                        fontStyle: isSignatureLine ? "italic" : "normal",
                        fontWeight: i === 0 ? 500 : 400,
                        textIndent: (!isClosing && !isSignatureLine && i > 0 && i < paragraphs.length - 2) ? "1.5em" : 0,
                      }}>
                        {para.replace("{{YourName}}", "[Your Name]")}
                      </p>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{lead.emailBody}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Score footer ── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lead.score && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: lead.scoreLabel === "Strong Lead" ? "rgba(22,163,74,0.15)" : "rgba(202,138,4,0.15)", color: lead.scoreLabel === "Strong Lead" ? "#4ade80" : "#fbbf24" }}>
                {lead.scoreLabel} · {lead.score}
              </span>
            )}
            {lead.rating && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{lead.rating}/5 · {lead.reviewCount?.toLocaleString()} reviews</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Replace {"{{"+"YourName}}"} before sending</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Card ───────────────────────────────────────────────────── */
function LeadCard({ lead, selected, onToggle, onPreview, idx }: {
  lead: Lead; selected: boolean; onToggle: () => void; onPreview: () => void; idx: number;
}) {
  return (
    <div
      className="lead-card"
      style={{
        background: W, borderRadius: 12, border: selected ? `1.5px solid ${IND}` : `1px solid ${BDR2}`,
        padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14,
        transition: "border-color .15s, box-shadow .15s",
        animationDelay: `${idx * 0.04}s`,
        boxShadow: selected ? `0 0 0 3px rgba(99,102,241,.08)` : "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: 5, border: selected ? `2px solid ${IND}` : `2px solid #d1d5db`,
          background: selected ? IND : W, cursor: "pointer", flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
        }}
      >
        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: K }}>{lead.companyName}</div>
          <ScoreBadge label={lead.scoreLabel || ""} score={lead.score || 0} />
        </div>
        <div style={{ fontSize: 12, color: K3, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
          {lead.contactName && <span>{lead.contactName} · {lead.title}</span>}
          {lead.email && <span style={{ color: IND }}>{lead.email}</span>}
          {lead.phone && <span>{lead.phone}</span>}
        </div>
        <div style={{ fontSize: 12, color: K3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 520 }}>
          <span style={{ fontWeight: 600, color: K2 }}>Subject: </span>{lead.emailSubject}
        </div>
        {lead.rating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            {/* Circular rating indicator */}
            <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={lead.rating >= 4.5 ? "#16a34a" : lead.rating >= 3.5 ? "#ca8a04" : "#dc2626"}
                  strokeWidth="3"
                  strokeDasharray={`${(lead.rating / 5) * 94.2} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: lead.rating >= 4.5 ? "#16a34a" : lead.rating >= 3.5 ? "#ca8a04" : "#dc2626" }}>
                {lead.rating.toFixed(1)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: K4 }}>
              <div style={{ fontWeight: 600, color: K3 }}>{lead.rating >= 4.5 ? "Excellent" : lead.rating >= 3.5 ? "Good" : "Fair"}</div>
              <div>{lead.reviewCount?.toLocaleString()} reviews</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Preview btn */}
      <button
        onClick={onPreview}
        style={{
          padding: "6px 12px", borderRadius: 7, border: `1px solid ${BDR2}`, background: W,
          fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer", flexShrink: 0,
          transition: "all .15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = IND; (e.currentTarget as HTMLButtonElement).style.color = IND; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BDR2; (e.currentTarget as HTMLButtonElement).style.color = K2; }}
      >
        Preview
      </button>
    </div>
  );
}

/* ─── Generation Progress Tracker ────────────────────────────────── */
const GEN_STEPS = [
  { icon: "🔍", label: (b: string, l: string) => `Scanning Google Maps for ${b} in ${l}` },
  { icon: "📊", label: (_b: string, _l: string, n?: number) => `Analyzing ${n ?? "–"} businesses found` },
  { icon: "🏆", label: () => "Scoring leads by quality and reachability" },
  { icon: "✍️", label: (_b: string, _l: string, _n?: number, t?: string) => `Writing ${t ?? ""} cold emails with AI` },
  { icon: "✅", label: (_b: string, _l: string, n?: number) => `${n ?? "–"} personalized emails ready` },
];

function GenerationProgress({ bizType, location_, tone, leadCount, done, resultCount }: {
  bizType: string; location_: string; tone: string; leadCount: number; done: boolean; resultCount: number;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Step timings (ms)
    const stepTimes = [0, 1000, 2400, 4200];
    const timers: ReturnType<typeof setTimeout>[] = [];
    stepTimes.forEach((t, i) => {
      timers.push(setTimeout(() => setActiveStep(i), t));
    });
    // Progress bar: 0→78% over 14s, then stalls until done
    let p = 0;
    const interval = setInterval(() => {
      p += (78 - p) * 0.04;
      setProgress(Math.min(p, 78));
    }, 160);
    return () => { timers.forEach(clearTimeout); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (done) { setActiveStep(4); setProgress(100); }
  }, [done]);

  const stepLabel = (i: number) => {
    if (i === 0) return GEN_STEPS[0].label(bizType, location_);
    if (i === 1) return GEN_STEPS[1].label(bizType, location_, leadCount);
    if (i === 2) return GEN_STEPS[2].label(bizType, location_);
    if (i === 3) return GEN_STEPS[3].label(bizType, location_, leadCount, tone);
    return GEN_STEPS[4].label(bizType, location_, resultCount);
  };

  const IND = "#6366f1";
  const W = "#ffffff";
  const K = "#0a0a0a";
  const K3 = "#888";

  return (
    <div style={{
      background: W, borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)",
      padding: "28px 28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#16a34a" : IND, boxShadow: done ? "0 0 8px rgba(22,163,74,.5)" : "0 0 10px rgba(99,102,241,.6)", animation: done ? "none" : "pulse 1.4s ease infinite" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: K }}>
          {done ? `Generation complete — ${resultCount} leads ready` : "Generating your campaign..."}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 3, marginBottom: 22, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: done ? "#16a34a" : `linear-gradient(90deg,${IND},#818cf8)`,
          width: `${progress}%`,
          transition: "width .4s ease, background .4s ease",
          boxShadow: done ? "none" : "0 0 8px rgba(99,102,241,.4)",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {GEN_STEPS.map((step, i) => {
          const isActive = i === activeStep && !done;
          const isDone_ = i < activeStep || done;
          const isFuture = i > activeStep && !done;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isFuture ? 0.3 : 1, transition: "opacity .3s" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isDone_ ? (done && i === 4 ? "#dcfce7" : "#f0f0ff") : isActive ? `rgba(99,102,241,0.1)` : "#f8f8f9",
                border: `1.5px solid ${isDone_ ? (done && i === 4 ? "#bbf7d0" : "#c7d2fe") : isActive ? "rgba(99,102,241,0.3)" : "#e4e4e8"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
                transition: "all .3s",
              }}>
                {isDone_ ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5l3 3 5-5" stroke={done && i === 4 ? "#16a34a" : IND} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: IND, animation: "pulse 1s ease infinite" }} />
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? K : isDone_ ? "#4338ca" : K3, transition: "color .3s" }}>
                  {stepLabel(i)}
                </div>
                {isActive && (
                  <div style={{ fontSize: 11, color: "rgba(99,102,241,0.6)", marginTop: 2, animation: "pulse 1.5s ease infinite" }}>
                    Working on it...
                  </div>
                )}
              </div>
              {isDone_ && i < 4 && (
                <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 600, flexShrink: 0 }}>done</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function AppPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* form state */
  const [bizType, setBizType]    = useState("");
  const [location_, setLocation_] = useState("");
  const [intent, setIntent]      = useState("");
  const [leadCount, setLeadCount] = useState(10);
  const [tone, setTone]          = useState<Tone>("professional");
  const [campaignName, setCampaignName] = useState("");

  /* results state */
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [billingError, setBillingError] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  /* auth */
  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()),
    retry: false,
  });
  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  useEffect(() => {
    if (me === null || (me && !(me as any).id)) setLocation("/login");
  }, [me]);

  // Load template pre-fill when arriving from Templates page
  const [loadedTemplate, setLoadedTemplate] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("outleadrr_active_template");
    if (stored) {
      try {
        const t = JSON.parse(stored);
        if (t.tone && ["professional","friendly","direct","humorous","persuasive","casual","consultative","bold"].includes(t.tone)) {
          setTone(t.tone as Tone);
        }
        if (t.name) { setLoadedTemplate(t.name); setIntent(t.name); }
        localStorage.removeItem("outleadrr_active_template");
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (params.get("connected") === "true") {
      window.history.replaceState({}, "", "/app");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
  }, []);

  /* generate mutation */
  const generateMutation = useMutation<LeadsResponse, Error, object>({
    mutationFn: (body) => apiRequest("POST", "/api/generate-leads", body).then(async r => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.message || json.error || "Generation failed");
      return json;
    }),
    onSuccess: (data) => {
      setLeads(data.leads);
      setSelected(new Set(data.leads.map((_: Lead, i: number) => i)));
      setBillingError(false);
    },
    onError: (err) => {
      if (err.message?.includes("REQUEST_DENIED") || err.message?.toLowerCase().includes("billing") || err.message?.includes("SERPAPI_KEY")) {
        setBillingError(true);
      } else {
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      }
    },
  });

  /* send mutation */
  const sendMutation = useMutation<SendEmailsResponse, Error, object>({
    mutationFn: (body) => apiRequest("POST", "/api/send-emails", body).then(async r => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Send failed");
      return json;
    }),
    onSuccess: (data) => {
      toast({ title: `${data.sent} email${data.sent !== 1 ? "s" : ""} sent`, description: data.failed > 0 ? `${data.failed} failed` : "All delivered successfully" });
    },
    onError: (err) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const selectedLeads = leads.filter((_, i) => selected.has(i));

  const handleGenerate = () => {
    if (!bizType.trim() || !location_.trim()) {
      toast({ title: "Missing fields", description: "Business type and location are required", variant: "destructive" });
      return;
    }
    setBillingError(false);
    setLeads([]);
    setSelected(new Set());
    setShowProgress(true);
    generateMutation.mutate({ businessType: bizType, location: location_, intent, leadCount, tone });
  };

  const handleSend = () => {
    if (!gmailStatus?.connected) {
      toast({ title: "Gmail not connected", description: "Connect your Gmail account first", variant: "destructive" });
      return;
    }
    sendMutation.mutate({
      leads: selectedLeads,
      campaignName: campaignName || undefined,
      businessType: bizType || undefined,
      location: location_ || undefined,
    });
  };

  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((_, i) => i)));
  };

  return (
    <AppLayout>
      <style>{GLOBAL_CSS}</style>

      {previewLead && <EmailPanel lead={previewLead} onClose={() => setPreviewLead(null)} />}

      {/* ── Page header ── */}
      <div style={{ padding: "28px 36px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em", margin: 0 }}>Campaign Builder</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: `${IND}12`, color: IND, letterSpacing: ".06em", textTransform: "uppercase" }}>AI-Powered</span>
          </div>
          <p style={{ fontSize: 13, color: K3, margin: 0 }}>Find leads, craft world-class cold emails, and launch outreach in one flow.</p>
        </div>
        {leads.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "7px 16px", fontWeight: 700 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {leads.length} leads ready
          </div>
        )}
      </div>

      {/* ── Template loaded banner ── */}
      {loadedTemplate && (
        <div style={{ margin: "16px 36px 0", padding: "11px 18px", borderRadius: 10, background: "#f0f0ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#6366f1" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: "#4338ca", fontWeight: 600 }}>Template loaded: <span style={{ fontWeight: 700 }}>{loadedTemplate}</span> — tone and intent pre-filled below.</span>
          </div>
          <button onClick={() => setLoadedTemplate(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>
      )}

      {/* ── Billing error banner ── */}
      {billingError && (
        <div style={{ margin: "16px 36px 0", padding: "12px 18px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 2L1.5 15.5h15L9 2z" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8v3M9 13.5v.5" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>SerpAPI key not configured</div>
            <div style={{ fontSize: 12, color: "#9a3412", marginTop: 2 }}>Add your SERPAPI_KEY to Vercel environment variables. You can get a free API key at serpapi.com.</div>
            <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, marginTop: 4, display: "inline-block" }}>Get your SerpAPI key</a>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 36px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Campaign builder card ── */}
        <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, boxShadow: "0 1px 8px rgba(0,0,0,.05)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)", top:-80, right:-60, animation:"floatOrb 8s ease infinite", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%)", bottom:-40, left:40, animation:"floatOrb 11s ease infinite reverse", pointerEvents:"none" }} />
            <div style={{ width: 32, height: 32, borderRadius: 9, background: IND2, border: `1px solid rgba(99,102,241,.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12l3-4 3 2.5 3-5 3 2.5" stroke={IND} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: K }}>New Campaign</div>
              <div style={{ fontSize: 11, color: K3 }}>Define your target and let AI build the outreach</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Business Type</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Dental clinics, Law firms"
                  value={bizType}
                  onChange={e => setBizType(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Location</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Austin TX, Manhattan"
                  value={location_}
                  onChange={e => setLocation_(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>What are you pitching? <span style={{ color: K4, fontWeight: 400 }}>(optional)</span></label>
              <input
                className="cb-input"
                placeholder="e.g. Website redesign services, CRM software for small teams"
                value={intent}
                onChange={e => setIntent(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Number of Leads</label>
                <div style={{ position: "relative" }}>
                  <select className="cb-select" value={leadCount} onChange={e => setLeadCount(+e.target.value)}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Campaign Name <span style={{ color: K4, fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="cb-input"
                  placeholder="e.g. Q1 Dental Outreach"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </div>
            </div>

            {/* Persona selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 10 }}>Email Persona & Tone</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {PERSONAS.map(p => {
                  const active = tone === p.tone;
                  return (
                    <button
                      key={p.tone}
                      onClick={() => setTone(p.tone)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                        borderRadius: 10, border: active ? `1.5px solid ${p.color}` : `1.5px solid #e4e4e8`,
                        background: active ? `${p.color}0f` : W,
                        cursor: "pointer", textAlign: "left", transition: "all .15s",
                        boxShadow: active ? `0 0 0 3px ${p.color}15` : "none",
                      }}
                    >
                      <img src={p.photo} alt={p.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `2px solid ${active ? p.color : "#e4e4e8"}`, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: active ? p.color : K, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: K3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: K, color: W, fontSize: 14, fontWeight: 700,
                cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                opacity: generateMutation.isPending ? 0.7 : 1,
                transition: "all .15s", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,.15)",
              }}
              onMouseEnter={e => { if (!generateMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#222"; }}
              onMouseLeave={e => { if (!generateMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = K; }}
            >
              {generateMutation.isPending ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5v2M7.5 11.5v2M1.5 7.5h2M11.5 7.5h2M3.4 3.4l1.42 1.42M10.18 10.18l1.42 1.42M3.4 11.6l1.42-1.42M10.18 4.82l1.42-1.42" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Generating leads...
                </>
              ) : "Generate Leads"}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {leads.length > 0 && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {/* Results header + sticky send bar */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              background: "rgba(248,248,249,0.92)", backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${BDR}`,
              padding: "12px 0 12px", marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={toggleAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 7, border: `1px solid ${BDR2}`,
                    background: W, fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer",
                  }}
                >
                  {selected.size === leads.length ? "Deselect all" : "Select all"}
                </button>
                <span style={{ fontSize: 12, color: K3 }}>{selected.size} of {leads.length} selected</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!gmailStatus?.connected && (
                  <a
                    href="/api/auth/google"
                    style={{
                      padding: "9px 16px", borderRadius: 9, border: `1px solid ${BDR2}`,
                      background: W, color: K2, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    Connect Gmail
                  </a>
                )}
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={sendMutation.isPending || selected.size === 0 || !gmailStatus?.connected}
                >
                  {sendMutation.isPending ? "Sending..." : `Send ${selected.size > 0 ? selected.size : ""} Email${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>

            {showProgress && (
              <GenerationProgress
                bizType={bizType}
                location_={location_}
                tone={tone}
                leadCount={leadCount}
                done={!generateMutation.isPending && leads.length > 0}
                resultCount={leads.length}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leads.map((lead, i) => (
                <LeadCard
                  key={i}
                  idx={i}
                  lead={lead}
                  selected={selected.has(i)}
                  onToggle={() => {
                    const next = new Set(selected);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    setSelected(next);
                  }}
                  onPreview={() => setPreviewLead(lead)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {leads.length === 0 && !generateMutation.isPending && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: K3 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto 16px" }}>
              <circle cx="24" cy="24" r="22" stroke="#e4e4e8" strokeWidth="2"/>
              <path d="M16 28l5-6 4 4 5-7 6 4" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: K2, marginBottom: 6 }}>No leads yet</div>
            <div style={{ fontSize: 13, color: K3 }}>Fill in the campaign details above and click Generate Leads.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
