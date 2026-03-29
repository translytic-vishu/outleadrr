import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState as useStateTable } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/lib/theme";
import type { MeResponse } from "@shared/schema";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";

const F = "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif";
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
  .d-card{
    background:rgba(255,255,255,0.035);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:14px;
    transition:border-color .2s,box-shadow .2s;
    cursor:default;
  }
  .d-card:hover{border-color:rgba(255,255,255,0.12);box-shadow:0 8px 24px rgba(0,0,0,.3);}
  .qbtn{
    display:flex;align-items:center;gap:10px;
    padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.035);color:#a1a1aa;
    font-size:13px;font-weight:600;font-family:${F};
    cursor:pointer;transition:all .15s;text-align:left;width:100%;
  }
  .qbtn:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);color:#ededed;}
  .qbtn-primary{
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:10px 18px;border-radius:10px;border:none;
    background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;
    font-size:13px;font-weight:700;font-family:${F};
    cursor:pointer;transition:all .15s;
    box-shadow:0 2px 12px rgba(139,92,246,.25);
  }
  .qbtn-primary:hover{box-shadow:0 4px 20px rgba(139,92,246,.4);}
  .kpi-card{
    border-radius:14px;padding:20px 22px;
    position:relative;overflow:hidden;
    transition:box-shadow .2s;
    border:1px solid rgba(255,255,255,0.06);
  }
  .kpi-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.3);}
  [data-theme="light"] .d-card{background:#ffffff!important;border-color:#e4e4e7!important;}
  [data-theme="light"] .d-card:hover{border-color:#d4d4d8!important;box-shadow:0 4px 16px rgba(0,0,0,.06)!important;}
  [data-theme="light"] .kpi-card{border-color:#e4e4e7!important;}
  [data-theme="light"] .kpi-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)!important;}
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

/* -- Mini bar sparkline -- */
function MiniBar({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 26 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 4, borderRadius: 2,
          height: `${Math.max((v / max) * 100, 8)}%`,
          background: color,
          opacity: i === values.length - 1 ? 1 : 0.35 + (i / values.length) * 0.55,
        }} />
      ))}
    </div>
  );
}

/* -- Recharts Area chart -- */
function CampaignAreaChart({ campaigns, isDark }: { campaigns: Campaign[]; isDark: boolean }) {
  if (campaigns.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13l4-5 3 3 4-6 4 3" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ fontSize: 13, color: isDark ? "#52525b" : "#a1a1aa", fontWeight: 500 }}>Launch your first campaign to see activity</div>
    </div>
  );

  const data = campaigns.slice(-8).map(c => ({
    name: c.name.length > 9 ? c.name.slice(0, 9) + "\u2026" : c.name,
    sent: c.sent,
    leads: c.totalLeads,
  }));

  const gridColor   = isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.07)";
  const tickColor   = isDark ? "#52525b" : "#a1a1aa";
  const tooltipBg   = isDark ? "#161616" : "#ffffff";
  const tooltipBdr  = isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACC} stopOpacity={isDark ? 0.25 : 0.15} />
            <stop offset="90%" stopColor={ACC} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? 0.18 : 0.1} />
            <stop offset="90%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor, fontFamily: F, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: tickColor, fontFamily: F }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 10, fontSize: 12, fontFamily: F, boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}
          labelStyle={{ color: isDark ? "#ededed" : "#09090b", fontWeight: 700, marginBottom: 4 }}
          itemStyle={{ color: isDark ? "#a1a1aa" : "#52525b" }}
        />
        <Area type="monotone" dataKey="sent"  stroke={ACC}       strokeWidth={2} fill="url(#gradSent)"  dot={false} name="Sent" />
        <Area type="monotone" dataKey="leads" stroke="#10b981"   strokeWidth={2} fill="url(#gradLeads)" dot={false} name="Leads" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* -- KPI Card -- */
