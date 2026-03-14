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

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .row-hover:hover{background:#fafafa;}
`;

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: W, borderRadius: 14, border: `1px solid ${BDR}`,
      padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: K, letterSpacing: "-.05em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: K3, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("GET", "/api/campaigns").then(r => r.json()),
  });

  const campaigns = data?.campaigns || [];
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.totalLeads, 0);

  return (
    <AppLayout>
      <style>{CSS}</style>
      <PageIntro config={PAGE_INTROS.campaigns} />

      <div style={{ padding: "28px 36px", fontFamily: F, minHeight: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em", marginBottom: 4 }}>Campaigns</h1>
            <p style={{ fontSize: 13, color: K3 }}>Every outreach you've sent, tracked in one place.</p>
          </div>
          <button
            onClick={() => setLocation("/app")}
            style={{
              padding: "9px 20px", borderRadius: 9, border: "none",
              background: K, color: W, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: F,
              boxShadow: "0 2px 8px rgba(0,0,0,.15)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = K; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Campaign
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Campaigns" value={campaigns.length} />
          <StatCard label="Total Leads Generated" value={totalLeads} />
          <StatCard label="Emails Sent" value={totalSent} />
          <StatCard label="Avg Delivery Rate" value={campaigns.length ? `${Math.round((totalSent / Math.max(totalLeads,1)) * 100)}%` : "—"} />
        </div>

        {/* Table */}
        <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.05)" }}>
          <div style={{ padding: "16px 22px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: K }}>All Campaigns</span>
            <span style={{ fontSize: 12, color: K3 }}>{campaigns.length} total</span>
          </div>

          {isLoading ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <svg style={{ animation: "spin 1s linear infinite" }} width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${IND}10`, border: `1px solid ${IND}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 18l4-6 4 4 4-7 5 3" stroke={IND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: K, marginBottom: 6 }}>No campaigns yet</div>
              <div style={{ fontSize: 13, color: K3, marginBottom: 20 }}>Create your first campaign in the builder and send some emails to see data here.</div>
              <button
                onClick={() => setLocation("/app")}
                style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: IND, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,.3)" }}
              >
                Launch Campaign Builder
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: BG, borderBottom: `1px solid ${BDR}` }}>
                  {["Campaign", "Target", "Leads", "Sent", "Failed", "Delivery", "Date"].map(h => (
                    <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: K3, textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const delivRate = c.totalLeads > 0 ? Math.round((c.sent / c.totalLeads) * 100) : 0;
                  return (
                    <tr key={c.id} className="row-hover" style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${BDR}` : "none", transition: "background .12s" }}>
                      <td style={{ padding: "15px 20px" }}>
                        <div style={{ fontWeight: 700, color: K }}>{c.name}</div>
                      </td>
                      <td style={{ padding: "15px 20px", color: K3 }}>
                        <div style={{ fontSize: 12 }}>{c.businessType}</div>
                        <div style={{ fontSize: 11, color: K3, marginTop: 1 }}>{c.location}</div>
                      </td>
                      <td style={{ padding: "15px 20px", color: K2, fontWeight: 600 }}>{c.totalLeads}</td>
                      <td style={{ padding: "15px 20px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 6 }}>{c.sent}</span>
                      </td>
                      <td style={{ padding: "15px 20px" }}>
                        {c.failed > 0
                          ? <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 6 }}>{c.failed}</span>
                          : <span style={{ color: K3 }}>—</span>}
                      </td>
                      <td style={{ padding: "15px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden", minWidth: 60 }}>
                            <div style={{ height: "100%", width: `${delivRate}%`, background: delivRate >= 80 ? "#16a34a" : delivRate >= 50 ? "#ca8a04" : "#dc2626", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: K2, minWidth: 32 }}>{delivRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "15px 20px", color: K3, fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
