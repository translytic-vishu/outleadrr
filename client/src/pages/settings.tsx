import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import type { AuthStatus, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";

// ─── Design tokens ────────────────────────────────────────────────────────────
const F           = "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif";
const CARD        = "rgba(255,255,255,0.035)";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const TEXT        = "#ededed";
const TEXT2       = "#a1a1aa";
const TEXT3       = "#52525b";

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  *, *::before, *::after { box-sizing: border-box; }
  input, select { font-family: ${F}; }

  .s-input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    font-size: 14px;
    color: ${TEXT};
    outline: none;
    transition: border-color .18s, background .18s;
    -webkit-appearance: none;
    appearance: none;
  }
  .s-input::placeholder { color: ${TEXT3}; }
  .s-input:focus { border-color: rgba(139,92,246,0.6); background: rgba(255,255,255,0.07); }

  .s-input option {
    background: #1a1a20;
    color: ${TEXT};
  }

  .s-btn-save {
    padding: 9px 20px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.08);
    color: ${TEXT};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: ${F};
    transition: background .18s, border-color .18s;
  }
  .s-btn-save:hover { background: rgba(255,255,255,0.12); }

  .s-btn-primary {
    padding: 10px 20px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: ${F};
    text-decoration: none;
    display: inline-block;
    box-shadow: 0 2px 14px rgba(139,92,246,0.35);
    transition: opacity .18s, box-shadow .18s;
  }
  .s-btn-primary:hover { opacity: .88; box-shadow: 0 4px 20px rgba(139,92,246,0.5); }

  .s-btn-ghost {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid ${CARD_BORDER};
    background: ${CARD};
    color: ${TEXT2};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: ${F};
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: background .18s, border-color .18s, color .18s;
  }
  .s-btn-ghost:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.14);
    color: ${TEXT};
  }

  .s-btn-danger {
    padding: 9px 16px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.2);
    background: rgba(239,68,68,0.08);
    color: #f87171;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: ${F};
    flex-shrink: 0;
    transition: background .18s, border-color .18s;
  }
  .s-btn-danger:hover {
    background: rgba(239,68,68,0.14);
    border-color: rgba(239,68,68,0.35);
  }

  .s-btn-disconnect {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.2);
    background: rgba(239,68,68,0.08);
    color: #f87171;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: ${F};
    transition: background .18s, border-color .18s;
  }
  .s-btn-disconnect:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.35); }
  .s-btn-disconnect:disabled { opacity: .5; cursor: not-allowed; }

  .s-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 9px;
    border: 1.5px solid rgba(139,92,246,0.35);
    background: rgba(139,92,246,0.1);
    color: #c4b5fd;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: ${F};
    transition: background .18s, border-color .18s, color .18s;
  }
  .s-toggle-btn:hover {
    background: rgba(139,92,246,0.18);
    border-color: rgba(139,92,246,0.55);
    color: #ddd6fe;
  }

  /* ── Theme picker cards ── */
  .s-theme-card {
    flex: 1;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    padding: 14px;
    cursor: pointer;
    transition: border-color .18s, background .18s, box-shadow .18s;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: ${F};
  }
  .s-theme-card:hover { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.05); }
  .s-theme-card.selected {
    border-color: #8b5cf6;
    background: rgba(139,92,246,0.08);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
  .s-theme-preview {
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 16/9;
    display: block;
  }
  [data-theme="light"] .s-input {
    background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1);
    color: #0f0f13; color-scheme: light;
  }
  [data-theme="light"] .s-input::placeholder { color: rgba(0,0,0,0.28); }
  [data-theme="light"] .s-input:focus { border-color: rgba(124,58,237,0.6); background: rgba(124,58,237,0.03); }
  [data-theme="light"] .s-btn-save { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); color: #0f0f13; }
  [data-theme="light"] .s-btn-save:hover { background: rgba(0,0,0,0.08); }
  [data-theme="light"] .s-btn-ghost { background: #fff; border-color: rgba(0,0,0,0.1); color: #454550; }
  [data-theme="light"] .s-btn-ghost:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.14); color: #0f0f13; }
  [data-theme="light"] .settings-card { background: #ffffff !important; border-color: #e4e4e7 !important; }
  [data-theme="light"] .settings-card-header { border-color: #e4e4e7 !important; }
  [data-theme="light"] .settings-text { color: #09090b !important; }
  [data-theme="light"] .settings-text2 { color: #3f3f46 !important; }
  [data-theme="light"] .settings-text3 { color: #71717a !important; }
  [data-theme="light"] .settings-email-field { background: #f4f4f5 !important; border-color: #e4e4e7 !important; color: #3f3f46 !important; }
  [data-theme="light"] .s-btn-save { background: #f4f4f5 !important; border-color: #e4e4e7 !important; color: #09090b !important; }
  [data-theme="light"] .s-theme-card { background: #f4f4f5 !important; border-color: #e4e4e7 !important; }
  [data-theme="light"] .s-theme-card.selected { border-color: #7c3aed !important; background: rgba(124,58,237,0.04) !important; }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.5 9.5a6 6 0 01-8-8 6.5 6.5 0 108 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3 3l1 1M11 11l1 1M11 3l-1 1M4 11l-1 1"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon({ color = "#16a34a" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3 3 6-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MailIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.4"/>
      <path d="M1 5.5l6 3.5 6-3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({
  title,
  desc,
  children,
  delay = 0,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="settings-card"
      style={{
        background: CARD,
        borderRadius: 16,
        border: `1px solid ${CARD_BORDER}`,
        overflow: "hidden",
        marginBottom: 16,
        animation: `fadeUp .4s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="settings-card-header" style={{ padding: "18px 24px", borderBottom: `1px solid ${CARD_BORDER}` }}>
        <div className="settings-text" style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{title}</div>
        {desc && <div className="settings-text2" style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="settings-text2" style={{ fontSize: 12, fontWeight: 600, color: TEXT2, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div className="settings-text3" style={{ fontSize: 11, color: TEXT3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Theme ─────────────────────────────────────────────────────────────────
  const { theme, toggle: toggleTheme, isDark } = useTheme();
  const tBg   = isDark ? "#0a0a0a"                : "#fafafa";
  const tBdr  = isDark ? "rgba(255,255,255,0.08)" : "#e4e4e7";
  const tText = isDark ? "#ededed"                : "#09090b";
  const tText2= isDark ? "#a1a1aa"                : "#3f3f46";
  const tText3= isDark ? "#71717a"                : "#71717a";
  const tEmailField = isDark ? "rgba(255,255,255,0.035)" : "#f4f4f5";

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()),
  });

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Gmail disconnected successfully" });
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <style>{CSS}</style>

      <div
        style={{
          background: tBg,
          padding: "32px 40px",
          fontFamily: F,
          minHeight: "100vh",
        }}
      >
        {/* Page heading */}
        <div style={{ maxWidth: 720, marginBottom: 28, animation: "fadeUp .35s ease both" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: tText,
              letterSpacing: "-.03em",
              marginBottom: 4,
              margin: 0,
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: 13, color: tText2, marginTop: 4, marginBottom: 0 }}>
            Manage your account, integrations, and campaign preferences.
          </p>
        </div>

        {/* Content column */}
        <div style={{ maxWidth: 720 }}>

          {/* ── Appearance ────────────────────────────────────────────── */}
          <Section title="Appearance" desc="Choose how Outleadrr looks to you." delay={0}>
            <div style={{ display: "flex", gap: 12 }}>

              {/* Dark card */}
              <button
                className={`s-theme-card${theme === "dark" ? " selected" : ""}`}
                onClick={() => theme !== "dark" && toggleTheme()}
              >
                {/* Mini dark UI preview */}
                <svg className="s-theme-preview" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="90" fill="#0a0a0a"/>
                  {/* Sidebar */}
                  <rect width="38" height="90" fill="#111111"/>
                  <rect x="8" y="10" width="22" height="5" rx="2" fill="#ededed" fillOpacity=".12"/>
                  <rect x="8" y="22" width="18" height="3" rx="1.5" fill="#71717a"/>
                  <rect x="8" y="29" width="22" height="3" rx="1.5" fill="#52525b"/>
                  <rect x="8" y="36" width="20" height="3" rx="1.5" fill="#52525b"/>
                  <rect x="8" y="43" width="16" height="3" rx="1.5" fill="#52525b"/>
                  {/* Active item highlight */}
                  <rect x="0" y="27.5" width="3" height="7" rx="1" fill="#8b5cf6"/>
                  <rect x="8" y="27.5" width="22" height="7" rx="3" fill="#8b5cf6" fillOpacity=".15"/>
                  {/* Main content */}
                  <rect x="46" y="10" width="50" height="6" rx="2" fill="#ededed" fillOpacity=".7"/>
                  <rect x="46" y="22" width="100" height="24" rx="4" fill="#ffffff" fillOpacity=".035"/>
                  <rect x="46" y="50" width="54" height="24" rx="4" fill="#ffffff" fillOpacity=".035"/>
                  <rect x="106" y="50" width="46" height="24" rx="4" fill="#ffffff" fillOpacity=".035"/>
                  <rect x="52" y="28" width="24" height="3" rx="1.5" fill="#a1a1aa"/>
                  <rect x="52" y="34" width="40" height="2" rx="1" fill="#52525b"/>
                  <rect x="52" y="56" width="20" height="3" rx="1.5" fill="#71717a"/>
                  <rect x="52" y="62" width="36" height="2" rx="1" fill="#3f3f3f"/>
                </svg>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <MoonIcon />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tText }}>Dark</span>
                  </div>
                  {theme === "dark" && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Light card */}
              <button
                className={`s-theme-card${theme === "light" ? " selected" : ""}`}
                onClick={() => theme !== "light" && toggleTheme()}
              >
                {/* Mini light UI preview */}
                <svg className="s-theme-preview" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="90" fill="#fafafa"/>
                  {/* Sidebar */}
                  <rect width="38" height="90" fill="#ffffff"/>
                  <rect x="0" y="0" width="38" height="90" fill="none" stroke="#e4e4e7" strokeWidth=".5"/>
                  <rect x="8" y="10" width="22" height="5" rx="2" fill="#09090b" fillOpacity=".12"/>
                  <rect x="8" y="22" width="18" height="3" rx="1.5" fill="#a1a1aa"/>
                  <rect x="8" y="29" width="22" height="3" rx="1.5" fill="#d4d4d8"/>
                  <rect x="8" y="36" width="20" height="3" rx="1.5" fill="#d4d4d8"/>
                  <rect x="8" y="43" width="16" height="3" rx="1.5" fill="#d4d4d8"/>
                  {/* Active item highlight */}
                  <rect x="0" y="27.5" width="3" height="7" rx="1" fill="#7c3aed"/>
                  <rect x="8" y="27.5" width="22" height="7" rx="3" fill="#7c3aed" fillOpacity=".1"/>
                  {/* Main content */}
                  <rect x="46" y="10" width="50" height="6" rx="2" fill="#09090b" fillOpacity=".7"/>
                  <rect x="46" y="22" width="100" height="24" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
                  <rect x="46" y="50" width="54" height="24" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
                  <rect x="106" y="50" width="46" height="24" rx="4" fill="#ffffff" stroke="#e4e4e7" strokeWidth=".5"/>
                  <rect x="52" y="28" width="24" height="3" rx="1.5" fill="#3f3f46"/>
                  <rect x="52" y="34" width="40" height="2" rx="1" fill="#a1a1aa"/>
                  <rect x="52" y="56" width="20" height="3" rx="1.5" fill="#71717a"/>
                  <rect x="52" y="62" width="36" height="2" rx="1" fill="#d4d4d8"/>
                </svg>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <SunIcon />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tText }}>Light</span>
                  </div>
                  {theme === "light" && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </button>

            </div>
          </Section>

          {/* ── Account ───────────────────────────────────────────────── */}
          <Section title="Account" desc="Your login credentials and account details." delay={60}>
            <Field label="Email Address">
              <div
                className="settings-email-field"
                style={{
                  padding: "10px 14px",
                  background: tEmailField,
                  border: `1.5px solid ${tBdr}`,
                  borderRadius: 9,
                  fontSize: 14,
                  color: tText2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MailIcon color={tText3} />
                {me?.email || "Loading..."}
              </div>
            </Field>
          </Section>

          {/* ── Gmail Integration ─────────────────────────────────────── */}
          <Section title="Gmail Integration" desc="Send outreach emails directly from your Gmail inbox." delay={120}>
            {gmailStatus?.connected ? (
              /* Connected state */
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Green glow badge */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: "rgba(22,163,74,0.08)",
                      border: "1px solid rgba(22,163,74,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9l4.5 4.5L15 5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 13,
                        fontWeight: 700,
                        color: tText,
                      }}
                    >
                      Gmail Connected
                      {/* Green dot */}
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#4ade80",
                          display: "inline-block",
                          boxShadow: "0 0 6px rgba(74,222,128,0.7)",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: tText2, marginTop: 2 }}>{gmailStatus.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href="/api/auth/google" className="s-btn-ghost">
                    Reconnect
                  </a>
                  <button
                    className="s-btn-disconnect"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>
            ) : (
              /* Not connected state */
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tText, marginBottom: 3 }}>
                    Gmail not connected
                  </div>
                  <div style={{ fontSize: 12, color: tText2 }}>
                    Connect Gmail to send outreach emails directly from your inbox. Recipients see your real address.
                  </div>
                </div>
                <a href="/api/auth/google" className="s-btn-primary" style={{ flexShrink: 0 }}>
                  Connect Gmail
                </a>
              </div>
            )}

            {/* Info bullets */}
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.025)",
                borderRadius: 10,
                border: `1px solid ${tBdr}`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                "Emails come from your real Gmail address, not a third-party sender",
                "We request send + read access — never used for anything else",
                "Disconnect at any time from this page",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: tText2 }}
                >
                  <span style={{ flexShrink: 0, marginTop: 1 }}>
                    <CheckIcon color="#4ade80" />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Sender Identity ───────────────────────────────────────── */}
          <Section title="Sender Identity" desc="Personalise your emails with your name and role." delay={180}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Your Full Name">
                  <input className="s-input" placeholder="e.g. Alex Morgan" />
                </Field>
                <Field label="Your Role / Title">
                  <input className="s-input" placeholder="e.g. Founder, Sales Lead" />
                </Field>
              </div>
              <Field label="Company / Team Name">
                <input className="s-input" placeholder="e.g. Outleadrr, Morgan Consulting" />
              </Field>
              <div>
                <button className="s-btn-save">Save Identity</button>
              </div>
            </div>
          </Section>

          {/* ── Campaign Defaults ─────────────────────────────────────── */}
          <Section title="Campaign Defaults" desc="Pre-fill the Campaign Builder to save time." delay={240}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Default Lead Count" hint="How many leads to pull per campaign">
                  <div style={{ position: "relative" }}>
                    <select className="s-input" defaultValue="10" style={{ cursor: "pointer", paddingRight: 36 }}>
                      {[5, 10, 15, 20].map(n => (
                        <option key={n} value={n}>{n} leads</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <ChevronIcon color={TEXT3} />
                    </span>
                  </div>
                </Field>
                <Field label="Default Tone" hint="Your preferred email persona">
                  <div style={{ position: "relative" }}>
                    <select className="s-input" defaultValue="professional" style={{ cursor: "pointer", paddingRight: 36 }}>
                      {["professional","friendly","direct","humorous","persuasive","casual","consultative","bold"].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <ChevronIcon color={TEXT3} />
                    </span>
                  </div>
                </Field>
              </div>
              <div>
                <button className="s-btn-save">Save Defaults</button>
              </div>
            </div>
          </Section>

          {/* ── Danger Zone ───────────────────────────────────────────── */}
          <Section title="Danger Zone" desc="Irreversible actions. Proceed with caution." delay={300}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: tText, marginBottom: 3 }}>
                  Delete account
                </div>
                <div style={{ fontSize: 12, color: tText2 }}>
                  Permanently deletes your account, all campaigns, and data. This cannot be undone.
                </div>
              </div>
              <button className="s-btn-danger">Delete Account</button>
            </div>
          </Section>

        </div>
      </div>
    </AppLayout>
  );
}
