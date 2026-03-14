import { AppLayout } from "@/components/AppLayout";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const STATS = [
  { label: "Emails Sent", value: "247", change: "+18%", up: true },
  { label: "Open Rate",   value: "64%",  change: "+7%",  up: true },
  { label: "Reply Rate",  value: "22%",  change: "+3%",  up: true },
  { label: "Meetings Booked", value: "14", change: "-2", up: false },
];

// Simple bar chart data
const WEEKLY = [
  { day: "Mon", sent: 38, opened: 24, replied: 9 },
  { day: "Tue", sent: 42, opened: 29, replied: 11 },
  { day: "Wed", sent: 35, opened: 22, replied: 7 },
  { day: "Thu", sent: 48, opened: 32, replied: 14 },
  { day: "Fri", sent: 51, opened: 35, replied: 16 },
  { day: "Sat", sent: 18, opened: 10, replied: 3 },
  { day: "Sun", sent: 15, opened: 8,  replied: 2 },
];

const MAX_VAL = Math.max(...WEEKLY.map(d => d.sent));

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{
      flex: 1, background: color, borderRadius: "3px 3px 0 0",
      height: `${(value / max) * 100}%`, minHeight: 2,
      transition: "height .4s ease",
    }} />
  );
}

export default function Analytics() {
  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}`}</style>

      <div style={{ padding: "28px 36px", fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Analytics</h1>
          <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Performance metrics across all your campaigns.</p>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: K, letterSpacing: "-.05em", lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.up ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  {s.up
                    ? <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M6 3v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  }
                </svg>
                {s.change} vs last week
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,.05)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: K }}>Weekly Activity</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: IND, label: "Sent" }, { color: "#10b981", label: "Opened" }, { color: "#f59e0b", label: "Replied" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: K3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, height: 180, alignItems: "flex-end" }}>
            {WEEKLY.map(d => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0, height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2 }}>
                  <Bar value={d.sent}   max={MAX_VAL} color={IND} />
                  <Bar value={d.opened} max={MAX_VAL} color="#10b981" />
                  <Bar value={d.replied} max={MAX_VAL} color="#f59e0b" />
                </div>
                <div style={{ fontSize: 10, color: K3, textAlign: "center", marginTop: 6, fontWeight: 600 }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top campaigns */}
        <div style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: K }}>Top Campaigns</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f8f9", borderBottom: `1px solid ${BDR}` }}>
                {["Campaign", "Sent", "Open Rate", "Reply Rate", "Score"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Q1 Dental Outreach", sent: 14, openRate: "71%", replyRate: "29%", score: 91 },
                { name: "NYC Real Estate Agencies", sent: 20, openRate: "65%", replyRate: "30%", score: 88 },
                { name: "SaaS Founders SF", sent: 8, openRate: "62%", replyRate: "12%", score: 74 },
              ].map((c, i) => (
                <tr key={i} style={{ borderBottom: i < 2 ? `1px solid ${BDR}` : "none" }}>
                  <td style={{ padding: "13px 18px", fontWeight: 600, color: K }}>{c.name}</td>
                  <td style={{ padding: "13px 18px", color: K2 }}>{c.sent}</td>
                  <td style={{ padding: "13px 18px", color: "#10b981", fontWeight: 600 }}>{c.openRate}</td>
                  <td style={{ padding: "13px 18px", color: IND, fontWeight: 600 }}>{c.replyRate}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#dcfce7", color: "#16a34a" }}>{c.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
