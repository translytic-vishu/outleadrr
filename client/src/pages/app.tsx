import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppNav } from "@/components/site-nav";
import { OnboardingModal } from "@/components/OnboardingModal";

/* ─── Tokens ──────────────────────────────────────────────────────── */
const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const BG  = "#f4f4f6";
const W   = "#ffffff";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const K4  = "#c0c0c0";
const BDR = "rgba(0,0,0,0.07)";
const BDR2= "rgba(0,0,0,0.13)";
const ACC = "#0a0a0a";

const GLOBAL = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{background:${BG};color:${K};font-family:${F};}
  input,button,select,textarea{font-family:${F};}
  input::placeholder,textarea::placeholder{color:${K4};}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes progLine{from{width:0}to{width:100%}}
  .lf-input{
    width:100%;padding:12px 16px;
    background:${W};border:1.5px solid #e2e2e6;
    border-radius:10px;font-size:14px;color:${K};outline:none;
    transition:border-color .2s,box-shadow .2s;
    box-shadow:0 1px 2px rgba(0,0,0,.04);
  }
  .lf-input:focus{border-color:${K};box-shadow:0 0 0 3px rgba(0,0,0,.07);}
  .lf-label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${K3};display:block;margin-bottom:8px;}
  .vol-pill{
    padding:8px 20px;border-radius:8px;border:1.5px solid #e2e2e6;
    background:${W};font-size:13px;font-weight:600;color:${K2};
    cursor:pointer;transition:all .15s;box-shadow:0 1px 2px rgba(0,0,0,.04);
  }
  .vol-pill:hover{border-color:${K};color:${K};}
  .vol-pill.active{background:${K};border-color:${K};color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);}
  .tone-pill{
    padding:8px 16px;border-radius:8px;border:1.5px solid #e2e2e6;
    background:${W};font-size:12px;font-weight:600;color:${K2};
    cursor:pointer;transition:all .15s;box-shadow:0 1px 2px rgba(0,0,0,.04);
  }
  .tone-pill:hover{border-color:${K};color:${K};}
  .tone-pill.active{background:${K};border-color:${K};color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);}
  .cta-btn{
    display:flex;align-items:center;justify-content:center;gap:9px;
    width:100%;padding:15px;border-radius:10px;border:none;
    background:${K};color:#fff;font-size:15px;font-weight:700;letter-spacing:-.01em;
    cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;
    box-shadow:0 2px 8px rgba(0,0,0,.22),0 1px 2px rgba(0,0,0,.1);
  }
  .cta-btn:hover{background:#1c1c1c;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.28);}
  .cta-btn:active{transform:translateY(0);}
  .cta-btn:disabled{background:#c0c0c0;box-shadow:none;cursor:not-allowed;transform:none;}
  .ghost-btn{
    display:inline-flex;align-items:center;gap:6px;
    padding:7px 14px;border-radius:7px;
    background:rgba(255,255,255,0.7);color:${K2};border:1.5px solid rgba(0,0,0,0.09);
    font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    box-shadow:0 1px 3px rgba(0,0,0,.06);
  }
  .ghost-btn:hover{border-color:${K};color:${K};background:rgba(255,255,255,0.9);}
  .ghost-btn:disabled{opacity:.4;cursor:not-allowed;}
  .send-btn{
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 20px;border-radius:8px;border:none;
    background:${K};color:#fff;font-size:13px;font-weight:700;
    cursor:pointer;transition:all .2s;
    box-shadow:0 2px 8px rgba(0,0,0,.22);
  }
  .send-btn:hover{background:#1c1c1c;transform:translateY(-1px);box-shadow:0 5px 16px rgba(0,0,0,.28);}
  .send-btn:disabled{background:#ccc;cursor:not-allowed;box-shadow:none;transform:none;}
  .filter-pill{
    padding:6px 14px;border-radius:7px;border:1.5px solid #e2e2e6;
    background:${W};font-size:12px;font-weight:600;color:${K2};cursor:pointer;transition:all .15s;
  }
  .filter-pill:hover{border-color:${K};color:${K};}
  .filter-pill.active{background:${K};color:#fff;border-color:${K};box-shadow:0 2px 6px rgba(0,0,0,.15);}
  .skeleton{animation:pulse 1.6s ease-in-out infinite;background:#e2e2e6;border-radius:6px;}
  @media(max-width:768px){
    .form-2col{grid-template-columns:1fr !important;}
    .vol-tone-row{flex-direction:column !important;}
    .toolbar-row{flex-direction:column !important;align-items:flex-start !important;}
  }
`;

/* ─── Background wave (fixed, full page) ─────────────────────────── */
function BgWave() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number; let t = 0;
    const waves = Array.from({ length: 10 }, (_, i) => ({
      yFrac: 0.08 + (i / 10) * 0.88,
      amp: 12 + (i % 3) * 9 + Math.random() * 8,
      freq: 0.0012 + Math.random() * 0.002,
      speed: 0.08 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      opacity: 0.018 + Math.random() * 0.025,
    }));
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    const draw = () => {
      const CW = canvas.offsetWidth, CH = canvas.offsetHeight;
      ctx.clearRect(0, 0, CW, CH);
      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(10,10,10,${w.opacity})`;
        ctx.lineWidth = 1;
        for (let x = 0; x <= CW; x += 4) {
          const y = CH * w.yFrac
            + Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp
            + Math.sin(x * w.freq * 2.1 + t * w.speed * 1.3 + w.phase2) * (w.amp * 0.3);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      t += 0.004;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:.6 }} />;
}

/* ─── Wave canvas (hero section) ─────────────────────────────────── */
function WaveCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number; let t = 0;
    const waves = Array.from({ length: 14 }, (_, i) => ({
      yFrac:  0.05 + (i / 14) * 0.9,
      amp:    8  + (i % 4) * 7 + Math.random() * 10,
      freq:   0.0018 + Math.random() * 0.0026,
      speed:  0.12 + Math.random() * 0.18,
      phase:  Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      opacity:0.028 + Math.random() * 0.042,
    }));
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    const draw = () => {
      const CW = canvas.offsetWidth, CH = canvas.offsetHeight;
      ctx.clearRect(0, 0, CW, CH);
      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(10,10,10,${w.opacity})`;
        ctx.lineWidth = 0.9;
        for (let x = 0; x <= CW; x += 3) {
          const y = CH * w.yFrac
            + Math.sin(x * w.freq + t * w.speed + w.phase)  * w.amp
            + Math.sin(x * w.freq * 2.1 + t * w.speed * 1.4 + w.phase2) * (w.amp * 0.32)
            + Math.sin(x * w.freq * 0.5 + t * w.speed * 0.5 + w.phase + 1.3) * (w.amp * 0.18);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      t += 0.005;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }} />;
}

/* ─── Progress steps ─────────────────────────────────────────────── */
const STEPS = ["Searching Maps","Scoring Leads","Writing Emails","Ready"];
const DELAYS = [0, 2400, 5200, 9400];

function ProgressSteps({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = DELAYS.slice(1).map((d, i) => setTimeout(() => setStep(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, [active]);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 0 4px",gap:0 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display:"flex",alignItems:"center" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:7 }}>
            <div style={{
              width:32,height:32,borderRadius:"50%",
              border:`2px solid ${i <= step ? K : BDR2}`,
              background: i < step ? K : W,
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .35s",
            }}>
              {i < step
                ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : i === step
                  ? <span style={{ width:10,height:10,border:`2px solid ${K}`,borderTop:"2px solid transparent",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }} />
                  : <span style={{ width:6,height:6,borderRadius:"50%",background:K4,display:"inline-block" }} />
              }
            </div>
            <span style={{ fontSize:11,fontWeight:i<=step?700:500,color:i<=step?K:K3,whiteSpace:"nowrap" }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width:56,height:1.5,background:BDR,marginBottom:20,position:"relative",overflow:"hidden" }}>
              {i < step && <div style={{ position:"absolute",inset:0,background:K,animation:"progLine .4s ease" }} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Score helpers ──────────────────────────────────────────────── */
const sc  = (v: number) => v >= 70 ? "#16a34a" : v >= 45 ? "#d97706" : "#dc2626";
const lc  = (l: string) => l === "Strong Lead" ? "#16a34a" : l === "Good Lead" ? "#d97706" : "#dc2626";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
      <span style={{ fontSize:11,color:K2,width:96,flexShrink:0 }}>{label}</span>
      <div style={{ flex:1,height:3,borderRadius:99,background:"#e9e9eb",overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${value}%`,background:sc(value),transition:"width .8s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      <span style={{ fontSize:11,fontWeight:700,color:sc(value),width:28,textAlign:"right",flexShrink:0 }}>{value}</span>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background:W,borderRadius:12,border:`1px solid ${BDR}`,padding:"20px 22px" }}>
      <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
        <div className="skeleton" style={{ width:48,height:48,borderRadius:8,flexShrink:0 }} />
        <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
          <div className="skeleton" style={{ height:15,width:"45%",borderRadius:4 }} />
          <div className="skeleton" style={{ height:11,width:"30%",borderRadius:4 }} />
          <div style={{ display:"flex",gap:10,marginTop:3 }}>
            <div className="skeleton" style={{ height:11,width:80,borderRadius:4 }} />
            <div className="skeleton" style={{ height:11,width:130,borderRadius:4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Send Results Overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ width:"100%",maxWidth:440,borderRadius:16,background:W,boxShadow:"0 24px 64px rgba(0,0,0,.2)",overflow:"hidden" }}>
        <div style={{ padding:"22px 26px 16px",borderBottom:`1px solid ${BDR}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:K3,marginBottom:5 }}>Send Report</div>
            <div style={{ fontSize:26,fontWeight:800,color:K,letterSpacing:"-.03em" }}>{data.sent} / {data.total} sent</div>
            {data.failed > 0 && <div style={{ fontSize:12,color:"#dc2626",marginTop:3 }}>{data.failed} failed</div>}
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",border:`1px solid ${BDR}`,background:W,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:K2 }}>×</button>
        </div>
        <div style={{ maxHeight:260,overflowY:"auto",padding:"10px 26px 22px" }}>
          {data.results.map(r => (
            <div key={r.email} style={{ display:"flex",justifyContent:"space-between",gap:12,padding:"8px 0",borderBottom:`1px solid ${BDR}` }}>
              <span style={{ fontSize:13,fontFamily:"monospace",color:K2 }}>{r.email}</span>
              <span style={{ fontSize:11,fontWeight:700,color:r.success?"#16a34a":"#dc2626" }}>{r.success?"Sent":"Failed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Card ─────────────────────────────────────────────────── */
function LeadCard({ lead, index, sending, sendResult, editedEmail, onEditEmail }: {
  lead: Lead; index: number; sending: boolean;
  sendResult?: { success: boolean };
  editedEmail: { subject: string; body: string };
  onEditEmail: (subject: string, body: string) => void;
}) {
  const [open, setOpen]     = useState(true);
  const [editing, setEditing] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const score = lead.score ?? 62;
  const scoreLabel = lead.scoreLabel ?? "Good Lead";
  const sb = lead.scoreBreakdown;

  const copyBody = async () => {
    await navigator.clipboard.writeText(editedEmail.body);
    setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div style={{
      background:W,borderRadius:16,border:`1px solid #e2e2e6`,
      boxShadow:"0 2px 12px rgba(0,0,0,.06)",
      overflow:"hidden",opacity:sending?.55:1,transition:"opacity .2s",
      animation:`fadeUp .4s cubic-bezier(.16,1,.3,1) ${index*55}ms both`,
    }}>
      {/* Header row */}
      <div style={{ padding:"18px 22px",display:"flex",gap:16,alignItems:"flex-start" }}>
        {/* Score badge */}
        <div style={{ flexShrink:0,textAlign:"center" }}>
          <div style={{ width:52,height:52,borderRadius:8,background:BG,border:`1.5px solid ${BDR2}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1 }}>
            <span style={{ fontSize:18,fontWeight:800,color:K,lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:8,color:K3,fontWeight:600,letterSpacing:".04em" }}>SCORE</span>
          </div>
          <div style={{ marginTop:5,fontSize:9,fontWeight:700,color:lc(scoreLabel),letterSpacing:".04em",textTransform:"uppercase" }}>
            {scoreLabel.replace(" Lead","")}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:4 }}>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:K,letterSpacing:"-.02em" }}>{lead.companyName}</div>
              <div style={{ fontSize:13,color:K2,marginTop:1 }}>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</div>
            </div>
            {sendResult && (
              <span style={{ fontSize:11,fontWeight:700,color:sendResult.success?"#16a34a":"#dc2626",border:`1px solid ${sendResult.success?"#bbf7d0":"#fecaca"}`,padding:"3px 9px",borderRadius:4,background:sendResult.success?"#f0fdf4":"#fef2f2" }}>
                {sendResult.success ? "Sent" : "Failed"}
              </span>
            )}
            {sending && <span style={{ fontSize:11,color:K3,fontWeight:600 }}>Sending…</span>}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"4px 18px",marginTop:8 }}>
            {lead.phone && <a href={`tel:${lead.phone}`} style={{ fontSize:13,color:K,textDecoration:"none",fontWeight:500 }}>{lead.phone}</a>}
            <span style={{ fontSize:13,fontFamily:"monospace",color:K2 }}>{lead.email}</span>
            {lead.website && (
              <a href={lead.website.startsWith("http")?lead.website:`https://${lead.website}`} target="_blank" rel="noreferrer"
                style={{ fontSize:12,color:K3,textDecoration:"none",fontFamily:"monospace" }}>
                {lead.website.replace(/^https?:\/\//,"").replace(/\/$/,"").slice(0,32)}
              </a>
            )}
            {(lead.rating??0)>0 && <span style={{ fontSize:12,color:K3 }}>{lead.rating?.toFixed(1)} / 5 · {lead.reviewCount?.toLocaleString()} reviews</span>}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {sb && (
        <div style={{ padding:"12px 22px 14px",borderTop:`1px solid ${BDR}`,background:"#fafafa" }}>
          <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:K3,marginBottom:10 }}>Score Breakdown</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            <ScoreBar label="Industry Fit"  value={sb.industryFit}  />
            <ScoreBar label="Business Size" value={sb.businessSize} />
            <ScoreBar label="Reachability"  value={sb.reachability} />
            <ScoreBar label="Opportunity"   value={sb.opportunity}  />
            <ScoreBar label="Review Health" value={sb.reviewHealth} />
          </div>
        </div>
      )}

      {/* Email preview toggle */}
      <div style={{ borderTop:`1px solid ${BDR}` }}>
        <button onClick={() => setOpen(!open)} style={{
          width:"100%",padding:"9px 22px",background:"none",border:"none",cursor:"pointer",
          textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",
          color:K2,display:"flex",alignItems:"center",gap:8,transition:"background .15s",
        }}>
          <span style={{ fontSize:14,lineHeight:1 }}>{open?"−":"+"}</span>
          {open?"Hide email":"View email"}
          {!open && editedEmail.subject && (
            <span style={{ marginLeft:"auto",fontSize:11,color:K3,fontWeight:400,textTransform:"none",letterSpacing:0 }}>
              {editedEmail.subject.slice(0,48)}{editedEmail.subject.length>48?"…":""}
            </span>
          )}
        </button>

        {open && (
          <div style={{ padding:"0 22px 18px" }}>
            <div style={{ background:"#fafafa",borderRadius:8,border:`1px solid ${BDR}`,overflow:"hidden" }}>
              {/* Subject line */}
              <div style={{ padding:"10px 14px",borderBottom:`1px solid ${BDR}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,background:W }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:K3,marginBottom:3 }}>Subject</div>
                  {editing
                    ? <input value={editedEmail.subject} onChange={e=>onEditEmail(e.target.value,editedEmail.body)}
                        style={{ width:"100%",fontSize:13,fontWeight:600,color:K,background:"transparent",border:"none",outline:"none",padding:0,fontFamily:F }} />
                    : <div style={{ fontSize:13,fontWeight:600,color:K }}>{editedEmail.subject}</div>
                  }
                </div>
                <button className="ghost-btn" onClick={()=>setEditing(!editing)} style={{ fontSize:11,padding:"4px 10px",flexShrink:0 }}>
                  {editing?"Done":"Edit"}
                </button>
              </div>
              {/* Body */}
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9 }}>
                  <span style={{ fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:K3 }}>Body</span>
                  <button className="ghost-btn" onClick={copyBody} style={{ fontSize:11,padding:"4px 10px" }}>
                    {copiedBody?"Copied":"Copy"}
                  </button>
                </div>
                {editing
                  ? <textarea value={editedEmail.body} onChange={e=>onEditEmail(editedEmail.subject,e.target.value)}
                      style={{ width:"100%",fontSize:13,lineHeight:1.8,color:K2,background:"transparent",border:"none",outline:"none",resize:"vertical",minHeight:110,padding:0,fontFamily:F }} />
                  : <p style={{ fontSize:13,lineHeight:1.8,color:K2,whiteSpace:"pre-line",margin:0 }}>{editedEmail.body}</p>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Response rate calc ─────────────────────────────────────────── */
function respRate(avg: number) {
  if (avg >= 72) return "18–22%";
  if (avg >= 55) return "12–16%";
  return "6–10%";
}

type SortKey    = "score-desc" | "score-asc" | "name";
type FilterLbl  = "all" | "Strong Lead" | "Good Lead" | "Weak Lead";
type Tone       = "professional" | "friendly" | "direct" | "humorous";

const PERSONAS: { key: Tone; name: string; label: string; color: string; avatar: string; desc: string }[] = [
  { key:"professional", name:"Marcus", label:"Professional", color:"#6366f1", avatar:"M", desc:"Formal, polished, business-focused" },
  { key:"friendly",     name:"Sarah",  label:"Friendly",     color:"#10b981", avatar:"S", desc:"Warm, personable, conversational"  },
  { key:"direct",       name:"Alex",   label:"Direct",       color:"#f59e0b", avatar:"A", desc:"Short, punchy, straight to value"  },
  { key:"humorous",     name:"Jake",   label:"Humorous",     color:"#ec4899", avatar:"J", desc:"Witty, memorable, stands out"      },
];

/* ── Persona Dropdown ─────────────────────────────────────────────── */
function PersonaDropdown({ value, onChange }: { value: Tone; onChange: (t: Tone) => void }) {
  const [open, setOpen] = useState(false);
  const selected = PERSONAS.find(p => p.key === value)!;
  return (
    <div style={{ position:"relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:10,border:"1.5px solid #e2e2e6",background:W,cursor:"pointer",transition:"all .15s",minWidth:220,boxShadow:"0 1px 2px rgba(0,0,0,.04)" }}
        onMouseEnter={e=>(e.currentTarget.style.borderColor=K)}
        onMouseLeave={e=>{ if(!open) e.currentTarget.style.borderColor="#e2e2e6"; }}>
        <div style={{ width:28,height:28,borderRadius:8,background:selected.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0 }}>{selected.avatar}</div>
        <div style={{ flex:1,textAlign:"left" }}>
          <div style={{ fontSize:13,fontWeight:700,color:K,lineHeight:1 }}>{selected.name}</div>
          <div style={{ fontSize:11,color:K3,marginTop:2 }}>{selected.label}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition:"transform .2s",transform:open?"rotate(180deg)":"none",flexShrink:0 }}>
          <path d="M3 5l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed",inset:0,zIndex:10 }} />
          <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:20,background:W,border:"1.5px solid #e2e2e6",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",overflow:"hidden" }}>
            {PERSONAS.map(p => (
              <button key={p.key} type="button"
                onClick={() => { onChange(p.key); setOpen(false); }}
                style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:p.key===value?"#f7f7f9":W,border:"none",cursor:"pointer",transition:"background .12s",textAlign:"left" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#f7f7f9")}
                onMouseLeave={e=>(e.currentTarget.style.background=p.key===value?"#f7f7f9":W)}>
                <div style={{ width:32,height:32,borderRadius:8,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0 }}>{p.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:K }}>{p.name} <span style={{ fontWeight:500,color:K3 }}>— {p.label}</span></div>
                  <div style={{ fontSize:11,color:K3,marginTop:1 }}>{p.desc}</div>
                </div>
                {p.key === value && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke={K} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const EXAMPLES = [
  { business:"plumbers",       location:"Houston, TX"       },
  { business:"dentists",       location:"Los Angeles, CA"   },
  { business:"HVAC companies", location:"Chicago, IL"       },
  { business:"law firms",      location:"New York, NY"      },
];

/* ─── App ────────────────────────────────────────────────────────── */
export default function App() {
  const [, navigate] = useLocation();

  const [businessType, setBusinessType] = useState("");
  const [location,     setLocation]     = useState("");
  const [intent,       setIntent]       = useState("");
  const [leadCount,    setLeadCount]    = useState<10|25|50>(10);
  const [tone,         setTone]         = useState<Tone>("professional");

  const [result,        setResult]        = useState<LeadsResponse|null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sendData,      setSendData]      = useState<SendEmailsResponse|null>(null);
  const [sendResults,   setSendResults]   = useState<Record<number,{success:boolean}>>({});
  const [sortBy,        setSortBy]        = useState<SortKey>("score-desc");
  const [filterLabel,   setFilterLabel]   = useState<FilterLbl>("all");
  const [editedEmails,  setEditedEmails]  = useState<Record<number,{subject:string;body:string}>>({});

  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useQuery<MeResponse>({ queryKey:["/api/auth/me"], retry:false });
  const { data: auth } = useQuery<AuthStatus>({ queryKey:["/api/auth/status"], refetchInterval:false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected")==="true") {
      toast({ title:"Gmail connected." });
      window.history.replaceState({},""," /app");
      queryClient.invalidateQueries({ queryKey:["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title:"Connection failed.", variant:"destructive" });
      window.history.replaceState({},""," /app");
    }
  }, []);

  useEffect(() => { if (!meLoading && !me) navigate("/login"); }, [me, meLoading]);

  const logoutMutation     = useMutation({ mutationFn:()=>apiRequest("POST","/api/auth/logout",{}), onSuccess:()=>{ queryClient.clear(); navigate("/"); } });
  const disconnectMutation = useMutation({ mutationFn:()=>apiRequest("POST","/api/auth/disconnect",{}), onSuccess:()=>{ queryClient.invalidateQueries({ queryKey:["/api/auth/status"] }); toast({ title:"Gmail disconnected." }); } });

  const generateMutation = useMutation({
    mutationFn: async (data: { businessType:string; location:string; intent?:string; leadCount?:number; tone?:Tone }) => {
      const res = await apiRequest("POST","/api/generate-leads",data);
      if (!res.ok) {
        if (res.status===401) { navigate("/login"); throw new Error("Not authenticated"); }
        const body = await res.json();
        if (res.status===503) { const e:any=new Error(body.message||body.error); e.isApiKeyMissing=true; throw e; }
        throw new Error(body.message||body.error||"Failed");
      }
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setApiKeyMissing(false); setResult(data); setSendData(null); setSendResults({}); setFilterLabel("all"); setSortBy("score-desc");
      const init: Record<number,{subject:string;body:string}> = {};
      data.leads.forEach(l => { init[l.id]={ subject:l.emailSubject, body:l.emailBody }; });
      setEditedEmails(init);
      setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),200);
    },
    onError: (err:any) => {
      if (err.isApiKeyMissing) setApiKeyMissing(true);
      else toast({ title:"Generation failed.", description:err.message, variant:"destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (leads:Lead[]) => {
      const enriched = leads.map(l => ({ ...l, emailSubject:editedEmails[l.id]?.subject||l.emailSubject, emailBody:editedEmails[l.id]?.body||l.emailBody }));
      const res = await apiRequest("POST","/api/send-emails",{ leads:enriched });
      return res.json() as Promise<SendEmailsResponse>;
    },
    onSuccess: (data) => {
      setSendData(data);
      const map: Record<number,{success:boolean}> = {};
      if (result) data.results.forEach((r,i) => { map[result.leads[i]?.id]=r; });
      setSendResults(map);
    },
    onError: (err:any) => toast({ title:"Send failed.", description:err.message, variant:"destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim()||!location.trim()) { toast({ title:"Enter a business type and location.", variant:"destructive" }); return; }
    generateMutation.mutate({ businessType:businessType.trim(), location:location.trim(), intent:intent.trim()||undefined, leadCount, tone });
  };

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map(l=>l.email).join(", "));
    toast({ title:"All emails copied." });
  };

  const exportCSV = () => {
    if (!result) return;
    const hdr = ["Company","Contact","Title","Email","Phone","Website","Score","Label"];
    const rows = result.leads.map(l=>[l.companyName,l.contactName,l.title??"",l.email,l.phone??"",l.website??"",l.score??"",l.scoreLabel??""]);
    const csv = [hdr,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download="outleadrr-leads.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title:"CSV downloaded." });
  };

  const displayedLeads = useMemo(() => {
    if (!result) return [];
    let leads = [...result.leads];
    if (filterLabel!=="all") leads = leads.filter(l=>l.scoreLabel===filterLabel);
    if (sortBy==="score-desc") leads.sort((a,b)=>(b.score??0)-(a.score??0));
    else if (sortBy==="score-asc") leads.sort((a,b)=>(a.score??0)-(b.score??0));
    else leads.sort((a,b)=>a.companyName.localeCompare(b.companyName));
    return leads;
  },[result,sortBy,filterLabel]);

  const stats = useMemo(() => {
    if (!result?.leads.length) return null;
    const leads = result.leads;
    const avg   = Math.round(leads.reduce((s,l)=>s+(l.score??0),0)/leads.length);
    return { avg, strong:leads.filter(l=>l.scoreLabel==="Strong Lead").length, phone:leads.filter(l=>l.phone).length, total:leads.length };
  },[result]);

  if (meLoading) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG }}>
      <style>{GLOBAL}</style>
      <span style={{ width:20,height:20,border:`2px solid ${BDR}`,borderTop:`2px solid ${K}`,borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }} />
    </div>
  );
  if (!me) return null;

  return (
    <>
      <style>{GLOBAL}</style>
      <BgWave />
      <div style={{ position:"relative",zIndex:1 }}>
      <OnboardingModal />
      {sendData && <SendResultsPanel data={sendData} onClose={()=>setSendData(null)} />}

      <AppNav
        email={me.email}
        gmailStatus={auth??null}
        onDisconnectGmail={()=>disconnectMutation.mutate()}
        onLogout={()=>logoutMutation.mutate()}
        disconnecting={disconnectMutation.isPending}
        loggingOut={logoutMutation.isPending}
      />

      {/* ── Page hero ────────────────────────────────────────────── */}
      <div style={{ position:"relative",background:"#0a0a0a",overflow:"hidden" }}>
        <WaveCanvas />
        <div style={{ position:"relative",zIndex:1,width:"100%",padding:"52px 48px 48px" }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"4px 12px",marginBottom:18 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block",boxShadow:"0 0 6px #4ade80" }} />
            <span style={{ fontSize:10,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)" }}>Lead Generator</span>
          </div>
          <h1 style={{ fontSize:42,fontWeight:900,color:"#ffffff",letterSpacing:"-.04em",lineHeight:1.08,marginBottom:12 }}>
            Find businesses.<br />Send in one click.
          </h1>
          <p style={{ fontSize:15,color:"rgba(255,255,255,0.55)",maxWidth:500,lineHeight:1.6 }}>
            Discover real prospects from Google Maps, score them by opportunity, and send AI-written cold emails — in under 30 seconds.
          </p>
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────────── */}
      <div style={{ width:"100%",padding:"32px 48px 0" }}>
        <div style={{ background:W,borderRadius:16,border:`1px solid #e2e2e6`,boxShadow:"0 4px 24px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04)" }}>
          {/* Card header */}
          <div style={{ padding:"18px 28px",borderBottom:`1px solid #f0f0f2`,display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:4,height:20,background:K,borderRadius:2 }} />
            <span style={{ fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:K }}>Campaign Setup</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding:"24px 28px 28px" }}>
            {/* Row 1 */}
            <div className="form-2col" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
              <div>
                <label className="lf-label">Business Type</label>
                <input className="lf-input" value={businessType} onChange={e=>setBusinessType(e.target.value)} placeholder="plumbers, dentists, HVAC companies…" />
              </div>
              <div>
                <label className="lf-label">Location</label>
                <input className="lf-input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Houston, TX · Chicago, IL…" />
              </div>
            </div>

            {/* Row 2: Intent */}
            <div style={{ marginBottom:16 }}>
              <label className="lf-label">
                What are you selling?
                <span style={{ textTransform:"none",letterSpacing:0,fontWeight:400,color:K4,marginLeft:6,fontSize:11 }}>GPT tailors every email around this</span>
              </label>
              <input className="lf-input" value={intent} onChange={e=>setIntent(e.target.value)} placeholder="e.g. website design services for local businesses" />
            </div>

            {/* Row 3: Volume + Tone */}
            <div className="vol-tone-row" style={{ display:"flex",gap:32,marginBottom:22,flexWrap:"wrap" }}>
              <div>
                <label className="lf-label">Lead Volume</label>
                <div style={{ display:"flex",gap:8 }}>
                  {([10,25,50] as (10|25|50)[]).map(n=>(
                    <button key={n} type="button" className={`vol-pill${leadCount===n?" active":""}`} onClick={()=>setLeadCount(n)}>
                      {n}{n===50?"+":""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="lf-label">Email Persona</label>
                <PersonaDropdown value={tone} onChange={setTone} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="cta-btn" disabled={generateMutation.isPending}>
              {generateMutation.isPending
                ? <><span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }} /> Finding leads…</>
                : `Find ${leadCount===50?"50+":leadCount} leads →`}
            </button>

            {/* Examples */}
            <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginTop:14 }}>
              {EXAMPLES.map(ex=>(
                <button key={ex.business} type="button"
                  onClick={()=>{ setBusinessType(ex.business); setLocation(ex.location); }}
                  style={{ padding:"5px 13px",borderRadius:7,background:"#f7f7f9",border:`1px solid #e2e2e6`,fontSize:12,color:K2,cursor:"pointer",transition:"all .15s",fontWeight:500 }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=K; e.currentTarget.style.color=K; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e2e2e6"; e.currentTarget.style.color=K2; }}>
                  {ex.business}, {ex.location}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* ── API key banner ───────────────────────────────────────── */}
      {apiKeyMissing && (
        <div style={{ width:"100%",padding:"20px 48px 0" }}>
          <div style={{ background:"#fefce8",border:"1px solid #fde047",borderRadius:12,padding:"18px 22px",display:"flex",gap:12,alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:"#854d0e",marginBottom:4 }}>Google Places API key required</div>
              <p style={{ fontSize:12,color:"#92400e",lineHeight:1.6,margin:0 }}>
                Add <code style={{ fontFamily:"monospace",background:"rgba(0,0,0,.06)",padding:"1px 5px",borderRadius:3 }}>GOOGLE_PLACES_API_KEY</code> to your environment.
                Get one at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color:"#854d0e",fontWeight:700 }}>Google Cloud Console</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────── */}
      {generateMutation.isPending && (
        <div style={{ width:"100%",padding:"28px 48px 0" }}>
          <div style={{ background:W,borderRadius:16,border:`1px solid #e2e2e6`,padding:"8px 36px 36px",boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
            <ProgressSteps active={generateMutation.isPending} />
            <div style={{ display:"flex",flexDirection:"column",gap:12,marginTop:20 }}>
              {[0,1,2].map(i=><SkeletonCard key={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && !generateMutation.isPending && (
        <div ref={resultsRef} style={{ width:"100%",padding:"28px 48px 80px" }}>

          {/* Stat bar */}
          {stats && (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
              {[
                { label:"Leads Found",    value:String(stats.total),           sub:"businesses"    },
                { label:"Avg Score",      value:String(stats.avg)+"/100",      sub:"lead quality"  },
                { label:"Strong Leads",   value:String(stats.strong),          sub:"top prospects" },
                { label:"Est. Response",  value:respRate(stats.avg),           sub:"reply rate"    },
              ].map(c=>(
                <div key={c.label} style={{ background:W,borderRadius:12,border:`1px solid #e2e2e6`,padding:"18px 22px",boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:K3,marginBottom:8 }}>{c.label}</div>
                  <div style={{ fontSize:26,fontWeight:800,color:K,letterSpacing:"-.03em",lineHeight:1 }}>{c.value}</div>
                  <div style={{ fontSize:11,color:K3,marginTop:5 }}>{c.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="toolbar-row" style={{ background:W,borderRadius:12,border:`1px solid #e2e2e6`,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
              {(["all","Strong Lead","Good Lead","Weak Lead"] as FilterLbl[]).map(f=>(
                <button key={f} className={`filter-pill${filterLabel===f?" active":""}`} onClick={()=>setFilterLabel(f)}>
                  {f==="all"?`All (${result.leads.length})`:f}
                </button>
              ))}
              <select value={sortBy} onChange={e=>setSortBy(e.target.value as SortKey)}
                style={{ padding:"5px 10px",border:`1.5px solid ${BDR}`,borderRadius:6,background:W,fontSize:12,color:K,cursor:"pointer",outline:"none",marginLeft:4 }}>
                <option value="score-desc">Score: High → Low</option>
                <option value="score-asc">Score: Low → High</option>
                <option value="name">Name A → Z</option>
              </select>
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              <button className="ghost-btn" onClick={copyAllEmails}>Copy emails</button>
              <button className="ghost-btn" onClick={exportCSV}>Export CSV</button>
              <button className="ghost-btn" onClick={()=>generateMutation.mutate({businessType,location,intent:intent||undefined,leadCount,tone})}>Regenerate</button>
              {auth?.connected
                ? <button className="send-btn" onClick={()=>sendMutation.mutate(result.leads)} disabled={sendMutation.isPending}>{sendMutation.isPending?"Sending…":"Send all via Gmail"}</button>
                : <a href="/api/auth/google" className="send-btn" style={{ textDecoration:"none" }}>Connect Gmail →</a>
              }
            </div>
          </div>

          {filterLabel!=="all" && (
            <p style={{ fontSize:12,color:K3,marginBottom:10,paddingLeft:2 }}>
              Showing {displayedLeads.length} of {result.leads.length} — filtered by <strong style={{ color:K2 }}>{filterLabel}</strong>
              <button onClick={()=>setFilterLabel("all")} style={{ background:"none",border:"none",cursor:"pointer",color:K2,fontSize:12,marginLeft:8,padding:0,fontFamily:F,textDecoration:"underline" }}>Clear</button>
            </p>
          )}

          {displayedLeads.length > 0
            ? <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {displayedLeads.map((lead,i)=>(
                  <LeadCard key={lead.id} lead={lead} index={i}
                    sending={sendMutation.isPending&&!sendResults[lead.id]}
                    sendResult={sendResults[lead.id]}
                    editedEmail={editedEmails[lead.id]||{subject:lead.emailSubject,body:lead.emailBody}}
                    onEditEmail={(s,b)=>setEditedEmails(p=>({...p,[lead.id]:{subject:s,body:b}}))}
                  />
                ))}
              </div>
            : <div style={{ textAlign:"center",padding:"64px 32px",background:W,borderRadius:16,border:`1px solid #e2e2e6`,boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize:14,fontWeight:700,color:K,marginBottom:8 }}>No {filterLabel} leads found</div>
                <button className="ghost-btn" onClick={()=>setFilterLabel("all")}>Show all</button>
              </div>
          }
        </div>
      )}
      </div>
    </>
  );
}
