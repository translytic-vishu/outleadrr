import { useState, useEffect } from "react";

const STORAGE_KEY = "outleadrr_onboarding_done";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";

const ONBOARD_CSS = `
  @keyframes ob-fadeIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ob-fadeOut { from{opacity:1;transform:translateY(0)}   to{opacity:0;transform:translateY(-12px)} }
  @keyframes ob-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.5)} 70%{box-shadow:0 0 0 8px rgba(99,102,241,0)} }
  .ob-slide-in  { animation: ob-fadeIn  .42s cubic-bezier(.16,1,.3,1) both; }
  .ob-slide-out { animation: ob-fadeOut .28s cubic-bezier(.4,0,1,1) both; }
  .ob-cta {
    display:flex;align-items:center;justify-content:center;
    padding:13px 40px;border-radius:999px;border:none;
    background:#6366f1;color:#fff;
    font-size:15px;font-weight:700;font-family:${F};
    cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;
    box-shadow:0 2px 16px rgba(99,102,241,.4);
    width:100%;max-width:320px;
  }
  .ob-cta:hover{background:#5254cc;transform:translateY(-1px);box-shadow:0 6px 24px rgba(99,102,241,.5);}
  .ob-cta:active{transform:translateY(0);}
  .ob-ghost {
    font-size:13px;color:rgba(255,255,255,.4);font-family:${F};
    background:none;border:none;cursor:pointer;margin-top:2px;
    transition:color .15s;padding:6px 12px;
  }
  .ob-ghost:hover{color:rgba(255,255,255,.7);}
  .ob-check-row {
    display:flex;align-items:flex-start;gap:14px;
    padding:18px 0;border-bottom:1px solid rgba(255,255,255,.07);
  }
  .ob-check-row:last-child{border-bottom:none;}
`;

/* ── Check icon ─────────────────────────────────────── */
function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:1 }}>
      <circle cx="9" cy="9" r="9" fill="rgba(99,102,241,.18)" />
      <path d="M5 9.5l2.8 2.8L13 6" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Dot nav ────────────────────────────────────────── */
function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:7 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 7,
          height: 7,
          borderRadius: 99,
          background: i === current ? "#6366f1" : "rgba(255,255,255,.2)",
          transition: "all .3s cubic-bezier(.16,1,.3,1)",
        }} />
      ))}
    </div>
  );
}

/* ── Slide definitions ──────────────────────────────── */
type SlideKey = "welcome" | "find" | "score" | "gmail" | "ready";

const SLIDES: { key: SlideKey; title: string; sub: string }[] = [
  { key:"welcome", title:"Welcome to OutLeadrr",        sub:"Your AI-powered cold outreach engine. Let's walk you through how it works." },
  { key:"find",    title:"Find real businesses",         sub:"Search Google Maps for live prospects in any city, any industry — in seconds." },
  { key:"score",   title:"AI scores every lead",         sub:"Each business gets a 0–100 score based on fit, size, reachability, and review health." },
  { key:"gmail",   title:"Connect Gmail to send",        sub:"Send emails directly from your real Gmail inbox — not a bulk sender." },
  { key:"ready",   title:"You're all set",               sub:"Start finding prospects and closing deals in under 30 seconds." },
];

