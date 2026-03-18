import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";
const SESSION_KEY = "outleadrr_new_login";

const CSS = `
  @keyframes ob-in    { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes ob-out   { from{opacity:1;transform:translateY(0) scale(1)}      to{opacity:0;transform:translateY(-14px) scale(.97)} }
  @keyframes ob-orb1  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(30px,-24px) scale(1.08)} 70%{transform:translate(-18px,16px) scale(.94)} }
  @keyframes ob-orb2  { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-26px,20px) scale(1.06)} 65%{transform:translate(22px,-18px) scale(.96)} }
  .ob-in  { animation: ob-in  .44s cubic-bezier(.16,1,.3,1) both; }
  .ob-out { animation: ob-out .24s cubic-bezier(.4,0,1,1) both; }
  .ob-cta {
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:13px 36px;border-radius:11px;border:none;
    background:rgba(255,255,255,.96);color:#0a0a0a;
    font-size:14px;font-weight:700;font-family:${F};letter-spacing:-.01em;
    cursor:pointer;transition:all .18s;
    box-shadow:0 4px 16px rgba(0,0,0,.22);
    width:100%;max-width:300px;
  }
  .ob-cta:hover{background:#fff;transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,0,0,.28);}
  .ob-cta:active{transform:translateY(0);}
  .ob-cta-ghost {
    display:flex;align-items:center;justify-content:center;
    padding:12px 36px;border-radius:11px;
    border:1px solid rgba(255,255,255,.11);
    background:rgba(255,255,255,.05);color:rgba(255,255,255,.62);
    font-size:14px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .18s;
    width:100%;max-width:300px;
    backdrop-filter:blur(6px);
  }
  .ob-cta-ghost:hover{background:rgba(255,255,255,.09);color:rgba(255,255,255,.88);border-color:rgba(255,255,255,.2);}
  .ob-check{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05);}
  .ob-check:last-child{border-bottom:none;}
`;

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
      {Array.from({ length: n }).map((_, x) => (
        <div key={x} style={{
          width: x === i ? 22 : 6, height: 6, borderRadius: 99,
          background: x === i ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.15)",
          transition: "all .32s cubic-bezier(.16,1,.3,1)",
          boxShadow: x === i ? "0 0 8px rgba(255,255,255,.3)" : "none",
        }} />
      ))}
    </div>
  );
}

