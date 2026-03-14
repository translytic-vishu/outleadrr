import { useState, useEffect } from "react";

const STORAGE_KEY = "outleadrr_onboarding_v3";
const F = "'Inter','Helvetica Neue',Arial,sans-serif";

const CSS = `
  @keyframes ob-in    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ob-out   { from{opacity:1;transform:translateY(0)}    to{opacity:0;transform:translateY(-12px)} }
  @keyframes ob-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes ob-ping  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.9);opacity:0} }
  .ob-in  { animation: ob-in  .42s cubic-bezier(.16,1,.3,1) both; }
  .ob-out { animation: ob-out .24s cubic-bezier(.4,0,1,1) both; }
  .ob-cta {
    display:flex;align-items:center;justify-content:center;
    padding:13px 36px;border-radius:10px;border:none;
    background:#fff;color:#0a0a0a;
    font-size:14px;font-weight:700;font-family:${F};letter-spacing:-.01em;
    cursor:pointer;transition:all .18s;
    box-shadow:0 1px 3px rgba(0,0,0,.1);
    width:100%;max-width:280px;
  }
  .ob-cta:hover{background:#f0f0f0;transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.15);}
  .ob-cta:active{transform:translateY(0);}
  .ob-cta-outline {
    display:flex;align-items:center;justify-content:center;
    padding:13px 36px;border-radius:10px;
    border:1px solid rgba(255,255,255,.15);
    background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);
    font-size:14px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .18s;
    width:100%;max-width:280px;
    backdrop-filter:blur(8px);
  }
  .ob-cta-outline:hover{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.25);}
  .ob-skip{font-size:12px;color:rgba(255,255,255,.3);font-family:${F};background:none;border:none;cursor:pointer;transition:color .15s;padding:6px;letter-spacing:.01em;}
  .ob-skip:hover{color:rgba(255,255,255,.55);}
  .ob-check{display:flex;align-items:flex-start;gap:14px;padding:15px 0;border-bottom:1px solid rgba(255,255,255,.055);}
  .ob-check:last-child{border-bottom:none;}
`;

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
      {Array.from({ length: n }).map((_, x) => (
        <div key={x} style={{
          width: x === i ? 20 : 6, height: 6, borderRadius: 99,
          background: x === i ? "#fff" : "rgba(255,255,255,.2)",
          transition: "all .3s cubic-bezier(.16,1,.3,1)",
        }} />
      ))}
    </div>
  );
}

