import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import type { AuthStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: W, borderRadius: 14, border: `1px solid ${BDR}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)", marginBottom: 16 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BDR}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: K }}>{title}</div>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Gmail disconnected" });
    },
  });

  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}input,select{font-family:${F};}`}</style>

      <div style={{ padding: "28px 36px", fontFamily: F, maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Settings</h1>
          <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Manage your account, integrations, and preferences.</p>
        </div>

        {/* Gmail connection */}
        <Section title="Gmail Integration">
          {gmailStatus?.connected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9l5 5L16 4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: K }}>Gmail Connected</div>
                  <div style={{ fontSize: 12, color: K3, marginTop: 1 }}>{gmailStatus.email}</div>
                </div>
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid #fca5a5`, background: "#fff5f5", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all .15s" }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: K }}>Gmail not connected</div>
                <div style={{ fontSize: 12, color: K3, marginTop: 1 }}>Connect Gmail to send outreach emails directly.</div>
              </div>
              <a
                href="/api/auth/google"
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: IND, color: W, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(99,102,241,.3)" }}
              >
                Connect Gmail
              </a>
            </div>
          )}
        </Section>

        {/* Sender defaults */}
        <Section title="Sender Identity">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Your Full Name", placeholder: "e.g. Alex Morgan" },
              { label: "Your Company / Team Name", placeholder: "e.g. Outleadrr" },
              { label: "Your Role / Title", placeholder: "e.g. Founder, Sales Lead" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "9px 14px", background: "#f8f8f9", border: `1.5px solid #e4e4e8`, borderRadius: 9, fontSize: 14, color: K, outline: "none", transition: "border-color .18s" }}
                  onFocus={e => { e.currentTarget.style.borderColor = IND; e.currentTarget.style.background = W; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e4e4e8"; e.currentTarget.style.background = "#f8f8f9"; }}
                />
              </div>
            ))}
            <button
              style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 9, border: "none", background: K, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}
            >
              Save Changes
            </button>
          </div>
        </Section>

        {/* Campaign defaults */}
        <Section title="Campaign Defaults">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Default Lead Count</label>
              <div style={{ position: "relative", width: 200 }}>
                <select
                  defaultValue="10"
                  style={{ width: "100%", padding: "9px 14px", background: "#f8f8f9", border: `1.5px solid #e4e4e8`, borderRadius: 9, fontSize: 14, color: K, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Default Tone</label>
              <div style={{ position: "relative", width: 200 }}>
                <select
                  defaultValue="professional"
                  style={{ width: "100%", padding: "9px 14px", background: "#f8f8f9", border: `1.5px solid #e4e4e8`, borderRadius: 9, fontSize: 14, color: K, outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  {["professional","friendly","direct","humorous","persuasive","casual","consultative","bold"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>
            <button
              style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 9, border: "none", background: K, color: W, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}
            >
              Save Defaults
            </button>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Account">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: K }}>Delete account</div>
              <div style={{ fontSize: 12, color: K3, marginTop: 1 }}>Permanently delete your account and all data. This cannot be undone.</div>
            </div>
            <button
              style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid #fca5a5`, background: "#fff5f5", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}
            >
              Delete Account
            </button>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
