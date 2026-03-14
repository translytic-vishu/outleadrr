import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BG  = "#f8f8f9";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

interface Campaign {
  id: number;
  name: string;
  businessType: string;
  location: string;
  totalLeads: number;
  sent: number;
  failed: number;
  createdAt: string;
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon: JSX.Element }) {
  return (
    <div style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</div>
        <div style={{ color: color || IND, opacity: 0.6 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: color || K, letterSpacing: "-.06em", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function BarChart({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) return null;
  const MAX = Math.max(...campaigns.map(c => c.sent), 1);
  return (
    <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, padding: "22px 24px", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: K, marginBottom: 20 }}>Emails Sent per Campaign</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {campaigns.slice(0, 8).map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: K2, width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{c.name}</div>
            <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(c.sent / MAX) * 100}%`, background: `linear-gradient(90deg,${IND},#818cf8)`, borderRadius: 4, transition: "width .5s ease" }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: K2, width: 28, textAlign: "right", flexShrink: 0 }}>{c.sent}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("GET", "/api/campaigns").then(r => r.json()),
  });

  const campaigns = data?.campaigns || [];
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.totalLeads, 0);
  const delivRate = totalLeads > 0 ? Math.round((totalSent / totalLeads) * 100) : 0;

  const empty = !isLoading && campaigns.length === 0;

  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <PageIntro config={PAGE_INTROS.analytics} />

      <div style={{ padding: "28px 36px", fontFamily: F }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em", marginBottom: 4 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: K3 }}>Real performance data from your campaigns.</p>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 64 }}>
            <svg style={{ animation: "spin 1s linear infinite" }} width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={K3} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        ) : empty ? (
          <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, padding: "64px 24px", textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${IND}10`, border: `1px solid ${IND}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M3 20l5-7 5 4 5-8 5 4" stroke={IND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: K, marginBottom: 6 }}>No data yet</div>
            <div style={{ fontSize: 13, color: K3, marginBottom: 22 }}>Run your first campaign and send emails to see analytics populate here.</div>
            <button
              onClick={() => setLocation("/app")}
              style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: IND, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,.3)" }}
            >
              Create First Campaign
            </button>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard label="Campaigns Run" value={campaigns.length} icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 3 2 4-6 2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
              <StatCard label="Total Leads" value={totalLeads} icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} />
              <StatCard label="Emails Sent" value={totalSent} color="#16a34a" icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l12-6-6 12-2-5-4-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>} />
              <StatCard label="Delivery Rate" value={`${delivRate}%`} color={delivRate >= 80 ? "#16a34a" : "#ca8a04"} icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9l4 4L14 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
            </div>

            {/* Bar chart */}
            <div style={{ marginBottom: 24 }}>
              <BarChart campaigns={campaigns} />
            </div>

            {/* Campaign breakdown table */}
            <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
              <div style={{ padding: "16px 22px", borderBottom: `1px solid ${BDR}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: K }}>Campaign Breakdown</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: BG, borderBottom: `1px solid ${BDR}` }}>
                    {["Campaign", "Industry", "Leads", "Sent", "Failed", "Delivery Rate"].map(h => (
                      <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const rate = c.totalLeads > 0 ? Math.round((c.sent / c.totalLeads) * 100) : 0;
                    return (
                      <tr key={c.id} style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${BDR}` : "none" }}>
                        <td style={{ padding: "14px 20px", fontWeight: 600, color: K }}>{c.name}</td>
                        <td style={{ padding: "14px 20px", color: K3, fontSize: 12 }}>{c.businessType} · {c.location}</td>
                        <td style={{ padding: "14px 20px", color: K2, fontWeight: 600 }}>{c.totalLeads}</td>
                        <td style={{ padding: "14px 20px" }}><span style={{ fontWeight: 700, color: "#16a34a" }}>{c.sent}</span></td>
                        <td style={{ padding: "14px 20px" }}>{c.failed > 0 ? <span style={{ fontWeight: 700, color: "#dc2626" }}>{c.failed}</span> : <span style={{ color: K3 }}>0</span>}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${rate}%`, background: rate >= 80 ? "#16a34a" : "#ca8a04", borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: K2 }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
