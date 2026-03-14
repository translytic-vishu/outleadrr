import { useState, useEffect } from "react";

const STORAGE_KEY = "outleadrr_onboarding_v2";
const F = "'Inter','Helvetica Neue',Arial,sans-serif";

const CSS = `
  @keyframes ob-in    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ob-out   { from{opacity:1;transform:translateY(0)}    to{opacity:0;transform:translateY(-14px)} }
  @keyframes ob-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ob-glow  { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.5)} 70%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
  @keyframes ob-spin  { to{transform:rotate(360deg)} }
  @keyframes ob-bar   { from{width:0} to{width:var(--w)} }
  @keyframes ob-ping  { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.8);opacity:0} }
  .ob-in  { animation: ob-in  .44s cubic-bezier(.16,1,.3,1) both; }
  .ob-out { animation: ob-out .26s cubic-bezier(.4,0,1,1)   both; }
  .ob-cta {
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:14px 40px;border-radius:999px;border:none;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff;font-size:15px;font-weight:700;font-family:${F};
    cursor:pointer;transition:all .2s;
    box-shadow:0 4px 20px rgba(99,102,241,.45);
    width:100%;max-width:300px;
  }
  .ob-cta:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.55);}
  .ob-cta:active{transform:translateY(0);}
  .ob-skip{font-size:13px;color:rgba(255,255,255,.38);font-family:${F};background:none;border:none;cursor:pointer;transition:color .15s;padding:6px;}
  .ob-skip:hover{color:rgba(255,255,255,.65);}
  .ob-check{display:flex;align-items:flex-start;gap:14px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.06);}
  .ob-check:last-child{border-bottom:none;}
`;

/* ── Dot nav ─────────────────────────────────────── */
function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display:"flex",gap:7,alignItems:"center" }}>
      {Array.from({ length: n }).map((_, x) => (
        <div key={x} style={{
          width: x === i ? 22 : 7, height: 7, borderRadius: 99,
          background: x === i ? "#6366f1" : "rgba(255,255,255,.18)",
          transition: "all .35s cubic-bezier(.16,1,.3,1)",
        }} />
      ))}
    </div>
  );
}

