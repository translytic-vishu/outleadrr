/**
 * AppLayout — premium sidebar shell used by all authenticated pages.
 * Inspired by Linear, Stripe, and Notion.
 */
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MeResponse, AuthStatus } from "@shared/schema";
import logoSrc from "@assets/outleadr_1773257073565.png";

const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const SIDE = "#09090b";   // zinc-950
const IND  = "#6366f1";
const W    = "#ffffff";
const DIM  = "rgba(255,255,255,0.38)";
const DIM2 = "rgba(255,255,255,0.055)";
const BDR  = "rgba(255,255,255,0.07)";

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  .nav-btn{
    display:flex;align-items:center;gap:10px;
    padding:7px 10px;border-radius:7px;border:none;
    background:transparent;color:${DIM};
    font-size:13px;font-weight:500;
    cursor:pointer;text-align:left;width:100%;
    transition:background .12s,color .12s;
    font-family:${F};position:relative;
    letter-spacing:-.01em;
  }
  .nav-btn:hover{background:${DIM2};color:rgba(255,255,255,0.75);}
  .nav-btn.active{background:rgba(99,102,241,0.14);color:${W};font-weight:600;}
  .nav-btn.active .nav-icon{color:${IND};}
  .nav-icon{display:flex;flex-shrink:0;transition:color .12s;}
  .sidebar-section-label{
    font-size:10px;font-weight:700;color:rgba(255,255,255,0.2);
    letter-spacing:.09em;text-transform:uppercase;
    padding:0 10px;margin:14px 0 5px;
  }
`;

function SidebarLogo() {
  const ratio = 28 / 36;
  const imgH  = Math.round(130 * ratio);
  const neg   = -Math.round(47 * ratio);
  return (
    <div style={{ height: 28, overflow: "hidden", display: "flex", alignItems: "center" }}>
      <img
        src={logoSrc} alt="Outleadrr"
        style={{ height: imgH, width: "auto", objectFit: "contain", marginTop: neg, marginBottom: neg, display: "block", filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

const NAV_ITEMS = [
  {
    label: "Dashboard", path: "/dashboard",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="8.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="1.5" y="8.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="8.5" y="8.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    label: "Campaign Builder", path: "/app",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 11L5.5 7l3 2.5 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12.5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    label: "Campaigns", path: "/campaigns",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="2" rx="1" fill="currentColor" opacity=".35"/><rect x="1.5" y="6.5" width="8" height="2" rx="1" fill="currentColor" opacity=".6"/><rect x="1.5" y="10.5" width="5" height="2" rx="1" fill="currentColor"/></svg>,
  },
  {
    label: "Inbox", path: "/inbox",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    label: "Templates", path: "/templates",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 5.5h6M4.5 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    label: "Leads", path: "/leads",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    label: "Analytics", path: "/analytics",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 11.5l3.5-4.5 3 2.5 3.5-6L14 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

interface AppLayoutProps { children: React.ReactNode }

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()),
    retry: false,
  });

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout").then(r => r.json()),
    onSuccess: () => { queryClient.clear(); setLocation("/login"); },
  });

  const initial = me?.email?.[0]?.toUpperCase() || "U";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: F, background: "#f4f4f6" }}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224,
        flexShrink: 0,
        background: SIDE,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${BDR}`,
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${BDR}` }}>
          <SidebarLogo />
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 5, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600 }}>
            Outreach Platform
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column" }}>
          <div className="sidebar-section-label">Workspace</div>
          {NAV_ITEMS.map(item => {
            const active = location === item.path || (item.path !== "/app" && location.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => setLocation(item.path)} className={`nav-btn${active ? " active" : ""}`}>
                {/* Active left-bar indicator */}
                {active && (
                  <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: "0 2px 2px 0", background: IND }} />
                )}
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div className="sidebar-section-label" style={{ marginTop: 18 }}>Account</div>
          <button
            onClick={() => setLocation("/settings")}
            className={`nav-btn${location === "/settings" ? " active" : ""}`}
          >
            {location === "/settings" && (
              <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: "0 2px 2px 0", background: IND }} />
            )}
            <span className="nav-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.06 1.06M11.04 11.04l1.06 1.06M2.9 12.1l1.06-1.06M11.04 3.96l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </span>
            Settings
          </button>
        </nav>

        {/* Bottom: Gmail + user */}
        <div style={{ borderTop: `1px solid ${BDR}`, padding: "10px 8px 12px" }}>

          {/* Gmail status */}
          {gmailStatus?.connected ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8, marginBottom: 6,
              background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.18)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: ".06em", textTransform: "uppercase" }}>Gmail Connected</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gmailStatus.email}</div>
              </div>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8, textDecoration: "none",
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
                color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, marginBottom: 6,
                transition: "all .15s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l5.5 3.5L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Connect Gmail
            </a>
          )}

          {/* User row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: W, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {me?.email || ""}
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title="Log out"
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", borderRadius: 4, transition: "color .12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 6.5h6M8 4.5l2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", background: "#0a0a0c" }}>
        {children}
      </main>
    </div>
  );
}
