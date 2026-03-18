import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import type { AuthStatus } from "@shared/schema";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";
const SESSION_SHOWN_KEY = "outleadrr_ob_shown";

const CSS = `
  @keyframes ob-in    { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes ob-out   { from{opacity:1;transform:translateY(0) scale(1)}      to{opacity:0;transform:translateY(-12px) scale(.97)} }
  @keyframes ob-orb1  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(30px,-24px) scale(1.08)} 70%{transform:translate(-18px,16px) scale(.94)} }
  @keyframes ob-orb2  { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-26px,20px) scale(1.06)} 65%{transform:translate(22px,-18px) scale(.96)} }
  .ob-in  { animation: ob-in  .4s cubic-bezier(.16,1,.3,1) both; }
  .ob-out { animation: ob-out .22s cubic-bezier(.4,0,1,1) both; }
  .ob-cta {
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:13px 28px;border-radius:11px;border:none;
    background:rgba(255,255,255,.96);color:#0a0a0a;
    font-size:14px;font-weight:700;font-family:${F};letter-spacing:-.01em;
    cursor:pointer;transition:all .18s;
    box-shadow:0 4px 16px rgba(0,0,0,.22);
    flex:1;
  }
  .ob-cta:hover{background:#fff;transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,0,0,.28);}
  .ob-cta:active{transform:translateY(0);}
  .ob-cta-ghost {
    display:flex;align-items:center;justify-content:center;
    padding:13px 28px;border-radius:11px;
    border:1px solid rgba(255,255,255,.11);
    background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);
    font-size:14px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .18s;
    flex:1;
  }
  .ob-cta-ghost:hover{background:rgba(255,255,255,.09);color:rgba(255,255,255,.88);border-color:rgba(255,255,255,.2);}
  .ob-check{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05);}
  .ob-check:last-child{border-bottom:none;}
  .ob-mini-card{padding:12px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;}
`;

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display:"flex",gap:5,alignItems:"center" }}>
      {Array.from({ length: n }).map((_, x) => (
        <div key={x} style={{
          width: x === i ? 20 : 5, height: 5, borderRadius: 99,
          background: x === i ? "rgba(255,255,255,.88)" : "rgba(255,255,255,.14)",
          transition: "all .3s cubic-bezier(.16,1,.3,1)",
          boxShadow: x === i ? "0 0 6px rgba(255,255,255,.25)" : "none",
        }} />
      ))}
    </div>
  );
}

function Chk() {
  return (
    <div style={{ width:18,height:18,borderRadius:5,background:"rgba(99,102,241,.2)",border:"1px solid rgba(99,102,241,.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path d="M1.5 4.5l2 2L7.5 2" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── Slide 1: Welcome ── */
function SlideWelcome() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:9,width:"100%" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%" }}>
        {[
          { label:"Google Maps data",    desc:"Real businesses, live data",       num:"01" },
          { label:"Personalized emails", desc:"Written for each prospect",        num:"02" },
          { label:"Lead scoring",        desc:"Ranked 0–100 by opportunity",      num:"03" },
          { label:"Gmail sending",       desc:"Sent from your real inbox",        num:"04" },
        ].map(f => (
          <div key={f.label} className="ob-mini-card">
            <div style={{ fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:".07em",marginBottom:6 }}>{f.num}</div>
            <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.88)",marginBottom:3 }}>{f.label}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,.34)",lineHeight:1.45 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 2: Dashboard ── */
function SlideDashboard() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:9,width:"100%" }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7 }}>
        {[
          { label:"Campaigns", num:"4",  color:"#8b5cf6" },
          { label:"Emails Sent",num:"37", color:"#10b981" },
          { label:"Leads Found",num:"52", color:"#f59e0b" },
          { label:"Delivery",  num:"94%", color:"#4ade80" },
        ].map(c => (
          <div key={c.label} className="ob-mini-card">
            <div style={{ fontSize:10,color:"rgba(255,255,255,.28)",marginBottom:5 }}>{c.label}</div>
            <div style={{ fontSize:20,fontWeight:900,color:c.color,letterSpacing:"-.04em",lineHeight:1 }}>{c.num}</div>
          </div>
        ))}
      </div>
      <div className="ob-mini-card">
        <div style={{ fontSize:10,color:"rgba(255,255,255,.28)",marginBottom:8 }}>Outreach Activity</div>
        <svg viewBox="0 0 240 36" style={{ width:"100%",height:"auto",display:"block",overflow:"visible" }}>
          <defs>
            <linearGradient id="ob-ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".25"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,36 L0,28 L48,18 L96,24 L144,8 L192,12 L240,4 L240,36 Z" fill="url(#ob-ag)"/>
          <polyline points="0,28 48,18 96,24 144,8 192,12 240,4" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="ob-mini-card" style={{ display:"flex",gap:12,alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10,color:"rgba(255,255,255,.28)",marginBottom:4 }}>Quick Actions</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.55)" }}>New Campaign · Templates · Inbox</div>
        </div>
        <div style={{ padding:"6px 12px",background:"rgba(139,92,246,.25)",border:"1px solid rgba(139,92,246,.4)",borderRadius:7,fontSize:11,fontWeight:700,color:"#c4b5fd" }}>+ New</div>
      </div>
    </div>
  );
}

