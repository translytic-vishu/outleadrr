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
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes countIn{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes lineDrawAnim{from{stroke-dashoffset:800}to{stroke-dashoffset:0}}
  @keyframes areaFadeIn{0%{opacity:0}100%{opacity:1}}
  @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-32px)}}
  @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-36px,28px)}}
  @keyframes shimmerSlide{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes barGrow{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1);transform-origin:bottom}}
  @keyframes pulseRing{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
  .d-card{
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:18px;
    transition:border-color .25s,box-shadow .25s,transform .25s;
    cursor:default;
    position:relative;overflow:hidden;
  }
  .d-card:hover{border-color:rgba(255,255,255,0.13);box-shadow:0 12px 40px rgba(0,0,0,.5);transform:translateY(-1px);}
  .stat-num{animation:countIn .6s cubic-bezier(.16,1,.3,1) both;}
  .row-in{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both;}
  .qbtn{
    display:flex;align-items:center;gap:10px;
    padding:11px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);color:rgba(255,255,255,.65);
    font-size:13px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .2s;text-align:left;width:100%;
  }
  .qbtn:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);color:#fff;transform:translateX(4px);}
  .qbtn-primary{
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:12px 18px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;
    font-size:13px;font-weight:700;font-family:${F};
    cursor:pointer;transition:all .2s;
    box-shadow:0 4px 20px rgba(139,92,246,.35);
    position:relative;overflow:hidden;
  }
  .qbtn-primary::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);background-size:200%;animation:shimmerSlide 3s ease infinite;}
  .qbtn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(139,92,246,.5);}
  .kpi-card{
    border-radius:18px;padding:22px 24px;
    position:relative;overflow:hidden;
    transition:transform .25s,box-shadow .25s;
    border:1px solid rgba(255,255,255,0.06);
  }
  .kpi-card:hover{transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.5);}
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

/* ── Mini bar sparkline ── */
function MiniBar({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 5, borderRadius: 3,
          height: `${Math.max((v / max) * 100, 8)}%`,
          background: color,
          opacity: i === values.length - 1 ? 1 : 0.4 + (i / values.length) * 0.5,
          animation: `barGrow .5s cubic-bezier(.16,1,.3,1) both`,
          animationDelay: `${0.4 + i * 0.05}s`,
        }} />
      ))}
    </div>
  );
}

