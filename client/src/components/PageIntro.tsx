/**
 * PageIntro — shows a first-time walkthrough slide when navigating
 * to a new page. Dismissed per-page via localStorage.
 */
import { useState, useEffect } from "react";

const F = "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif";
const SEEN_KEY = "outleadrr_seen_pages_v1";

function getSeenPages(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch { return {}; }
}
function markSeen(page: string) {
  const seen = getSeenPages();
  seen[page] = true;
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

export interface PageIntroConfig {
  pageKey: string;
  title: string;
  subtitle: string;
  steps: { icon: React.ReactNode; label: string; desc: string }[];
}

const CSS = `
  @keyframes pi-in  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pi-orb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-16px) scale(1.06)} }
  .pi-card { animation: pi-in .38s cubic-bezier(.16,1,.3,1) both; }
`;

export function PageIntro({ config }: { config: PageIntroConfig }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getSeenPages()[config.pageKey]) setVisible(true);
  }, [config.pageKey]);

  const dismiss = () => {
    markSeen(config.pageKey);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />
      {/* Glass modal */}
      <div
        className="pi-card"
        style={{
          position: "fixed", zIndex: 301,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "calc(100% - 32px)", maxWidth: 480,
          background: "rgba(10,10,16,0.82)",
          backdropFilter: "blur(48px) saturate(160%)",
          WebkitBackdropFilter: "blur(48px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04), 0 40px 100px rgba(0,0,0,.85), 0 8px 32px rgba(99,102,241,.07)",
          fontFamily: F,
          overflow: "hidden",
        }}
      >
        {/* Ambient orb */}
        <div aria-hidden style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:20 }}>
          <div style={{ position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%)",top:-60,right:-40,animation:"pi-orb 10s ease-in-out infinite" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position:"relative",zIndex:1 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
              {config.pageKey}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,.95)", letterSpacing: "-.03em", lineHeight: 1.15, margin: 0 }}>
              {config.title}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.65, margin: "6px 0 0", maxWidth: 360 }}>
              {config.subtitle}
            </p>
          </div>
          <button
            onClick={dismiss}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.38)", fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "all .15s", marginTop: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
          >
            &#x2715;
          </button>
        </div>

        {/* Steps */}
        <div style={{ padding: "20px 24px", position:"relative",zIndex:1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {config.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  animation: `pi-in .4s ${i * 70}ms both`,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, color: "#818cf8",
                }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 3 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.55 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 24px 24px", position:"relative",zIndex:1 }}>
          <button
            onClick={dismiss}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 11, border: "none",
              background: "rgba(255,255,255,.96)", color: "#0a0a0a",
              fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: F,
              transition: "all .15s",
              boxShadow: "0 4px 16px rgba(0,0,0,.22)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.96)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
          >
            Got it — let's go
          </button>
        </div>
      </div>
    </>
  );
}

/* ── SVG icon helpers ───────────────────────────────────────────── */
const Ico = {
  chart:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4.5 3 2.5 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  send:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 6.5l5 2.5 2.5 5L14 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  inbox:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 6l7 4 7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  plug:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2v3M10 2v3M4 5h8l-1 5H5L4 5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  chat:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v8H9l-3 2v-2H2V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  template: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5.5h6M5 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  eye:      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="6" ry="3.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>,
  zap:      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 2L4 9h4.5L6.5 14 12 7H7.5L9.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  kanban:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="3.5" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6.25" y="2.5" width="3.5" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="2.5" width="3.5" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  mail:     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  reply:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4L2 7l3 3M2 7h7a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 2v2M11 2v2M1.5 7h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

/* ── Per-page intro configs ─────────────────────────────────────── */

export const PAGE_INTROS: Record<string, PageIntroConfig> = {
  campaigns: {
    pageKey: "campaigns",
    title: "Your Campaigns",
    subtitle: "Every outreach you send gets tracked here — open rates, replies, and status all in one place.",
    steps: [
      { icon: Ico.zap,   label: "Create a campaign in the builder", desc: "Head to Campaign Builder, fill in your target, and generate leads." },
      { icon: Ico.send,  label: "Send emails to start tracking",    desc: "Once you send, the campaign appears here with live stats." },
      { icon: Ico.chart, label: "Monitor performance over time",    desc: "See sent count, open rates, and reply rates per campaign." },
    ],
  },
  inbox: {
    pageKey: "inbox",
    title: "Your Inbox",
    subtitle: "Replies from prospects land here. Connect Gmail to see real responses from your outreach.",
    steps: [
      { icon: Ico.plug,  label: "Connect your Gmail account",      desc: "Use the sidebar button or Settings to link your Gmail." },
      { icon: Ico.mail,  label: "Run a campaign and send emails",  desc: "Prospects who reply will show up in this inbox view." },
      { icon: Ico.chat,  label: "Reply directly from here",        desc: "Write back without leaving the app. Keep the conversation moving." },
    ],
  },
  templates: {
    pageKey: "templates",
    title: "Email Templates",
    subtitle: "Pre-built frameworks for every tone and situation. Pick one and the Campaign Builder auto-fills your email.",
    steps: [
      { icon: Ico.template, label: "Browse by tone and style", desc: "12 templates — professional, bold, friendly, and more." },
      { icon: Ico.eye,      label: "Preview before using",     desc: "Click any template to see the full subject line and body." },
      { icon: Ico.zap,      label: "Use in a campaign",        desc: "Hit 'Use This Template' and it pre-fills the Campaign Builder." },
    ],
  },
  leads: {
    pageKey: "leads",
    title: "Lead CRM",
    subtitle: "Every lead you generate lives here. Move them through your pipeline as you make progress.",
    steps: [
      { icon: Ico.search, label: "Leads appear after generation", desc: "Run a campaign and all generated leads are automatically added." },
      { icon: Ico.kanban, label: "Drag leads through stages",     desc: "Move from New to Contacted to Replied to Closed Won." },
      { icon: Ico.chart,  label: "Track your pipeline value",     desc: "See how many leads are at each stage at a glance." },
    ],
  },
  analytics: {
    pageKey: "analytics",
    title: "Analytics",
    subtitle: "A real-time view of your outreach performance across all campaigns.",
    steps: [
      { icon: Ico.mail,     label: "Emails sent and open rates", desc: "See how many emails landed and how many were opened." },
      { icon: Ico.reply,    label: "Reply rate tracking",        desc: "Know exactly how many prospects responded to your outreach." },
      { icon: Ico.calendar, label: "Weekly activity chart",      desc: "Spot trends in your outreach volume day by day." },
    ],
  },
  settings: {
    pageKey: "settings",
    title: "Settings",
    subtitle: "Set up your sender identity, Gmail connection, and campaign defaults.",
    steps: [
      { icon: Ico.mail,     label: "Connect or manage Gmail",  desc: "All outreach emails are sent from your real Gmail address." },
      { icon: Ico.inbox,    label: "Set your sender identity", desc: "Add your name, title, and company so emails feel personal." },
      { icon: Ico.calendar, label: "Set campaign defaults",    desc: "Choose your default lead count and tone to save time." },
    ],
  },
};
