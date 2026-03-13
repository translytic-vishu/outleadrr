import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppNav } from "@/components/site-nav";

/* ─── Design tokens ───────────────────────────────────────────────── */
const FONT  = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BG    = "#f8f9fb";
const WHITE = "#ffffff";
const INK   = "#0f0f0f";
const INK2  = "#555";
const INK3  = "#999";
const BDR   = "rgba(0,0,0,0.08)";
const IND   = "#6366f1";
const IND_L = "rgba(99,102,241,0.08)";
const IND_M = "rgba(99,102,241,0.15)";

const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${BG}; color: ${INK}; font-family: ${FONT}; }
  input, button, select, textarea { font-family: ${FONT}; }
  input::placeholder, textarea::placeholder { color: #bbb; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes stepFill  { from{width:0} to{width:100%} }
  .lf-input {
    width:100%;padding:12px 15px;
    background:${WHITE};border:1.5px solid ${BDR};
    border-radius:10px;font-size:14px;color:${INK};outline:none;
    transition:border-color .2s,box-shadow .2s;
  }
  .lf-input:focus{border-color:${IND};box-shadow:0 0 0 3px ${IND_M};}
  .lf-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${INK3};display:block;margin-bottom:7px;}
  .vol-pill{
    padding:8px 20px;border-radius:99px;border:1.5px solid ${BDR};
    background:${WHITE};font-size:13px;font-weight:600;color:${INK2};
    cursor:pointer;transition:all .15s;
  }
  .vol-pill:hover{border-color:${IND};color:${IND};}
  .vol-pill.active{background:${IND};border-color:${IND};color:#fff;box-shadow:0 2px 10px rgba(99,102,241,.3);}
  .tone-pill{
    padding:7px 16px;border-radius:99px;border:1.5px solid ${BDR};
    background:${WHITE};font-size:12px;font-weight:600;color:${INK2};
    cursor:pointer;transition:all .15s;
  }
  .tone-pill:hover{border-color:${IND};color:${IND};}
  .tone-pill.active{background:${IND_L};border-color:${IND};color:${IND};}
  .cta-btn{
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:14px 36px;border-radius:12px;border:none;
    background:${IND};color:#fff;font-size:15px;font-weight:700;letter-spacing:-.01em;
    cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;
    box-shadow:0 2px 12px rgba(99,102,241,.35);width:100%;
  }
  .cta-btn:hover{background:#4f46e5;transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.4);}
  .cta-btn:active{transform:translateY(0);}
  .cta-btn:disabled{background:#c7c8f5;box-shadow:none;cursor:not-allowed;transform:none;}
  .outline-btn{
    display:inline-flex;align-items:center;gap:6px;
    padding:7px 16px;border-radius:8px;
    background:${WHITE};color:${INK};border:1.5px solid ${BDR};
    font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;
  }
  .outline-btn:hover{border-color:${IND};color:${IND};background:${IND_L};}
  .outline-btn:disabled{opacity:.5;cursor:not-allowed;}
  .send-btn{
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 20px;border-radius:8px;border:none;
    background:${IND};color:#fff;font-size:13px;font-weight:700;
    cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(99,102,241,.3);
  }
  .send-btn:hover{background:#4f46e5;}
  .send-btn:disabled{background:#c7c8f5;cursor:not-allowed;box-shadow:none;}
  .skeleton{animation:pulse 1.5s ease-in-out infinite;background:#e9eaf0;border-radius:6px;}
  .filter-pill{padding:5px 14px;border-radius:99px;border:1.5px solid ${BDR};background:${WHITE};font-size:12px;font-weight:600;color:${INK2};cursor:pointer;transition:all .15s;}
  .filter-pill:hover{border-color:${IND};color:${IND};}
  .filter-pill.active{background:${IND};color:#fff;border-color:${IND};}
  @media(max-width:700px){
    .form-grid-2{grid-template-columns:1fr !important;}
    .toolbar-row{flex-direction:column !important;align-items:flex-start !important;}
  }
`;

/* ─── Progress step data ─────────────────────────────────────────── */
const STEPS = ["Searching Maps", "Scoring Leads", "Writing Emails", "Ready to Send"];
const STEP_DELAYS = [0, 2200, 4800, 9000]; // ms

/* ─── Send Results Overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  const allSent = data.sent === data.total;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.45)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ width:"100%",maxWidth:460,borderRadius:20,background:WHITE,boxShadow:"0 24px 60px rgba(0,0,0,.18)",overflow:"hidden" }}>
        <div style={{ padding:"24px 28px 18px",borderBottom:`1px solid ${BDR}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:INK3,marginBottom:6 }}>Send Report</div>
            <div style={{ fontSize:28,fontWeight:800,color:allSent?"#16a34a":INK,letterSpacing:"-.03em" }}>{data.sent} of {data.total} sent</div>
            {data.failed > 0 && <div style={{ fontSize:12,color:"#dc2626",marginTop:4 }}>{data.failed} failed</div>}
          </div>
          <button onClick={onClose} style={{ background:"rgba(0,0,0,.06)",border:"none",borderRadius:99,width:32,height:32,fontSize:18,cursor:"pointer",color:INK2,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ maxHeight:280,overflowY:"auto",padding:"12px 28px 24px" }}>
          {data.results.map(r => (
            <div key={r.email} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:`1px solid ${BDR}` }}>
              <span style={{ fontSize:13,fontFamily:"monospace",color:INK2 }}>{r.email}</span>
              <span style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",color:r.success?"#16a34a":"#dc2626" }}>{r.success?"✓ Sent":"✗ Failed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Score helpers ──────────────────────────────────────────────── */
const sc  = (v: number) => v >= 70 ? "#16a34a" : v >= 45 ? "#ea580c" : "#dc2626";
const scB = (v: number) => v >= 70 ? "#f0fdf4" : v >= 45 ? "#fff7ed" : "#fef2f2";
const lc  = (l: string) => l === "Strong Lead" ? "#16a34a" : l === "Good Lead" ? "#ea580c" : "#dc2626";
const lB  = (l: string) => l === "Strong Lead" ? "#f0fdf4" : l === "Good Lead" ? "#fff7ed" : "#fef2f2";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
      <span style={{ fontSize:11,color:INK2,width:96,flexShrink:0 }}>{label}</span>
      <div style={{ flex:1,height:4,borderRadius:99,background:scB(value),overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${value}%`,borderRadius:99,background:sc(value),transition:"width .7s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      <span style={{ fontSize:11,fontWeight:700,color:sc(value),width:30,textAlign:"right",flexShrink:0 }}>{value}</span>
    </div>
  );
}

/* ─── Skeleton Card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background:WHITE,borderRadius:16,border:`1px solid ${BDR}`,padding:"22px 24px" }}>
      <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
        <div className="skeleton" style={{ width:56,height:56,borderRadius:"50%",flexShrink:0 }} />
        <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
          <div className="skeleton" style={{ height:16,width:"50%",borderRadius:6 }} />
          <div className="skeleton" style={{ height:12,width:"32%",borderRadius:6 }} />
          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            <div className="skeleton" style={{ height:12,width:90,borderRadius:6 }} />
            <div className="skeleton" style={{ height:12,width:140,borderRadius:6 }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop:16,paddingTop:14,borderTop:`1px solid ${BDR}`,display:"flex",flexDirection:"column",gap:7 }}>
        {[80,55,70,45,65].map((w,i) => <div key={i} className="skeleton" style={{ height:7,width:`${w}%`,borderRadius:4 }} />)}
      </div>
    </div>
  );
}

/* ─── Lead Card ─────────────────────────────────────────────────── */
function LeadCard({
  lead, index, sending, sendResult, editedEmail, onEditEmail,
}: {
  lead: Lead; index: number; sending: boolean;
  sendResult?: { success: boolean; error?: string };
  editedEmail: { subject: string; body: string };
  onEditEmail: (subject: string, body: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<"email"|"body"|null>(null);

  const copy = async (text: string, key: "email"|"body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const score = lead.score ?? 62;
  const scoreLabel = lead.scoreLabel ?? "Good Lead";
  const sb = lead.scoreBreakdown;

  return (
    <div style={{
      background:WHITE,borderRadius:16,border:`1px solid ${BDR}`,
      boxShadow:"0 1px 4px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03)",
      overflow:"hidden",opacity:sending?.5:1,transition:"opacity .2s",
      animation:`fadeUp .4s cubic-bezier(.16,1,.3,1) ${index*60}ms both`,
    }}>
      {/* Top */}
      <div style={{ padding:"18px 22px",display:"flex",gap:18,alignItems:"flex-start" }}>
        {/* Score circle */}
        <div style={{ flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
          <div style={{ width:58,height:58,borderRadius:"50%",background:scB(score),border:`2.5px solid ${sc(score)}`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" }}>
            <span style={{ fontSize:18,fontWeight:800,color:sc(score),lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:8,color:sc(score),fontWeight:600,opacity:.7 }}>/100</span>
          </div>
          <span style={{ fontSize:9,fontWeight:700,color:lc(scoreLabel),background:lB(scoreLabel),borderRadius:99,padding:"2px 7px",whiteSpace:"nowrap" }}>{scoreLabel}</span>
        </div>
        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:5 }}>
            <div>
              <div style={{ fontSize:16,fontWeight:700,color:INK,letterSpacing:"-.02em" }}>{lead.companyName}</div>
              <div style={{ fontSize:13,color:INK2,marginTop:2 }}>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</div>
            </div>
            {sendResult && (
              <span style={{ fontSize:11,fontWeight:700,color:sendResult.success?"#16a34a":"#dc2626",background:sendResult.success?"#f0fdf4":"#fef2f2",border:`1px solid ${sendResult.success?"#bbf7d0":"#fecaca"}`,padding:"3px 10px",borderRadius:99,whiteSpace:"nowrap" }}>
                {sendResult.success ? "✓ Sent" : "✗ Failed"}
              </span>
            )}
            {sending && <span style={{ fontSize:11,color:INK3,fontWeight:600 }}>Sending…</span>}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"5px 16px",marginTop:8 }}>
            {lead.phone && <a href={`tel:${lead.phone}`} style={{ fontSize:13,color:INK,textDecoration:"none",display:"flex",alignItems:"center",gap:5 }}>📞 {lead.phone}</a>}
            <button onClick={() => copy(lead.email,"email")} style={{ fontSize:13,color:"#2563eb",background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4,fontFamily:FONT }}>
              ✉ <span style={{ fontFamily:"monospace",fontSize:12 }}>{copied==="email"?"Copied ✓":lead.email}</span>
            </button>
            {lead.website && <a href={lead.website.startsWith("http")?lead.website:`https://${lead.website}`} target="_blank" rel="noreferrer" style={{ fontSize:12,color:INK3,textDecoration:"none",display:"flex",alignItems:"center",gap:4 }}>🌐 <span style={{ fontFamily:"monospace" }}>{lead.website.replace(/^https?:\/\//,"").replace(/\/$/,"").slice(0,28)}</span></a>}
            {(lead.rating??0)>0 && <span style={{ fontSize:12,color:INK2 }}>⭐ {lead.rating?.toFixed(1)} <span style={{ color:INK3 }}>({lead.reviewCount?.toLocaleString()})</span></span>}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {sb && (
        <div style={{ padding:"12px 22px 14px",borderTop:`1px solid ${BDR}`,background:"#fafbfe" }}>
          <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:INK3,marginBottom:9 }}>Score Breakdown</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            <ScoreBar label="Industry Fit"  value={sb.industryFit} />
            <ScoreBar label="Business Size" value={sb.businessSize} />
            <ScoreBar label="Reachability"  value={sb.reachability} />
            <ScoreBar label="Opportunity"   value={sb.opportunity} />
            <ScoreBar label="Review Health" value={sb.reviewHealth} />
          </div>
        </div>
      )}

      {/* Email preview */}
      <div style={{ borderTop:`1px solid ${BDR}` }}>
        <button onClick={() => setOpen(!open)} style={{ width:"100%",padding:"10px 22px",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:12,fontWeight:700,color:IND,display:"flex",alignItems:"center",gap:6,transition:"background .15s" }}>
          <span style={{ fontSize:13 }}>✉</span>
          {open ? "Hide email preview" : "View email preview →"}
          {!open && <span style={{ marginLeft:"auto",fontSize:11,color:INK3,fontWeight:400 }}>{editedEmail.subject?.slice(0,40)}</span>}
        </button>
        {open && (
          <div style={{ padding:"0 22px 18px" }}>
            <div style={{ background:"#fafbfe",borderRadius:12,border:`1.5px solid ${BDR}`,overflow:"hidden" }}>
              {/* Subject */}
              <div style={{ padding:"10px 14px",borderBottom:`1px solid ${BDR}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:WHITE }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:INK3,marginBottom:3 }}>Subject</div>
                  {editing ? (
                    <input value={editedEmail.subject} onChange={e => onEditEmail(e.target.value, editedEmail.body)}
                      style={{ width:"100%",fontSize:13,fontWeight:600,color:INK,background:"transparent",border:"none",outline:"none",padding:0,fontFamily:FONT }} />
                  ) : (
                    <div style={{ fontSize:13,fontWeight:600,color:INK }}>{editedEmail.subject}</div>
                  )}
                </div>
                <div style={{ display:"flex",gap:6,flexShrink:0,marginLeft:10 }}>
                  <button className="outline-btn" onClick={() => setEditing(!editing)} style={{ fontSize:11,padding:"4px 10px" }}>{editing ? "Done" : "Edit"}</button>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center" }}>
                  <span style={{ fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:INK3 }}>Email Body</span>
                  <button className="outline-btn" onClick={() => copy(editedEmail.body,"body")} style={{ fontSize:11,padding:"4px 10px" }}>{copied==="body"?"Copied ✓":"Copy"}</button>
                </div>
                {editing ? (
                  <textarea value={editedEmail.body} onChange={e => onEditEmail(editedEmail.subject, e.target.value)}
                    style={{ width:"100%",fontSize:13,lineHeight:1.75,color:INK2,background:"transparent",border:"none",outline:"none",resize:"vertical",minHeight:120,padding:0,fontFamily:FONT }} />
                ) : (
                  <p style={{ fontSize:13,lineHeight:1.75,color:INK2,whiteSpace:"pre-line",margin:0 }}>{editedEmail.body}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Progress Indicator ────────────────────────────────────────── */
function ProgressSteps({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = STEP_DELAYS.slice(1).map((delay, i) =>
      setTimeout(() => setStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div style={{ display:"flex",alignItems:"center",gap:0,justifyContent:"center",padding:"28px 0 8px" }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display:"flex",alignItems:"center",gap:0 }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
            <div style={{
              width:34,height:34,borderRadius:"50%",
              background: i < step ? IND : i === step ? IND_L : "rgba(0,0,0,.05)",
              border: `2px solid ${i <= step ? IND : BDR}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .4s",
            }}>
              {i < step
                ? <span style={{ fontSize:14,color:"#fff" }}>✓</span>
                : i === step
                  ? <span style={{ display:"inline-block",width:12,height:12,border:`2px solid ${IND}`,borderTop:`2px solid transparent`,borderRadius:"50%",animation:"spin .7s linear infinite" }} />
                  : <span style={{ width:8,height:8,borderRadius:"50%",background:BDR,display:"inline-block" }} />
              }
            </div>
            <span style={{ fontSize:11,fontWeight:600,color: i <= step ? IND : INK3,whiteSpace:"nowrap" }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width:64,height:2,background:BDR,marginBottom:20,position:"relative",overflow:"hidden" }}>
              {i < step && <div style={{ position:"absolute",inset:0,background:IND,animation:"stepFill .4s ease" }} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Estimated Response Rate ───────────────────────────────────── */
function responseRate(avgScore: number) {
  if (avgScore >= 72) return { label: "18–22%", color: "#16a34a", bg: "#f0fdf4" };
  if (avgScore >= 55) return { label: "12–16%", color: "#ea580c", bg: "#fff7ed" };
  return { label: "6–10%", color: "#dc2626", bg: "#fef2f2" };
}

type SortKey = "score-desc" | "score-asc" | "name";
type FilterLabel = "all" | "Strong Lead" | "Good Lead" | "Weak Lead";
type Tone = "professional" | "friendly" | "direct" | "humorous";

const TONE_OPTIONS: { key: Tone; label: string; desc: string }[] = [
  { key: "professional", label: "Professional", desc: "Formal & business-focused" },
  { key: "friendly",     label: "Friendly",     desc: "Warm & conversational" },
  { key: "direct",       label: "Direct",       desc: "Straight to the point" },
  { key: "humorous",     label: "Humorous",     desc: "Light & memorable" },
];

const EXAMPLES = [
  { business: "plumbers",          location: "Houston, TX" },
  { business: "dentists",          location: "Los Angeles, CA" },
  { business: "HVAC companies",    location: "Chicago, IL" },
  { business: "law firms",         location: "New York, NY" },
];

/* ─── Main App ──────────────────────────────────────────────────── */
export default function App() {
  const [, navigate] = useLocation();

  /* form state */
  const [businessType, setBusinessType] = useState("");
  const [location,     setLocation]     = useState("");
  const [intent,       setIntent]       = useState("");
  const [leadCount,    setLeadCount]    = useState<10|25|50>(10);
  const [tone,         setTone]         = useState<Tone>("professional");

  /* results state */
  const [result,       setResult]       = useState<LeadsResponse | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sendData,     setSendData]     = useState<SendEmailsResponse | null>(null);
  const [sendResults,  setSendResults]  = useState<Record<number,{success:boolean;error?:string}>>({});
  const [sortBy,       setSortBy]       = useState<SortKey>("score-desc");
  const [filterLabel,  setFilterLabel]  = useState<FilterLabel>("all");
  const [editedEmails, setEditedEmails] = useState<Record<number,{subject:string;body:string}>>({});

  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* auth queries */
  const { data: me, isLoading: meLoading } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"], retry: false });
  const { data: auth } = useQuery<AuthStatus>({ queryKey: ["/api/auth/status"], refetchInterval: false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "true") {
      toast({ title: "Gmail connected successfully." });
      window.history.replaceState({}, "", "/app");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title: "Connection failed. Please try again.", variant: "destructive" });
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  useEffect(() => { if (!meLoading && !me) navigate("/login"); }, [me, meLoading]);

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess:  () => { queryClient.clear(); navigate("/"); },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect", {}),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] }); toast({ title: "Gmail disconnected." }); },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { businessType: string; location: string; intent?: string; leadCount?: number; tone?: Tone }) => {
      const res = await apiRequest("POST", "/api/generate-leads", data);
      if (!res.ok) {
        if (res.status === 401) { navigate("/login"); throw new Error("Not authenticated"); }
        const body = await res.json();
        if (res.status === 503) { const err: any = new Error(body.message||body.error); err.isApiKeyMissing=true; throw err; }
        throw new Error(body.message||body.error||"Failed to generate leads");
      }
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setApiKeyMissing(false);
      setResult(data);
      setSendData(null); setSendResults({}); setFilterLabel("all"); setSortBy("score-desc");
      // Initialise editable email state
      const initEdits: Record<number,{subject:string;body:string}> = {};
      data.leads.forEach(l => { initEdits[l.id] = { subject: l.emailSubject, body: l.emailBody }; });
      setEditedEmails(initEdits);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 200);
    },
    onError: (err: any) => {
      if (err.isApiKeyMissing) setApiKeyMissing(true);
      else toast({ title:"Generation failed.", description:err.message, variant:"destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      const enriched = leads.map(l => ({ ...l, emailSubject: editedEmails[l.id]?.subject||l.emailSubject, emailBody: editedEmails[l.id]?.body||l.emailBody }));
      const res = await apiRequest("POST", "/api/send-emails", { leads: enriched });
      return res.json() as Promise<SendEmailsResponse>;
    },
    onSuccess: (data) => {
      setSendData(data);
      const map: Record<number,{success:boolean;error?:string}> = {};
      if (result) data.results.forEach((r,i) => { map[result.leads[i]?.id] = r; });
      setSendResults(map);
    },
    onError: (err: any) => toast({ title:"Send failed.", description:err.message, variant:"destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim()||!location.trim()) { toast({ title:"Enter a business type and location.", variant:"destructive" }); return; }
    generateMutation.mutate({ businessType:businessType.trim(), location:location.trim(), intent:intent.trim()||undefined, leadCount, tone });
  };

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map(l => l.email).join(", "));
    toast({ title:"Copied all emails." });
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = ["Company","Contact","Title","Email","Phone","Website","Score","Label"];
    const rows = result.leads.map(l => [l.companyName,l.contactName,l.title??"",l.email,l.phone??"",l.website??"",l.score??"",l.scoreLabel??""]);
    const csv = [headers,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`outleadrr-leads.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title:"CSV downloaded." });
  };

  const displayedLeads = useMemo(() => {
    if (!result) return [];
    let leads = [...result.leads];
    if (filterLabel !== "all") leads = leads.filter(l => l.scoreLabel === filterLabel);
    if (sortBy === "score-desc") leads.sort((a,b) => (b.score??0)-(a.score??0));
    else if (sortBy === "score-asc") leads.sort((a,b) => (a.score??0)-(b.score??0));
    else leads.sort((a,b) => a.companyName.localeCompare(b.companyName));
    return leads;
  }, [result, sortBy, filterLabel]);

  const summaryStats = useMemo(() => {
    if (!result||!result.leads.length) return null;
    const leads = result.leads;
    const avgScore = Math.round(leads.reduce((s,l) => s+(l.score??0),0)/leads.length);
    return { avgScore, strongCount:leads.filter(l=>l.scoreLabel==="Strong Lead").length, withPhone:leads.filter(l=>l.phone).length, total:leads.length };
  }, [result]);

  if (meLoading) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG }}>
      <style>{GLOBAL}</style>
      <div style={{ width:24,height:24,border:`2px solid ${BDR}`,borderTop:`2px solid ${IND}`,borderRadius:"50%",animation:"spin .7s linear infinite" }} />
    </div>
  );
  if (!me) return null;

  return (
    <>
      <style>{GLOBAL}</style>
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      <AppNav
        email={me.email}
        gmailStatus={auth ?? null}
        onDisconnectGmail={() => disconnectMutation.mutate()}
        onLogout={() => logoutMutation.mutate()}
        disconnecting={disconnectMutation.isPending}
        loggingOut={logoutMutation.isPending}
      />

      {/* ── Page Title ───────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${WHITE} 0%,#f3f4ff 100%)`,borderBottom:`1px solid ${BDR}` }}>
        <div style={{ maxWidth:1200,margin:"0 auto",padding:"32px 36px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:8 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${IND},#818cf8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 14px rgba(99,102,241,.35)" }}>🎯</div>
            <div>
              <h1 style={{ fontSize:26,fontWeight:900,color:INK,letterSpacing:"-.04em",lineHeight:1 }}>Lead Generator</h1>
              <p style={{ fontSize:13,color:INK2,marginTop:4 }}>Find businesses, score them, and send AI-crafted cold emails in seconds.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Campaign Setup Form ──────────────────────────────────── */}
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"28px 36px 0" }}>
        <div style={{ background:WHITE,borderRadius:20,border:`1px solid ${BDR}`,boxShadow:"0 4px 24px rgba(0,0,0,.06),0 1px 4px rgba(0,0,0,.04)",overflow:"hidden" }}>
          {/* Form header */}
          <div style={{ padding:"20px 28px 16px",borderBottom:`1px solid ${BDR}`,background:`linear-gradient(90deg,${IND_L},transparent)` }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:6,height:22,borderRadius:3,background:IND }} />
              <span style={{ fontSize:13,fontWeight:700,letterSpacing:".04em",color:INK }}>Campaign Setup</span>
              <span style={{ fontSize:12,color:INK3,marginLeft:4 }}>— Describe your offer, choose your targets, hit send.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding:"20px 24px 24px" }}>
            {/* Row 1: Business Type + Location */}
            <div className="form-grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16 }}>
              <div>
                <label className="lf-label">Business Type</label>
                <input className="lf-input" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="plumbers, dentists, HVAC companies…" />
              </div>
              <div>
                <label className="lf-label">Location</label>
                <input className="lf-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Houston, TX · Los Angeles, CA…" />
              </div>
            </div>

            {/* Row 2: Campaign Intent */}
            <div style={{ marginBottom:16 }}>
              <label className="lf-label">What are you selling? <span style={{ textTransform:"none",letterSpacing:0,fontWeight:400,color:INK3 }}>(GPT tailors every email around this)</span></label>
              <input className="lf-input" value={intent} onChange={e => setIntent(e.target.value)} placeholder="e.g. I'm selling website design services for local businesses…" />
            </div>

            {/* Row 3: Lead Volume + Tone */}
            <div className="form-grid-2" style={{ display:"grid",gridTemplateColumns:"auto 1fr",gap:24,marginBottom:22,alignItems:"flex-start" }}>
              <div>
                <label className="lf-label">Lead Volume</label>
                <div style={{ display:"flex",gap:8 }}>
                  {([10,25,50] as (10|25|50)[]).map(n => (
                    <button key={n} type="button" className={`vol-pill${leadCount===n?" active":""}`} onClick={() => setLeadCount(n)}>{n}{n===50?"+":""}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="lf-label">Email Tone</label>
                <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
                  {TONE_OPTIONS.map(({ key, label }) => (
                    <button key={key} type="button" className={`tone-pill${tone===key?" active":""}`} onClick={() => setTone(key)} title={TONE_OPTIONS.find(t=>t.key===key)?.desc}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <button type="submit" className="cta-btn" disabled={generateMutation.isPending}>
              {generateMutation.isPending
                ? <><span style={{ display:"inline-block",width:16,height:16,border:"2px solid rgba(255,255,255,.35)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite" }} /> Finding leads…</>
                : `Find ${leadCount === 50 ? "50+" : leadCount} leads →`}
            </button>

            {/* Example pills */}
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:12 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.business} type="button"
                  onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                  style={{ padding:"5px 12px",borderRadius:99,background:BG,border:`1px solid ${BDR}`,fontSize:12,color:INK2,cursor:"pointer" }}>
                  {ex.business}, {ex.location}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* ── API key missing banner ───────────────────────────────── */}
      {apiKeyMissing && (
        <div style={{ maxWidth:1200,margin:"20px auto 0",padding:"0 36px" }}>
          <div style={{ background:"#fefce8",border:"1px solid #fde047",borderRadius:14,padding:"18px 22px",display:"flex",gap:14,alignItems:"flex-start" }}>
            <span style={{ fontSize:20,flexShrink:0 }}>🔑</span>
            <div>
              <div style={{ fontSize:14,fontWeight:700,color:"#854d0e",marginBottom:5 }}>Google Places API key required</div>
              <p style={{ fontSize:13,color:"#92400e",lineHeight:1.6,margin:0 }}>
                Add <code style={{ fontFamily:"monospace",background:"rgba(0,0,0,.06)",padding:"1px 5px",borderRadius:4 }}>GOOGLE_PLACES_API_KEY</code> to your environment secrets.
                Get one at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color:"#854d0e",fontWeight:700 }}>Google Cloud Console</a> → APIs → Places API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading / Progress ───────────────────────────────────── */}
      {generateMutation.isPending && (
        <div style={{ maxWidth:1200,margin:"28px auto 0",padding:"0 36px" }}>
          <div style={{ background:WHITE,borderRadius:18,border:`1px solid ${BDR}`,padding:"4px 32px 32px",boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
            <ProgressSteps active={generateMutation.isPending} />
            <div style={{ display:"flex",flexDirection:"column",gap:12,marginTop:20 }}>
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && !generateMutation.isPending && (
        <div ref={resultsRef} style={{ maxWidth:1200,margin:"24px auto 80px",padding:"0 36px" }}>

          {/* Stats cards */}
          {summaryStats && (() => {
            const rr = responseRate(summaryStats.avgScore);
            const cards = [
              { label:"Leads Found",    value:String(summaryStats.total),         sub:"businesses",      accent:IND,     bg:IND_L },
              { label:"Avg Lead Score", value:String(summaryStats.avgScore),       sub:"out of 100",      accent:"#0ea5e9",bg:"#f0f9ff" },
              { label:"Strong Leads",   value:String(summaryStats.strongCount),    sub:"ready to close",  accent:"#16a34a",bg:"#f0fdf4" },
              { label:"Est. Response",  value:rr.label,                           sub:"avg reply rate",   accent:rr.color, bg:rr.bg },
            ];
            return (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
                {cards.map(c => (
                  <div key={c.label} style={{ background:WHITE,borderRadius:14,border:`1px solid ${BDR}`,padding:"16px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:11,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:INK3,marginBottom:8 }}>{c.label}</div>
                    <div style={{ fontSize:26,fontWeight:900,color:c.accent,letterSpacing:"-.03em",lineHeight:1 }}>{c.value}</div>
                    <div style={{ fontSize:12,color:INK3,marginTop:4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Toolbar */}
          <div className="toolbar-row" style={{ background:WHITE,borderRadius:14,border:`1px solid ${BDR}`,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
              {(["all","Strong Lead","Good Lead","Weak Lead"] as FilterLabel[]).map(f => (
                <button key={f} className={`filter-pill${filterLabel===f?" active":""}`} onClick={() => setFilterLabel(f)}>
                  {f==="all" ? `All (${result.leads.length})` : f}
                </button>
              ))}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                style={{ padding:"5px 10px",border:`1.5px solid ${BDR}`,borderRadius:8,background:WHITE,fontSize:12,color:INK,cursor:"pointer",outline:"none",marginLeft:6 }}>
                <option value="score-desc">Score ↓</option>
                <option value="score-asc">Score ↑</option>
                <option value="name">Name A→Z</option>
              </select>
            </div>
            <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
              <button className="outline-btn" onClick={copyAllEmails}>Copy all emails</button>
              <button className="outline-btn" onClick={exportCSV}>Export CSV</button>
              <button className="outline-btn" onClick={() => generateMutation.mutate({ businessType, location, intent:intent||undefined, leadCount, tone })}>Regenerate</button>
              {auth?.connected ? (
                <button className="send-btn" onClick={() => sendMutation.mutate(result.leads)} disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? "Sending…" : "Send all via Gmail"}
                </button>
              ) : (
                <a href="/api/auth/google" className="send-btn" style={{ textDecoration:"none" }}>Connect Gmail to send</a>
              )}
            </div>
          </div>

          {filterLabel !== "all" && (
            <p style={{ fontSize:13,color:INK3,marginBottom:12,paddingLeft:4 }}>
              Showing {displayedLeads.length} of {result.leads.length} · <strong style={{ color:lc(filterLabel) }}>{filterLabel}</strong>
              <button onClick={() => setFilterLabel("all")} style={{ background:"none",border:"none",cursor:"pointer",color:IND,fontSize:13,marginLeft:8,padding:0,fontFamily:FONT }}>Clear ×</button>
            </p>
          )}

          {/* Lead cards */}
          {displayedLeads.length > 0 ? (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {displayedLeads.map((lead, i) => (
                <LeadCard
                  key={lead.id} lead={lead} index={i}
                  sending={sendMutation.isPending && !sendResults[lead.id]}
                  sendResult={sendResults[lead.id]}
                  editedEmail={editedEmails[lead.id] || { subject:lead.emailSubject, body:lead.emailBody }}
                  onEditEmail={(subject,body) => setEditedEmails(prev => ({ ...prev, [lead.id]:{ subject, body } }))}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign:"center",padding:"60px 32px",background:WHITE,borderRadius:16,border:`1px solid ${BDR}` }}>
              <div style={{ fontSize:32,marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:16,fontWeight:700,color:INK,marginBottom:8 }}>No {filterLabel} leads</div>
              <button className="outline-btn" onClick={() => setFilterLabel("all")}>Show all</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