/* ── Area chart ── */
function AreaChart({ campaigns }: { campaigns: Campaign[] }) {
  const slice = campaigns.slice(-8);
  const data = slice.map(c => c.sent);
  const labels = slice.map(c => c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name);

  if (data.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13l4-5 3 3 4-6 4 3" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)", fontWeight: 500 }}>Launch your first campaign to see activity</div>
    </div>
  );

  const W = 500, H = 150, PAD = 6;
  const max = Math.max(...data, 1);
  const xs = data.map((_, i) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2));
  const ys = data.map(v => PAD + (1 - v / max) * (H - PAD * 2));
  const linePts = xs.map((x, i) => `${x},${ys[i]}`).join(" L");
  const areaPts = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(" L") + ` L${xs[xs.length - 1]},${H} Z`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W + 40} ${H + 30}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACC} stopOpacity=".22" />
            <stop offset="85%" stopColor={ACC} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Grid lines */}
        {[0, .33, .66, 1].map((t, i) => (
          <line key={i} x1={40} y1={PAD + t * (H - PAD * 2)} x2={W + 40} y2={PAD + t * (H - PAD * 2)}
            stroke="rgba(255,255,255,.04)" strokeWidth="1" />
        ))}
        {/* Y labels */}
        {[0, .5, 1].map((t, i) => (
          <text key={i} x={34} y={PAD + (1 - t) * (H - PAD * 2) + 4} textAnchor="end"
            style={{ fontSize: 9, fill: "rgba(255,255,255,.2)", fontFamily: F }}>
            {Math.round(max * t)}
          </text>
        ))}
        <g transform="translate(40,0)">
          <path d={areaPts} fill="url(#areaG)" style={{ animation: "areaFadeIn .8s ease both .3s", opacity: 0 }} />
          <path d={`M${linePts}`} fill="none" stroke={ACC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow)"
            strokeDasharray="800" style={{ animation: "lineDrawAnim 1.6s cubic-bezier(.16,1,.3,1) both .1s" }} />
          {xs.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={ys[i]} r="4" fill={ACC} opacity=".3"
                style={{ animation: `countIn .3s ease both ${.5 + i * .1}s`, opacity: 0 }} />
              <circle cx={x} cy={ys[i]} r="2.5" fill={ACC}
                style={{ animation: `countIn .3s ease both ${.5 + i * .1}s`, opacity: 0 }} />
            </g>
          ))}
          {xs.map((x, i) => (
            <text key={i} x={x} y={H + 20} textAnchor="middle"
              style={{ fontSize: 8, fill: "rgba(255,255,255,.22)", fontFamily: F, fontWeight: 600 }}>
              {labels[i]}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ── KPI Card — premium style ── */
function KPICard({ label, value, sub, icon, bg, accent, sparkValues, delay = 0 }:
  { label: string; value: string | number; sub?: string; icon: React.ReactNode; bg: string; accent: string; sparkValues?: number[]; delay?: number }) {
  return (
    <div className="kpi-card" style={{ background: bg, borderRadius: 18, padding: "22px 24px", position: "relative", overflow: "hidden", transition: "transform .25s,box-shadow .25s", border: "1px solid rgba(255,255,255,0.06)", animation: `fadeUp .5s cubic-bezier(.16,1,.3,1) both ${delay}s` }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${accent}30 0%,transparent 70%)`, top: -30, right: -20, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}1a`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
            {icon}
          </div>
          {sparkValues && sparkValues.length > 1 && <MiniBar values={sparkValues} color={accent} />}
        </div>
        <div className="stat-num" style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-.06em", lineHeight: 1, marginBottom: 6, animationDelay: `${delay + .1}s` }}>
          {value}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,.22)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Delivery bar ── */
function DeliveryBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 28 }}>{pct}%</span>
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
  const totalSent   = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalLeads  = campaigns.reduce((s, c) => s + c.totalLeads, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.failed, 0);
  const deliveryRate = totalSent + totalFailed > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0;

  const sentSpark  = campaigns.slice(-7).map(c => c.sent);
  const leadsSpark = campaigns.slice(-7).map(c => c.totalLeads);

  const latest     = campaigns.length > 0 ? [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
  const mostLeads  = campaigns.length > 0 ? campaigns.reduce((best, c) => c.totalLeads > best.totalLeads ? c : best) : null;
  const bestDel    = campaigns.length > 0 ? campaigns.reduce((best, c) => {
    const r = c.sent + c.failed > 0 ? c.sent / (c.sent + c.failed) : 0;
    const br = best.sent + best.failed > 0 ? best.sent / (best.sent + best.failed) : 0;
    return r > br ? c : best;
  }) : null;

  const topCampaigns = [...campaigns].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 3);

  return (
    <AppLayout>
      <style>{CSS}</style>

      <div style={{ flex: 1, background: "#0a0a0c", minHeight: "100vh", fontFamily: F, position: "relative", overflowX: "hidden" }}>

        {/* Ambient background orbs */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%)", top: -200, right: -150, animation: "orb1 16s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 70%)", bottom: -80, left: -100, animation: "orb2 20s ease-in-out infinite" }} />
          {/* Subtle grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "32px 40px 56px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, animation: "fadeUp .5s cubic-bezier(.16,1,.3,1) both" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.2)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                {formatDate()}
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-.05em", lineHeight: 1, marginBottom: 8 }}>
                {me?.email ? greeting(me.email) : "Dashboard"}
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.32)" }}>
                {campaigns.length === 0
                  ? "Ready to launch your first outreach campaign."
                  : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} · ${totalSent} email${totalSent !== 1 ? "s" : ""} sent`}
              </p>
            </div>
            <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ flexShrink: 0, padding: "12px 22px" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Campaign
            </button>
          </div>

          {/* ── KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <KPICard
              label="Campaigns" value={isLoading ? "—" : campaigns.length}
              sub="total run"
              icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 13l4-5 3.5 3 5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              bg="linear-gradient(135deg,rgba(139,92,246,0.14) 0%,rgba(10,10,12,0) 100%)"
              accent="#8b5cf6" delay={0.05}
            />
            <KPICard
              label="Emails Sent" value={isLoading ? "—" : totalSent}
              sub="across all campaigns"
              sparkValues={sentSpark}
              icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M15 2L2 7l6 3 3 6L15 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              bg="linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(10,10,12,0) 100%)"
              accent="#10b981" delay={0.1}
            />
            <KPICard
              label="Leads Found" value={isLoading ? "—" : totalLeads}
              sub="from Google Maps"
              sparkValues={leadsSpark}
              icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              bg="linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(10,10,12,0) 100%)"
              accent="#f59e0b" delay={0.15}
            />
            <KPICard
              label="Delivery Rate" value={isLoading ? "—" : `${deliveryRate}%`}
              sub={totalSent + totalFailed > 0 ? `${totalFailed} failed` : "no sends yet"}
              icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 9.5l4.5 4.5 8.5-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              bg={deliveryRate >= 80
                ? "linear-gradient(135deg,rgba(74,222,128,0.12) 0%,rgba(10,10,12,0) 100%)"
                : "linear-gradient(135deg,rgba(251,191,36,0.12) 0%,rgba(10,10,12,0) 100%)"}
              accent={deliveryRate >= 80 ? "#4ade80" : "#fbbf24"} delay={0.2}
            />
          </div>

          {/* ── Row 2: Area Chart + Top Campaigns ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14, marginBottom: 14 }}>

            {/* Activity Chart */}
            <div className="d-card" style={{ padding: "24px 26px", animation: "fadeUp .5s ease both .28s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>Outreach Activity</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginTop: 3 }}>Emails sent per campaign</div>
                </div>
                {campaigns.length > 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACC, background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.2)", padding: "4px 10px", borderRadius: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>
                    Last {Math.min(campaigns.length, 8)}
                  </div>
                )}
              </div>
              <AreaChart campaigns={campaigns} />
            </div>

            {/* Top Campaigns */}
            <div className="d-card" style={{ padding: "24px", animation: "fadeUp .5s ease both .33s" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.85)", marginBottom: 4 }}>Top Campaigns</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", marginBottom: 20 }}>Highest lead volume</div>

              {topCampaigns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10, textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3.5" stroke="rgba(139,92,246,0.6)" strokeWidth="1.3"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="rgba(139,92,246,0.6)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)", lineHeight: 1.6 }}>Run your first campaign<br/>to see results here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {topCampaigns.map((c, i) => {
                    const pct = c.totalLeads > 0 ? Math.min(Math.round((c.totalLeads / Math.max(...campaigns.map(x => x.totalLeads), 1)) * 100), 100) : 0;
                    const colors = ["#4ade80", ACC, "#f59e0b"];
                    const col = colors[i] || ACC;
                    return (
                      <div key={c.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,.78)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{c.name}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: col, flexShrink: 0 }}>{c.totalLeads} leads</div>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 5 }}>{c.businessType} · {c.location}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 3: Recent Campaigns + Quick Actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14, marginBottom: 14 }}>

            {/* Recent Campaigns */}
            <div className="d-card" style={{ padding: "24px 26px", animation: "fadeUp .5s ease both .38s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>Recent Campaigns</div>
                {campaigns.length > 0 && (
                  <button onClick={() => setLocation("/campaigns")} style={{ fontSize: 11, fontWeight: 600, color: ACC, background: "none", border: "none", cursor: "pointer", fontFamily: F, padding: 0, letterSpacing: ".02em" }}>
                    View all →
                  </button>
                )}
              </div>

              {campaigns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17l5.5-7 4.5 4 5.5-8" stroke="rgba(139,92,246,.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.45)", marginBottom: 5 }}>No campaigns yet</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)", marginBottom: 14 }}>Generate your first batch of leads and emails in minutes.</div>
                    <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ padding: "9px 20px", fontSize: 12 }}>Start a campaign</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 60px 110px", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.05)", marginBottom: 4 }}>
                    {["CAMPAIGN", "TYPE", "LEADS", "SENT", "DELIVERY"].map(h => (
                      <div key={h} style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.2)", letterSpacing: ".1em" }}>{h}</div>
                    ))}
                  </div>
                  {campaigns.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="row-in" style={{
                      display: "grid", gridTemplateColumns: "1fr 100px 60px 60px 110px", gap: 10,
                      padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
                      alignItems: "center", animationDelay: `${.38 + i * .06}s`,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.8)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.27)" }}>{c.location}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.businessType}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>{c.totalLeads}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{c.sent}</div>
                      <DeliveryBar sent={c.sent} total={c.sent + c.failed} />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Quick Actions + Insights */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Quick Actions */}
              <div className="d-card" style={{ padding: "22px", animation: "fadeUp .5s ease both .43s" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 14 }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ marginBottom: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    New Campaign
                  </button>
                  {[
                    { label: "Browse Templates", path: "/templates", icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 5h6M3.5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                    { label: "View Inbox",       path: "/inbox",     icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l5.5 3.5L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                    { label: "Analytics",       path: "/analytics", icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 9.5l3-3 2.5 2 3.5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  ].map(a => (
                    <button key={a.path} className="qbtn" onClick={() => setLocation(a.path)}>
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini insights */}
              {campaigns.length > 0 && (
                <div className="d-card" style={{ padding: "18px 20px", animation: "fadeUp .5s ease both .5s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 14 }}>Insights</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {bestDel && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>Best delivery</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
                          {bestDel.sent + bestDel.failed > 0 ? Math.round((bestDel.sent / (bestDel.sent + bestDel.failed)) * 100) : 0}%
                        </div>
                      </div>
                    )}
                    {mostLeads && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>Most leads</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", flexShrink: 0 }}>{mostLeads.totalLeads}</div>
                      </div>
                    )}
                    {latest && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>Latest sent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", flexShrink: 0 }}>{latest.sent}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
