import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/lib/theme";
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
    background:rgba(255,255,255,0.035);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:18px;
    transition:border-color .25s,box-shadow .25s,transform .25s;
    cursor:default;
    position:relative;overflow:hidden;
  }
  .d-card:hover{border-color:rgba(255,255,255,0.14);box-shadow:0 12px 40px rgba(0,0,0,.5);transform:translateY(-1px);}
  .stat-num{animation:countIn .6s cubic-bezier(.16,1,.3,1) both;}
  .row-in{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both;}
  .qbtn{
    display:flex;align-items:center;gap:10px;
    padding:11px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.035);color:#a1a1aa;
    font-size:13px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .2s;text-align:left;width:100%;
  }
  .qbtn:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);color:#ededed;transform:translateX(4px);}
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
    border:1px solid rgba(255,255,255,0.08);
  }
  .kpi-card:hover{transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.5);}
  [data-theme="light"] .d-card{background:#ffffff!important;border-color:#e4e4e7!important;}
  [data-theme="light"] .d-card:hover{border-color:#d4d4d8!important;box-shadow:0 8px 28px rgba(0,0,0,.06)!important;}
  [data-theme="light"] .kpi-card{border-color:#e4e4e7!important;}
  [data-theme="light"] .kpi-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.08)!important;}
  [data-theme="light"] .qbtn{background:#f4f4f5!important;border-color:#e4e4e7!important;color:#3f3f46!important;}
  [data-theme="light"] .qbtn:hover{background:#e4e4e7!important;border-color:#d4d4d8!important;color:#09090b!important;}
  [data-theme="light"] .stat-num{color:#09090b!important;}
  [data-theme="light"] .kpi-label{color:#71717a!important;}
  [data-theme="light"] .kpi-sub{color:#a1a1aa!important;}
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
function AreaChart({ campaigns, isDark }: { campaigns: Campaign[]; isDark: boolean }) {
  const slice = campaigns.slice(-8);
  const data = slice.map(c => c.sent);
  const labels = slice.map(c => c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name);

  const gridColor  = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.14)";
  const labelColor = isDark ? "#71717a" : "#a1a1aa";
  const emptyColor = isDark ? "#52525b" : "#a1a1aa";

  if (data.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13l4-5 3 3 4-6 4 3" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ fontSize: 12, color: emptyColor, fontWeight: 500 }}>Launch your first campaign to see activity</div>
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
            <stop offset="0%" stopColor={ACC} stopOpacity={isDark ? ".22" : ".14"} />
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
            stroke={gridColor} strokeWidth="1" />
        ))}
        {/* Y labels */}
        {[0, .5, 1].map((t, i) => (
          <text key={i} x={34} y={PAD + (1 - t) * (H - PAD * 2) + 4} textAnchor="end"
            style={{ fontSize: 9, fill: labelColor, fontFamily: F }}>
            {Math.round(max * t)}
          </text>
        ))}
        <g transform="translate(40,0)">
          <path d={areaPts} fill="url(#areaG)" style={{ animation: "areaFadeIn .8s ease both .3s", opacity: 0 }} />
          <path d={`M${linePts}`} fill="none" stroke={ACC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            filter={isDark ? "url(#glow)" : undefined}
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
              style={{ fontSize: 8, fill: labelColor, fontFamily: F, fontWeight: 600 }}>
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
        <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
        {sub && <div className="kpi-sub" style={{ fontSize: 11, color: "rgba(255,255,255,.22)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}


export default function AppDashboard() {
  const [, setLocation] = useLocation();
  const { isDark } = useTheme();

  const dashBg   = isDark ? "#0a0a0a" : "#fafafa";
  const headText  = isDark ? "#ededed" : "#09090b";
  const subText   = isDark ? "#71717a" : "#71717a";
  const dateText  = isDark ? "#52525b" : "#a1a1aa";
  const cardTitle = isDark ? "#ededed" : "#09090b";
  const cardSub   = isDark ? "#71717a" : "#71717a";
  const tableHeaderColor = isDark ? "#52525b"  : "#a1a1aa";
  const tableRowText     = isDark ? "#ededed"  : "#09090b";
  const tableSubText     = isDark ? "#a1a1aa"  : "#3f3f46";
  const tableSubText2    = isDark ? "#52525b"  : "#a1a1aa";
  const tableRowBdr      = isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5";
  const tableHover       = isDark ? "rgba(255,255,255,0.025)" : "#f4f4f5";
  const gridBg           = isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.02)";
  const tableHeaderBdr   = isDark ? "rgba(255,255,255,0.05)"  : "#e4e4e7";
  const pipelineLabel    = isDark ? "#a1a1aa"  : "#3f3f46";
  const qaLabel          = isDark ? "#71717a"  : "#71717a";
  const delivBarBg       = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const topCampText      = isDark ? "#ededed"  : "#09090b";
  const topCampSub       = isDark ? "#52525b"  : "#a1a1aa";
  const emptyText        = isDark ? "#a1a1aa"  : "#3f3f46";
  const emptyText2       = isDark ? "#52525b"  : "#a1a1aa";
  const barBg            = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tableCellGray    = isDark ? "#a1a1aa"  : "#3f3f46";
  const tableNone        = isDark ? "#52525b"  : "#a1a1aa";

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

      <div style={{ flex: 1, background: dashBg, minHeight: "100vh", fontFamily: F, position: "relative", overflowX: "hidden" }}>

        {/* Ambient background orbs */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%)", top: -200, right: -150, animation: "orb1 16s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 70%)", bottom: -80, left: -100, animation: "orb2 20s ease-in-out infinite" }} />
          {/* Subtle grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${gridBg} 1px,transparent 1px),linear-gradient(90deg,${gridBg} 1px,transparent 1px)`, backgroundSize: "40px 40px" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "32px 40px 56px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, animation: "fadeUp .5s cubic-bezier(.16,1,.3,1) both" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: dateText, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                {formatDate()}
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: headText, letterSpacing: "-.05em", lineHeight: 1, marginBottom: 8 }}>
                {me?.email ? greeting(me.email) : "Dashboard"}
              </h1>
              <p style={{ fontSize: 13, color: subText }}>
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
                  <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle }}>Outreach Activity</div>
                  <div style={{ fontSize: 11, color: cardSub, marginTop: 3 }}>Emails sent per campaign</div>
                </div>
                {campaigns.length > 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACC, background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.2)", padding: "4px 10px", borderRadius: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>
                    Last {Math.min(campaigns.length, 8)}
                  </div>
                )}
              </div>
              <AreaChart campaigns={campaigns} isDark={isDark} />
            </div>

            {/* Top Campaigns */}
            <div className="d-card" style={{ padding: "24px", animation: "fadeUp .5s ease both .33s" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Top Campaigns</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 20 }}>Highest lead volume</div>

              {topCampaigns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10, textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3.5" stroke="rgba(139,92,246,0.6)" strokeWidth="1.3"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="rgba(139,92,246,0.6)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ fontSize: 12, color: emptyText2, lineHeight: 1.6 }}>Run your first campaign<br/>to see results here.</div>
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
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: topCampText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{c.name}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: col, flexShrink: 0 }}>{c.totalLeads} leads</div>
                        </div>
                        <div style={{ height: 4, background: delivBarBg, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
                        </div>
                        <div style={{ fontSize: 10, color: topCampSub, marginTop: 5 }}>{c.businessType} · {c.location}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 3: Horizontal Bar Chart (Analytics) ── */}
          {campaigns.length > 0 && (
            <div className="d-card" style={{ padding: "24px 26px", marginBottom: 14, animation: "fadeUp .5s ease both .38s" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Emails Sent per Campaign</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 20 }}>Campaign-level email delivery breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {campaigns.slice(0, 8).map((c, i) => {
                  const MAX = Math.max(...campaigns.map(x => x.sent), 1);
                  const pct = Math.max((c.sent / MAX) * 100, c.sent > 0 ? 4 : 0);
                  const delRate = c.sent + c.failed > 0 ? Math.round((c.sent / (c.sent + c.failed)) * 100) : 0;
                  const barColor = delRate >= 80 ? "#4ade80" : delRate >= 50 ? "#fbbf24" : "#f87171";
                  return (
                    <div key={c.id} className="row-in" style={{ display: "flex", alignItems: "center", gap: 14, animationDelay: `${.38 + i * .05}s` }}>
                      <div style={{ fontSize: 12, color: tableCellGray, width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{c.name}</div>
                      <div style={{ flex: 1, height: 7, background: barBg, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${ACC},${barColor})`, borderRadius: 4, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", width: 28, textAlign: "right", flexShrink: 0 }}>{c.sent}</div>
                      <div style={{ fontSize: 11, color: cardSub, width: 36, textAlign: "right", flexShrink: 0 }}>{delRate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Row 4: Full Campaigns Table ── */}
          <div className="d-card" style={{ marginBottom: 14, animation: "fadeUp .5s ease both .43s" }}>
            <div style={{ padding: "20px 26px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle }}>All Campaigns</div>
                <div style={{ fontSize: 11, color: cardSub, marginTop: 3 }}>{campaigns.length} total · complete history</div>
              </div>
              <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ padding: "9px 16px", fontSize: 12 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div style={{ padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17l5.5-7 4.5 4 5.5-8" stroke="rgba(139,92,246,.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: emptyText, marginBottom: 5 }}>No campaigns yet</div>
                  <div style={{ fontSize: 12, color: emptyText2, marginBottom: 14 }}>Generate your first batch of leads and emails in minutes.</div>
                  <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ padding: "9px 20px", fontSize: 12 }}>Start a campaign</button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${tableHeaderBdr}` }}>
                      {["Campaign", "Industry / Location", "Leads", "Sent", "Failed", "Delivery", "Date"].map(h => (
                        <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 9, fontWeight: 800, color: tableHeaderColor, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const dr = c.sent + c.failed > 0 ? Math.round((c.sent / (c.sent + c.failed)) * 100) : 0;
                      const drColor = dr >= 80 ? "#4ade80" : dr >= 50 ? "#fbbf24" : "#f87171";
                      const date = (() => { try { return new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "—"; } })();
                      return (
                        <tr key={c.id} className="row-in" style={{
                          borderBottom: i < campaigns.length - 1 ? `1px solid ${tableRowBdr}` : "none",
                          transition: "background .12s", animationDelay: `${.43 + i * .04}s`,
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = tableHover; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                        >
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: tableRowText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{c.name}</div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontSize: 12, color: tableSubText }}>{c.businessType}</div>
                            <div style={{ fontSize: 11, color: tableSubText2, marginTop: 2 }}>{c.location}</div>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700, color: tableCellGray }}>{c.totalLeads}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,.1)", padding: "2px 8px", borderRadius: 6 }}>{c.sent}</span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            {c.failed > 0
                              ? <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 8px", borderRadius: 6 }}>{c.failed}</span>
                              : <span style={{ color: tableNone, fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 64, height: 4, background: delivBarBg, borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${dr}%`, background: drColor, borderRadius: 2, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: drColor }}>{dr}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: 11, color: tableSubText2, whiteSpace: "nowrap" }}>{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Row 5: Lead Pipeline + Quick Actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, marginBottom: 14 }}>

            {/* Lead Pipeline */}
            <div className="d-card" style={{ padding: "24px 26px", animation: "fadeUp .5s ease both .48s" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Lead Pipeline</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 20 }}>Track leads through your sales stages</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "New",        color: "#8b5cf6", count: totalLeads },
                  { label: "Contacted",  color: "#3b82f6", count: campaigns.reduce((s, c) => s + c.sent, 0) },
                  { label: "Replied",    color: "#10b981", count: 0 },
                  { label: "Meeting",    color: "#f59e0b", count: 0 },
                  { label: "Closed",     color: "#4ade80", count: 0 },
                ].map(col => (
                  <div key={col.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: pipelineLabel, letterSpacing: ".05em" }}>{col.label.toUpperCase()}</span>
                    </div>
                    <div style={{ background: `${col.color}10`, border: `1.5px dashed ${col.color}30`, borderRadius: 10, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: col.color, letterSpacing: "-.04em", lineHeight: 1 }}>{col.count}</div>
                      <div style={{ fontSize: 9, color: topCampSub, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>leads</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions + Insights */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="d-card" style={{ padding: "20px", animation: "fadeUp .5s ease both .5s" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: qaLabel, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 12 }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ marginBottom: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    New Campaign
                  </button>
                  {[
                    { label: "Browse Templates", path: "/templates", icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 5h6M3.5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                    { label: "View Inbox", path: "/inbox", icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l5.5 3.5L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                  ].map(a => (
                    <button key={a.path} className="qbtn" onClick={() => setLocation(a.path)}>{a.icon}{a.label}</button>
                  ))}
                </div>
              </div>

              {campaigns.length > 0 && (
                <div className="d-card" style={{ padding: "18px 20px", animation: "fadeUp .5s ease both .55s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: qaLabel, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 12 }}>Insights</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {bestDel && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: pipelineLabel }}>Best delivery</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{bestDel.sent + bestDel.failed > 0 ? Math.round((bestDel.sent / (bestDel.sent + bestDel.failed)) * 100) : 0}%</div>
                      </div>
                    )}
                    {mostLeads && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: pipelineLabel }}>Most leads</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>{mostLeads.totalLeads}</div>
                      </div>
                    )}
                    {latest && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: pipelineLabel }}>Latest sent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{latest.sent}</div>
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
