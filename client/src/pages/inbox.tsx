import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const K4  = "#c4c4c8";
const W   = "#ffffff";
const BG  = "#f8f8f9";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const MOCK_THREADS = [
  { id: 1, from: "Sarah Torres", company: "Torres Plumbing", subject: "Re: Partnership opportunity", preview: "Thanks for reaching out! We'd love to learn more about your services...", time: "2h ago", unread: true, tag: "Interested" },
  { id: 2, from: "Mike Chen",    company: "Chen Law Group",  subject: "Re: Website redesign",        preview: "We're actually looking to revamp our site this quarter. Can we schedule a call?", time: "5h ago", unread: true, tag: "Meeting Booked" },
  { id: 3, from: "Lisa Park",    company: "Park Dental",     subject: "Re: Digital marketing",       preview: "Not the right time for us right now, but feel free to follow up in Q3.", time: "1d ago", unread: false, tag: "Not Now" },
  { id: 4, from: "James Wilson", company: "Wilson Realty",   subject: "Re: CRM automation",          preview: "Interesting pitch. What does the onboarding process look like?", time: "2d ago", unread: false, tag: "Interested" },
  { id: 5, from: "Anna Kim",     company: "Kim Wellness",    subject: "Re: SEO services",            preview: "We already work with another agency, thanks.", time: "3d ago", unread: false, tag: "Not Interested" },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "Interested":     { bg: "#dcfce7", color: "#16a34a" },
  "Meeting Booked": { bg: "#ede9fe", color: "#7c3aed" },
  "Not Now":        { bg: "#fef9c3", color: "#ca8a04" },
  "Not Interested": { bg: "#fee2e2", color: "#dc2626" },
};

export default function Inbox() {
  const [activeThread, setActiveThread] = useState(MOCK_THREADS[0]);
  const [reply, setReply] = useState("");

  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}textarea{font-family:${F};resize:none;}`}</style>

      <div style={{ display: "flex", height: "100%", fontFamily: F }}>

        {/* Thread list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${BDR}`, overflowY: "auto", background: W }}>
          <div style={{ padding: "20px 18px 14px", borderBottom: `1px solid ${BDR}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: K }}>Inbox</h2>
            <p style={{ fontSize: 12, color: K3, marginTop: 2 }}>{MOCK_THREADS.filter(t => t.unread).length} unread</p>
          </div>
          {MOCK_THREADS.map(t => {
            const active = activeThread.id === t.id;
            const tc = TAG_COLORS[t.tag] || { bg: "#f1f5f9", color: "#64748b" };
            return (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                style={{
                  padding: "14px 18px", borderBottom: `1px solid ${BDR}`, cursor: "pointer",
                  background: active ? IND + "0a" : "transparent",
                  borderLeft: active ? `3px solid ${IND}` : "3px solid transparent",
                  transition: "all .15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: t.unread ? 700 : 500, color: K, display: "flex", alignItems: "center", gap: 5 }}>
                    {t.unread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: IND, flexShrink: 0 }} />}
                    {t.from}
                  </div>
                  <div style={{ fontSize: 11, color: K3 }}>{t.time}</div>
                </div>
                <div style={{ fontSize: 11, color: K3, marginBottom: 4 }}>{t.company}</div>
                <div style={{ fontSize: 12, color: K2, fontWeight: 500, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: K3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{t.preview}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: tc.bg, color: tc.color, flexShrink: 0, marginLeft: 6 }}>{t.tag}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thread view + reply */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Thread header */}
          <div style={{ padding: "20px 28px", borderBottom: `1px solid ${BDR}`, background: W }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: K }}>{activeThread.subject}</div>
            <div style={{ fontSize: 12, color: K3, marginTop: 3 }}>{activeThread.from} · {activeThread.company}</div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: BG }}>
            {/* Original email */}
            <div style={{ background: W, borderRadius: 12, border: `1px solid ${BDR}`, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: K2 }}>You → {activeThread.from}</div>
                <div style={{ fontSize: 11, color: K3 }}>Original outreach</div>
              </div>
              <div style={{ fontSize: 13, color: K2, lineHeight: 1.6 }}>
                Hi {activeThread.from.split(" ")[0]},<br/><br/>
                I came across {activeThread.company} and was impressed by your work. I wanted to reach out about a potential opportunity to help grow your business...<br/><br/>
                Would you have 15 minutes this week for a quick call?<br/><br/>
                Best,<br/>Your Name
              </div>
            </div>

            {/* Reply */}
            <div style={{ background: W, borderRadius: 12, border: `1.5px solid ${IND}22`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: K2 }}>{activeThread.from} → You</div>
                <div style={{ fontSize: 11, color: K3 }}>{activeThread.time}</div>
              </div>
              <div style={{ fontSize: 13, color: K2, lineHeight: 1.6 }}>{activeThread.preview}</div>
            </div>
          </div>

          {/* Reply box */}
          <div style={{ padding: "16px 28px", borderTop: `1px solid ${BDR}`, background: W }}>
            <div style={{ background: BG, borderRadius: 10, border: `1.5px solid #e4e4e8`, overflow: "hidden", transition: "border-color .18s" }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={`Reply to ${activeThread.from}...`}
                rows={4}
                style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", outline: "none", fontSize: 13, color: K, lineHeight: 1.6 }}
              />
              <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${BDR}` }}>
                <button
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${BDR}`, background: W, fontSize: 11, fontWeight: 600, color: K3, cursor: "pointer", fontFamily: F }}
                >
                  AI Follow-up
                </button>
                <button
                  disabled={!reply.trim()}
                  style={{
                    padding: "7px 18px", borderRadius: 8, border: "none",
                    background: reply.trim() ? IND : "#e4e4e8",
                    color: reply.trim() ? W : K3,
                    fontSize: 13, fontWeight: 700, cursor: reply.trim() ? "pointer" : "not-allowed",
                    fontFamily: F, transition: "all .15s",
                  }}
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
