import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";
import { apiRequest } from "@/lib/queryClient";
import type { AuthStatus, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BG  = "#f8f8f9";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  input,select{font-family:'Inter','Helvetica Neue',Arial,sans-serif;}
  .settings-input{
    width:100%;padding:10px 14px;
    background:${BG};border:1.5px solid #e4e4e8;
    border-radius:9px;font-size:14px;color:${K};outline:none;
    transition:border-color .18s,background .18s;
  }
  .settings-input:focus{border-color:${IND};background:${W};}
`;

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)", marginBottom: 16 }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BDR}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: K }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: K3, marginTop: 3 }}>{desc}</div>}
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: K3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <AppLayout>
      <style>{CSS}</style>
      <PageIntro config={PAGE_INTROS.settings} />

      <div style={{ padding: "28px 36px", fontFamily: F, maxWidth: 700 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em", marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: K3 }}>Manage your account, integrations, and campaign preferences.</p>
        </div>

        {/* Account info */}
        <Section title="Account" desc="Your login credentials and account details.">
          <Field label="Email Address">
            <div style={{
              padding: "10px 14px", background: BG, border: `1.5px solid #e4e4e8`,
              borderRadius: 9, fontSize: 14, color: K3, display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke={K3} strokeWidth="1.4"/><path d="M1 5.5l6 3.5 6-3.5" stroke={K3} strokeWidth="1.4" strokeLinecap="round"/></svg>
              {me?.email || "Loading..."}
            </div>
          </Field>
        </Section>

        {/* Gmail */}
        <Section title="Gmail Integration" desc="Send outreach emails directly from your Gmail inbox.">
          {gmailStatus?.connected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5L15 5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: K }}>Gmail Connected</div>
                  <div style={{ fontSize: 12, color: K3, marginTop: 2 }}>{gmailStatus.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href="/api/auth/google"
                  style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BDR}`, background: W, color: K2, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  Reconnect
                </a>
                <button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff5f5", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all .15s" }}
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: K, marginBottom: 3 }}>Gmail not connected</div>
                <div style={{ fontSize: 12, color: K3 }}>Connect Gmail to send outreach emails directly from your inbox. Recipients see your real address.</div>
              </div>
              <a
                href="/api/auth/google"
                style={{
                  padding: "10px 20px", borderRadius: 9, border: "none", background: IND,
                  color: W, fontSize: 13, fontWeight: 700, textDecoration: "none",
                  flexShrink: 0, boxShadow: "0 2px 10px rgba(99,102,241,.3)",
                  display: "inline-block",
                }}
              >
                Connect Gmail
              </a>
            </div>
          )}

          <div style={{ marginTop: 16, padding: "12px 16px", background: BG, borderRadius: 10, border: `1px solid ${BDR}`, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Emails come from your real Gmail address, not a third-party sender",
              "We request send + read access — never used for anything else",
              "Disconnect at any time from this page",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: K3 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M2.5 7l3 3 6-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t}
              </div>
            ))}
          </div>
        </Section>

        {/* Sender identity */}
        <Section title="Sender Identity" desc="Personalise your emails with your name and role.">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Your Full Name">
                <input className="settings-input" placeholder="e.g. Alex Morgan" />
              </Field>
              <Field label="Your Role / Title">
                <input className="settings-input" placeholder="e.g. Founder, Sales Lead" />
              </Field>
            </div>
            <Field label="Company / Team Name">
              <input className="settings-input" placeholder="e.g. Outleadrr, Morgan Consulting" />
            </Field>
            <div>
              <button
                style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: K, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#222"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = K; }}
              >
                Save Identity
              </button>
            </div>
          </div>
        </Section>

        {/* Campaign defaults */}
        <Section title="Campaign Defaults" desc="Pre-fill the Campaign Builder to save time.">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Default Lead Count" hint="How many leads to pull per campaign">
                <div style={{ position: "relative" }}>
                  <select className="settings-input" defaultValue="10" style={{ appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </Field>
              <Field label="Default Tone" hint="Your preferred email persona">
                <div style={{ position: "relative" }}>
                  <select className="settings-input" defaultValue="professional" style={{ appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                    {["professional","friendly","direct","humorous","persuasive","casual","consultative","bold"].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </Field>
            </div>
            <div>
              <button
                style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: K, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#222"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = K; }}
              >
                Save Defaults
              </button>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" desc="Irreversible actions. Proceed with caution.">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: K, marginBottom: 3 }}>Delete account</div>
              <div style={{ fontSize: 12, color: K3 }}>Permanently deletes your account, all campaigns, and data. This cannot be undone.</div>
            </div>
            <button
              style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff5f5", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, flexShrink: 0, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5"; }}
            >
              Delete Account
            </button>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
