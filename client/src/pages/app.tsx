import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/lib/theme";

/* ─── Design Tokens ─── dark premium theme ───────────────────────── */
const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const W    = "#ededed";                  // primary text — zinc-100
const K    = "#111111";                  // card background
const K2   = "#a1a1aa";                  // secondary text — zinc-400
const K3   = "#71717a";                  // muted text — zinc-500
const K4   = "#52525b";                  // placeholder — zinc-600
const BDR  = "rgba(255,255,255,0.08)";
const BDR2 = "rgba(255,255,255,0.12)";
const IND  = "#8b5cf6";
const IND2 = "rgba(139,92,246,0.1)";

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{font-family:${F};}
  input,button,select,textarea{font-family:${F};}
  input::placeholder,textarea::placeholder{color:#52525b;}
  select option { background:#111111; color:#ededed; }
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes genPulse{0%,100%{opacity:.6;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.01)}}
  @keyframes spin-slow{to{transform:rotate(360deg)}}
  .cb-input{
    width:100%;padding:10px 14px;
    background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);
    border-radius:10px;font-size:14px;color:rgba(255,255,255,0.88);outline:none;
    transition:border-color .18s,box-shadow .18s,background .18s;
    color-scheme:dark;
  }
  .cb-input:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(139,92,246,.12);background:rgba(139,92,246,0.05);}
  .cb-select{
    width:100%;padding:10px 14px;
    background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);
    border-radius:10px;font-size:14px;color:rgba(255,255,255,0.88);outline:none;
    appearance:none;cursor:pointer;
    transition:border-color .18s,box-shadow .18s;
    color-scheme:dark;
  }
  .cb-select:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(139,92,246,.12);}
  @keyframes floatOrb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(22px,-18px) scale(1.06)}66%{transform:translate(-12px,12px) scale(.96)}}
  @keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}
  @keyframes glow{0%,100%{box-shadow:0 0 24px rgba(139,92,246,.2)}50%{box-shadow:0 0 48px rgba(139,92,246,.5)}}
  @keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
  .lead-card{animation:fadeUp .38s cubic-bezier(.16,1,.3,1) both;}
  .lead-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)!important;border-color:rgba(139,92,246,0.25)!important;transition:transform .22s,box-shadow .22s,border-color .22s!important;}
  [data-theme="light"] .cb-input{background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.1);color:#0f0f13;color-scheme:light;}
  [data-theme="light"] .cb-input::placeholder{color:rgba(0,0,0,0.28);}
  [data-theme="light"] .cb-input:focus{border-color:rgba(124,58,237,0.6);background:rgba(124,58,237,0.03);box-shadow:0 0 0 3px rgba(124,58,237,0.08);}
  [data-theme="light"] .cb-select{background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.1);color:#0f0f13;color-scheme:light;}
  [data-theme="light"] .cb-select:focus{border-color:rgba(124,58,237,0.6);box-shadow:0 0 0 3px rgba(124,58,237,0.08);}
  [data-theme="light"] select option{background:#fff;color:#0f0f13;}
  [data-theme="light"] input::placeholder,[data-theme="light"] textarea::placeholder{color:rgba(0,0,0,0.28);}
  [data-theme="light"] .field-label{color:rgba(0,0,0,0.4);}
  [data-theme="light"] .section-divider{background:rgba(0,0,0,0.06);}
  [data-theme="light"] .lead-card{background:#fff!important;border-color:rgba(0,0,0,0.08)!important;box-shadow:0 2px 10px rgba(0,0,0,.06)!important;}
  [data-theme="light"] .lead-card:hover{border-color:rgba(124,58,237,0.3)!important;box-shadow:0 6px 24px rgba(0,0,0,.1)!important;}
  .send-btn{
    padding:11px 24px;border-radius:10px;border:none;
    background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:13px;font-weight:700;
    cursor:pointer;font-family:${F};transition:all .18s;
    box-shadow:0 4px 16px rgba(109,40,217,.35);letter-spacing:-.01em;
  }
  .send-btn:hover:not(:disabled){box-shadow:0 8px 28px rgba(109,40,217,.5);transform:translateY(-1px);}
  .send-btn:disabled{opacity:.4;cursor:not-allowed;}
  .field-label{font-size:11px;font-weight:700;color:rgba(255,255,255,0.38);margin-bottom:6px;display:block;letter-spacing:.07em;text-transform:uppercase;}
  .section-divider{height:1px;background:rgba(255,255,255,0.05);margin:18px 0;}
`;

/* ─── Persona definitions ─────────────────────────────────────────── */
type Tone = "professional" | "friendly" | "direct" | "humorous" | "persuasive" | "casual" | "consultative" | "bold";

const PERSONAS: { tone: Tone; name: string; title: string; desc: string; color: string; photo: string }[] = [
  { tone: "professional", name: "Alex Morgan",   title: "Enterprise AE",      desc: "Formal, polished, results-driven",   color: "#3b82f6", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "friendly",    name: "Jamie Chen",     title: "SMB Advisor",        desc: "Warm, approachable, conversational", color: "#10b981", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "direct",      name: "Marcus Reid",    title: "Sales Director",     desc: "No fluff, straight to the point",    color: "#f59e0b", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "humorous",    name: "Zoe Park",       title: "Growth Hacker",      desc: "Witty, memorable, stands out",       color: "#ec4899", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "persuasive",  name: "Jordan Blake",   title: "Revenue Lead",       desc: "Compelling hooks, urgency-driven",   color: "#8b5cf6", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "casual",      name: "Sam Torres",     title: "BDR",                desc: "Relaxed, peer-to-peer energy",       color: "#06b6d4", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "consultative",name: "Dana Kim",       title: "Solutions Consult.", desc: "Advisory, insight-led, trusted",    color: "#6366f1", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=72&h=72&fit=crop&crop=face&q=80" },
  { tone: "bold",        name: "Ryder Fox",      title: "Founder",            desc: "Disruptive, confident, direct",      color: "#ef4444", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=72&h=72&fit=crop&crop=face&q=80" },
];

/* ─── Lead score badge ────────────────────────────────────────────── */
function ScoreBadge({ label, score }: { label: string; score: number }) {
  const bg  = label === "Strong Lead" ? "rgba(34,197,94,0.12)"  : label === "Good Lead" ? "rgba(234,179,8,0.12)"  : "rgba(239,68,68,0.12)";
  const col = label === "Strong Lead" ? "#4ade80"                : label === "Good Lead" ? "#fbbf24"                : "#f87171";
  const bdr = label === "Strong Lead" ? "rgba(74,222,128,0.25)" : label === "Good Lead" ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: bg, color: col, border: `1px solid ${bdr}`, letterSpacing: ".04em", textTransform: "uppercase" }}>
      {label.replace(" Lead","")} · {score}
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

/* ─── Edit Email Modal ────────────────────────────────────────────── */
function EditEmailModal({ lead, onSave, onClose }: { lead: Lead; onSave: (updated: Lead) => void; onClose: () => void }) {
  const [subject, setSubject] = useState(lead.emailSubject);
  const [body, setBody] = useState(lead.emailBody);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(12px)" }} />
      {/* Modal */}
      <div style={{
        position:"fixed",zIndex:201,top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"calc(100% - 32px)",maxWidth:640,
        background:"rgba(12,12,18,0.95)",
        border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:18,boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
        backdropFilter:"blur(40px)",
        fontFamily:"'Inter',sans-serif",overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ padding:"16px 22px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.9)" }}>Edit Email — {lead.companyName}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2 }}>Changes apply only to this lead</div>
          </div>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding:"20px 22px",display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:".08em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Subject Line</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} style={{ width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:13,color:"rgba(255,255,255,0.88)",outline:"none",fontFamily:"'Inter',sans-serif",colorScheme:"dark" } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor="#8b5cf6";}} onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.1)";}} />
          </div>
          <div>
            <label style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:".08em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Email Body</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={12} style={{ width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,fontSize:12.5,color:"rgba(255,255,255,0.82)",outline:"none",fontFamily:"'Georgia',serif",lineHeight:1.75,resize:"vertical",colorScheme:"dark" } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor="#8b5cf6";}} onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.1)";}} />
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"9px 20px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.55)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif" }}>Cancel</button>
            <button onClick={()=>{ onSave({...lead,emailSubject:subject,emailBody:body}); onClose(); }} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 16px rgba(109,40,217,0.35)" }}>Save Changes</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Lead Card ───────────────────────────────────────────────────── */
function LeadCard({ lead, selected, onToggle, onPreview, onEdit, idx }: {
  lead: Lead; selected: boolean; onToggle: () => void; onPreview: () => void; onEdit: () => void; idx: number;
}) {
  return (
    <div
      className="lead-card"
      style={{
        background: selected ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.03)",
        borderRadius: 14,
        border: selected ? `1.5px solid rgba(139,92,246,0.35)` : `1px solid ${BDR}`,
        padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14,
        transition: "border-color .15s, box-shadow .15s, background .15s",
        animationDelay: `${idx * 0.04}s`,
        boxShadow: selected ? `0 0 0 3px rgba(139,92,246,.08), 0 4px 20px rgba(0,0,0,.3)` : "0 2px 12px rgba(0,0,0,.2)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: 5,
          border: selected ? `2px solid ${IND}` : `2px solid rgba(255,255,255,0.18)`,
          background: selected ? IND : "rgba(255,255,255,0.04)",
          cursor: "pointer", flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
        }}
      >
        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{lead.companyName}</div>
          <ScoreBadge label={lead.scoreLabel || ""} score={lead.score || 0} />
        </div>
        <div style={{ fontSize: 12, color: K3, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
          {lead.contactName && <span>{lead.contactName} · {lead.title}</span>}
          {lead.email && <span style={{ color: "#a78bfa" }}>{lead.email}</span>}
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
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
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

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onPreview}
          style={{
            padding: "6px 14px", borderRadius: 8,
            border: `1px solid rgba(255,255,255,0.1)`,
            background: "rgba(255,255,255,0.05)",
            fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer",
            transition: "all .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = IND; (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = K2; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
        >
          Preview
        </button>
        <button onClick={onEdit} style={{ padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.45)",cursor:"pointer",transition:"all .15s" }}
          onMouseEnter={e=>{(e.target as HTMLElement).style.borderColor="#8b5cf6";(e.target as HTMLElement).style.color="#c4b5fd";}}
          onMouseLeave={e=>{(e.target as HTMLElement).style.borderColor="rgba(255,255,255,0.1)";(e.target as HTMLElement).style.color="rgba(255,255,255,0.45)";}}>
          Edit
        </button>
      </div>
    </div>
  );
}

/* ─── Generation Progress Tracker ────────────────────────────────── */
const GEN_STEPS = [
  { label: (b: string, l: string) => `Scanning Google Maps for ${b} in ${l}` },
  { label: (_b: string, _l: string, n?: number) => `Analyzing ${n ?? "–"} businesses found` },
  { label: () => "Scoring leads by quality and reachability" },
  { label: (_b: string, _l: string, _n?: number, t?: string) => `Writing ${t ?? ""} cold emails with AI` },
  { label: (_b: string, _l: string, n?: number) => `${n ?? "–"} personalized emails ready` },
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

  const IND_ = "#8b5cf6";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "24px 28px 22px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
      marginBottom: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated scan line */}
      {!done && (
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent)",
          animation: "scanLine 3s linear infinite",
          pointerEvents: "none",
        }} />
      )}
      {/* Purple ambient glow */}
      <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)",top:-100,right:-80,pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, position:"relative" }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: done ? "#4ade80" : IND_,
          boxShadow: done ? "0 0 10px rgba(74,222,128,.7)" : "0 0 12px rgba(139,92,246,.8)",
          animation: done ? "none" : "pulse 1.2s ease infinite",
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: done ? "#4ade80" : "rgba(255,255,255,0.88)" }}>
          {done ? `${resultCount} leads generated — ready to send` : "Running AI lead generation..."}
        </span>
        {!done && (
          <span style={{ marginLeft:"auto", fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 20, overflow: "hidden", position:"relative" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: done ? "linear-gradient(90deg,#4ade80,#22c55e)" : "linear-gradient(90deg,#6d28d9,#8b5cf6,#a78bfa)",
          width: `${progress}%`,
          transition: "width .5s cubic-bezier(.16,1,.3,1), background .5s",
          boxShadow: done ? "0 0 8px rgba(74,222,128,.5)" : "0 0 10px rgba(139,92,246,.6)",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, position:"relative" }}>
        {GEN_STEPS.map((_step, i) => {
          const isActive = i === activeStep && !done;
          const isDone_ = i < activeStep || done;
          const isFuture = i > activeStep && !done;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isFuture ? 0.25 : 1, transition: "opacity .4s" }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: isDone_ ? (done && i === 4 ? "rgba(74,222,128,0.12)" : "rgba(139,92,246,0.12)") : isActive ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${isDone_ ? (done && i === 4 ? "rgba(74,222,128,0.3)" : "rgba(139,92,246,0.3)") : isActive ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .35s",
              }}>
                {isDone_ ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 5.5l3 3 5-5" stroke={done && i === 4 ? "#4ade80" : IND_} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: IND_, animation: "pulse 0.9s ease infinite" }} />
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? "rgba(255,255,255,0.9)" : isDone_ ? "#c4b5fd" : "rgba(255,255,255,0.35)", transition: "color .35s", letterSpacing:"-.01em" }}>
                  {stepLabel(i)}
                </div>
                {isActive && (
                  <div style={{ fontSize: 10, color: "rgba(139,92,246,0.6)", marginTop: 2 }}>
                    processing...
                  </div>
                )}
              </div>
              {isDone_ && i < 4 && (
                <div style={{ fontSize: 9, color: "rgba(139,92,246,0.5)", fontWeight: 700, letterSpacing:".06em", textTransform:"uppercase", flexShrink: 0 }}>done</div>
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
  const { isDark } = useTheme();

  // Shadow tokens for theme support — zinc scale
  const W    = isDark ? "#ededed"                : "#09090b";
  const K    = isDark ? "#111111"                : "#ffffff";
  const K2   = isDark ? "#a1a1aa"                : "#3f3f46";
  const K3   = isDark ? "#71717a"                : "#71717a";
  const K4   = isDark ? "#52525b"                : "#a1a1aa";
  const BDR  = isDark ? "rgba(255,255,255,0.08)" : "#e4e4e7";
  const IND2 = isDark ? "rgba(139,92,246,0.1)"   : "rgba(124,58,237,0.08)";
  const cardBg   = isDark ? "rgba(255,255,255,0.035)" : "#ffffff";
  const stickyBg = isDark ? "rgba(10,10,10,0.88)" : "rgba(250,250,250,0.92)";

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
  const [editLead, setEditLead]   = useState<{ lead: Lead; idx: number } | null>(null);
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
      {editLead && <EditEmailModal lead={editLead.lead} onSave={(updated) => { const next = [...leads]; next[editLead.idx] = updated; setLeads(next); }} onClose={() => setEditLead(null)} />}

      {/* ── Page header ── */}
      <div style={{ padding: "28px 36px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: W, letterSpacing: "-.03em", margin: 0 }}>Campaign Builder</h1>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 5, background: "rgba(139,92,246,0.12)", color: "#a78bfa", letterSpacing: ".1em", textTransform: "uppercase", border: "1px solid rgba(139,92,246,0.2)" }}>AI-Powered</span>
          </div>
          <p style={{ fontSize: 13, color: K3, margin: 0 }}>Find leads, craft world-class cold emails, and launch outreach in one flow.</p>
        </div>
        {leads.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4ade80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 9, padding: "7px 14px", fontWeight: 700 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 6px rgba(74,222,128,0.7)" }} />
            {leads.length} leads ready
          </div>
        )}
      </div>


      {/* ── Billing error banner ── */}
      {billingError && (
        <div style={{ margin: "16px 36px 0", padding: "12px 18px", borderRadius: 10, background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 2L1.5 15.5h15L9 2z" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8v3M9 13.5v.5" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fb923c" }}>SerpAPI key not configured</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Add your SERPAPI_KEY to Vercel environment variables. Free key at serpapi.com.</div>
            <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#fb923c", fontWeight: 600, marginTop: 4, display: "inline-block" }}>Get your SerpAPI key</a>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 36px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Campaign builder card ── */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${BDR}`, boxShadow: isDark ? "0 4px 32px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)", top:-80, right:-60, animation:"floatOrb 8s ease infinite", pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%)", bottom:-40, left:40, animation:"floatOrb 11s ease infinite reverse", pointerEvents:"none" }} />
            <div style={{ width: 32, height: 32, borderRadius: 9, background: IND2, border: `1px solid rgba(139,92,246,.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12l3-4 3 2.5 3-5 3 2.5" stroke={IND} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>New Campaign</div>
              <div style={{ fontSize: 11, color: K3 }}>Define your target and let AI build the outreach</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="field-label">Business Type</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Dental clinics, Law firms"
                  value={bizType}
                  onChange={e => setBizType(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Location</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Austin TX, Manhattan"
                  value={location_}
                  onChange={e => setLocation_(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">What are you pitching? <span style={{ color: K4, fontWeight: 400, textTransform:"none", letterSpacing:"normal" }}>(optional)</span></label>
              <input
                className="cb-input"
                placeholder="e.g. Website redesign services, CRM software for small teams"
                value={intent}
                onChange={e => setIntent(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label className="field-label">Number of Leads</label>
                <div style={{ position: "relative" }}>
                  <select className="cb-select" value={leadCount} onChange={e => setLeadCount(+e.target.value)}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div>
                <label className="field-label">Campaign Name <span style={{ color: K4, fontWeight: 400, textTransform:"none", letterSpacing:"normal" }}>(optional)</span></label>
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
              <label className="field-label">Email Persona & Tone</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {PERSONAS.map(p => {
                  const active = tone === p.tone;
                  return (
                    <button
                      key={p.tone}
                      onClick={() => setTone(p.tone)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                        borderRadius: 10,
                        border: active ? `1.5px solid ${p.color}55` : `1.5px solid rgba(255,255,255,0.07)`,
                        background: active ? `${p.color}14` : "rgba(255,255,255,0.03)",
                        cursor: "pointer", textAlign: "left", transition: "all .15s",
                        boxShadow: active ? `0 0 0 3px ${p.color}18, 0 4px 16px rgba(0,0,0,0.2)` : "none",
                      }}
                    >
                      <img src={p.photo} alt={p.name} style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", border: `2px solid ${active ? p.color : "rgba(255,255,255,0.1)"}`, flexShrink:0 }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: active ? p.color : "rgba(255,255,255,0.8)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: K3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template selector */}
            <div style={{ marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
              <button
                onClick={() => {
                  setLocation("/templates");
                }}
                style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.55)",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#8b5cf6";(e.currentTarget as HTMLElement).style.color="#c4b5fd";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)";(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.55)";}}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Template
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:400 }}>(optional)</span>
              </button>
              {loadedTemplate && (
                <span style={{ fontSize:12,color:"#c4b5fd",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:7,padding:"4px 10px" }}>
                  {loadedTemplate}
                  <button onClick={()=>setLoadedTemplate(null)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",marginLeft:6,fontSize:14,lineHeight:1,padding:0 }}>×</button>
                </span>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              style={{
                width: "100%", padding: "13px", borderRadius: 11, border: "none",
                background: generateMutation.isPending
                  ? "rgba(139,92,246,0.4)"
                  : "linear-gradient(135deg,#7c3aed 0%,#8b5cf6 50%,#6d28d9 100%)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                transition: "all .2s", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: generateMutation.isPending ? "none" : "0 4px 20px rgba(109,40,217,.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                letterSpacing: "-.01em",
                position: "relative", overflow: "hidden",
              }}
            >
              {!generateMutation.isPending && (
                <div style={{ position:"absolute",inset:0,background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%)",backgroundSize:"200% 100%",animation:"shimmer 3s ease infinite",pointerEvents:"none" }} />
              )}
              {generateMutation.isPending ? (
                <>
                  <div style={{ display:"flex",gap:4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)",animation:`pulse 1.2s ease ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                  Generating leads...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L9.18 5.5H14L10.41 8.5L11.73 13L7.5 10.2L3.27 13L4.59 8.5L1 5.5H5.82L7.5 1Z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="rgba(255,255,255,0.15)" strokeLinejoin="round"/></svg>
                  Generate Leads
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {leads.length > 0 && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {/* Results header + sticky send bar */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              background: stickyBg, backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: `1px solid ${BDR}`,
              padding: "12px 0 12px", marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={toggleAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 7,
                    border: `1px solid rgba(255,255,255,0.1)`,
                    background: "rgba(255,255,255,0.05)",
                    fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer",
                    transition: "all .15s",
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
                      padding: "9px 16px", borderRadius: 9,
                      border: `1px solid rgba(255,255,255,0.1)`,
                      background: "rgba(255,255,255,0.05)",
                      color: K2, fontSize: 12, fontWeight: 600,
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                      transition: "all .15s",
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
                  onEdit={() => setEditLead({ lead, idx: i })}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {leads.length === 0 && !generateMutation.isPending && (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px",gap:32 }}>
            {/* Animated orbit visualization */}
            <div style={{ position:"relative",width:160,height:160 }}>
              {/* Center circle */}
              <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:44,height:44,borderRadius:"50%",background:"rgba(139,92,246,0.15)",border:"2px solid rgba(139,92,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 10l4-5 3 3 4-5 4 4" stroke="#8b5cf6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {/* Orbit ring */}
              <svg width="160" height="160" style={{ position:"absolute",top:0,left:0,animation:"spin-slow 12s linear infinite" }}>
                <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="6 4"/>
                <circle cx="80" cy="20" r="7" fill="rgba(139,92,246,0.5)" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5"/>
              </svg>
              {/* Second orbit ring */}
              <svg width="160" height="160" style={{ position:"absolute",top:0,left:0,animation:"spin-slow 8s linear infinite reverse" }}>
                <circle cx="80" cy="80" r="40" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="4 3"/>
                <circle cx="80" cy="40" r="5" fill="rgba(99,102,241,0.5)" stroke="rgba(99,102,241,0.8)" strokeWidth="1.5"/>
              </svg>
            </div>
            {/* Labels */}
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:8 }}>Ready to find your leads</div>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.33)",maxWidth:300,lineHeight:1.65 }}>Fill in business type and location above, then click Generate. The AI will find, score, and write personalized emails for each prospect.</div>
            </div>
            {/* Mini step list */}
            <div style={{ display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:320 }}>
              {[
                { n:"01", label:"Search Google Maps for real businesses" },
                { n:"02", label:"Score each lead by rating and opportunity" },
                { n:"03", label:"Write a personalized cold email for each" },
              ].map(s => (
                <div key={s.n} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize:10,fontWeight:800,color:"rgba(139,92,246,0.6)",letterSpacing:".08em",fontFamily:"monospace",flexShrink:0 }}>{s.n}</span>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.45)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