function Chk() {
  return (
    <div style={{ width:20,height:20,borderRadius:6,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5L8.5 2" stroke="rgba(255,255,255,.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── Slide 1: Welcome ─────────────────────────── */
function SlideWelcome() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:22,width:"100%" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,width:"100%" }}>
        {[
          { label:"Google Maps data",  desc:"Real businesses, live data",       num:"01" },
          { label:"Personalized emails", desc:"Written for each prospect",       num:"02" },
          { label:"Lead scoring",       desc:"Ranked 0–100 by opportunity",      num:"03" },
          { label:"Gmail sending",      desc:"Sent from your real inbox",        num:"04" },
        ].map(f => (
          <div key={f.label} style={{ padding:"14px 16px",borderRadius:11,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.25)",letterSpacing:".06em",marginBottom:6 }}>{f.num}</div>
            <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,.88)",marginBottom:3 }}>{f.label}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,.38)",lineHeight:1.45 }}>{f.desc}</div>
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
            <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:3 }}>Business Type</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.8)",fontWeight:500 }}>plumbers</div>
          </div>
          <div style={{ background:"rgba(255,255,255,.07)",borderRadius:8,padding:"9px 13px" }}>
            <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:3 }}>Location</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.8)",fontWeight:500 }}>Houston, TX</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,.06)",borderRadius:8,padding:"9px 13px",marginBottom:10 }}>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",marginBottom:3 }}>What are you selling?</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,.6)" }}>website design services</div>
        </div>
        <div style={{ background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,padding:"10px",textAlign:"center",fontSize:13,fontWeight:700,color:"#fff" }}>
          Find 10 leads
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,.06)" }} />
        <span style={{ fontSize:11,color:"rgba(255,255,255,.25)",fontWeight:500 }}>Google Maps pulls real businesses</span>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,.06)" }} />
      </div>
      <div style={{ display:"flex",gap:8 }}>
        {["Houston Plumbing","Rapid Pipe Co.","QuickFix Plumbing"].map((n,i) => (
          <div key={n} style={{ flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,padding:"10px 11px",animation:`ob-in .4s ${i*70}ms both` }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#4ade80",marginBottom:6 }} />
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
          <div style={{ width:46,height:46,borderRadius:9,background:`rgba(255,255,255,.06)`,border:`1px solid rgba(255,255,255,.1)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ fontSize:17,fontWeight:900,color:l.color,lineHeight:1 }}>{l.score}</span>
            <span style={{ fontSize:7,color:"rgba(255,255,255,.25)",fontWeight:600,letterSpacing:".06em",marginTop:1 }}>SCORE</span>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
              <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,.8)" }}>{l.name}</span>
              <span style={{ fontSize:10,fontWeight:700,color:l.color }}>{l.label}</span>
            </div>
            <div style={{ display:"flex",gap:3 }}>
              {l.bars.map((v, j) => (
                <div key={j} style={{ flex:1,height:3,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${v}%`,background:l.color,borderRadius:99,opacity:.8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ display:"flex",justifyContent:"space-between",padding:"0 4px",marginTop:2 }}>
        {["Industry","Size","Reach","Opp.","Reviews"].map(s => (
          <span key={s} style={{ fontSize:9,color:"rgba(255,255,255,.22)",fontWeight:600,letterSpacing:".05em" }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 4: Gmail ───────────────────────────── */
function SlideGmail() {
  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:12 }}>
      <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:13,overflow:"hidden" }}>
        <div style={{ padding:"10px 15px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.7)",flexShrink:0 }}>Y</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.75)" }}>you@gmail.com</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,.28)" }}>to: john@houstonplumbing.com</div>
          </div>
          <div style={{ fontSize:10,color:"#4ade80",fontWeight:600,background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.18)",padding:"3px 9px",borderRadius:6,flexShrink:0 }}>Sent</div>
        </div>
        <div style={{ padding:"11px 15px" }}>
          <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.6)",marginBottom:5 }}>Website design for Houston Plumbing</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,.3)",lineHeight:1.65 }}>Hi John, I noticed your site could use a refresh to better convert the traffic you're already getting from Google...</div>
        </div>
      </div>
      <div style={{ background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:11,padding:"2px 16px" }}>
        {[
          { t:"Emails come from your real Gmail address, not a third-party sender" },
          { t:"Better deliverability — recipients see your name, not a bulk tool" },
          { t:"We only request send access and never read your inbox" },
        ].map((c, i) => (
          <div key={i} className="ob-check">
            <Chk />
            <span style={{ fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.55 }}>{c.t}</span>
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
        { n:"1", text:"Enter a business type and city" },
        { n:"2", text:"Review scored leads with ready-to-send emails" },
        { n:"3", text:"Connect Gmail and send in one click" },
      ].map((s, i) => (
        <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:11,animation:`ob-in .4s ${i*80}ms both` }}>
          <div style={{ width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"rgba(255,255,255,.6)",flexShrink:0 }}>{s.n}</div>
          <span style={{ fontSize:13,fontWeight:500,color:"rgba(255,255,255,.75)" }}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

const SLIDES = [
  { key:"welcome", title:"Welcome to Outleadrr",      sub:"Find real prospects, score them, and send personalized emails — all in one place.",     Comp: SlideWelcome },
  { key:"find",    title:"Find businesses instantly",  sub:"Search any industry and city. We pull live results straight from Google Maps.",          Comp: SlideFind    },
  { key:"score",   title:"Every lead gets a score",    sub:"Each business is ranked across five dimensions so you know exactly who to contact first.", Comp: SlideScore   },
  { key:"gmail",   title:"Connect your Gmail",         sub:"Send emails directly from your inbox. One connection, and you're ready to go.",           Comp: SlideGmail   },
  { key:"ready",   title:"You're all set",             sub:"Here's all you need to know to get started.",                                             Comp: SlideReady   },
];

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
    setTimeout(() => { setStep(s => s + dir); setExiting(false); }, 230);
  };

  if (!visible) return null;

  const { title, sub, Comp } = SLIDES[step];
  const isFirst = step === 0;
  const isGmail = SLIDES[step].key === "gmail";
  const isLast  = step === SLIDES.length - 1;

  return (
    <>
      <style>{CSS}</style>
      <div onClick={dismiss} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)" }} />
      <div style={{
        position:"fixed",zIndex:201,top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"calc(100% - 32px)",maxWidth:520,
        background:"#0f0f11",
        border:"1px solid rgba(255,255,255,.08)",
        borderRadius:18,
        boxShadow:"0 32px 80px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.05)",
        fontFamily:F,overflow:"hidden",
      }}>
        {/* Top bar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 0" }}>
          <span style={{ fontSize:11,fontWeight:700,letterSpacing:".08em",color:"rgba(255,255,255,.25)",textTransform:"uppercase" }}>Outleadrr</span>
          <button onClick={dismiss} style={{ width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.09)",color:"rgba(255,255,255,.4)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,transition:"all .15s" }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.11)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.06)")}>
            &#x2715;
          </button>
        </div>

        {/* Content */}
        <div key={step} className={exiting ? "ob-out" : "ob-in"} style={{ padding:"18px 24px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:18 }}>
          <div style={{ textAlign:"center" }}>
            <h2 style={{ fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-.03em",lineHeight:1.15,marginBottom:7 }}>{title}</h2>
            <p style={{ fontSize:13,color:"rgba(255,255,255,.42)",lineHeight:1.6,maxWidth:360,margin:"0 auto" }}>{sub}</p>
          </div>
          <Comp />
        </div>

        {/* CTA */}
        <div style={{ padding:"10px 24px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
          {isGmail ? (
            <>
              <a href="/api/auth/google" className="ob-cta" style={{ textDecoration:"none",textAlign:"center" }}>Connect Gmail</a>
              <button className="ob-cta-outline" onClick={() => go(1)}>Skip for now</button>
            </>
          ) : (
            <button className="ob-cta" onClick={() => go(1)}>
              {isLast ? "Start finding leads" : isFirst ? "Get started" : "Continue"}
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 24px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <button onClick={() => go(-1)} style={{ fontSize:12,color:isFirst?"transparent":"rgba(255,255,255,.28)",background:"none",border:"none",cursor:isFirst?"default":"pointer",fontFamily:F,transition:"color .15s",padding:"3px 0" }}
            onMouseEnter={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.6)"); }}
            onMouseLeave={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.28)"); }}>
            Back
          </button>
          <Dots n={SLIDES.length} i={step} />
          <span style={{ fontSize:11,color:"rgba(255,255,255,.18)",minWidth:24,textAlign:"right" }}>{step+1}/{SLIDES.length}</span>
        </div>
      </div>
    </>
  );
}

export function resetOnboarding() { localStorage.removeItem(STORAGE_KEY); }
