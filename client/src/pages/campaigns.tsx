import { AppLayout } from "@/components/AppLayout";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const MOCK_CAMPAIGNS = [
  { id: 1, name: "Q1 Dental Outreach", status: "Active", leads: 18, sent: 14, opened: 9, replied: 3, created: "Mar 8, 2026" },
  { id: 2, name: "Austin Law Firms", status: "Draft", leads: 10, sent: 0, opened: 0, replied: 0, created: "Mar 12, 2026" },
  { id: 3, name: "NYC Real Estate Agencies", status: "Completed", leads: 20, sent: 20, opened: 15, replied: 6, created: "Feb 28, 2026" },
  { id: 4, name: "SaaS Founders SF", status: "Paused", leads: 12, sent: 8, opened: 5, replied: 1, created: "Mar 1, 2026" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Active:    { bg: "#dcfce7", color: "#16a34a" },
  Draft:     { bg: "#f1f5f9", color: "#64748b" },
  Completed: { bg: "#ede9fe", color: "#7c3aed" },
  Paused:    { bg: "#fef9c3", color: "#ca8a04" },
};

export default function Campaigns() {
  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}input,button{font-family:${F};}`}</style>

      <div style={{ padding: "28px 36px", fontFamily: F }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Campaigns</h1>
            <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Track and manage all your outreach campaigns.</p>
          </div>
          <a
            href="/app"
            style={{
              padding: "9px 18px", borderRadius: 9, border: "none",
              background: K, color: W, fontSize: 13, fontWeight: 700,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,.15)",
            }}
          >
            + New Campaign
          </a>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Campaigns", value: "4" },
            { label: "Emails Sent", value: "42" },
            { label: "Open Rate", value: "69%" },
            { label: "Reply Rate", value: "24%" },
          ].map(s => (
            <div key={s.label} style={{ background: W, borderRadius: 12, border: `1px solid ${BDR}`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: K, letterSpacing: "-.04em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f8f9", borderBottom: `1px solid ${BDR}` }}>
                {["Campaign", "Status", "Leads", "Sent", "Opened", "Replied", "Created"].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CAMPAIGNS.map((c, i) => {
                const sc = STATUS_COLORS[c.status] || { bg: "#f1f5f9", color: "#64748b" };
                return (
                  <tr key={c.id} style={{ borderBottom: i < MOCK_CAMPAIGNS.length - 1 ? `1px solid ${BDR}` : "none" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: K }}>{c.name}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: sc.bg, color: sc.color }}>{c.status}</span>
                    </td>
                    <td style={{ padding: "14px 18px", color: K2 }}>{c.leads}</td>
                    <td style={{ padding: "14px 18px", color: K2 }}>{c.sent}</td>
                    <td style={{ padding: "14px 18px", color: K2 }}>{c.opened}</td>
                    <td style={{ padding: "14px 18px", color: K2 }}>{c.replied}</td>
                    <td style={{ padding: "14px 18px", color: K3 }}>{c.created}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