function KPICard({ label, value, sub, icon, bg, accent, sparkValues, delay = 0 }:
  { label: string; value: string | number; sub?: string; icon: React.ReactNode; bg: string; accent: string; sparkValues?: number[]; delay?: number }) {
  return (
    <div className="kpi-card" style={{ background: bg, animationDelay: `${delay}s` }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}1a`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
            {icon}
          </div>
          {sparkValues && sparkValues.length > 1 && <MiniBar values={sparkValues} color={accent} />}
        </div>
        <div className="stat-num" style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-.04em", lineHeight: 1, marginBottom: 6 }}>
          {value}
        </div>
        <div className="kpi-label" style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        {sub && <div className="kpi-sub" style={{ fontSize: 11, color: "rgba(255,255,255,.22)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}


/* -- TanStack-powered campaigns table -- */
function CampaignsTable({ campaigns, isDark, onNewCampaign, colors }: {
  campaigns: Campaign[];
  isDark: boolean;
  onNewCampaign: () => void;
  colors: Record<string, string>;
}) {
  const [sorting, setSorting] = useStateTable<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useStateTable("");

  const columns: ColumnDef<Campaign>[] = [
    {
      id: "name", accessorKey: "name", header: "Campaign",
      cell: ({ getValue }) => (
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.tableRowText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{getValue() as string}</div>
      ),
    },
    {
      id: "industry", header: "Industry / Location",
      cell: ({ row }) => (
        <div>
          <div style={{ fontSize: 12, color: colors.tableSubText }}>{row.original.businessType}</div>
          <div style={{ fontSize: 11, color: colors.tableSubText2, marginTop: 2 }}>{row.original.location}</div>
        </div>
      ),
    },
    {
      id: "totalLeads", accessorKey: "totalLeads", header: "Leads",
      cell: ({ getValue }) => <span style={{ fontSize: 13, fontWeight: 700, color: colors.tableCellGray }}>{getValue() as number}</span>,
    },
    {
      id: "sent", accessorKey: "sent", header: "Sent",
      cell: ({ getValue }) => <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,.1)", padding: "2px 8px", borderRadius: 6 }}>{getValue() as number}</span>,
    },
    {
      id: "failed", accessorKey: "failed", header: "Failed",
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return v > 0
          ? <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,.1)", padding: "2px 8px", borderRadius: 6 }}>{v}</span>
          : <span style={{ color: colors.tableNone, fontSize: 12 }}>&mdash;</span>;
      },
    },
    {
      id: "delivery", header: "Delivery",
      accessorFn: row => row.sent + row.failed > 0 ? Math.round((row.sent / (row.sent + row.failed)) * 100) : 0,
      cell: ({ getValue }) => {
        const dr = getValue() as number;
        const drColor = dr >= 80 ? "#4ade80" : dr >= 50 ? "#fbbf24" : "#f87171";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 64, height: 4, background: colors.delivBarBg, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${dr}%`, background: drColor, borderRadius: 2, transition: "width .3s ease" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: drColor }}>{dr}%</span>
          </div>
        );
      },
    },
    {
      id: "createdAt", accessorKey: "createdAt", header: "Date",
      cell: ({ getValue }) => {
        try { return <span style={{ fontSize: 11, color: colors.tableSubText2, whiteSpace: "nowrap" }}>{new Date(getValue() as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>; }
        catch { return <span style={{ fontSize: 11, color: colors.tableSubText2 }}>&mdash;</span>; }
      },
    },
  ];

  const table = useReactTable({
    data: campaigns,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const inputBg = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
  const inputBdr = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.1)";
  const inputColor = isDark ? "#a1a1aa" : "#52525b";

  return (
    <div className="d-card" style={{ marginBottom: 16 }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${colors.tableHeaderBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.cardTitle }}>All Campaigns</div>
          <div style={{ fontSize: 11, color: colors.cardSub, marginTop: 3 }}>{campaigns.length} total</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {campaigns.length > 0 && (
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={inputColor} strokeWidth="1.3"/><path d="M9 9l2.5 2.5" stroke={inputColor} strokeWidth="1.3" strokeLinecap="round"/></svg>
              <input
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Search campaigns\u2026"
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 9, fontSize: 12, color: inputColor, outline: "none", fontFamily: F, width: 180 }}
              />
            </div>
          )}
          <button className="qbtn-primary" onClick={onNewCampaign} style={{ padding: "9px 16px", fontSize: 12, flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Campaign
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l5-6.5 4 3.5 5-7" stroke="rgba(139,92,246,.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.emptyText }}>No campaigns yet</div>
          <div style={{ fontSize: 12, color: colors.emptyText2, maxWidth: 280, lineHeight: 1.6 }}>Generate your first batch of leads and emails in minutes.</div>
          <button className="qbtn-primary" onClick={onNewCampaign} style={{ padding: "10px 22px", fontSize: 13, marginTop: 4 }}>Start a campaign</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} style={{ borderBottom: `1px solid ${colors.tableHeaderBdr}` }}>
                  {hg.headers.map(header => (
                    <th key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ padding: "11px 20px", textAlign: "left", fontSize: 9, fontWeight: 800, color: colors.tableHeaderColor, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap", cursor: header.column.getCanSort() ? "pointer" : "default", userSelect: "none" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? " \u2191" : header.column.getIsSorted() === "desc" ? " \u2193" : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < table.getRowModel().rows.length - 1 ? `1px solid ${colors.tableRowBdr}` : "none", transition: "background .1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = colors.tableHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: "12px 20px" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", fontSize: 13, color: colors.tableSubText2 }}>No matching campaigns</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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

  const bestDel    = campaigns.length > 0 ? campaigns.reduce((best, c) => {
    const r = c.sent + c.failed > 0 ? c.sent / (c.sent + c.failed) : 0;
    const br = best.sent + best.failed > 0 ? best.sent / (best.sent + best.failed) : 0;
    return r > br ? c : best;
  }) : null;

  const topCampaigns = [...campaigns].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 3);

  return (
    <AppLayout>
      <style>{CSS}</style>

      <div style={{ flex: 1, background: dashBg, minHeight: "100vh", fontFamily: F }}>
        <div style={{ padding: "28px 36px 48px", maxWidth: 1200, margin: "0 auto" }}>

          {/* -- Header -- */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: dateText, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                {formatDate()}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: headText, letterSpacing: "-.04em", lineHeight: 1, marginBottom: 6 }}>
                {me?.email ? greeting(me.email) : "Dashboard"}
              </h1>
              <p style={{ fontSize: 13, color: subText }}>
                {campaigns.length === 0
                  ? "Ready to launch your first outreach campaign."
                  : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} \u00b7 ${totalSent} email${totalSent !== 1 ? "s" : ""} sent`}
              </p>
            </div>
            <button className="qbtn-primary" onClick={() => setLocation("/app")} style={{ flexShrink: 0, padding: "10px 20px" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              New Campaign
            </button>
          </div>

          {/* -- KPI Cards -- */}
          {(() => {
            const end = isDark ? "rgba(10,10,12,0)" : "rgba(249,249,251,0)";
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                <KPICard label="Campaigns" value={isLoading ? "\u2014" : campaigns.length} sub="total run"
                  icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 13l4-5 3.5 3 5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  bg={`linear-gradient(135deg,rgba(139,92,246,${isDark?".14":".09"}) 0%,${end} 100%)`} accent="#8b5cf6" delay={0} />
                <KPICard label="Emails Sent" value={isLoading ? "\u2014" : totalSent} sub="across all campaigns" sparkValues={sentSpark}
                  icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M15 2L2 7l6 3 3 6L15 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  bg={`linear-gradient(135deg,rgba(16,185,129,${isDark?".12":".08"}) 0%,${end} 100%)`} accent="#10b981" delay={0} />
                <KPICard label="Leads Found" value={isLoading ? "\u2014" : totalLeads} sub="from Google Maps" sparkValues={leadsSpark}
                  icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  bg={`linear-gradient(135deg,rgba(245,158,11,${isDark?".12":".08"}) 0%,${end} 100%)`} accent="#f59e0b" delay={0} />
                <KPICard label="Delivery Rate" value={isLoading ? "\u2014" : `${deliveryRate}%`} sub={totalSent + totalFailed > 0 ? `${totalFailed} failed` : "no sends yet"}
                  icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 9.5l4.5 4.5 8.5-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  bg={deliveryRate >= 80 ? `linear-gradient(135deg,rgba(74,222,128,${isDark?".12":".08"}) 0%,${end} 100%)` : `linear-gradient(135deg,rgba(251,191,36,${isDark?".12":".08"}) 0%,${end} 100%)`}
                  accent={deliveryRate >= 80 ? "#4ade80" : "#fbbf24"} delay={0} />
              </div>
            );
          })()}

          {/* -- Row 2: Area Chart + Top Campaigns -- */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 16 }}>

            {/* Activity Chart */}
            <div className="d-card" style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
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
              <CampaignAreaChart campaigns={campaigns} isDark={isDark} />
            </div>

            {/* Top Campaigns */}
            <div className="d-card" style={{ padding: "22px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Top Campaigns</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 18 }}>Highest lead volume</div>

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
                          <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width .3s ease" }} />
                        </div>
                        <div style={{ fontSize: 10, color: topCampSub, marginTop: 5 }}>{c.businessType} \u00b7 {c.location}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* -- Row 3: Horizontal Bar Chart -- */}
          {campaigns.length > 0 && (
            <div className="d-card" style={{ padding: "22px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Emails Sent per Campaign</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 18 }}>Campaign-level email delivery breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {campaigns.slice(0, 8).map((c) => {
                  const MAX = Math.max(...campaigns.map(x => x.sent), 1);
                  const pct = Math.max((c.sent / MAX) * 100, c.sent > 0 ? 4 : 0);
                  const delRate = c.sent + c.failed > 0 ? Math.round((c.sent / (c.sent + c.failed)) * 100) : 0;
                  const barColor = delRate >= 80 ? "#4ade80" : delRate >= 50 ? "#fbbf24" : "#f87171";
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ fontSize: 12, color: tableCellGray, width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{c.name}</div>
                      <div style={{ flex: 1, height: 6, background: barBg, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${ACC},${barColor})`, borderRadius: 3, transition: "width .3s ease" }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", width: 28, textAlign: "right", flexShrink: 0 }}>{c.sent}</div>
                      <div style={{ fontSize: 11, color: cardSub, width: 36, textAlign: "right", flexShrink: 0 }}>{delRate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -- Row 4: Full Campaigns Table -- */}
          <CampaignsTable
            campaigns={campaigns}
            isDark={isDark}
            onNewCampaign={() => setLocation("/app")}
            colors={{ cardTitle, cardSub, tableHeaderColor, tableRowText, tableSubText, tableSubText2, tableRowBdr, tableHover, tableHeaderBdr, tableCellGray, tableNone, delivBarBg, emptyText, emptyText2 }}
          />

          {/* -- Row 5: Lead Pipeline + Quick Actions -- */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>

            {/* Lead Pipeline */}
            <div className="d-card" style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cardTitle, marginBottom: 4 }}>Lead Pipeline</div>
              <div style={{ fontSize: 11, color: cardSub, marginBottom: 18 }}>Track leads through your sales stages</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "New",        color: "#8b5cf6", count: totalLeads },
                  { label: "Contacted",  color: "#3b82f6", count: campaigns.reduce((s, c) => s + c.sent, 0) },
                  { label: "Replied",    color: "#10b981", count: 0 },
                  { label: "Meeting",    color: "#f59e0b", count: 0 },
                  { label: "Closed",     color: "#4ade80", count: 0 },
                ].map(col => (
                  <div key={col.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: pipelineLabel, letterSpacing: ".05em" }}>{col.label.toUpperCase()}</span>
                    </div>
                    <div style={{ background: `${col.color}10`, border: `1.5px dashed ${col.color}30`, borderRadius: 10, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 72 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: col.color, letterSpacing: "-.03em", lineHeight: 1 }}>{col.count}</div>
                      <div style={{ fontSize: 9, color: topCampSub, marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>leads</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions + Insights */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="d-card" style={{ padding: "18px" }}>
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
                <div className="d-card" style={{ padding: "18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: qaLabel, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 12 }}>Insights</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {bestDel && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: pipelineLabel }}>Best delivery</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{bestDel.sent + bestDel.failed > 0 ? Math.round((bestDel.sent / (bestDel.sent + bestDel.failed)) * 100) : 0}%</div>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: pipelineLabel }}>Most leads</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>{topCampaigns[0]?.totalLeads ?? 0}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: pipelineLabel }}>Avg per campaign</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ACC }}>{campaigns.length > 0 ? Math.round(totalSent / campaigns.length) : 0}</div>
                    </div>
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