function Chk() {
  return (
    <div style={{ width:20,height:20,borderRadius:6,background:"rgba(99,102,241,.2)",border:"1px solid rgba(99,102,241,.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2 }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── Slide 1: Welcome ─────────────────────────── */
function SlideWelcome() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20,width:"100%" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,width:"100%" }}>
        {[
          { label:"Google Maps data",   desc:"Real businesses, live data",        num:"01" },
          { label:"Personalized emails", desc:"Written for each prospect",         num:"02" },
          { label:"Lead scoring",        desc:"Ranked 0–100 by opportunity",       num:"03" },
          { label:"Gmail sending",       desc:"Sent from your real inbox",         num:"04" },
        ].map(f => (
          <div key={f.label} style={{ padding:"15px 16px",borderRadius:12,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.22)",letterSpacing:".07em",marginBottom:7 }}>{f.num}</div>
            <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.88)",marginBottom:4 }}>{f.label}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,.35)",lineHeight:1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 2: Find ────────────────────────────── */
function SlideFind() {
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10 }}>
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,padding:"16px 18px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
          <div style={{ background:"rgba(255,255,255,.07)",borderRadius:8,padding:"9px 13px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.28)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>Business Type</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.82)",fontWeight:600 }}>plumbers</div>
          </div>
          <div style={{ background:"rgba(255,255,255,.07)",borderRadius:8,padding:"9px 13px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.28)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>Location</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.82)",fontWeight:600 }}>Houston, TX</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,.06)",borderRadius:8,padding:"9px 13px",marginBottom:10 }}>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.28)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>What are you selling?</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,.58)" }}>website design services</div>
        </div>
        <div style={{ background:"rgba(99,102,241,.18)",border:"1px solid rgba(99,102,241,.3)",borderRadius:8,padding:"10px",textAlign:"center",fontSize:13,fontWeight:700,color:"rgba(255,255,255,.9)" }}>
          Find 10 leads
        </div>
      </div>
      <div style={{ display:"flex",gap:8 }}>
        {["Houston Plumbing","Rapid Pipe Co.","QuickFix Plumbing"].map((n,i) => (
          <div key={n} style={{ flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,padding:"10px 11px",animation:`ob-in .4s ${i*70}ms both` }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#4ade80",marginBottom:6,boxShadow:"0 0 6px rgba(74,222,128,.5)" }} />
            <div style={{ fontSize:10,fontWeight:600,color:"rgba(255,255,255,.7)",lineHeight:1.4 }}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 3: Score ───────────────────────────── */
function SlideScore() {
  const leads = [
    { name:"Houston Plumbing",  score:87, label:"Strong",   color:"#4ade80", bars:[88,82,90,85,92] },
    { name:"Rapid Pipe Co.",    score:71, label:"Good",     color:"#facc15", bars:[72,68,75,70,70] },
    { name:"QuickFix Plumbing", score:44, label:"Weak",     color:"#f87171", bars:[42,40,50,44,44] },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:9,width:"100%" }}>
      {leads.map((l, i) => (
        <div key={l.name} style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:11,padding:"12px 15px",display:"flex",gap:13,alignItems:"center",animation:`ob-in .4s ${i*80}ms both` }}>
          <div style={{ width:46,height:46,borderRadius:9,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ fontSize:17,fontWeight:900,color:l.color,lineHeight:1 }}>{l.score}</span>
            <span style={{ fontSize:7,color:"rgba(255,255,255,.22)",fontWeight:600,letterSpacing:".06em",marginTop:1 }}>SCORE</span>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
              <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,.78)" }}>{l.name}</span>
              <span style={{ fontSize:10,fontWeight:700,color:l.color }}>{l.label}</span>
            </div>
            <div style={{ display:"flex",gap:3 }}>
              {l.bars.map((v, j) => (
                <div key={j} style={{ flex:1,height:3,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${v}%`,background:l.color,borderRadius:99,opacity:.75 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ display:"flex",justifyContent:"space-between",padding:"0 4px",marginTop:2 }}>
        {["Industry","Size","Reach","Opp.","Reviews"].map(s => (
          <span key={s} style={{ fontSize:9,color:"rgba(255,255,255,.2)",fontWeight:600,letterSpacing:".05em" }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 4: Gmail ───────────────────────────── */
function SlideGmail({ connected, gmailEmail }: { connected: boolean; gmailEmail?: string }) {
  if (connected) {
    return (
      <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
        <div style={{ width:60,height:60,borderRadius:"50%",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.22)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l6 6L23 7" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:15,fontWeight:700,color:"#4ade80",marginBottom:4 }}>Gmail Connected</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.38)" }}>{gmailEmail}</div>
        </div>
        <div style={{ width:"100%",background:"rgba(74,222,128,.05)",border:"1px solid rgba(74,222,128,.12)",borderRadius:11,padding:"14px 18px",fontSize:13,color:"rgba(255,255,255,.55)",lineHeight:1.65,textAlign:"center" }}>
          You're ready to send emails directly from your inbox. Recipients will see your real address.
        </div>
      </div>
    );
  }
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:12 }}>
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:13,overflow:"hidden" }}>
        <div style={{ padding:"10px 15px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:26,height:26,borderRadius:"50%",background:"rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.8)",flexShrink:0 }}>Y</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.7)" }}>you@gmail.com</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,.26)" }}>to: john@houstonplumbing.com</div>
          </div>
          <div style={{ fontSize:10,color:"#4ade80",fontWeight:600,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.18)",padding:"3px 9px",borderRadius:6,flexShrink:0 }}>Sent</div>
        </div>
        <div style={{ padding:"11px 15px" }}>
          <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.55)",marginBottom:5 }}>Website design for Houston Plumbing</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.28)",lineHeight:1.65 }}>Hi John, I noticed your site could use a refresh to better convert the traffic you're already getting from Google...</div>
        </div>
      </div>
      <div style={{ background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:11,padding:"2px 16px" }}>
        {[
          "Emails come from your real Gmail address, not a third-party sender",
          "Better deliverability — recipients see your name, not a bulk tool",
          "We only request send access — never used for anything else",
        ].map((t, i) => (
          <div key={i} className="ob-check">
            <Chk />
            <span style={{ fontSize:12,color:"rgba(255,255,255,.52)",lineHeight:1.6 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 5: Ready ───────────────────────────── */
function SlideReady() {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8,width:"100%" }}>
      {[
        { n:"1", text:"Enter a business type and city in Campaign Builder" },
        { n:"2", text:"Review AI-scored leads with ready-to-send emails" },
        { n:"3", text:"Connect Gmail and send your first campaign in one click" },
      ].map((s, i) => (
        <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:11,animation:`ob-in .4s ${i*80}ms both` }}>
          <div style={{ width:30,height:30,borderRadius:9,background:"rgba(99,102,241,.18)",border:"1px solid rgba(99,102,241,.28)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"rgba(255,255,255,.7)",flexShrink:0 }}>{s.n}</div>
          <span style={{ fontSize:13,fontWeight:500,color:"rgba(255,255,255,.7)",lineHeight:1.5 }}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

const SLIDE_DEFS = [
  { key:"welcome", title:"Welcome to Outleadrr",      sub:"Find real prospects, score them, and send personalized emails — all in one place."       },
  { key:"find",    title:"Find businesses instantly",  sub:"Search any industry and city. We pull live results straight from Google Maps."            },
  { key:"score",   title:"Every lead gets a score",    sub:"Each business is ranked across five dimensions so you know exactly who to contact first." },
  { key:"gmail",   title:"Connect your Gmail",         sub:"Send emails directly from your inbox. One connection, and you're ready to go."            },
  { key:"ready",   title:"You're all set",             sub:"Three steps to your first campaign."                                                      },
];

export function OnboardingModal({ gmailConnected, gmailEmail }: { gmailConnected?: boolean; gmailEmail?: string }) {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);
  const [exiting, setExiting] = useState(false);
  const { theme, toggle, isDark } = useTheme();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setVisible(false);
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1 && step === SLIDE_DEFS.length - 1) { dismiss(); return; }
    if (dir === -1 && step === 0) return;
    setExiting(true);
    setTimeout(() => { setStep(s => s + dir); setExiting(false); }, 230);
  };

  if (!visible) return null;

  const { title, sub, key } = SLIDE_DEFS[step];
  const isFirst  = step === 0;
  const isGmail  = key === "gmail";
  const isLast   = step === SLIDE_DEFS.length - 1;

  const renderSlide = () => {
    if (key === "welcome") return <SlideWelcome />;
    if (key === "find")    return <SlideFind />;
    if (key === "score")   return <SlideScore />;
    if (key === "gmail")   return <SlideGmail connected={!!gmailConnected} gmailEmail={gmailEmail} />;
    if (key === "ready")   return <SlideReady />;
    return null;
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div onClick={dismiss} style={{
        position:"fixed",inset:0,zIndex:200,
        background:"rgba(0,0,0,.82)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
      }} />

      {/* Glass modal */}
      <div style={{
        position:"fixed",zIndex:201,
        top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",
        width:"calc(100% - 32px)",maxWidth:520,
        background:"rgba(10,10,16,0.82)",
        backdropFilter:"blur(48px) saturate(160%)",
        WebkitBackdropFilter:"blur(48px) saturate(160%)",
        border:"1px solid rgba(255,255,255,.09)",
        borderRadius:20,
        boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04), 0 48px 120px rgba(0,0,0,.9), 0 8px 32px rgba(99,102,241,.08)",
        fontFamily:F,overflow:"hidden",
      }}>

        {/* Ambient orbs */}
        <div aria-hidden style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:20 }}>
          <div style={{ position:"absolute",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)",top:-80,right:-60,animation:"ob-orb1 9s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 70%)",bottom:-60,left:-40,animation:"ob-orb2 11s ease-in-out infinite" }} />
        </div>

        {/* Top bar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 0",position:"relative",zIndex:1 }}>
          <span style={{ fontSize:10,fontWeight:800,letterSpacing:".1em",color:"rgba(255,255,255,.2)",textTransform:"uppercase" }}>Outleadrr</span>
          <button onClick={dismiss} style={{
            width:26,height:26,borderRadius:"50%",
            background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.09)",
            color:"rgba(255,255,255,.38)",fontSize:14,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:F,transition:"all .15s",
          }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.11)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.06)")}>
            &#x2715;
          </button>
        </div>

        {/* Slide content */}
        <div key={step} className={exiting ? "ob-out" : "ob-in"} style={{ padding:"18px 24px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:18,position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center" }}>
            <h2 style={{ fontSize:22,fontWeight:800,color:"rgba(255,255,255,.95)",letterSpacing:"-.03em",lineHeight:1.15,marginBottom:7 }}>{title}</h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,.38)",lineHeight:1.65,maxWidth:370,margin:"0 auto" }}>{sub}</p>
          </div>
          {renderSlide()}
        </div>

        {/* CTA area */}
        <div style={{ padding:"10px 24px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,position:"relative",zIndex:1 }}>
          {isGmail && !gmailConnected ? (
            <>
              <a href="/api/auth/google" className="ob-cta" style={{ textDecoration:"none",textAlign:"center" }}>Connect Gmail</a>
              <button className="ob-cta-ghost" onClick={() => go(1)}>Skip for now</button>
            </>
          ) : (
            <button className="ob-cta" onClick={() => go(1)}>
              {isLast ? "Start finding leads" : isFirst ? "Get started" : "Continue"}
            </button>
          )}
          {isLast && (
            <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:4 }}>
              <span style={{ fontSize:12,color:"rgba(255,255,255,.3)" }}>Display:</span>
              <button onClick={toggle} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"6px 14px",borderRadius:8,
                border:"1px solid rgba(255,255,255,.12)",
                background:"rgba(255,255,255,.07)",
                color:"rgba(255,255,255,.65)",
                fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F,
                transition:"all .15s",
              }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.12)")}
                onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.07)")}>
                {isDark
                  ? <><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M2.9 11.1l.7-.7M10.4 3.6l.7-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>Switch to Light</>
                  : <><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M12 7.5A5 5 0 117 2c-.5 2 .5 5 3 5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>Switch to Dark</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding:"10px 24px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1 }}>
          <button onClick={() => go(-1)} style={{
            fontSize:12,color:isFirst?"transparent":"rgba(255,255,255,.26)",
            background:"none",border:"none",cursor:isFirst?"default":"pointer",
            fontFamily:F,transition:"color .15s",padding:"3px 0",
          }}
            onMouseEnter={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.55)"); }}
            onMouseLeave={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.26)"); }}>
            Back
          </button>
          <Dots n={SLIDE_DEFS.length} i={step} />
          <span style={{ fontSize:10,color:"rgba(255,255,255,.15)",minWidth:24,textAlign:"right" }}>{step+1}/{SLIDE_DEFS.length}</span>
        </div>
      </div>
    </>
  );
}

export function resetOnboarding() { sessionStorage.setItem(SESSION_KEY, "1"); }
