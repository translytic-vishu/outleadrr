import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import type { MeResponse } from "@shared/schema";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
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

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes dash-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(40px,-32px) scale(1.1)} 70%{transform:translate(-24px,20px) scale(.93)} }
  @keyframes dash-orb2 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-36px,28px) scale(1.08)} 65%{transform:translate(30px,-22px) scale(.95)} }
  @keyframes dash-orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,24px) scale(1.05)} }
  @keyframes fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes count-in  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
  @keyframes line-draw { from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
  @keyframes area-fade { from{opacity:0} to{opacity:1} }
  .dash-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:16px; }
  .dash-card:hover { border-color:rgba(255,255,255,.13); background:rgba(255,255,255,.055); }
  .dash-transition { transition: background .18s, border-color .18s; }
  .stat-val { animation: count-in .5s cubic-bezier(.16,1,.3,1) both; }
  .row-anim { animation: fade-up .4s cubic-bezier(.16,1,.3,1) both; }
  .quick-btn {
    display:flex;align-items:center;gap:10px;
    padding:12px 16px;border-radius:11px;border:1px solid rgba(255,255,255,.09);
    background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);
    font-size:13px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .15s;text-align:left;width:100%;
  }
  .quick-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#fff;transform:translateX(3px);}
  .quick-btn-primary {
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:12px 16px;border-radius:11px;border:none;
    background:${IND};color:#fff;
    font-size:13px;font-weight:700;font-family:${F};
    cursor:pointer;transition:all .15s;
    box-shadow:0 4px 16px rgba(99,102,241,.35);
  }
  .quick-btn-primary:hover{background:#4f46e5;transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,.45);}
`;

function greeting(email: string) {
  const h = new Date().getHours();
  const name = email.split("@")[0];
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
}

/* ── Mini sparkline SVG ────────────────────────────────────────── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 72, H = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * H * 0.85 - 2;
    return `${x},${y}`;
  });
  const d = "M" + pts.join(" L");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow:"visible" }}>
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="600" style={{ animation:"line-draw 1.2s ease both .3s" }} />
    </svg>
  );
}

/* ── Area line chart ───────────────────────────────────────────── */
function AreaChart({ campaigns }: { campaigns: Campaign[] }) {
  const data = campaigns.slice(-8).map(c => c.sent);
  const labels = campaigns.slice(-8).map(c => c.name.length > 10 ? c.name.slice(0,10)+"…" : c.name);
  if (data.length === 0) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:180,gap:10 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M4 26l8-10 8 6 10-14" stroke="rgba(255,255,255,.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <div style={{ fontSize:13,color:"rgba(255,255,255,.22)",fontWeight:500 }}>No campaign data yet</div>
    </div>
  );
  const W = 520, H = 160, PAD = 8;
  const max = Math.max(...data, 1);
  const xs = data.map((_, i) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2));
  const ys = data.map(v => PAD + (1 - v / max) * (H - PAD * 2));
  const linePts = xs.map((x, i) => `${x},${ys[i]}`).join(" L");
  const areaPts = `M${xs[0]},${H} L` + xs.map((x, i) => `${x},${ys[i]}`).join(" L") + ` L${xs[xs.length-1]},${H} Z`;

  return (
    <div style={{ width:"100%",overflow:"hidden" }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width:"100%",height:"auto",display:"block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={IND} stopOpacity=".25"/>
            <stop offset="100%" stopColor={IND} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        {[0,.25,.5,.75,1].map((t, i) => (
          <line key={i} x1={PAD} y1={PAD + t * (H - PAD*2)} x2={W-PAD} y2={PAD + t * (H - PAD*2)}
            stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        ))}
        {/* Area fill */}
        <path d={areaPts} fill="url(#areaGrad)" style={{ animation:"area-fade .8s ease both .4s",opacity:0 }} />
        {/* Line */}
        <path d={`M${linePts}`} fill="none" stroke={IND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="600" style={{ animation:"line-draw 1.4s cubic-bezier(.16,1,.3,1) both .2s" }} />
        {/* Dots */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="3.5" fill={IND}
            style={{ animation:`count-in .3s ease both ${.4 + i*.08}s`,opacity:0 }} />
        ))}
        {/* X labels */}
        {xs.map((x, i) => (
          <text key={i} x={x} y={H + 18} textAnchor="middle"
            style={{ fontSize:8,fill:"rgba(255,255,255,.22)",fontFamily:F,fontWeight:600 }}>
            {labels[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, sparkValues, delay = 0 }:
  { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; sparkValues?: number[]; delay?: number }) {
  return (
    <div className="dash-card dash-transition" style={{ padding:"22px 24px",animation:`fade-up .5s cubic-bezier(.16,1,.3,1) both ${delay}s` }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
        <div style={{ width:34,height:34,borderRadius:9,background:`${color}18`,border:`1px solid ${color}28`,display:"flex",alignItems:"center",justifyContent:"center",color }}>
          {icon}
        </div>
        {sparkValues && <Sparkline values={sparkValues} color={color} />}
      </div>
      <div className="stat-val" style={{ fontSize:30,fontWeight:900,color:"rgba(255,255,255,.92)",letterSpacing:"-.05em",lineHeight:1,marginBottom:5,animationDelay:`${delay+.1}s` }}>
        {value}
      </div>
      <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.32)",textTransform:"uppercase",letterSpacing:".07em",marginBottom: sub ? 4 : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize:11,color:"rgba(255,255,255,.25)" }}>{sub}</div>}
    </div>
  );
}

/* ── Delivery mini-bar ─────────────────────────────────────────── */
function DeliveryBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ flex:1,height:4,background:"rgba(255,255,255,.07)",borderRadius:99,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width .6s ease" }} />
      </div>
      <span style={{ fontSize:10,fontWeight:700,color,minWidth:28 }}>{pct}%</span>
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
  const totalSent    = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalLeads   = campaigns.reduce((s, c) => s + c.totalLeads, 0);
  const totalFailed  = campaigns.reduce((s, c) => s + c.failed, 0);
  const deliveryRate = totalSent + totalFailed > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0;
  const sentSpark    = campaigns.slice(-7).map(c => c.sent);

  return (
    <AppLayout>
      <style>{CSS}</style>

      {/* Dark background with orbs */}
      <div style={{ flex:1,background:"#09090d",minHeight:"100vh",position:"relative",overflow:"hidden",fontFamily:F }}>

        {/* Ambient orbs */}
        <div aria-hidden style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:0 }}>
          <div style={{ position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)",top:-150,right:-100,animation:"dash-orb1 14s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 70%)",bottom:-100,left:-80,animation:"dash-orb2 18s ease-in-out infinite" }} />
          <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 70%)",top:"45%",left:"40%",animation:"dash-orb3 22s ease-in-out infinite" }} />
        </div>

        <div style={{ position:"relative",zIndex:1,padding:"32px 36px",maxWidth:1100 }}>

          {/* Header */}
          <div style={{ marginBottom:32,animation:"fade-up .5s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8 }}>
                  {formatDate()}
                </div>
                <h1 style={{ fontSize:28,fontWeight:800,color:"rgba(255,255,255,.92)",letterSpacing:"-.04em",lineHeight:1.1 }}>
                  {me?.email ? greeting(me.email) : "Dashboard"}
                </h1>
                <p style={{ fontSize:13,color:"rgba(255,255,255,.32)",marginTop:6 }}>
                  {campaigns.length === 0 ? "Ready to launch your first campaign." : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} · ${totalSent} emails sent`}
                </p>
              </div>
              <button className="quick-btn-primary" onClick={() => setLocation("/app")} style={{ flexShrink:0 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                New Campaign
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
            <StatCard
              label="Campaigns" value={isLoading ? "—" : campaigns.length} sub="total run"
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4.5 3 2.5 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              color={IND} delay={0.05}
            />
            <StatCard
              label="Emails Sent" value={isLoading ? "—" : totalSent} sub="across all campaigns"
              sparkValues={sentSpark}
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 6.5l5 2.5 2.5 5L14 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              color="#10b981" delay={0.1}
            />
            <StatCard
              label="Leads Found" value={isLoading ? "—" : totalLeads} sub="from Google Maps"
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
              color="#f59e0b" delay={0.15}
            />
            <StatCard
              label="Delivery Rate" value={isLoading ? "—" : `${deliveryRate}%`} sub={totalSent + totalFailed > 0 ? `${totalFailed} failed` : "no sends yet"}
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              color={deliveryRate >= 80 ? "#4ade80" : "#facc15"} delay={0.2}
            />
          </div>

          {/* Chart + right col */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:14,marginBottom:14 }}>

            {/* Area chart */}
            <div className="dash-card dash-transition" style={{ padding:"22px 24px",animation:"fade-up .5s ease both .25s" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:"rgba(255,255,255,.82)" }}>Outreach Activity</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,.28)",marginTop:3 }}>Emails sent per campaign</div>
                </div>
                {campaigns.length > 0 && (
                  <div style={{ fontSize:11,fontWeight:600,color:IND,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",padding:"4px 10px",borderRadius:7 }}>
                    Last {Math.min(campaigns.length, 8)}
                  </div>
                )}
              </div>
              <AreaChart campaigns={campaigns} />
            </div>

            {/* Quick actions */}
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div className="dash-card dash-transition" style={{ padding:"22px 24px",animation:"fade-up .5s ease both .3s" }}>
                <div style={{ fontSize:13,fontWeight:700,color:"rgba(255,255,255,.7)",marginBottom:14,letterSpacing:"-.01em" }}>Quick Actions</div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <button className="quick-btn" onClick={() => setLocation("/app")}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    New Campaign
                  </button>
                  <button className="quick-btn" onClick={() => setLocation("/templates")}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4 5h6M4 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    Browse Templates
                  </button>
                  <button className="quick-btn" onClick={() => setLocation("/inbox")}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5l5.5 3.5L12.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    View Inbox
                  </button>
                  <button className="quick-btn" onClick={() => setLocation("/analytics")}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l3-3.5 2.5 2 3.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent campaigns */}
          <div className="dash-card dash-transition" style={{ padding:"22px 24px",animation:"fade-up .5s ease both .35s" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <div style={{ fontSize:14,fontWeight:700,color:"rgba(255,255,255,.82)" }}>Recent Campaigns</div>
              {campaigns.length > 0 && (
                <button onClick={() => setLocation("/campaigns")} style={{ fontSize:11,fontWeight:600,color:IND,background:"none",border:"none",cursor:"pointer",fontFamily:F,padding:0 }}>
                  View all →
                </button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 0",gap:12 }}>
                <div style={{ width:48,height:48,borderRadius:14,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17l5-6.5 4.5 3.5 6-9" stroke={IND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.45)",textAlign:"center" }}>No campaigns yet</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,.25)",textAlign:"center" }}>Create your first campaign to see it here.</div>
                <button className="quick-btn-primary" onClick={() => setLocation("/app")} style={{ marginTop:4,width:"auto",padding:"10px 20px" }}>
                  Start a campaign
                </button>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 100px 80px 80px 120px",gap:12,padding:"0 0 10px",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:8 }}>
                  {["Campaign","Leads","Sent","Failed","Delivery"].map(h => (
                    <div key={h} style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.22)",letterSpacing:".07em",textTransform:"uppercase" }}>{h}</div>
                  ))}
                </div>
                {campaigns.slice(0, 6).map((c, i) => (
                  <div key={c.id} className="row-anim" style={{
                    display:"grid",gridTemplateColumns:"1fr 100px 80px 80px 120px",gap:12,
                    padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.04)",
                    alignItems:"center",animationDelay:`${.35 + i*.06}s`,
                  }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.78)",marginBottom:2 }}>{c.name}</div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,.28)" }}>{c.businessType} · {c.location}</div>
                    </div>
                    <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.55)" }}>{c.totalLeads}</div>
                    <div style={{ fontSize:13,fontWeight:700,color:"#10b981" }}>{c.sent}</div>
                    <div style={{ fontSize:13,fontWeight:600,color:c.failed > 0 ? "#f87171" : "rgba(255,255,255,.25)" }}>{c.failed}</div>
                    <DeliveryBar sent={c.sent} total={c.sent + c.failed} />
                  </div>
                ))}
              </>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
