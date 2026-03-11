import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import logoSrc from "@assets/outleadr_1773257073565.png";

const S = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const BG = "#F5F5F5";
const WHITE = "#ffffff";
const INK = "#0f0f0f";
const INK2 = "#555";
const INK3 = "#999";
const BORDER = "rgba(0,0,0,0.07)";

const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${BG}; color: ${INK}; font-family: ${S}; }
  input, button { font-family: ${S}; }
  input::placeholder { color: #bbb; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .pill-btn {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    padding:10px 22px;border-radius:99px;
    background:${INK};color:${WHITE};border:none;
    font-family:${S};font-weight:600;font-size:14px;letter-spacing:-0.01em;
    cursor:pointer;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
    box-shadow:0 1px 3px rgba(0,0,0,0.12);text-decoration:none;
  }
  .pill-btn:hover{background:#222;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.15);}
  .pill-btn:active{transform:translateY(0);}
  .pill-btn:disabled{background:#ccc;cursor:not-allowed;transform:none;box-shadow:none;}
  .outline-btn {
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 18px;border-radius:99px;
    background:transparent;color:${INK};border:1px solid rgba(0,0,0,0.15);
    font-family:${S};font-weight:500;font-size:13px;
    cursor:pointer;transition:background 0.15s;text-decoration:none;
  }
  .outline-btn:hover{background:rgba(0,0,0,0.04);}
  .lf-input {
    width:100%;padding:13px 16px;
    background:${WHITE};border:1px solid rgba(0,0,0,0.1);
    border-radius:10px;font-family:${S};font-size:14px;
    color:${INK};outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;
  }
  .lf-input:focus{border-color:rgba(0,0,0,0.3);box-shadow:0 0 0 3px rgba(0,0,0,0.06);}
  .lf-label{font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${INK3};display:block;margin-bottom:8px;}
  .lead-row{display:grid;grid-template-columns:36px 1fr 200px 80px;gap:0 16px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);transition:background 0.15s;}
  .lead-row:hover{background:rgba(0,0,0,0.015);margin:0 -20px;padding:14px 20px;border-radius:8px;}
  .lead-row:last-child{border-bottom:none;}
  @media(max-width:680px){
    .form-grid{grid-template-columns:1fr !important;}
    .lead-row{grid-template-columns:28px 1fr auto !important;}
    .lead-contact-col{display:none !important;}
  }
`;

/* ─── send results overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: 20, background: WHITE, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 6 }}>Send Report</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: INK, letterSpacing: "-0.03em" }}>{data.sent} of {data.total} sent</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 99, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: INK2, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "12px 28px 24px" }}>
          {data.results.map(r => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: INK2 }}>{r.email}</span>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: r.success ? "#16a34a" : "#dc2626" }}>{r.success ? "Sent" : "Failed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── lead row ───────────────────────────────────────────────────── */
function LeadRow({ lead, index, sending, sendResult }: {
  lead: Lead; index: number; sending: boolean;
  sendResult?: { success: boolean; error?: string };
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"email" | "subject" | "body" | null>(null);
  const copy = async (text: string, key: "email" | "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, opacity: sending ? 0.4 : 1, transition: "opacity 0.2s" }}>
      <div className="lead-row">
        <span style={{ fontSize: 12, color: INK3, fontWeight: 500 }}>{String(index + 1).padStart(2, "0")}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>{lead.companyName}</div>
          <div style={{ fontSize: 12, color: INK2, marginTop: 2 }}>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</div>
        </div>
        <button className="lead-contact-col" onClick={() => copy(lead.email, "email")} data-testid={`button-copy-email-${lead.id}`}
          style={{ fontFamily: "monospace", fontSize: 12, color: INK2, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          {copied === "email" ? "Copied ✓" : lead.email}
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          {sendResult && <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: sendResult.success ? "#16a34a" : "#dc2626" }}>{sendResult.success ? "Sent" : "Failed"}</span>}
          {sending && <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: INK3 }}>Sending</span>}
          <button onClick={() => setOpen(!open)} data-testid={`button-expand-email-${lead.id}`}
            style={{ fontSize: 12, fontWeight: 500, color: INK2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {open ? "Close" : "View →"}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ paddingLeft: 52, paddingBottom: 24, paddingRight: 8 }}>
          <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3, marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{lead.emailSubject}</div>
              </div>
              <button onClick={() => copy(lead.emailSubject, "subject")} data-testid={`button-copy-subject-${lead.id}`}
                className="outline-btn" style={{ fontSize: 11, padding: "5px 12px", flexShrink: 0 }}>
                {copied === "subject" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3 }}>Email Body</span>
                <button onClick={() => copy(lead.emailBody, "body")} data-testid={`button-copy-body-${lead.id}`}
                  className="outline-btn" style={{ fontSize: 11, padding: "5px 12px" }}>
                  {copied === "body" ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: INK2, whiteSpace: "pre-line", margin: 0 }}>{lead.emailBody}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading ────────────────────────────────────────────────────── */
function LoadingView() {
  const steps = ["Scanning the market...", "Identifying prospects...", "Writing cold emails...", "Finalising your report..."];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(n => (n < steps.length - 1 ? n + 1 : n)), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "64px 32px" }}>
      <div style={{ display: "inline-block", width: 28, height: 28, border: `2px solid ${BORDER}`, borderTop: `2px solid ${INK}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 16 }} />
      <p style={{ fontSize: 15, color: INK2 }}>{steps[i]}</p>
    </div>
  );
}

const EXAMPLES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
];

