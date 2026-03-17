import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import type { MeResponse } from "@shared/schema";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";
const ACC = "#8b5cf6";

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

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes countIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  @keyframes lineDrawAnim{from{stroke-dashoffset:600}to{stroke-dashoffset:0}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 18px rgba(139,92,246,.25)}50%{box-shadow:0 0 36px rgba(139,92,246,.55)}}
  @keyframes areaFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin-slow{to{transform:rotate(360deg)}}
  @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(40px,-32px) scale(1.08)}70%{transform:translate(-24px,20px) scale(.93)}}
  @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-36px,28px) scale(1.06)}65%{transform:translate(30px,-22px) scale(.95)}}
  .d-card{
    background:rgba(255,255,255,0.035);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:16px;
    transition:border-color .2s,box-shadow .2s;
    cursor:default;
  }
  .d-card:hover{border-color:rgba(255,255,255,0.12);box-shadow:0 8px 32px rgba(0,0,0,.35);}
  .stat-val{animation:countIn .5s cubic-bezier(.16,1,.3,1) both;}
  .row-in{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both;}
  .qbtn{
    display:flex;align-items:center;gap:10px;
    padding:12px 16px;border-radius:11px;border:1px solid rgba(255,255,255,.09);
    background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);
    font-size:13px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .15s;text-align:left;width:100%;
  }
  .qbtn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#fff;transform:translateX(3px);}
  .qbtn-primary{
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:12px 16px;border-radius:11px;border:none;
    background:${ACC};color:#fff;
    font-size:13px;font-weight:700;font-family:${F};
    cursor:pointer;transition:all .15s;
    box-shadow:0 4px 16px rgba(139,92,246,.35);
  }
  .qbtn-primary:hover{background:#7c3aed;transform:translateY(-1px);box-shadow:0 8px 24px rgba(139,92,246,.5);}
`;

function greeting(email: string) {
  const h = new Date().getHours();
  const name = email.split("@")[0];
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ── Sparkline ── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 72, H = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H * 0.85 - 2}`);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: "visible" }}>
      <path d={"M" + pts.join(" L")} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="600" style={{ animation: "lineDrawAnim 1.2s ease both .3s" }} />
    </svg>
  );
}

/* ── Area Chart ── */
function AreaChart({ campaigns }: { campaigns: Campaign[] }) {
  const slice = campaigns.slice(-8);
  const data = slice.map(c => c.sent);
  const labels = slice.map(c => c.name.length > 10 ? c.name.slice(0, 10) + "…" : c.name);
  if (data.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 10 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M4 26l8-10 8 6 10-14" stroke="rgba(255,255,255,.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.22)", fontWeight: 500 }}>No campaign data yet</div>
    </div>
  );
  const W = 520, H = 160, PAD = 8;
  const yLabels = [0, 25, 50, 75, 100].map(pct => Math.round((Math.max(...data, 1) * pct) / 100));
  const max = Math.max(...data, 1);
  const xs = data.map((_, i) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2));
  const ys = data.map(v => PAD + (1 - v / max) * (H - PAD * 2));
  const linePts = xs.map((x, i) => `${x},${ys[i]}`).join(" L");
  const areaPts = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(" L") + ` L${xs[xs.length - 1]},${H} Z`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W + 36} ${H + 28}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACC} stopOpacity=".15" />
            <stop offset="100%" stopColor={ACC} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y labels */}
        {[0, .25, .5, .75, 1].map((t, i) => (
          <g key={i}>
            <line x1={36} y1={PAD + t * (H - PAD * 2)} x2={W + 36} y2={PAD + t * (H - PAD * 2)}
              stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            <text x={32} y={PAD + t * (H - PAD * 2) + 3} textAnchor="end"
              style={{ fontSize: 8, fill: "rgba(255,255,255,.22)", fontFamily: F }}>
              {yLabels[4 - i]}
            </text>
          </g>
        ))}
        <g transform="translate(36,0)">
          <path d={areaPts} fill="url(#areaGrad2)" style={{ animation: "areaFadeIn .8s ease both .4s", opacity: 0 }} />
          <path d={`M${linePts}`} fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="600" style={{ animation: "lineDrawAnim 1.4s cubic-bezier(.16,1,.3,1) both .2s" }} />
          {xs.map((x, i) => (
            <circle key={i} cx={x} cy={ys[i]} r="3.5" fill={ACC}
              style={{ animation: `countIn .3s ease both ${.4 + i * .08}s`, opacity: 0 }} />
          ))}
          {xs.map((x, i) => (
            <text key={i} x={x} y={H + 18} textAnchor="middle"
              style={{ fontSize: 8, fill: "rgba(255,255,255,.22)", fontFamily: F, fontWeight: 600 }}>
              {labels[i]}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, color, sparkValues, delay = 0 }:
  { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; sparkValues?: number[]; delay?: number }) {
  return (
    <div className="d-card" style={{ padding: "22px 24px", animation: `fadeUp .5s cubic-bezier(.16,1,.3,1) both ${delay}s` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
        {sparkValues && <Sparkline values={sparkValues} color={color} />}
      </div>
      <div className="stat-val" style={{ fontSize: 30, fontWeight: 900, color: "rgba(255,255,255,.92)", letterSpacing: "-.05em", lineHeight: 1, marginBottom: 5, animationDelay: `${delay + .1}s` }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.32)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: sub ? 4 : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>{sub}</div>}
    </div>
  );
}

/* ── Delivery Bar ── */
function DeliveryBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .6s ease" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

/* ── Score Bar (for Top Leads) ── */
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(score, 100)}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 22 }}>{score}</span>
    </div>
  );
}

