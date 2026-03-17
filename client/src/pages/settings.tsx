import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";
import { apiRequest } from "@/lib/queryClient";
import type { AuthStatus, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ─── Design tokens ────────────────────────────────────────────────────────────
const F           = "'Inter','Helvetica Neue',Arial,sans-serif";
const BG          = "#0a0a0c";
const CARD        = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const TEXT        = "rgba(255,255,255,0.9)";
const TEXT2       = "rgba(255,255,255,0.55)";
const TEXT3       = "rgba(255,255,255,0.28)";
const IND         = "#8b5cf6";

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
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${CARD_BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: TEXT2, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: TEXT3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Theme state ──────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const stored = localStorage.getItem("outleadrr_theme");
      return stored === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("outleadrr_theme", theme);
    } catch {
      // ignore
    }
    if (theme === "light") {
      document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
    } else {
      document.documentElement.style.filter = "";
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

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
      <PageIntro config={PAGE_INTROS.settings} />

      <div
        style={{
          background: BG,
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
              color: TEXT,
              letterSpacing: "-.03em",
              marginBottom: 4,
              margin: 0,
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: 13, color: TEXT2, marginTop: 4, marginBottom: 0 }}>
            Manage your account, integrations, and campaign preferences.
          </p>
        </div>

        {/* Content column */}
        <div style={{ maxWidth: 720 }}>

          {/* ── Appearance ────────────────────────────────────────────── */}
          <Section title="Appearance" desc="Customise the look and feel of the app." delay={0}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
                  Color Mode
                </div>
                <div style={{ fontSize: 12, color: TEXT2 }}>
                  Switch between dark and light display themes.
                </div>
              </div>
              <button className="s-toggle-btn" onClick={toggleTheme}>
                {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </Section>

          {/* ── Account ───────────────────────────────────────────────── */}
          <Section title="Account" desc="Your login credentials and account details." delay={60}>
            <Field label="Email Address">
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1.5px solid rgba(255,255,255,0.07)`,
                  borderRadius: 9,
                  fontSize: 14,
                  color: TEXT2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MailIcon color={TEXT3} />
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
                        color: TEXT,
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
                    <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{gmailStatus.email}</div>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
                    Gmail not connected
                  </div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>
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
                border: `1px solid ${CARD_BORDER}`,
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
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: TEXT2 }}
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
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
                  Delete account
                </div>
                <div style={{ fontSize: 12, color: TEXT2 }}>
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