/* ─── app (protected dashboard) ─────────────────────────────────── */
export default function App() {
  const [, navigate] = useLocation();
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: auth } = useQuery<AuthStatus>({ queryKey: ["/api/auth/status"], refetchInterval: false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "true") {
      toast({ title: "Gmail connected." });
      window.history.replaceState({}, "", "/app");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title: "Connection failed.", variant: "destructive" });
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  useEffect(() => {
    if (!meLoading && !me) {
      navigate("/login");
    }
  }, [me, meLoading]);

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Gmail disconnected." });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { businessType: string; location: string }) => {
      const res = await apiRequest("POST", "/api/generate-leads", data);
      if (!res.ok) {
        if (res.status === 401) { navigate("/login"); throw new Error("Not authenticated"); }
        const body = await res.json();
        throw new Error(body.error || "Failed to generate leads");
      }
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      setSendData(null);
      setSendResults({});
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    },
    onError: (err: any) => { toast({ title: "Generation failed.", description: err.message, variant: "destructive" }); },
  });

  const sendMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      const res = await apiRequest("POST", "/api/send-emails", { leads });
      return res.json() as Promise<SendEmailsResponse>;
    },
    onSuccess: (data) => {
      setSendData(data);
      const map: Record<number, { success: boolean; error?: string }> = {};
      if (result) data.results.forEach((r, i) => { map[result.leads[i]?.id] = r; });
      setSendResults(map);
    },
    onError: (err: any) => { toast({ title: "Send failed.", description: err.message, variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      toast({ title: "Enter a business type and location.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({ businessType: businessType.trim(), location: location.trim() });
  };

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map(l => l.email).join(", "));
    toast({ title: "Copied all emails." });
  };

  if (meLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: S }}>
        <style>{GLOBAL}</style>
        <div style={{ display: "inline-block", width: 28, height: 28, border: `2px solid ${BORDER}`, borderTop: `2px solid ${INK}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  if (!me) return null;

  return (
    <>
      <style>{GLOBAL}</style>
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      {/* ── navbar ─────────────────────────────────────────────── */}
      <header style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img src={logoSrc} alt="Outleadr" style={{ height: 120, width: "auto", marginLeft: -26, marginRight: -26 }} />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: INK3 }} data-testid="text-user-email">{me.email}</span>
            {auth?.connected ? (
              <button className="outline-btn" onClick={() => disconnectMutation.mutate()} data-testid="button-disconnect-gmail">
                Disconnect Gmail
              </button>
            ) : (
              <a href="/api/auth/google" data-testid="button-connect-gmail" className="outline-btn" style={{ textDecoration: "none" }}>
                Connect Gmail →
              </a>
            )}
            <button className="outline-btn" onClick={() => logoutMutation.mutate()} data-testid="button-logout"
              style={{ color: INK3, borderColor: "rgba(0,0,0,0.1)" }}>
              Log out
            </button>
          </nav>
        </div>
      </header>

      {/* ── page header ────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: INK, letterSpacing: "-0.03em", marginBottom: 4 }}>Lead Generator</h1>
          <p style={{ fontSize: 14, color: INK2 }}>Enter a business type and city to find qualified prospects with personalised cold emails — ready to send in seconds.</p>
        </div>
      </div>

      {/* ── form ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 0" }}>
        <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "28px 28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
              <div>
                <label className="lf-label">Business Type</label>
                <input className="lf-input" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="plumbers, dentists…" data-testid="input-business-type" />
              </div>
              <div>
                <label className="lf-label">Location</label>
                <input className="lf-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Houston, TX…" data-testid="input-location" />
              </div>
              <button type="submit" className="pill-btn" disabled={generateMutation.isPending} data-testid="button-generate-leads"
                style={{ padding: "13px 28px", fontSize: 14, whiteSpace: "nowrap", height: 48 }}>
                {generateMutation.isPending ? "Finding prospects…" : "Find prospects →"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.business} type="button"
                  onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                  data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                  style={{ padding: "5px 12px", borderRadius: 99, background: BG, border: `1px solid ${BORDER}`, fontSize: 12, color: INK2, cursor: "pointer" }}>
                  {ex.business}, {ex.location}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* loading */}
      {generateMutation.isPending && <LoadingView />}

      {/* ── results ──────────────────────────────────────────────── */}
      {result && !generateMutation.isPending && (
        <div ref={resultsRef} style={{ maxWidth: 1100, margin: "24px auto 80px", padding: "0 32px" }}>
          <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {/* results toolbar */}
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: INK3 }}>Results · </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{result.leads.length} prospects</span>
                <span style={{ fontSize: 13, color: INK2 }}> · {result.businessType} in {result.location}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="outline-btn" onClick={copyAllEmails} data-testid="button-copy-all-emails">Copy all emails</button>
                <button className="outline-btn" onClick={() => generateMutation.mutate({ businessType, location })} data-testid="button-regenerate">Regenerate</button>
                {auth?.connected ? (
                  <button className="pill-btn" onClick={() => sendMutation.mutate(result.leads)} disabled={sendMutation.isPending}
                    data-testid="button-send-all-emails" style={{ padding: "9px 20px", fontSize: 13 }}>
                    {sendMutation.isPending ? "Sending…" : "Send all via Gmail"}
                  </button>
                ) : (
                  <a href="/api/auth/google" data-testid="button-connect-gmail-results" className="pill-btn"
                    style={{ padding: "9px 20px", fontSize: 13, textDecoration: "none" }}>
                    Connect Gmail to send
                  </a>
                )}
              </div>
            </div>
            {/* column headers */}
            <div className="lead-row" style={{ padding: "8px 24px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
              {["#", "Company", "Email", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: INK3 }}>{h}</span>
              ))}
            </div>
            {/* rows */}
            <div style={{ padding: "0 24px" }}>
              {result.leads.map((lead, i) => (
                <LeadRow key={lead.id} lead={lead} index={i}
                  sending={sendMutation.isPending && !sendResults[lead.id]}
                  sendResult={sendResults[lead.id]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