/* ── Individual slide content ───────────────────────── */
function SlideContent({ slideKey, onConnectGmail, onSkip }: {
  slideKey: SlideKey;
  onConnectGmail: () => void;
  onSkip: () => void;
}) {
  if (slideKey === "welcome") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:28 }}>
      {/* Logo mark */}
      <div style={{ width:64,height:64,borderRadius:16,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M4 24 L16 8 L28 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 18 L16 8 L23 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".45"/>
        </svg>
      </div>
      {/* Feature pills */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center" }}>
        {["Google Maps data","AI-written emails","Gmail sending","Lead scoring"].map(f => (
          <div key={f} style={{ padding:"6px 14px",borderRadius:99,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",fontSize:12,color:"rgba(255,255,255,.65)",fontWeight:500 }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );

  if (slideKey === "find") return (
    <div style={{ width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"24px 28px" }}>
      {/* Fake search UI */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
        {["plumbers","Houston, TX"].map((v,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"rgba(255,255,255,.55)" }}>
            {v}
          </div>
        ))}
      </div>
      <div style={{ background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"rgba(255,255,255,.5)" }}>
        website design services for local businesses
      </div>
      <div style={{ marginTop:14,display:"flex",gap:8,alignItems:"center" }}>
        <div style={{ flex:1,height:38,borderRadius:8,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)" }} />
        <div style={{ width:120,height:38,borderRadius:8,background:"rgba(99,102,241,.8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:600 }}>Find 10 leads →</div>
      </div>
    </div>
  );

  if (slideKey === "score") return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",gap:10 }}>
      {[
        { name:"Houston Plumbing Co.",  score:87, color:"#4ade80" },
        { name:"Rapid Pipe Services",   score:71, color:"#4ade80" },
        { name:"Quick Fix Plumbers",    score:54, color:"#facc15" },
      ].map((b, i) => (
        <div key={i} style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,animation:`ob-fadeIn .4s ${i*100}ms both` }}>
          <div style={{ width:44,height:44,borderRadius:8,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ fontSize:16,fontWeight:800,color:b.color,lineHeight:1 }}>{b.score}</span>
            <span style={{ fontSize:7,color:"rgba(255,255,255,.3)",fontWeight:600,letterSpacing:".06em" }}>SCORE</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.85)",marginBottom:5 }}>{b.name}</div>
            <div style={{ height:4,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${b.score}%`,background:b.color,borderRadius:99 }} />
            </div>
          </div>
          <span style={{ fontSize:10,fontWeight:700,color:b.score>=70?"#4ade80":"#facc15",letterSpacing:".04em",flexShrink:0 }}>
            {b.score >= 70 ? "STRONG" : "GOOD"}
          </span>
        </div>
      ))}
    </div>
  );

  if (slideKey === "gmail") return (
    <div style={{ width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"6px 24px 6px" }}>
      <div className="ob-check-row">
        <Check />
        <span style={{ fontSize:14,color:"rgba(255,255,255,.8)",lineHeight:1.55 }}>
          OutLeadrr sends emails <strong style={{ color:"#fff" }}>directly from your Gmail account</strong> — not a third-party sender.
        </span>
      </div>
      <div className="ob-check-row">
        <Check />
        <span style={{ fontSize:14,color:"rgba(255,255,255,.8)",lineHeight:1.55 }}>
          Recipients see your real address, which <strong style={{ color:"#fff" }}>improves deliverability and trust</strong>.
        </span>
      </div>
      <div className="ob-check-row">
        <Check />
        <span style={{ fontSize:14,color:"rgba(255,255,255,.8)",lineHeight:1.55 }}>
          We only request <strong style={{ color:"#fff" }}>send permission</strong>. We never read or store your emails.
        </span>
      </div>
    </div>
  );

  if (slideKey === "ready") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20 }}>
      <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)",display:"flex",alignItems:"center",justifyContent:"center",animation:"ob-pulse 2s infinite" }}>
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path d="M7 17.5l7 7L27 10" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:10,width:"100%" }}>
        {[
          "Find businesses with Google Maps",
          "Score & review AI-written emails",
          "Send directly from Gmail in one click",
        ].map((s,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10,fontSize:13,color:"rgba(255,255,255,.75)",fontWeight:500 }}>
            <Check />{s}
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}

/* ── Main Onboarding Modal ──────────────────────────── */
export function OnboardingModal() {
  const [visible, setVisible]   = useState(false);
  const [step,    setStep]       = useState(0);
  const [exiting, setExiting]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const goNext = () => {
    if (step === SLIDES.length - 1) { dismiss(); return; }
    setExiting(true);
    setTimeout(() => { setStep(s => s + 1); setExiting(false); }, 260);
  };

  const goPrev = () => {
    if (step === 0) return;
    setExiting(true);
    setTimeout(() => { setStep(s => s - 1); setExiting(false); }, 260);
  };

  if (!visible) return null;

  const slide = SLIDES[step];
  const isGmail = slide.key === "gmail";
  const isReady = slide.key === "ready";
  const isFirst = step === 0;

  return (
    <>
      <style>{ONBOARD_CSS}</style>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)" }}
      />

      {/* Modal */}
      <div style={{
        position:"fixed",zIndex:201,
        top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"100%",maxWidth:520,
        background:"#111113",
        border:"1px solid rgba(255,255,255,.1)",
        borderRadius:20,
        boxShadow:"0 32px 80px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.04)",
        fontFamily:F,
        overflow:"hidden",
      }}>

        {/* Top close */}
        <div style={{ display:"flex",justifyContent:"flex-end",padding:"16px 20px 0" }}>
          <button onClick={dismiss} style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.5)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",fontFamily:F }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.12)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.07)")}>
            ×
          </button>
        </div>

        {/* Content */}
        <div
          key={step}
          className={exiting ? "ob-slide-out" : "ob-slide-in"}
          style={{ padding:"8px 36px 32px",display:"flex",flexDirection:"column",alignItems:"center",gap:22 }}
        >
          {/* Icon for gmail slide */}
          {isGmail && (
            <div style={{ width:56,height:56,borderRadius:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M3 7.5C3 6.67 3.67 6 4.5 6h19c.83 0 1.5.67 1.5 1.5v14c0 .83-.67 1.5-1.5 1.5h-19C3.67 23 3 22.33 3 21.5v-14z" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
                <path d="M3 8l11 8 11-8" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* Headline */}
          <div style={{ textAlign:"center" }}>
            <h2 style={{ fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-.03em",lineHeight:1.1,marginBottom:10 }}>
              {slide.title}
            </h2>
            <p style={{ fontSize:14,color:"rgba(255,255,255,.5)",lineHeight:1.65,maxWidth:380,margin:"0 auto" }}>
              {slide.sub}
            </p>
          </div>

          {/* Slide visual */}
          <div style={{ width:"100%" }}>
            <SlideContent
              slideKey={slide.key}
              onConnectGmail={() => { window.location.href = "/api/auth/google"; }}
              onSkip={goNext}
            />
          </div>

          {/* CTA */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:"100%" }}>
            {isGmail ? (
              <>
                <a
                  href="/api/auth/google"
                  className="ob-cta"
                  style={{ textDecoration:"none",textAlign:"center" }}
                >
                  Authenticate with Gmail
                </a>
                <button className="ob-ghost" onClick={goNext}>I'll do this later</button>
              </>
            ) : isReady ? (
              <button className="ob-cta" onClick={dismiss}>
                Find my first leads →
              </button>
            ) : (
              <button className="ob-cta" onClick={goNext}>
                {isFirst ? "Get started" : "Continue"}
              </button>
            )}
          </div>
        </div>

        {/* Footer: dots + prev */}
        <div style={{ padding:"0 36px 28px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <button
            onClick={goPrev}
            disabled={isFirst}
            style={{ fontSize:12,color:isFirst?"transparent":"rgba(255,255,255,.35)",background:"none",border:"none",cursor:isFirst?"default":"pointer",fontFamily:F,transition:"color .15s",padding:0 }}
            onMouseEnter={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.7)"); }}
            onMouseLeave={e=>{ if(!isFirst)(e.currentTarget.style.color="rgba(255,255,255,.35)"); }}
          >
            ← Back
          </button>
          <Dots total={SLIDES.length} current={step} />
          <span style={{ fontSize:12,color:"rgba(255,255,255,.25)",minWidth:36,textAlign:"right" }}>
            {step + 1}/{SLIDES.length}
          </span>
        </div>
      </div>
    </>
  );
}

/* ── Helper to reset onboarding (dev/testing) ───────── */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