/* ── Slide 3: Campaign Builder ── */
function SlideBuilder() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:9,width:"100%" }}>
      <div className="ob-mini-card">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7 }}>
          <div style={{ background:"rgba(255,255,255,.06)",borderRadius:7,padding:"8px 11px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.26)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:3 }}>Business Type</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,.82)",fontWeight:600 }}>plumbers</div>
          </div>
          <div style={{ background:"rgba(255,255,255,.06)",borderRadius:7,padding:"8px 11px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.26)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:3 }}>Location</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,.82)",fontWeight:600 }}>Houston, TX</div>
          </div>
        </div>
        <div style={{ background:"rgba(99,102,241,.18)",border:"1px solid rgba(99,102,241,.3)",borderRadius:7,padding:"9px",textAlign:"center",fontSize:12,fontWeight:700,color:"rgba(255,255,255,.9)" }}>
          Find 10 leads + Generate emails
        </div>
      </div>
      <div style={{ display:"flex",gap:7 }}>
        {["Houston Plumbing","Rapid Pipe Co.","QuickFix"].map((n,i) => (
          <div key={n} className="ob-mini-card" style={{ flex:1 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"#4ade80",marginBottom:5,boxShadow:"0 0 5px rgba(74,222,128,.5)" }} />
            <div style={{ fontSize:10,fontWeight:600,color:"rgba(255,255,255,.7)",lineHeight:1.35 }}>{n}</div>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",marginTop:3 }}>Score: {[87,71,44][i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 4: Inbox ── */
function SlideInbox() {
  const threads = [
    { name:"John – Houston Plumbing", preview:"Thanks for reaching out! We'd love to...", time:"2h", dot:"#4ade80" },
    { name:"Maria – QuickFix",        preview:"Interested in hearing more about your...",  time:"5h", dot:"#facc15" },
    { name:"Dave – Rapid Pipe",       preview:"Could you send over a proposal?",           time:"1d", dot:"#4ade80" },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:7,width:"100%" }}>
      {threads.map((t,i) => (
        <div key={i} className="ob-mini-card" style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:t.dot,flexShrink:0,boxShadow:`0 0 5px ${t.dot}88` }} />
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,.82)",marginBottom:2 }}>{t.name}</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,.32)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.preview}</div>
          </div>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.2)",flexShrink:0 }}>{t.time}</div>
        </div>
      ))}
      <div className="ob-mini-card" style={{ display:"flex",gap:8,alignItems:"center" }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 6h5M9 4l2.5 2-2.5 2" stroke="rgba(129,140,248,.7)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h1.5" stroke="rgba(129,140,248,.7)" strokeWidth="1.3" strokeLinecap="round"/></svg>
        <span style={{ fontSize:11,color:"rgba(255,255,255,.45)" }}>Reply directly from here without leaving the app</span>
      </div>
    </div>
  );
}

/* ── Slide 5: Templates ── */
function SlideTemplates() {
  const tpls = [
    { tag:"Bold",         desc:"Short, confident opener — great for decision makers" },
    { tag:"Friendly",     desc:"Warm and conversational — great for small business" },
    { tag:"Professional", desc:"Polished tone with a clear ask — works everywhere" },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8,width:"100%" }}>
      {tpls.map((t,i) => (
        <div key={i} className="ob-mini-card" style={{ display:"flex",gap:12,alignItems:"center" }}>
          <div style={{ padding:"4px 10px",background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.28)",borderRadius:6,fontSize:10,fontWeight:700,color:"#a5b4fc",flexShrink:0 }}>{t.tag}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.45,flex:1 }}>{t.desc}</div>
          <div style={{ fontSize:10,color:"rgba(139,92,246,.7)",fontWeight:600,flexShrink:0 }}>Use</div>
        </div>
      ))}
      <div style={{ fontSize:11,color:"rgba(255,255,255,.28)",textAlign:"center",paddingTop:2 }}>Click any template to preview the full subject + body</div>
    </div>
  );
}