export default function AppDashboard() {
  const [, setLocation] = useLocation();

  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()),
    retry: false,
  });

  const { data: campaignsData, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("GET", "/api/campaigns").then(r => r.json()),
  });

  const campaigns = campaignsData?.campaigns || [];
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.totalLeads, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.failed, 0);
  const deliveryRate = totalSent + totalFailed > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0;
  const sentSpark = campaigns.slice(-7).map(c => c.sent);

  // Performance insight data
  const bestDelivery = campaigns.length > 0 ? campaigns.reduce((best, c) => {
    const r = c.sent + c.failed > 0 ? c.sent / (c.sent + c.failed) : 0;
    const bestR = best.sent + best.failed > 0 ? best.sent / (best.sent + best.failed) : 0;
    return r > bestR ? c : best;
  }) : null;
  const mostLeads = campaigns.length > 0 ? campaigns.reduce((best, c) => c.totalLeads > best.totalLeads ? c : best) : null;
  const latest = campaigns.length > 0 ? [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

  // Top leads mock from campaigns (top 3 by leads)
  const topLeadCampaigns = [...campaigns].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 3);

  return (
    <AppLayout>
      <style>{CSS}</style>

      <div style={{ flex: 1, background: "#0a0a0c", minHeight: "100vh", position: "relative", overflow: "hidden", fontFamily: F }}>

        {/* Ambient orbs */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", top: -150, right: -100, animation: "orb1 14s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)", bottom: -100, left: -80, animation: "orb2 18s ease-in-out infinite" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "32px 36px 48px", maxWidth: 1100 }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 32, animation: "fadeUp .5s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                  {formatDate()}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,.92)", letterSpacing: "-.04em", lineHeight: 1.1 }}>
                  {me?.email ? greeting(me.email) : "Dashboard"}
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.32)", marginTop: 6 }}>
                  {campaigns.length === 0
                    ? "Ready to launch your first campaign."
                    : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} · ${totalSent} emails sent`}
                </p>
              </div>
              <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                New Campaign
              </button>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            <StatCard
              label="Total Campaigns" value={isLoading ? "—" : campaigns.length} sub="total run"
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4.5 3 2.5 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              color={ACC} delay={0.05}
            />
            <StatCard
              label="Total Emails Sent" value={isLoading ? "—" : totalSent} sub="across all campaigns"
              sparkValues={sentSpark}
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 6.5l5 2.5 2.5 5L14 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              color="#10b981" delay={0.1}
            />
            <StatCard
              label="Total Leads Found" value={isLoading ? "—" : totalLeads} sub="from Google Maps"
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
              color="#f59e0b" delay={0.15}
            />
            <StatCard
              label="Delivery Rate" value={isLoading ? "—" : `${deliveryRate}%`} sub={totalSent + totalFailed > 0 ? `${totalFailed} failed` : "no sends yet"}
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              color={deliveryRate >= 80 ? "#4ade80" : "#facc15"} delay={0.2}
            />
          </div>

          {/* ── Middle Row: Chart + Top Leads ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 14 }}>

            {/* Outreach Activity chart */}
            <div className="d-card" style={{ padding: "22px 24px", animation: "fadeUp .5s ease both .25s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.82)" }}>Outreach Activity</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 3 }}>Emails sent per campaign</div>
                </div>
                {campaigns.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: ACC, background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.2)", padding: "4px 10px", borderRadius: 7 }}>
                    Last {Math.min(campaigns.length, 8)}
                  </div>
                )}
              </div>
              <AreaChart campaigns={campaigns} />
            </div>

            {/* Top Leads */}
            <div className="d-card" style={{ padding: "22px 24px", animation: "fadeUp .5s ease both .3s" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.82)", marginBottom: 4 }}>Top Leads</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginBottom: 18 }}>Highest lead volume campaigns</div>
              {topLeadCampaigns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10, textAlign: "center" }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="12" r="5" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" /><path d="M6 27c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Run your first campaign to see leads here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {topLeadCampaigns.map((c, i) => {
                    const score = c.totalLeads > 0 ? Math.min(Math.round((c.totalLeads / Math.max(...campaigns.map(x => x.totalLeads), 1)) * 100), 100) : 0;
                    const colors = ["#4ade80", ACC, "#f59e0b"];
                    return (
                      <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", flexShrink: 0 }}>{c.location}</div>
                        </div>
                        <ScoreBar score={score} color={colors[i] || ACC} />
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>{c.totalLeads} leads · {c.businessType}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Second Middle Row: Recent Campaigns + Quick Actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, marginBottom: 14 }}>

            {/* Recent Campaigns table */}
            <div className="d-card" style={{ padding: "22px 24px", animation: "fadeUp .5s ease both .35s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.82)" }}>Recent Campaigns</div>
                {campaigns.length > 0 && (
                  <button onClick={() => setLocation("/campaigns")} style={{ fontSize: 11, fontWeight: 600, color: ACC, background: "none", border: "none", cursor: "pointer", fontFamily: F, padding: 0 }}>
                    View all →
                  </button>
                )}
              </div>

              {campaigns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4.5-6 4 3.5 5.5-8" stroke={ACC} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.4)", textAlign: "center" }}>No campaigns yet</div>
                  <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ padding: "9px 18px" }}>Start a campaign</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 70px 110px", gap: 12, padding: "0 0 10px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 8 }}>
                    {["CAMPAIGN", "BUSINESS TYPE", "LEADS", "SENT", "DELIVERY"].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)", letterSpacing: ".07em" }}>{h}</div>
                    ))}
                  </div>
                  {campaigns.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="row-in" style={{
                      display: "grid", gridTemplateColumns: "1fr 90px 70px 70px 110px", gap: 12,
                      padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
                      alignItems: "center", animationDelay: `${.35 + i * .06}s`,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.78)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>{c.location}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.businessType}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.55)" }}>{c.totalLeads}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{c.sent}</div>
                      <DeliveryBar sent={c.sent} total={c.sent + c.failed} />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="d-card" style={{ padding: "22px 24px", animation: "fadeUp .5s ease both .4s" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)", marginBottom: 16, letterSpacing: "-.01em" }}>Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ marginBottom: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  + New Campaign
                </button>
                <button className="qbtn" onClick={() => setLocation("/templates")}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M4 5h6M4 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  Browse Templates
                </button>
                <button className="qbtn" onClick={() => setLocation("/inbox")}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 5l5.5 3.5L12.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  View Inbox
                </button>
                <button className="qbtn" onClick={() => setLocation("/analytics")}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l3-3.5 2.5 2 3.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Analytics
                </button>
              </div>
            </div>
          </div>

          {/* ── Performance Insights ── */}
          <div style={{ animation: "fadeUp .5s ease both .45s" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.45)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 12 }}>Performance Insights</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>

              {/* Best Delivery Rate */}
              <div className="d-card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 8l3.5 3.5 6.5-7" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: ".07em", textTransform: "uppercase" }}>Best Delivery Rate</div>
                </div>
                {bestDelivery ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80", letterSpacing: "-.04em", marginBottom: 4 }}>
                      {bestDelivery.sent + bestDelivery.failed > 0 ? Math.round((bestDelivery.sent / (bestDelivery.sent + bestDelivery.failed)) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.65)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bestDelivery.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>{bestDelivery.sent} sent · {bestDelivery.failed} failed</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)" }}>No data yet</div>
                )}
              </div>

              {/* Most Leads Found */}
              <div className="d-card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="#fbbf24" strokeWidth="1.4" /><path d="M10 10l2.5 2.5" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: ".07em", textTransform: "uppercase" }}>Most Leads Found</div>
                </div>
                {mostLeads ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fbbf24", letterSpacing: "-.04em", marginBottom: 4 }}>{mostLeads.totalLeads}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.65)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mostLeads.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>{mostLeads.businessType} · {mostLeads.location}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)" }}>No data yet</div>
                )}
              </div>

              {/* Latest Campaign */}
              <div className="d-card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `rgba(139,92,246,.12)`, border: `1px solid rgba(139,92,246,.22)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={ACC} strokeWidth="1.4" /><path d="M7 4v3.5l2 2" stroke={ACC} strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: ".07em", textTransform: "uppercase" }}>Latest Campaign</div>
                </div>
                {latest ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,.85)", letterSpacing: "-.03em", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latest.name}</div>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: ACC, letterSpacing: "-.04em" }}>{latest.totalLeads}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>leads</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981", letterSpacing: "-.04em" }}>{latest.sent}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>sent</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,.5)", letterSpacing: "-.04em" }}>{latest.failed}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>failed</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)" }}>No campaigns yet</div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