/* ── Check icon ──────────────────────────────────── */
function Chk() {
  return (
    <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(99,102,241,.18)",border:"1px solid rgba(99,102,241,.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2 5.5l2.5 2.5L9 3" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── Slide 1: Welcome ───────────────────────────── */
function SlideWelcome() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:24,width:"100%" }}>
      {/* Animated logo orb */}
      <div style={{ position:"relative",width:80,height:80 }}>
        <div style={{ position:"absolute",inset:-8,borderRadius:"50%",background:"rgba(99,102,241,.12)",animation:"ob-ping 2s ease-out infinite" }} />
        <div style={{ width:80,height:80,borderRadius:20,background:"linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2))",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",animation:"ob-float 3s ease-in-out infinite" }}>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path d="M5 28 L19 8 L33 28" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 22 L19 8 L28 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".4"/>
          </svg>
        </div>
      </div>
      {/* Feature grid */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%" }}>
        {[
          { icon:"🗺️", label:"Google Maps data",   desc:"Real businesses, live data" },
          { icon:"🤖", label:"AI-written emails",   desc:"Personalized for each lead" },
          { icon:"📊", label:"Lead scoring 0–100",  desc:"Ranked by opportunity" },
          { icon:"📧", label:"Gmail sending",        desc:"From your real inbox" },
        ].map(f => (
          <div key={f.label} style={{ padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",display:"flex",gap:12,alignItems:"flex-start" }}>
            <span style={{ fontSize:20 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.9)",marginBottom:2 }}>{f.label}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,.4)" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 2: Find Businesses ───────────────────── */
function SlideFind() {
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10 }}>
      {/* Mock search form */}
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,padding:"18px 20px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
          <div style={{ background:"rgba(255,255,255,.07)",borderRadius:8,padding:"10px 14px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>Business Type</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.75)",fontWeight:500 }}>plumbers</div>
          </div>
          <div style={{ background:"rgba(255,255,255,.07)",borderRadius:8,padding:"10px 14px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>Location</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.75)",fontWeight:500 }}>Houston, TX</div>
          </div>
        </div>
        <div style={{ background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:8,padding:"10px 14px",marginBottom:12 }}>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.35)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4 }}>What are you selling?</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,.65)" }}>website design services</div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:9,padding:"11px",textAlign:"center",fontSize:13,fontWeight:700,color:"#fff",boxShadow:"0 4px 16px rgba(99,102,241,.4)" }}>
          Find 10 leads →
        </div>
      </div>
      {/* Arrow + result hint */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,.07)" }} />
        <span style={{ fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:600 }}>Google Maps returns real businesses</span>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,.07)" }} />
      </div>
      {/* Sample result pins */}
      <div style={{ display:"flex",gap:8 }}>
        {["Houston Plumbing Co.","Rapid Pipe Services","QuickFix Plumbers"].map((n,i) => (
          <div key={n} style={{ flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,padding:"10px 12px",animation:`ob-in .4s ${i*80}ms both` }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:"#4ade80",marginBottom:6,boxShadow:"0 0 6px #4ade80" }} />
            <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.75)",lineHeight:1.4 }}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 3: AI Scoring ────────────────────────── */
function SlideScore() {
  const leads = [
    { name:"Houston Plumbing Co.", score:87, label:"Strong",  color:"#4ade80", bars:[88,82,90,85,92] },
    { name:"Rapid Pipe Services",  score:71, label:"Good",    color:"#facc15", bars:[72,68,75,70,70] },
    { name:"QuickFix Plumbers",    score:48, label:"Moderate",color:"#f97316", bars:[50,42,55,45,48] },
  ];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:10,width:"100%" }}>
      {leads.map((l, i) => (
        <div key={l.name} style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"14px 16px",display:"flex",gap:14,alignItems:"center",animation:`ob-in .4s ${i*90}ms both` }}>
          <div style={{ width:50,height:50,borderRadius:10,background:`rgba(${l.color==="#4ade80"?"74,222,128":l.color==="#facc15"?"250,204,21":"249,115,22"},.1)`,border:`1px solid ${l.color}30`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ fontSize:18,fontWeight:900,color:l.color,lineHeight:1 }}>{l.score}</span>
            <span style={{ fontSize:7,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".06em" }}>SCORE</span>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.85)" }}>{l.name}</span>
              <span style={{ fontSize:10,fontWeight:700,color:l.color,letterSpacing:".04em" }}>{l.label}</span>
            </div>
            <div style={{ display:"flex",gap:3 }}>
              {l.bars.map((v, j) => (
                <div key={j} style={{ flex:1,height:4,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${v}%`,background:l.color,borderRadius:99,opacity:.85 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ display:"flex",justifyContent:"center",gap:16,marginTop:4 }}>
        {["Industry Fit","Size","Reach","Opp.","Reviews"].map(s => (
          <span key={s} style={{ fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:600,letterSpacing:".06em" }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 4: Connect Gmail ─────────────────────── */
function SlideGmail() {
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:14 }}>
      {/* Email mockup */}
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:14,overflow:"hidden" }}>
        <div style={{ padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff" }}>Y</div>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,.8)" }}>you@gmail.com</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,.3)" }}>to: john@houstonplumbing.com</div>
          </div>
          <div style={{ marginLeft:"auto",fontSize:10,color:"#4ade80",fontWeight:700,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",padding:"3px 10px",borderRadius:99 }}>Sent ✓</div>
        </div>
        <div style={{ padding:"12px 16px" }}>
          <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.7)",marginBottom:6 }}>Re: Website design for Houston Plumbing Co.</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.35)",lineHeight:1.7 }}>Hi John, I came across Houston Plumbing Co. and noticed your website could use a modern refresh to help convert more of your Google traffic...</div>
        </div>
      </div>
      {/* Feature checklist */}
      <div style={{ background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"4px 18px" }}>
        {[
          { text:"Sends from your real Gmail address — not a bulk sender", bold:"your real Gmail address" },
          { text:"Recipients trust it more — better open & reply rates", bold:"better open & reply rates" },
          { text:"We only request send permission — never read your emails", bold:"never read your emails" },
        ].map((c, i) => (
          <div key={i} className="ob-check">
            <Chk />
            <span style={{ fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.55 }}>
              {c.text.split(c.bold).map((part, j) => j === 0 ? part : <><strong style={{ color:"rgba(255,255,255,.9)" }}>{c.bold}</strong>{part}</>)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 5: Ready ─────────────────────────────── */
function SlideReady() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20,width:"100%" }}>
      {/* Success orb */}
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute",inset:-10,borderRadius:"50%",background:"rgba(74,222,128,.08)",animation:"ob-ping 2s ease-out infinite" }} />
        <div style={{ width:68,height:68,borderRadius:"50%",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16l7 7L26 9" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {/* Steps */}
      <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:8 }}>
        {[
          { emoji:"🔍", step:"1", text:"Enter a business type & city" },
          { emoji:"⚡", step:"2", text:"AI scores leads & writes emails" },
          { emoji:"📤", step:"3", text:"Review & send from your Gmail" },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 18px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:11,animation:`ob-in .4s ${i*90}ms both` }}>
            <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.25))",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>
              {s.emoji}
            </div>
            <span style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.8)" }}>{s.text}</span>
            <div style={{ marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:"rgba(74,222,128,.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.2 2.2L8 2.5" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide config ───────────────────────────────── */
const SLIDES = [
  { key:"welcome", title:"Welcome to OutLeadrr",   sub:"Your AI-powered cold outreach engine. Let's show you how it works.",        Comp: SlideWelcome },
  { key:"find",    title:"Find real businesses",    sub:"Type any business + city and get live prospects pulled from Google Maps.",   Comp: SlideFind    },
  { key:"score",   title:"Every lead gets scored",  sub:"AI ranks each business 0–100 across 5 dimensions so you focus on the best.",Comp: SlideScore   },
  { key:"gmail",   title:"Send from your Gmail",    sub:"Connect once and send personalized emails directly from your inbox.",        Comp: SlideGmail   },
  { key:"ready",   title:"You're all set 🎉",        sub:"Start finding and closing leads in under 30 seconds.",                      Comp: SlideReady   },
];

/* ── Main component ─────────────────────────────── */
export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => { if (!localStorage.getItem(STORAGE_KEY)) setVisible(true); }, []);

  const dismiss = () => { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); };

  const go = (dir: 1 | -1) => {
    if (dir === 1 && step === SLIDES.length - 1) { dismiss(); return; }
    if (dir === -1 && step === 0) return;
    setExiting(true);
    setTimeout(() => { setStep(s => s + dir); setExiting(false); }, 240);
  };

  if (!visible) return null;

  const { title, sub, Comp } = SLIDES[step];
  const isFirst  = step === 0;
  const isGmail  = SLIDES[step].key === "gmail";
  const isLast   = step === SLIDES.length - 1;

  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div onClick={dismiss} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)" }} />

      {/* Modal */}
      <div style={{
        position:"fixed",zIndex:201,top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"100%",maxWidth:540,
        background:"#111114",
        border:"1px solid rgba(255,255,255,.09)",
        borderRadius:22,
        boxShadow:"0 40px 100px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.06)",
        fontFamily:F,overflow:"hidden",
      }}>
        {/* Header bar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 0" }}>
          <div style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",borderRadius:99,padding:"4px 12px" }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#6366f1",boxShadow:"0 0 6px #6366f1" }} />
            <span style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",color:"rgba(99,102,241,.9)",textTransform:"uppercase" }}>Outleadrr</span>
          </div>
          <button onClick={dismiss} style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.45)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.13)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.07)")}>×</button>
        </div>

        {/* Slide content */}
        <div key={step} className={exiting ? "ob-out" : "ob-in"} style={{ padding:"20px 28px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:20 }}>
          <div style={{ textAlign:"center" }}>
            <h2 style={{ fontSize:24,fontWeight:800,color:"#fff",letterSpacing:"-.03em",lineHeight:1.12,marginBottom:8 }}>{title}</h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.65,maxWidth:380,margin:"0 auto" }}>{sub}</p>
          </div>
          <Comp />
        </div>

        {/* CTA area */}
        <div style={{ padding:"12px 28px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
          {isGmail ? (
            <>
              <a href="/api/auth/google" className="ob-cta" style={{ textDecoration:"none",textAlign:"center" }}>Authenticate with Gmail</a>
              <button className="ob-skip" onClick={() => go(1)}>I'll do this later</button>
            </>
          ) : (
            <button className="ob-cta" onClick={() => go(1)}>
              {isLast ? "Find my first leads →" : isFirst ? "Get started" : "Continue"}
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 28px 22px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <button onClick={() => go(-1)} style={{ fontSize:12,color:isFirst?"transparent":"rgba(255,255,255,.3)",background:"none",border:"none",cursor:isFirst?"default":"pointer",fontFamily:F,transition:"color .15s",padding:"4px 0" }}
            onMouseEnter={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.65)"); }}
            onMouseLeave={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.3)"); }}>← Back</button>
          <Dots n={SLIDES.length} i={step} />
          <span style={{ fontSize:11,color:"rgba(255,255,255,.2)",minWidth:28,textAlign:"right" }}>{step+1}/{SLIDES.length}</span>
        </div>
      </div>
    </>
  );
}

export function resetOnboarding() { localStorage.removeItem(STORAGE_KEY); }
