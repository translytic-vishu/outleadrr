/**
 * PageIntro — shows a first-time walkthrough slide when navigating
 * to a new page. Dismissed per-page via localStorage.
 */
import { useState, useEffect } from "react";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";
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
  steps: { icon: string; label: string; desc: string }[];
}

const CSS = `
  @keyframes pi-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
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
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      {/* Modal */}
      <div
        className="pi-card"
        style={{
          position: "fixed", zIndex: 301,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "calc(100% - 32px)", maxWidth: 480,
          background: "#0d0d10",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
          fontFamily: F,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
              {config.pageKey}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", lineHeight: 1.15, margin: 0 }}>
              {config.title}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, margin: "6px 0 0", maxWidth: 360 }}>
              {config.subtitle}
            </p>
          </div>
          <button
            onClick={dismiss}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.4)", fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "all .15s", marginTop: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
          >
            ×
          </button>
        </div>

        {/* Steps */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  fontSize: 18, flexShrink: 0,
                }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 3 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 24px 24px" }}>
          <button
            onClick={dismiss}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 11, border: "none",
              background: "#fff", color: "#0a0a0a",
              fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: F,
              transition: "all .15s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
          >
            Got it — let's go
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Per-page intro configs ─────────────────────────────────────── */

export const PAGE_INTROS: Record<string, PageIntroConfig> = {
  campaigns: {
    pageKey: "campaigns",
    title: "Your Campaigns",
    subtitle: "Every outreach you send gets tracked here — open rates, replies, and status all in one place.",
    steps: [
      { icon: "🚀", label: "Create a campaign in the builder", desc: "Head to Campaign Builder, fill in your target, and generate leads." },
      { icon: "📤", label: "Send emails to start tracking", desc: "Once you send, the campaign appears here with live stats." },
      { icon: "📊", label: "Monitor performance over time", desc: "See sent count, open rates, and reply rates per campaign." },
    ],
  },
  inbox: {
    pageKey: "inbox",
    title: "Your Inbox",
    subtitle: "Replies from prospects land here. Connect Gmail to see real responses from your outreach.",
    steps: [
      { icon: "🔌", label: "Connect your Gmail account", desc: "Use the sidebar button or Settings to link your Gmail." },
      { icon: "📨", label: "Run a campaign and send emails", desc: "Prospects who reply will show up in this inbox view." },
      { icon: "💬", label: "Reply directly from here", desc: "Write back without leaving the app. Keep the conversation moving." },
    ],
  },
  templates: {
    pageKey: "templates",
    title: "Email Templates",
    subtitle: "Pre-built frameworks for every tone and situation. Pick one and the Campaign Builder auto-fills your email.",
    steps: [
      { icon: "🎨", label: "Browse by tone and style", desc: "We have 12 templates — professional, bold, friendly, and more." },
      { icon: "👁️", label: "Preview before using", desc: "Click any template to see the full subject line and body." },
      { icon: "⚡", label: "Use in a campaign", desc: "Hit 'Use This Template' and it pre-fills the Campaign Builder." },
    ],
  },
  leads: {
    pageKey: "leads",
    title: "Lead CRM",
    subtitle: "Every lead you generate lives here. Move them through your pipeline as you make progress.",
    steps: [
      { icon: "🔍", label: "Leads appear after generation", desc: "Run a campaign and all generated leads are automatically added." },
      { icon: "🗂️", label: "Drag leads through stages", desc: "Move from New → Contacted → Replied → Meeting → Closed Won." },
      { icon: "📈", label: "Track your pipeline value", desc: "See how many leads are at each stage at a glance." },
    ],
  },
  analytics: {
    pageKey: "analytics",
    title: "Analytics",
    subtitle: "A real-time view of your outreach performance across all campaigns.",
    steps: [
      { icon: "📬", label: "Emails sent & open rates", desc: "See how many emails landed and how many were opened." },
      { icon: "💌", label: "Reply rate tracking", desc: "Know exactly how many prospects responded to your outreach." },
      { icon: "📅", label: "Weekly activity chart", desc: "Spot trends in your outreach volume day by day." },
    ],
  },
  settings: {
    pageKey: "settings",
    title: "Settings",
    subtitle: "Set up your sender identity, Gmail connection, and campaign defaults.",
    steps: [
      { icon: "📧", label: "Connect or manage Gmail", desc: "All outreach emails are sent from your real Gmail address." },
      { icon: "👤", label: "Set your sender identity", desc: "Add your name, title, and company so emails feel personal." },
      { icon: "⚙️", label: "Set campaign defaults", desc: "Choose your default lead count and tone to save time." },
    ],
  },
};
