import { useState, useRef, useEffect, useMemo } from "react";
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
const ACCENT = "#6366f1";

const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${BG}; color: ${INK}; font-family: ${S}; }
  input, button, select { font-family: ${S}; }
  input::placeholder { color: #bbb; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
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
    cursor:pointer;transition:background 0.15s,border-color 0.15s;text-decoration:none;
  }
  .outline-btn:hover{background:rgba(0,0,0,0.04);}
  .outline-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .lf-input {
    width:100%;padding:13px 16px;
    background:${WHITE};border:1px solid rgba(0,0,0,0.1);
    border-radius:10px;font-family:${S};font-size:14px;
    color:${INK};outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;
  }
  .lf-input:focus{border-color:${ACCENT};box-shadow:0 0 0 3px rgba(99,102,241,0.1);}
  .lf-select {
    padding:8px 12px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;
    background:${WHITE};font-family:${S};font-size:12px;color:${INK};
    cursor:pointer;outline:none;transition:border-color 0.2s;
  }
  .lf-select:focus{border-color:${ACCENT};}
  .lf-label{font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${INK3};display:block;margin-bottom:8px;}
  .filter-pill{padding:5px 14px;border-radius:99px;border:1px solid rgba(0,0,0,0.12);background:${WHITE};font-size:12px;font-weight:500;color:${INK2};cursor:pointer;transition:background 0.15s,border-color 0.15s,color 0.15s;}
  .filter-pill:hover{background:rgba(0,0,0,0.04);}
  .filter-pill.active{background:${INK};color:${WHITE};border-color:${INK};}
  .skeleton{animation:skeletonPulse 1.5s ease-in-out infinite;background:#e5e7eb;border-radius:6px;}
  @media(max-width:680px){
    .form-grid{grid-template-columns:1fr !important;}
    .toolbar-row{flex-direction:column !important;align-items:flex-start !important;}
  }
`;

/* ─── send results overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  const allSent = data.sent === data.total;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: 20, background: WHITE, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: INK3, marginBottom: 6 }}>Send Report</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: allSent ? "#16a34a" : INK, letterSpacing: "-0.03em" }}>{data.sent} of {data.total} sent</div>
            {data.failed > 0 && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{data.failed} failed</div>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 99, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: INK2, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "12px 28px 24px" }}>
          {data.results.map(r => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: INK2 }}>{r.email}</span>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: r.success ? "#16a34a" : "#dc2626" }}>{r.success ? "✓ Sent" : "✗ Failed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── score helpers ──────────────────────────────────────────────── */
function scoreColor(v: number) { return v >= 70 ? "#16a34a" : v >= 45 ? "#ea580c" : "#dc2626"; }
function scoreBg(v: number)    { return v >= 70 ? "#f0fdf4" : v >= 45 ? "#fff7ed" : "#fef2f2"; }
function labelColor(l: string) { return l === "Strong Lead" ? "#16a34a" : l === "Good Lead" ? "#ea580c" : "#dc2626"; }
function labelBg(l: string)    { return l === "Strong Lead" ? "#f0fdf4" : l === "Good Lead" ? "#fff7ed" : "#fef2f2"; }
function labelBorder(l: string){ return l === "Strong Lead" ? "#bbf7d0" : l === "Good Lead" ? "#fed7aa" : "#fecaca"; }

function ScoreBar({ label, value }: { label: string; value: number }) {
  const col = scoreColor(value);
  const trackBg = value >= 70 ? "#dcfce7" : value >= 45 ? "#ffedd5" : "#fee2e2";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: INK2, width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: trackBg, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 99, background: col, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: col, width: 32, textAlign: "right", flexShrink: 0 }}>{value}%</span>
    </div>
  );
}

/* ─── skeleton lead card ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden", padding: "20px 24px" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 18, width: "55%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "35%", borderRadius: 6 }} />
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 13, width: 160, borderRadius: 6 }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 8 }}>
        {[80, 60, 70, 50, 65].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 8, width: `${w}%`, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}

/* ─── lead card ──────────────────────────────────────────────────── */
function LeadCard({ lead, index, sending, sendResult }: {
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

  const score = lead.score ?? 62;
  const scoreLabel = lead.scoreLabel ?? "Good Lead";
  const sb = lead.scoreBreakdown;

  return (
    <div data-testid={`card-lead-${lead.id}`} style={{
      background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)",
      overflow: "hidden", opacity: sending ? 0.5 : 1, transition: "opacity 0.2s, box-shadow 0.2s",
      animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 50}ms both`,
    }}>
      {/* ── top section ── */}
      <div style={{ padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Score circle */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: scoreBg(score), border: `2px solid ${scoreColor(score)}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 8, color: scoreColor(score), fontWeight: 600, opacity: 0.7 }}>/100</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: labelColor(scoreLabel), background: labelBg(scoreLabel), border: `1px solid ${labelBorder(scoreLabel)}`, borderRadius: 99, padding: "2px 7px", textAlign: "center", whiteSpace: "nowrap" }} data-testid={`text-score-label-${lead.id}`}>{scoreLabel}</span>
        </div>

        {/* Lead info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }} data-testid={`text-company-${lead.id}`}>{lead.companyName}</div>
              <div style={{ fontSize: 13, color: INK2, marginTop: 2 }}>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {sendResult && (
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: sendResult.success ? "#16a34a" : "#dc2626", background: sendResult.success ? "#f0fdf4" : "#fef2f2", border: `1px solid ${sendResult.success ? "#bbf7d0" : "#fecaca"}`, padding: "3px 10px", borderRadius: 99 }}>
                  {sendResult.success ? "✓ Sent" : "✗ Failed"}
                </span>
              )}
              {sending && <span style={{ fontSize: 10, fontWeight: 600, color: INK3 }}>Sending…</span>}
            </div>
          </div>

          {/* Contact info row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 10 }}>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} data-testid={`text-phone-${lead.id}`}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: INK, textDecoration: "none" }}>
                <span style={{ fontSize: 14 }}>📞</span> {lead.phone}
              </a>
            )}
            <button onClick={() => copy(lead.email, "email")} data-testid={`button-copy-email-${lead.id}`}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              <span style={{ fontSize: 13 }}>✉</span>
              <span style={{ fontFamily: "monospace", fontSize: 12 }}>{copied === "email" ? "Copied ✓" : lead.email}</span>
            </button>
            {lead.website && (
              <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer"
                data-testid={`link-website-${lead.id}`}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: INK3, textDecoration: "none" }}>
                <span>🌐</span>
                <span style={{ fontFamily: "monospace" }}>{lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 30)}</span>
              </a>
            )}
            {(lead.rating ?? 0) > 0 && (
              <span style={{ fontSize: 12, color: INK2, display: "flex", alignItems: "center", gap: 4 }}>
                ⭐ {lead.rating?.toFixed(1)} <span style={{ color: INK3 }}>({lead.reviewCount?.toLocaleString()} reviews)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── score breakdown ── */}
      {sb && (
        <div style={{ padding: "14px 24px 16px", borderTop: `1px solid ${BORDER}`, background: "#fafafa" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: INK3, marginBottom: 10 }}>Score Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <ScoreBar label="Industry Fit"  value={sb.industryFit} />
            <ScoreBar label="Business Size" value={sb.businessSize} />
            <ScoreBar label="Reachability"  value={sb.reachability} />
            <ScoreBar label="Opportunity"   value={sb.opportunity} />
            <ScoreBar label="Review Health" value={sb.reviewHealth} />
          </div>
        </div>
      )}

      {/* ── email section ── */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={() => setOpen(!open)} data-testid={`button-expand-email-${lead.id}`}
          style={{ width: "100%", padding: "11px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 600, color: INK2, display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" }}>
          <span style={{ fontSize: 14 }}>✉</span>
          {open ? "Hide AI email" : "View AI email →"}
          <span style={{ marginLeft: "auto", fontSize: 10, color: INK3 }}>{lead.emailSubject ? `"${lead.emailSubject.slice(0, 40)}…"` : ""}</span>
        </button>
        {open && (
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ background: WHITE, borderRadius: 10, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: INK3, marginBottom: 3 }}>Subject</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{lead.emailSubject}</div>
                </div>
                <button onClick={() => copy(lead.emailSubject, "subject")} data-testid={`button-copy-subject-${lead.id}`}
                  className="outline-btn" style={{ fontSize: 11, padding: "5px 12px", flexShrink: 0 }}>
                  {copied === "subject" ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
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
    </div>
  );
}

const EXAMPLES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
];

type SortKey = "score-desc" | "score-asc" | "name";
type FilterLabel = "all" | "Strong Lead" | "Good Lead" | "Weak Lead";

/* ─── app (protected dashboard) ─────────────────────────────────── */
export default function App() {
  const [, navigate] = useLocation();
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const [sortBy, setSortBy] = useState<SortKey>("score-desc");
  const [filterLabel, setFilterLabel] = useState<FilterLabel>("all");
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
      toast({ title: "Gmail connected successfully." });
      window.history.replaceState({}, "", "/app");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title: "Connection failed. Please try again.", variant: "destructive" });
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
    onSuccess: () => { queryClient.clear(); navigate("/"); },
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
        if (res.status === 503) {
          const err: any = new Error(body.message || body.error);
          err.isApiKeyMissing = true;
          throw err;
        }
        throw new Error(body.message || body.error || "Failed to generate leads");
      }
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setApiKeyMissing(false);
      setResult(data);
      setSendData(null);
      setSendResults({});
      setFilterLabel("all");
      setSortBy("score-desc");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    },
    onError: (err: any) => {
      if (err.isApiKeyMissing) setApiKeyMissing(true);
      else toast({ title: "Generation failed.", description: err.message, variant: "destructive" });
    },
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
    toast({ title: "Copied all emails to clipboard." });
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = ["Company", "Contact", "Title", "Email", "Phone", "Website", "Address", "Rating", "Reviews", "Score", "Label"];
    const rows = result.leads.map(l => [
      l.companyName, l.contactName, l.title ?? "", l.email,
      l.phone ?? "", l.website ?? "", l.address ?? "",
      l.rating ?? "", l.reviewCount ?? "", l.score ?? "", l.scoreLabel ?? "",
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outleadrr-${result.businessType.replace(/\s+/g, "-")}-${result.location.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV downloaded." });
  };

  /* ── computed displayed leads ── */
  const displayedLeads = useMemo(() => {
    if (!result) return [];
    let leads = [...result.leads];
    if (filterLabel !== "all") leads = leads.filter(l => l.scoreLabel === filterLabel);
    if (sortBy === "score-desc") leads.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sortBy === "score-asc") leads.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    else if (sortBy === "name") leads.sort((a, b) => a.companyName.localeCompare(b.companyName));
    return leads;
  }, [result, sortBy, filterLabel]);

  /* ── summary stats ── */
  const summaryStats = useMemo(() => {
    if (!result || result.leads.length === 0) return null;
    const leads = result.leads;
    const avgScore = Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length);
    const strongCount = leads.filter(l => l.scoreLabel === "Strong Lead").length;
    const withPhone = leads.filter(l => l.phone).length;
    return { avgScore, strongCount, withPhone, total: leads.length };
  }, [result]);

  if (meLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: S }}>
        <style>{GLOBAL}</style>
        <div style={{ display: "inline-block", width: 24, height: 24, border: `2px solid ${BORDER}`, borderTop: `2px solid ${INK}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  if (!me) return null;

  return (
    <>
      <style>{GLOBAL}</style>
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      {/* ── navbar ─────────────────────────────────────────────── */}
      <header style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img src={logoSrc} alt="Outleadrr" style={{ height: 32, width: "auto" }} />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: INK3 }} data-testid="text-user-email">{me.email}</span>
            {auth?.connected ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  {auth.email}
                </span>
                <button className="outline-btn" onClick={() => disconnectMutation.mutate()} data-testid="button-disconnect-gmail"
                  style={{ fontSize: 12, padding: "6px 14px" }}>
                  Disconnect Gmail
                </button>
              </div>
            ) : (
              <a href="/api/auth/google" data-testid="button-connect-gmail" className="pill-btn"
                style={{ textDecoration: "none", fontSize: 13, padding: "8px 18px" }}>
                Connect Gmail →
              </a>
            )}
            <button className="outline-btn" onClick={() => logoutMutation.mutate()} data-testid="button-logout"
              style={{ color: INK3, borderColor: "rgba(0,0,0,0.1)", fontSize: 12, padding: "6px 14px" }}>
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
                <input className="lf-input" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="plumbers, dentists, HVAC companies…" data-testid="input-business-type" />
              </div>
              <div>
                <label className="lf-label">Location</label>
                <input className="lf-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Houston, TX…" data-testid="input-location" />
              </div>
              <button type="submit" className="pill-btn" disabled={generateMutation.isPending} data-testid="button-generate-leads"
                style={{ padding: "13px 28px", fontSize: 14, whiteSpace: "nowrap", height: 48 }}>
                {generateMutation.isPending
                  ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Finding…</>
                  : "Find prospects →"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.business} type="button"
                  onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                  data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                  style={{ padding: "5px 12px", borderRadius: 99, background: BG, border: `1px solid ${BORDER}`, fontSize: 12, color: INK2, cursor: "pointer", transition: "background 0.15s" }}>
                  {ex.business}, {ex.location}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* api key missing banner */}
      {apiKeyMissing && (
        <div style={{ maxWidth: 1100, margin: "20px auto 0", padding: "0 32px" }}>
          <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 14, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔑</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#854d0e", marginBottom: 6 }}>Google Places API key required</div>
              <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, margin: 0 }}>
                To pull real business data, add your <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.06)", padding: "1px 5px", borderRadius: 4 }}>GOOGLE_PLACES_API_KEY</code> to your environment secrets.
                Get a key at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#854d0e", fontWeight: 600 }}>Google Cloud Console</a>
                {" "}→ APIs &amp; Services → enable <strong>Places API</strong> → Create API key.
                See <strong>SETUP.md</strong> in this project for full instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* skeleton loading */}
      {generateMutation.isPending && (
        <div style={{ maxWidth: 1100, margin: "24px auto 0", padding: "0 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: INK3, marginTop: 20, marginBottom: 8 }}>Finding real businesses and writing personalised emails…</p>
        </div>
      )}

      {/* ── results ──────────────────────────────────────────────── */}
      {result && !generateMutation.isPending && (
        <div ref={resultsRef} style={{ maxWidth: 1100, margin: "24px auto 80px", padding: "0 32px" }}>

          {/* summary stats bar */}
          {summaryStats && (
            <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "12px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 13, color: INK3 }}>📊</span>
              <span style={{ fontSize: 13, color: INK2 }}><strong style={{ color: INK }}>{summaryStats.total}</strong> prospects found</span>
              <span style={{ color: BORDER, fontSize: 16 }}>|</span>
              <span style={{ fontSize: 13, color: INK2 }}>Avg score: <strong style={{ color: INK }}>{summaryStats.avgScore}</strong></span>
              <span style={{ color: BORDER, fontSize: 16 }}>|</span>
              <span style={{ fontSize: 13, color: INK2 }}><strong style={{ color: "#16a34a" }}>{summaryStats.strongCount}</strong> Strong Leads</span>
              <span style={{ color: BORDER, fontSize: 16 }}>|</span>
              <span style={{ fontSize: 13, color: INK2 }}><strong style={{ color: INK }}>{summaryStats.withPhone}</strong> with phone number</span>
            </div>
          )}

          {/* toolbar */}
          <div className="toolbar-row" style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {/* left: filter pills + sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {(["all", "Strong Lead", "Good Lead", "Weak Lead"] as FilterLabel[]).map(f => (
                <button key={f} className={`filter-pill${filterLabel === f ? " active" : ""}`}
                  onClick={() => setFilterLabel(f)}
                  style={{ textTransform: f === "all" ? "capitalize" : "none" }}>
                  {f === "all" ? `All (${result.leads.length})` : f}
                </button>
              ))}
              <select className="lf-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} style={{ marginLeft: 8 }}>
                <option value="score-desc">Score: High → Low</option>
                <option value="score-asc">Score: Low → High</option>
                <option value="name">Name A → Z</option>
              </select>
            </div>
            {/* right: action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="outline-btn" onClick={copyAllEmails} data-testid="button-copy-all-emails">Copy all emails</button>
              <button className="outline-btn" onClick={exportCSV} data-testid="button-export-csv">Export CSV</button>
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

          {/* displayed count when filtering */}
          {filterLabel !== "all" && (
            <p style={{ fontSize: 13, color: INK3, marginBottom: 12, paddingLeft: 4 }}>
              Showing {displayedLeads.length} of {result.leads.length} leads · filtered by <strong style={{ color: labelColor(filterLabel) }}>{filterLabel}</strong>
              <button onClick={() => setFilterLabel("all")} style={{ background: "none", border: "none", cursor: "pointer", color: ACCENT, fontSize: 13, marginLeft: 8, padding: 0, fontFamily: S }}>Clear filter ×</button>
            </p>
          )}

          {/* lead cards */}
          {displayedLeads.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {displayedLeads.map((lead, i) => (
                <LeadCard key={lead.id} lead={lead} index={i}
                  sending={sendMutation.isPending && !sendResults[lead.id]}
                  sendResult={sendResults[lead.id]} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 32px", background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>No {filterLabel} leads found</div>
              <p style={{ fontSize: 14, color: INK2, marginBottom: 16 }}>Try a different filter or regenerate results.</p>
              <button className="outline-btn" onClick={() => setFilterLabel("all")}>Show all leads</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
