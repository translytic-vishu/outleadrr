/**
 * AppLayout — premium sidebar shell used by all authenticated pages.
 * Inspired by Linear, Stripe, and Notion.
 */
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MeResponse, AuthStatus } from "@shared/schema";
import logoSrc from "@assets/outleadr_1773257073565.png";
import { useTheme } from "@/lib/theme";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const IND = "#8b5cf6";

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  .nav-btn{
    display:flex;align-items:center;gap:10px;
    padding:7px 10px;border-radius:7px;border:none;
    background:transparent;color:var(--nav-dim);
    font-size:13px;font-weight:500;
    cursor:pointer;text-align:left;width:100%;
    transition:background .12s,color .12s;
    font-family:${F};position:relative;
    letter-spacing:-.01em;
  }
  .nav-btn:hover{background:var(--nav-hover);color:var(--nav-text);}
  .nav-btn.active{background:rgba(139,92,246,0.14);color:var(--nav-active);font-weight:600;}
  .nav-btn.active .nav-icon{color:#8b5cf6;}
  .nav-icon{display:flex;flex-shrink:0;transition:color .12s;}
  .sidebar-section-label{
    font-size:10px;font-weight:700;color:var(--nav-label);
    letter-spacing:.09em;text-transform:uppercase;
    padding:0 10px;margin:14px 0 5px;
  }
  [data-theme="light"] .nav-btn{color:rgba(0,0,0,0.45);}
  [data-theme="light"] .nav-btn:hover{background:rgba(0,0,0,0.04);color:rgba(0,0,0,0.85);}
  [data-theme="light"] .nav-btn.active{background:rgba(124,58,237,0.1);color:#5b21b6;}
  [data-theme="light"] .nav-btn.active .nav-icon{color:#7c3aed;}
  [data-theme="light"] .sidebar-section-label{color:rgba(0,0,0,0.3);}
`;

function SidebarLogo({ isDark }: { isDark: boolean }) {
  // The PNG has ~47px padding top/bottom around a 36px logo in a 130px image.
  // We scale to show exactly the logo content at 28px tall.
  const ratio = 28 / 36;
  const imgH  = Math.round(130 * ratio);  // full scaled height
  const neg   = -Math.round(47 * ratio);  // negative margin to crop padding
  return (
    <div style={{ height: 28, overflow: "hidden", display: "flex", alignItems: "center" }}>
      <img
        src={logoSrc} alt="Outleadrr"
        style={{ height: imgH, width: "auto", objectFit: "contain", marginTop: neg, marginBottom: neg, display: "block",
          filter: isDark ? "brightness(0) invert(1)" : "brightness(0)" }}
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
    label: "Inbox", path: "/inbox",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    label: "Templates", path: "/templates",
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 5.5h6M4.5 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
];

interface AppLayoutProps { children: React.ReactNode }

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { theme, isDark, toggle } = useTheme();

  // Zinc-scale tokens — Vercel/TurboLearn inspired
  const sidebarBg  = isDark ? "#111111"  : "#ffffff";
  const sidebarBdr = isDark ? "rgba(255,255,255,0.08)" : "#e4e4e7";
  const mainBg     = isDark ? "#0a0a0a"  : "#fafafa";
  const gmailConnectedBg  = isDark ? "rgba(22,163,74,0.08)"  : "rgba(22,163,74,0.05)";
  const gmailConnectedBdr = isDark ? "rgba(22,163,74,0.2)"   : "rgba(22,163,74,0.2)";
  const gmailConnectedTxt = "#22c55e";
  const gmailConnectedSub = isDark ? "#71717a" : "#71717a";
  const gmailConnectBg  = isDark ? "rgba(167,139,250,0.08)" : "rgba(124,58,237,0.06)";
  const gmailConnectBdr = isDark ? "rgba(167,139,250,0.18)" : "rgba(124,58,237,0.15)";
  const gmailConnectTxt = isDark ? "#a78bfa" : "#7c3aed";
  const userEmail   = isDark ? "#71717a" : "#71717a";
  const logoutColor = isDark ? "#52525b" : "#a1a1aa";
  const logoutHover = isDark ? "#ededed" : "#09090b";

  // Inject CSS custom properties + global smooth theme-switch transitions
  const cssVars = `
    :root {
      --t-bg: ${mainBg};
      --t-sidebar: ${sidebarBg};
      --t-card: ${isDark ? "rgba(255,255,255,0.035)" : "#ffffff"};
      --t-border: ${isDark ? "rgba(255,255,255,0.08)" : "#e4e4e7"};
      --t-border2: ${isDark ? "rgba(255,255,255,0.12)" : "#d4d4d8"};
      --t-text: ${isDark ? "#ededed" : "#09090b"};
      --t-text2: ${isDark ? "#a1a1aa" : "#3f3f46"};
      --t-text3: ${isDark ? "#71717a" : "#71717a"};
      --t-text4: ${isDark ? "#52525b" : "#a1a1aa"};
      --t-accent: ${isDark ? "#a78bfa" : "#7c3aed"};
      --t-accent-dim: ${isDark ? "rgba(167,139,250,0.12)" : "rgba(124,58,237,0.08)"};
      --t-input-bg: ${isDark ? "rgba(255,255,255,0.05)" : "#ffffff"};
      --t-input-bdr: ${isDark ? "rgba(255,255,255,0.1)" : "#d4d4d8"};
      --t-row-hover: ${isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5"};
      --t-panel: ${isDark ? "#161616" : "#f4f4f5"};
      --nav-dim: ${isDark ? "#71717a" : "#71717a"};
      --nav-hover: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
      --nav-text: ${isDark ? "#ededed" : "#09090b"};
      --nav-active: ${isDark ? "#ededed" : "#09090b"};
      --nav-label: ${isDark ? "#52525b" : "#a1a1aa"};
    }
    /* Smooth theme transitions — all bg/border/color changes are animated */
    *, *::before, *::after {
      transition-property: background-color, border-color, color, box-shadow, opacity;
      transition-duration: 0.15s;
      transition-timing-function: ease;
    }
    /* Exempt elements that have their own animations */
    *[class*="animate"], *[style*="animation"], svg *, canvas { transition: none !important; }
  `;

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
    <div data-theme={theme} style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: F }}>
      <style>{CSS + cssVars}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: sidebarBg,
        display: "flex", flexDirection: "column",
        borderRight: `1px solid ${sidebarBdr}`,
        overflowY: "auto",
        transition: "background .2s",
      }}>

        {/* Logo */}
        <div
          onClick={() => setLocation("/dashboard")}
          style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${sidebarBdr}`, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        >
          <SidebarLogo isDark={isDark} />
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
            onClick={toggle}
            className="nav-btn"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="nav-icon">
              {isDark ? (
                /* Sun icon */
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.89 10.89l1.06 1.06M3.05 11.95l1.06-1.06M10.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              ) : (
                /* Moon icon */
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 9A5.5 5.5 0 016 2.5a.5.5 0 00-.6-.49A6.5 6.5 0 1013 9.6a.5.5 0 00-.5-.6z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </span>
            {isDark ? "Light mode" : "Dark mode"}
          </button>
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
        <div style={{ borderTop: `1px solid ${sidebarBdr}`, padding: "10px 8px 12px" }}>

          {gmailStatus?.connected ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, marginBottom:6, background:gmailConnectedBg, border:`1px solid ${gmailConnectedBdr}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:gmailConnectedTxt, flexShrink:0, boxShadow:"0 0 6px rgba(34,197,94,0.6)" }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, color:gmailConnectedTxt, letterSpacing:".06em", textTransform:"uppercase" }}>Gmail Connected</div>
                <div style={{ fontSize:10, color:gmailConnectedSub, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{gmailStatus.email}</div>
              </div>
            </div>
          ) : (
            <a href="/api/auth/google" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, textDecoration:"none", background:gmailConnectBg, border:`1px solid ${gmailConnectBdr}`, color:gmailConnectTxt, fontSize:12, fontWeight:600, marginBottom:6, transition:"all .15s" }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5l5.5 3.5L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Connect Gmail
            </a>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px" }}>
            <div style={{ width:26, height:26, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {initial}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:500, color:userEmail, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{me?.email || ""}</div>
            </div>
            <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} title="Log out"
              style={{ background:"none", border:"none", padding:4, cursor:"pointer", color:logoutColor, display:"flex", alignItems:"center", borderRadius:4, transition:"color .12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = logoutHover; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = logoutColor; }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 6.5h6M8 4.5l2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", background: mainBg, transition: "background .2s" }}>
        {children}
      </main>
    </div>
  );
}
