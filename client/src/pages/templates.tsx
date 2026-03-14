import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BG  = "#f8f8f9";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const TEMPLATES = [
  {
    id: 1, name: "The Value-First Open",
    tag: "Professional", uses: 47,
    subject: "Quick question about {{Company}}'s growth",
    preview: "Hi {{FirstName}}, I noticed {{Company}} has been expanding quickly in {{City}}. Most businesses at your stage run into [specific pain]. We've helped 40+ similar companies solve this with...",
  },
  {
    id: 2, name: "The Casual Check-in",
    tag: "Friendly", uses: 31,
    subject: "Hey {{FirstName}} — thought of you",
    preview: "Hey {{FirstName}}! Saw {{Company}} recently [event/achievement]. Really impressive. I work with businesses like yours to help with [specific value]. Any chance you'd be open to a quick chat?",
  },
  {
    id: 3, name: "The Direct Ask",
    tag: "Direct", uses: 28,
    subject: "15 minutes to double {{Company}}'s [metric]?",
    preview: "Hi {{FirstName}}, I'll keep it short. I help [industry] businesses [specific outcome]. Could save you [time/money]. Worth 15 minutes? Book here: [link]",
  },
  {
    id: 4, name: "The Case Study",
    tag: "Persuasive", uses: 19,
    subject: "How [Similar Company] got [result] in 90 days",
    preview: "Hi {{FirstName}}, [Competitor/peer] was facing the same challenge as {{Company}}. After working with us, they [specific result with numbers]. I'd love to show you how we could do the same for {{Company}}...",
  },
  {
    id: 5, name: "The Industry Insight",
    tag: "Consultative", uses: 22,
    subject: "{{Industry}} trend that's costing businesses like {{Company}}",
    preview: "Hi {{FirstName}}, one thing I keep hearing from [industry] leaders is [insight]. Most businesses don't realize how much this is costing them. We've built a solution specifically for this...",
  },
  {
    id: 6, name: "The Bold Challenger",
    tag: "Bold", uses: 14,
    subject: "Honest question for {{FirstName}} at {{Company}}",
    preview: "{{FirstName}} — most [industry] businesses are leaving [money/opportunity] on the table and don't even know it. {{Company}} might be too. I can show you in under 10 minutes. Interested?",
  },
];

const TAG_COLORS: Record<string, string> = {
  Professional: "#6366f1", Friendly: "#10b981", Direct: "#f59e0b",
  Persuasive: "#8b5cf6", Consultative: "#3b82f6", Bold: "#ef4444",
};

export default function Templates() {
  const [activeTemplate, setActiveTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}textarea{font-family:${F};resize:none;}`}</style>

      <div style={{ padding: "28px 36px", fontFamily: F }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Templates</h1>
            <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Pre-built email templates for every situation and tone.</p>
          </div>
          <button
            style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: K, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}
          >
            + New Template
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {TEMPLATES.map(t => {
            const tagColor = TAG_COLORS[t.tag] || "#6366f1";
            return (
              <div
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                style={{
                  background: W, borderRadius: 14, border: `1px solid ${BDR}`,
                  padding: "20px", cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,.05)",
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = tagColor + "60"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px rgba(0,0,0,.09)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BDR; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: K }}>{t.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: tagColor + "18", color: tagColor, flexShrink: 0, marginLeft: 8 }}>{t.tag}</span>
                </div>
                <div style={{ fontSize: 12, color: K2, fontWeight: 600, marginBottom: 8 }}>Subject: <span style={{ fontWeight: 400, color: K3 }}>{t.subject}</span></div>
                <div style={{ fontSize: 12, color: K3, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any }}>{t.preview}</div>
                <div style={{ marginTop: 14, fontSize: 11, color: K3 }}>Used {t.uses} times</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-in drawer */}
      {activeTemplate && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "flex-end",
        }} onClick={() => setActiveTemplate(null)}>
          <div
            style={{
              width: 480, background: W, height: "100%", overflowY: "auto",
              boxShadow: "-8px 0 40px rgba(0,0,0,.12)",
              animation: "slideIn .2s ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: K }}>{activeTemplate.name}</div>
                <div style={{ fontSize: 12, color: K3, marginTop: 2 }}>{activeTemplate.tag} tone · Used {activeTemplate.uses} times</div>
              </div>
              <button onClick={() => setActiveTemplate(null)} style={{ background: "none", border: "none", cursor: "pointer", color: K3, fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Subject Line</div>
                <div style={{ background: BG, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: K, fontWeight: 600, border: `1px solid ${BDR}` }}>{activeTemplate.subject}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Body</div>
                <div style={{ background: BG, borderRadius: 8, padding: "14px", fontSize: 13, color: K2, lineHeight: 1.65, border: `1px solid ${BDR}` }}>{activeTemplate.preview}</div>
              </div>
              <div style={{ padding: "14px", background: IND + "0a", borderRadius: 10, border: `1px solid ${IND}22`, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: IND, marginBottom: 4 }}>Dynamic Variables</div>
                <div style={{ fontSize: 12, color: K2, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["{{FirstName}}", "{{Company}}", "{{City}}", "{{Industry}}"].map(v => (
                    <span key={v} style={{ background: IND + "18", color: IND, padding: "2px 8px", borderRadius: 5, fontWeight: 600 }}>{v}</span>
                  ))}
                </div>
              </div>
              <button
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: K, color: W, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 10px rgba(0,0,0,.12)" }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </AppLayout>
  );
}
