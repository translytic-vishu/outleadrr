/**
 * AppLayout — sidebar + main content shell used by all authenticated pages.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MeResponse, AuthStatus } from "@shared/schema";
import logoSrc from "@assets/outleadr_1773257073565.png";

/* ─── design tokens ──────────────────────────────────────────────── */
const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const SIDE = "#0d0d0d";
const IND  = "#6366f1";
const IND2 = "rgba(99,102,241,0.12)";
const W    = "#ffffff";
const DIM  = "rgba(255,255,255,0.45)";
const DIM2 = "rgba(255,255,255,0.08)";

/* ─── Logo ───────────────────────────────────────────────────────── */
function SidebarLogo() {
  const ratio = 28 / 36;
  const imgH  = Math.round(130 * ratio);
  const neg   = -Math.round(47 * ratio);
  return (
    <div style={{ height: 28, overflow: "hidden", display: "flex", alignItems: "center" }}>
      <img
        src={logoSrc}
        alt="Outleadrr"
        style={{ height: imgH, width: "auto", objectFit: "contain", marginTop: neg, marginBottom: neg, display: "block", filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

/* ─── Nav item definitions ───────────────────────────────────────── */
const NAV_ITEMS: { label: string; path: string; icon: JSX.Element }[] = [
  {
    label: "Campaign Builder",
    path: "/app",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L6 8l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: "Campaigns",
    path: "/campaigns",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" opacity=".4"/>
        <rect x="2" y="7" width="9" height="2" rx="1" fill="currentColor" opacity=".7"/>
        <rect x="2" y="11" width="6" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Inbox",
    path: "/inbox",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Templates",
    path: "/templates",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Leads",
    path: "/leads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3-4 3 2 3-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/* ─── AppLayout ──────────────────────────────────────────────────── */
interface AppLayoutProps {
  children: React.ReactNode;
}

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
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: F, background: "#f8f8f9" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: SIDE,
        display: "flex",
        flexDirection: "column",
        padding: "0",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        overflowY: "auto",
      }}>

        {/* Logo area */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SidebarLogo />
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = location === item.path || (item.path !== "/app" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, border: "none",
                  background: active ? IND2 : "transparent",
                  color: active ? W : DIM,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "all .15s", fontFamily: F,
                  outline: active ? `1px solid rgba(99,102,241,0.3)` : "none",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = DIM2; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <span style={{ color: active ? IND : DIM, display: "flex", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Gmail status */}
          {gmailStatus?.connected ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
              marginBottom: 4,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1.2 }}>Gmail Connected</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gmailStatus.email}</div>
              </div>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, textDecoration: "none",
                background: IND2, border: `1px solid rgba(99,102,241,0.25)`,
                color: W, fontSize: 12, fontWeight: 600, marginBottom: 4,
                transition: "all .15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1 5l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Connect Gmail
            </a>
          )}

          {/* Settings */}
          <button
            onClick={() => setLocation("/settings")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, border: "none",
              background: location === "/settings" ? IND2 : "transparent",
              color: location === "/settings" ? W : DIM,
              fontSize: 13, fontWeight: 500,
              cursor: "pointer", textAlign: "left", width: "100%",
              transition: "all .15s", fontFamily: F,
            }}
            onMouseEnter={e => { if (location !== "/settings") (e.currentTarget as HTMLButtonElement).style.background = DIM2; }}
            onMouseLeave={e => { if (location !== "/settings") (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Settings
          </button>

          {/* User + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginTop: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: W, flexShrink: 0,
            }}>
              {me?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.email || ""}</div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title="Log out"
              style={{
                background: "none", border: "none", padding: 4, cursor: "pointer",
                color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
                transition: "color .15s", borderRadius: 4,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 7h7M9 4.5l2.5 2.5L9 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