/* ── Slide 6: Theme ── */
function SlideTheme({ theme, toggle }: { theme: string; toggle: () => void }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12,width:"100%" }}>
      <div style={{ display:"flex",gap:10 }}>
        {/* Dark card */}
        <button onClick={() => theme !== "dark" && toggle()} style={{
          flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontFamily:F,
          border: theme === "dark" ? "1.5px solid #8b5cf6" : "1.5px solid rgba(255,255,255,.1)",
          background: theme === "dark" ? "rgba(139,92,246,.12)" : "rgba(255,255,255,.04)",
          boxShadow: theme === "dark" ? "0 0 0 3px rgba(139,92,246,.15)" : "none",
          transition:"all .2s",
        }}>
          <svg viewBox="0 0 140 80" style={{ width:"100%",borderRadius:8,marginBottom:8,display:"block" }}>
            <rect width="140" height="80" fill="#0a0a0a"/>
            <rect width="34" height="80" fill="#111111"/>
            <rect x="6" y="8" width="20" height="4" rx="2" fill="#ededed" fillOpacity=".15"/>
            <rect x="0" y="22" width="3" height="6" rx="1" fill="#8b5cf6"/>
            <rect x="6" y="22" width="20" height="6" rx="2" fill="#8b5cf6" fillOpacity=".14"/>
            <rect x="6" y="32" width="18" height="3" rx="1.5" fill="#52525b"/>
            <rect x="6" y="38" width="16" height="3" rx="1.5" fill="#52525b"/>
            <rect x="42" y="8" width="44" height="5" rx="2" fill="#ededed" fillOpacity=".7"/>
            <rect x="42" y="18" width="90" height="20" rx="4" fill="#ffffff" fillOpacity=".035"/>
            <rect x="42" y="42" width="48" height="20" rx="4" fill="#ffffff" fillOpacity=".035"/>
            <rect x="94" y="42" width="38" height="20" rx="4" fill="#ffffff" fillOpacity=".035"/>
            <rect x="48" y="23" width="22" height="3" rx="1.5" fill="#a1a1aa"/>
            <rect x="48" y="29" width="36" height="2" rx="1" fill="#52525b"/>
          </svg>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,.8)" }}>Dark</span>
            {theme === "dark" && <div style={{ width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center" }}><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-3.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
          </div>
        </button>
        {/* Light card */}
        <button onClick={() => theme !== "light" && toggle()} style={{
          flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontFamily:F,
          border: theme === "light" ? "1.5px solid #8b5cf6" : "1.5px solid rgba(255,255,255,.1)",
          background: theme === "light" ? "rgba(139,92,246,.12)" : "rgba(255,255,255,.04)",
          boxShadow: theme === "light" ? "0 0 0 3px rgba(139,92,246,.15)" : "none",
          transition:"all .2s",
        }}>
          <svg viewBox="0 0 140 80" style={{ width:"100%",borderRadius:8,marginBottom:8,display:"block" }}>
            <rect width="140" height="80" fill="#fafafa"/>
            <rect width="34" height="80" fill="#ffffff"/>
            <rect x="0" y="0" width="34" height="80" fill="none" stroke="#e4e4e7" strokeWidth=".5"/>
            <rect x="6" y="8" width="20" height="4" rx="2" fill="#09090b" fillOpacity=".15"/>
            <rect x="0" y="22" width="3" height="6" rx="1" fill="#7c3aed"/>
            <rect x="6" y="22" width="20" height="6" rx="2" fill="#7c3aed" fillOpacity=".1"/>
            <rect x="6" y="32" width="18" height="3" rx="1.5" fill="#d4d4d8"/>
            <rect x="6" y="38" width="16" height="3" rx="1.5" fill="#d4d4d8"/>
            <rect x="42" y="8" width="44" height="5" rx="2" fill="#09090b" fillOpacity=".7"/>
            <rect x="42" y="18" width="90" height="20" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
            <rect x="42" y="42" width="48" height="20" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
            <rect x="94" y="42" width="38" height="20" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
            <rect x="48" y="23" width="22" height="3" rx="1.5" fill="#3f3f46"/>
            <rect x="48" y="29" width="36" height="2" rx="1" fill="#a1a1aa"/>
          </svg>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,.8)" }}>Light</span>
            {theme === "light" && <div style={{ width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center" }}><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-3.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
          </div>
        </button>
      </div>
      <div style={{ fontSize:11,color:"rgba(255,255,255,.28)",textAlign:"center" }}>You can change this anytime in Settings</div>
    </div>
  );
}

/* ── Slide 7: Gmail ── */
function SlideGmail({ connected, gmailEmail }: { connected: boolean; gmailEmail?: string }) {
  if (connected) {
    return (
      <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:14 }}>
        <div style={{ width:54,height:54,borderRadius:"50%",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.22)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#4ade80",marginBottom:3 }}>Gmail Connected</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.38)" }}>{gmailEmail}</div>
        </div>
        <div style={{ width:"100%",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.12)",borderRadius:10,padding:"12px 16px",fontSize:12,color:"rgba(255,255,255,.52)",lineHeight:1.6,textAlign:"center" }}>
          You're ready to send emails from your real Gmail inbox.
        </div>
      </div>
    );
  }
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10 }}>
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden" }}>
        <div style={{ padding:"9px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:9 }}>
          <div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.8)",flexShrink:0 }}>Y</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.7)" }}>you@gmail.com</div>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.26)" }}>to: john@houstonplumbing.com</div>
          </div>
          <div style={{ fontSize:9,color:"#4ade80",fontWeight:600,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.18)",padding:"2px 8px",borderRadius:5 }}>Sent</div>
        </div>
        <div style={{ padding:"10px 14px" }}>
          <div style={{ fontSize:10,fontWeight:600,color:"rgba(255,255,255,.52)",marginBottom:4 }}>Website design for Houston Plumbing</div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,.28)",lineHeight:1.6 }}>Hi John, I noticed your site could use a refresh to better convert the traffic you're already getting...</div>
        </div>
      </div>
      <div style={{ background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"2px 14px" }}>
        {[
          "Emails come from your real Gmail address, not a third-party sender",
          "Better deliverability — recipients see your name",
          "We only request send access — never used for anything else",
        ].map((t, i) => (
          <div key={i} className="ob-check">
            <Chk />
            <span style={{ fontSize:11,color:"rgba(255,255,255,.48)",lineHeight:1.55 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDE_DEFS = [
  { key:"welcome",   title:"Welcome to Outleadrr",   sub:"Find real prospects, score them, and send personalised emails — all in one place.", route: null },
  { key:"dashboard", title:"Your Dashboard",          sub:"See all your campaigns, stats, and activity at a glance. This is your home base.", route: "/dashboard" },
  { key:"builder",   title:"Campaign Builder",        sub:"Pick a business type and city, generate scored leads, and send AI-written emails in minutes.", route: "/app" },
  { key:"inbox",     title:"Your Inbox",              sub:"Prospect replies land here. Read, reply, and move conversations forward without leaving the app.", route: "/inbox" },
  { key:"templates", title:"Email Templates",         sub:"Pre-built frameworks for every tone. Pick one and the Campaign Builder auto-fills your email.", route: "/templates" },
  { key:"theme",     title:"Choose Your Look",        sub:"Pick a display theme. You can change it anytime from Settings.", route: null },
  { key:"gmail",     title:"Connect Your Gmail",      sub:"Send emails directly from your inbox. One connection, and you're ready to go.", route: null },
];

export function OnboardingModal() {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);
  const [exiting, setExiting] = useState(false);
  const { theme, toggle } = useTheme();

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
    enabled: visible,
  });

  useEffect(() => {
    // Show on every fresh page load (sessionStorage resets on tab close/refresh)
    if (sessionStorage.getItem(SESSION_SHOWN_KEY) !== "1") setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    setVisible(false);
    setLocation("/dashboard");
  };

  const complete = () => {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    setVisible(false);
    setLocation("/dashboard");
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1 && step === SLIDE_DEFS.length - 1) { complete(); return; }
    if (dir === -1 && step === 0) return;
    const nextStep = step + dir;
    const nextSlide = SLIDE_DEFS[nextStep];
    if (nextSlide.route) setLocation(nextSlide.route);
    setExiting(true);
    setTimeout(() => { setStep(nextStep); setExiting(false); }, 220);
  };

  if (!visible) return null;

  const { title, sub, key } = SLIDE_DEFS[step];
  const isFirst = step === 0;
  const isLast  = step === SLIDE_DEFS.length - 1;
  const isGmail = key === "gmail";

  const renderSlide = () => {
    if (key === "welcome")   return <SlideWelcome />;
    if (key === "dashboard") return <SlideDashboard />;
    if (key === "builder")   return <SlideBuilder />;
    if (key === "inbox")     return <SlideInbox />;
    if (key === "templates") return <SlideTemplates />;
    if (key === "theme")     return <SlideTheme theme={theme} toggle={toggle} />;
    if (key === "gmail")     return <SlideGmail connected={!!gmailStatus?.connected} gmailEmail={gmailStatus?.email} />;
    return null;
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop — slight blur so page is visible underneath */}
      <div onClick={dismiss} style={{
        position:"fixed",inset:0,zIndex:900,
        background:"rgba(0,0,0,.52)",
        backdropFilter:"blur(4px)",
        WebkitBackdropFilter:"blur(4px)",
      }} />

      {/* Glass modal — centered on full viewport */}
      <div style={{
        position:"fixed",zIndex:901,
        top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",
        width:"calc(100% - 32px)",maxWidth:500,
        background:"rgba(8,8,14,0.88)",
        backdropFilter:"blur(48px) saturate(160%)",
        WebkitBackdropFilter:"blur(48px) saturate(160%)",
        border:"1px solid rgba(255,255,255,.1)",
        borderRadius:22,
        boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04), 0 48px 120px rgba(0,0,0,.9), 0 8px 32px rgba(99,102,241,.1)",
        fontFamily:F,overflow:"hidden",
      }}>

        {/* Ambient orbs */}
        <div aria-hidden style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:22 }}>
          <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)",top:-80,right:-60,animation:"ob-orb1 9s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:240,height:240,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 70%)",bottom:-60,left:-40,animation:"ob-orb2 11s ease-in-out infinite" }} />
        </div>

        {/* Top bar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 0",position:"relative",zIndex:1 }}>
          <span style={{ fontSize:9,fontWeight:800,letterSpacing:".1em",color:"rgba(255,255,255,.18)",textTransform:"uppercase" }}>Outleadrr · Setup</span>
          <button onClick={dismiss} style={{
            width:24,height:24,borderRadius:"50%",
            background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.09)",
            color:"rgba(255,255,255,.35)",fontSize:13,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:F,transition:"all .15s",
          }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.11)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.06)")}>
            &#x2715;
          </button>
        </div>

        {/* Slide content */}
        <div key={step} className={exiting ? "ob-out" : "ob-in"} style={{ padding:"16px 22px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:14,position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center",width:"100%" }}>
            <h2 style={{ fontSize:20,fontWeight:800,color:"rgba(255,255,255,.95)",letterSpacing:"-.03em",lineHeight:1.15,marginBottom:5,margin:0 }}>{title}</h2>
            <p style={{ fontSize:12,color:"rgba(255,255,255,.36)",lineHeight:1.6,maxWidth:360,margin:"5px auto 0" }}>{sub}</p>
          </div>
          {renderSlide()}
        </div>

        {/* CTA area */}
        <div style={{ padding:"8px 22px 6px",display:"flex",gap:8,position:"relative",zIndex:1 }}>
          {isGmail && !gmailStatus?.connected ? (
            <>
              <a href="/api/auth/google" className="ob-cta" style={{ textDecoration:"none",textAlign:"center" }}>Connect Gmail</a>
              <button className="ob-cta-ghost" onClick={() => go(1)}>Skip for now</button>
            </>
          ) : (
            <button className="ob-cta" onClick={() => go(1)}>
              {isLast ? "Done — let's go" : isFirst ? "Get started" : "Next"}
            </button>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding:"8px 22px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
          <button onClick={() => go(-1)} style={{
            fontSize:11,color:isFirst?"transparent":"rgba(255,255,255,.24)",
            background:"none",border:"none",cursor:isFirst?"default":"pointer",
            fontFamily:F,transition:"color .15s",padding:"3px 0",
          }}
            onMouseEnter={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.5)"); }}
            onMouseLeave={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.24)"); }}>
            Back
          </button>
          <Dots n={SLIDE_DEFS.length} i={step} />
          <span style={{ fontSize:9,color:"rgba(255,255,255,.13)",minWidth:24,textAlign:"right" }}>{step+1}/{SLIDE_DEFS.length}</span>
        </div>
      </div>
    </>
  );
}

export function resetOnboarding() { sessionStorage.removeItem(SESSION_SHOWN_KEY); }
