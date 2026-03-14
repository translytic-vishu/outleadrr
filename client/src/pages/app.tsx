import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse, MeResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";

/* ─── Design Tokens ───────────────────────────────────────────────── */
const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const W    = "#ffffff";
const K    = "#0a0a0a";
const K2   = "#3a3a3a";
const K3   = "#888";
const K4   = "#c4c4c8";
const BDR  = "rgba(0,0,0,0.07)";
const BDR2 = "rgba(0,0,0,0.12)";
const IND  = "#6366f1";
const IND2 = "rgba(99,102,241,0.08)";

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{font-family:${F};}
  input,button,select,textarea{font-family:${F};}
  input::placeholder,textarea::placeholder{color:${K4};}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  .cb-input{
    width:100%;padding:10px 14px;
    background:${W};border:1.5px solid #e4e4e8;
    border-radius:9px;font-size:14px;color:${K};outline:none;
    transition:border-color .18s,box-shadow .18s;
  }
  .cb-input:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  .cb-select{
    width:100%;padding:10px 14px;
    background:${W};border:1.5px solid #e4e4e8;
    border-radius:9px;font-size:14px;color:${K};outline:none;
    appearance:none;cursor:pointer;
    transition:border-color .18s,box-shadow .18s;
  }
  .cb-select:focus{border-color:${IND};box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  .lead-card{
    animation: fadeUp .3s ease both;
  }
  .send-btn{
    padding:10px 20px;border-radius:9px;border:none;
    background:${IND};color:${W};font-size:13px;font-weight:700;
    cursor:pointer;font-family:${F};transition:all .15s;
    box-shadow:0 2px 10px rgba(99,102,241,.3);
  }
  .send-btn:hover:not(:disabled){background:#4f46e5;transform:translateY(-1px);}
  .send-btn:disabled{opacity:.5;cursor:not-allowed;}
`;

/* ─── Persona definitions ─────────────────────────────────────────── */
type Tone = "professional" | "friendly" | "direct" | "humorous" | "persuasive" | "casual" | "consultative" | "bold";

const PERSONAS: { tone: Tone; name: string; title: string; desc: string; photo: string; color: string }[] = [
  { tone: "professional", name: "Alex Morgan", title: "Enterprise AE", desc: "Formal, polished, results-driven", photo: "https://randomuser.me/api/portraits/men/32.jpg", color: "#3b82f6" },
  { tone: "friendly",    name: "Jamie Chen",  title: "SMB Advisor",    desc: "Warm, approachable, conversational", photo: "https://randomuser.me/api/portraits/women/44.jpg", color: "#10b981" },
  { tone: "direct",      name: "Marcus Reid", title: "Sales Director",  desc: "No fluff, straight to the point", photo: "https://randomuser.me/api/portraits/men/55.jpg", color: "#f59e0b" },
  { tone: "humorous",    name: "Zoe Park",    title: "Growth Hacker",   desc: "Witty, memorable, stands out", photo: "https://randomuser.me/api/portraits/women/68.jpg", color: "#ec4899" },
  { tone: "persuasive",  name: "Jordan Blake", title: "Revenue Lead",  desc: "Compelling hooks, urgency-driven", photo: "https://randomuser.me/api/portraits/men/14.jpg", color: "#8b5cf6" },
  { tone: "casual",      name: "Sam Torres",  title: "BDR",             desc: "Relaxed, peer-to-peer energy", photo: "https://randomuser.me/api/portraits/women/22.jpg", color: "#06b6d4" },
  { tone: "consultative",name: "Dana Kim",    title: "Solutions Consul.", desc: "Advisory, insight-led, trusted", photo: "https://randomuser.me/api/portraits/women/37.jpg", color: "#6366f1" },
  { tone: "bold",        name: "Ryder Fox",   title: "Founder",          desc: "Disruptive, confident, direct", photo: "https://randomuser.me/api/portraits/men/78.jpg", color: "#ef4444" },
];

/* ─── Lead score badge ────────────────────────────────────────────── */
function ScoreBadge({ label, score }: { label: string; score: number }) {
  const bg = label === "Strong Lead" ? "#dcfce7" : label === "Good Lead" ? "#fef9c3" : "#fee2e2";
  const col = label === "Strong Lead" ? "#16a34a" : label === "Good Lead" ? "#ca8a04" : "#dc2626";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: bg, color: col, letterSpacing: ".03em" }}>
      {label} · {score}
    </span>
  );
}

/* ─── Email preview panel ─────────────────────────────────────────── */
function EmailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: W, borderRadius: 16, width: "100%", maxWidth: 560,
        boxShadow: "0 24px 80px rgba(0,0,0,.18)",
        animation: "fadeUp .25s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: K }}>{lead.contactName}</div>
            <div style={{ fontSize: 12, color: K3, marginTop: 2 }}>{lead.title} · {lead.companyName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: K3, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Subject</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: K }}>{lead.emailSubject}</div>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: K3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Body</div>
          <div style={{ fontSize: 13, color: K2, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{lead.emailBody}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Card ───────────────────────────────────────────────────── */
function LeadCard({ lead, selected, onToggle, onPreview, idx }: {
  lead: Lead; selected: boolean; onToggle: () => void; onPreview: () => void; idx: number;
}) {
  return (
    <div
      className="lead-card"
      style={{
        background: W, borderRadius: 12, border: selected ? `1.5px solid ${IND}` : `1px solid ${BDR2}`,
        padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14,
        transition: "border-color .15s, box-shadow .15s",
        animationDelay: `${idx * 0.04}s`,
        boxShadow: selected ? `0 0 0 3px rgba(99,102,241,.08)` : "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: 5, border: selected ? `2px solid ${IND}` : `2px solid #d1d5db`,
          background: selected ? IND : W, cursor: "pointer", flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
        }}
      >
        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: K }}>{lead.companyName}</div>
          <ScoreBadge label={lead.scoreLabel || ""} score={lead.score || 0} />
        </div>
        <div style={{ fontSize: 12, color: K3, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
          {lead.contactName && <span>{lead.contactName} · {lead.title}</span>}
          {lead.email && <span style={{ color: IND }}>{lead.email}</span>}
          {lead.phone && <span>{lead.phone}</span>}
        </div>
        <div style={{ fontSize: 12, color: K3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 520 }}>
          <span style={{ fontWeight: 600, color: K2 }}>Subject: </span>{lead.emailSubject}
        </div>
        {lead.rating && (
          <div style={{ fontSize: 11, color: K4 }}>
            {lead.rating}/5 stars · {lead.reviewCount?.toLocaleString()} reviews
          </div>
        )}
      </div>

      {/* Preview btn */}
      <button
        onClick={onPreview}
        style={{
          padding: "6px 12px", borderRadius: 7, border: `1px solid ${BDR2}`, background: W,
          fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer", flexShrink: 0,
          transition: "all .15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = IND; (e.currentTarget as HTMLButtonElement).style.color = IND; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BDR2; (e.currentTarget as HTMLButtonElement).style.color = K2; }}
      >
        Preview
      </button>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function AppPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* form state */
  const [bizType, setBizType]    = useState("");
  const [location_, setLocation_] = useState("");
  const [intent, setIntent]      = useState("");
  const [leadCount, setLeadCount] = useState(10);
  const [tone, setTone]          = useState<Tone>("professional");
  const [campaignName, setCampaignName] = useState("");

  /* results state */
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [billingError, setBillingError] = useState(false);

  /* auth */
  const { data: me } = useQuery<MeResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.json()),
    retry: false,
  });
  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  useEffect(() => {
    if (me === null || (me && !(me as any).id)) setLocation("/login");
  }, [me]);

  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (params.get("connected") === "true") {
      window.history.replaceState({}, "", "/app");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
  }, []);

  /* generate mutation */
  const generateMutation = useMutation<LeadsResponse, Error, object>({
    mutationFn: (body) => apiRequest("POST", "/api/generate-leads", body).then(async r => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.message || json.error || "Generation failed");
      return json;
    }),
    onSuccess: (data) => {
      setLeads(data.leads);
      setSelected(new Set(data.leads.map((_: Lead, i: number) => i)));
      setBillingError(false);
    },
    onError: (err) => {
      if (err.message?.includes("REQUEST_DENIED") || err.message?.toLowerCase().includes("billing")) {
        setBillingError(true);
      } else {
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      }
    },
  });

  /* send mutation */
  const sendMutation = useMutation<SendEmailsResponse, Error, object>({
    mutationFn: (body) => apiRequest("POST", "/api/send-emails", body).then(async r => {
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Send failed");
      return json;
    }),
    onSuccess: (data) => {
      toast({ title: `${data.sent} email${data.sent !== 1 ? "s" : ""} sent`, description: data.failed > 0 ? `${data.failed} failed` : "All delivered successfully" });
    },
    onError: (err) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const selectedLeads = leads.filter((_, i) => selected.has(i));

  const handleGenerate = () => {
    if (!bizType.trim() || !location_.trim()) {
      toast({ title: "Missing fields", description: "Business type and location are required", variant: "destructive" });
      return;
    }
    setBillingError(false);
    setLeads([]);
    setSelected(new Set());
    generateMutation.mutate({ businessType: bizType, location: location_, intent, leadCount, tone });
  };

  const handleSend = () => {
    if (!gmailStatus?.connected) {
      toast({ title: "Gmail not connected", description: "Connect your Gmail account first", variant: "destructive" });
      return;
    }
    sendMutation.mutate({
      leads: selectedLeads,
      campaignName: campaignName || undefined,
      businessType: bizType || undefined,
      location: location_ || undefined,
    });
  };

  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((_, i) => i)));
  };

  return (
    <AppLayout>
      <style>{GLOBAL_CSS}</style>

      {previewLead && <EmailPanel lead={previewLead} onClose={() => setPreviewLead(null)} />}

      {/* ── Page header ── */}
      <div style={{ padding: "28px 36px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Campaign Builder</h1>
          <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Find leads, generate personalized emails, and launch outreach in one flow.</p>
        </div>
        {leads.length > 0 && (
          <div style={{ fontSize: 12, color: K3, background: W, border: `1px solid ${BDR}`, borderRadius: 8, padding: "6px 14px" }}>
            {leads.length} leads generated
          </div>
        )}
      </div>

      {/* ── Billing error banner ── */}
      {billingError && (
        <div style={{ margin: "16px 36px 0", padding: "12px 18px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 2L1.5 15.5h15L9 2z" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8v3M9 13.5v.5" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>Google Places API Billing Required</div>
            <div style={{ fontSize: 12, color: "#9a3412", marginTop: 2 }}>Enable billing on your Google Cloud project to use the Places API. It stays free within quota limits.</div>
            <a href="https://console.cloud.google.com/billing" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#ea580c", fontWeight: 600, marginTop: 4, display: "inline-block" }}>Enable billing in Google Cloud Console</a>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 36px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Campaign builder card ── */}
        <div style={{ background: W, borderRadius: 16, border: `1px solid ${BDR}`, boxShadow: "0 1px 8px rgba(0,0,0,.05)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: IND2, border: `1px solid rgba(99,102,241,.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12l3-4 3 2.5 3-5 3 2.5" stroke={IND} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: K }}>New Campaign</div>
              <div style={{ fontSize: 11, color: K3 }}>Define your target and let AI build the outreach</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Business Type</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Dental clinics, Law firms"
                  value={bizType}
                  onChange={e => setBizType(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Location</label>
                <input
                  className="cb-input"
                  placeholder="e.g. Austin TX, Manhattan"
                  value={location_}
                  onChange={e => setLocation_(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>What are you pitching? <span style={{ color: K4, fontWeight: 400 }}>(optional)</span></label>
              <input
                className="cb-input"
                placeholder="e.g. Website redesign services, CRM software for small teams"
                value={intent}
                onChange={e => setIntent(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Number of Leads</label>
                <div style={{ position: "relative" }}>
                  <select className="cb-select" value={leadCount} onChange={e => setLeadCount(+e.target.value)}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} leads</option>)}
                  </select>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><path d="M2 4l4 4 4-4" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 6 }}>Campaign Name <span style={{ color: K4, fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="cb-input"
                  placeholder="e.g. Q1 Dental Outreach"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </div>
            </div>

            {/* Persona selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K2, display: "block", marginBottom: 10 }}>Email Persona & Tone</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {PERSONAS.map(p => {
                  const active = tone === p.tone;
                  return (
                    <button
                      key={p.tone}
                      onClick={() => setTone(p.tone)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                        borderRadius: 10, border: active ? `1.5px solid ${p.color}` : `1.5px solid #e4e4e8`,
                        background: active ? `${p.color}0f` : W,
                        cursor: "pointer", textAlign: "left", transition: "all .15s",
                        boxShadow: active ? `0 0 0 3px ${p.color}15` : "none",
                      }}
                    >
                      <img src={p.photo} alt={p.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `2px solid ${active ? p.color : "#e4e4e8"}`, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: active ? p.color : K, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: K3, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: K, color: W, fontSize: 14, fontWeight: 700,
                cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                opacity: generateMutation.isPending ? 0.7 : 1,
                transition: "all .15s", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,.15)",
              }}
              onMouseEnter={e => { if (!generateMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#222"; }}
              onMouseLeave={e => { if (!generateMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = K; }}
            >
              {generateMutation.isPending ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5v2M7.5 11.5v2M1.5 7.5h2M11.5 7.5h2M3.4 3.4l1.42 1.42M10.18 10.18l1.42 1.42M3.4 11.6l1.42-1.42M10.18 4.82l1.42-1.42" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Generating leads...
                </>
              ) : "Generate Leads"}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {leads.length > 0 && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            {/* Results header + sticky send bar */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              background: "rgba(248,248,249,0.92)", backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${BDR}`,
              padding: "12px 0 12px", marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={toggleAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 7, border: `1px solid ${BDR2}`,
                    background: W, fontSize: 12, fontWeight: 600, color: K2, cursor: "pointer",
                  }}
                >
                  {selected.size === leads.length ? "Deselect all" : "Select all"}
                </button>
                <span style={{ fontSize: 12, color: K3 }}>{selected.size} of {leads.length} selected</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!gmailStatus?.connected && (
                  <a
                    href="/api/auth/google"
                    style={{
                      padding: "9px 16px", borderRadius: 9, border: `1px solid ${BDR2}`,
                      background: W, color: K2, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    Connect Gmail
                  </a>
                )}
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={sendMutation.isPending || selected.size === 0 || !gmailStatus?.connected}
                >
                  {sendMutation.isPending ? "Sending..." : `Send ${selected.size > 0 ? selected.size : ""} Email${selected.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leads.map((lead, i) => (
                <LeadCard
                  key={i}
                  idx={i}
                  lead={lead}
                  selected={selected.has(i)}
                  onToggle={() => {
                    const next = new Set(selected);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    setSelected(next);
                  }}
                  onPreview={() => setPreviewLead(lead)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {leads.length === 0 && !generateMutation.isPending && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: K3 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto 16px" }}>
              <circle cx="24" cy="24" r="22" stroke="#e4e4e8" strokeWidth="2"/>
              <path d="M16 28l5-6 4 4 5-7 6 4" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: K2, marginBottom: 6 }}>No leads yet</div>
            <div style={{ fontSize: 13, color: K3 }}>Fill in the campaign details above and click Generate Leads.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
