import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

/* ─── type tokens ────────────────────────────────────────────────── */
const T = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', 'Helvetica Neue', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  white: "#ffffff",
  dim: "rgba(255,255,255,0.38)",
  faint: "rgba(255,255,255,0.14)",
  rule: "rgba(255,255,255,0.1)",
};

const HR = () => (
  <div style={{ height: 1, background: T.rule, width: "100%" }} />
);

const Label = ({ children, style }: { children: string; style?: React.CSSProperties }) => (
  <span style={{
    fontFamily: T.sans, fontSize: 9, fontWeight: 400,
    letterSpacing: "0.22em", textTransform: "uppercase",
    color: T.dim, ...style,
  }}>{children}</span>
);

/* ─── send results overlay ───────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontFamily: T.sans, fontSize: 9, fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: T.dim }}>
              Report
            </p>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 36, fontWeight: 400, color: T.white, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {data.sent} of {data.total}<br />
              <em>emails sent.</em>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: T.sans, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.dim, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Close
          </button>
        </div>
        <HR />
        <div style={{ marginTop: 0 }}>
          {data.results.map((r, i) => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: r.success ? T.dim : "rgba(255,255,255,0.2)", letterSpacing: "-0.01em" }}>
                {r.email}
              </span>
              <span style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: r.success ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                {r.success ? "Sent" : r.error || "Failed"}
              </span>
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
    <div style={{ borderBottom: `1px solid ${T.rule}` }}>
      {/* main row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr 1fr auto",
        gap: "0 28px",
        padding: "24px 0",
        alignItems: "start",
        opacity: sending ? 0.35 : 1,
        transition: "opacity 0.2s",
      }}
        className="lead-row-grid"
      >
        {/* index */}
        <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: 400, color: T.faint, paddingTop: 2, letterSpacing: "0.04em" }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* company + contact */}
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 400, color: T.white, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 6 }}>
            {lead.companyName}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 300, color: T.dim, letterSpacing: "0.01em" }}>
            {lead.contactName}{lead.title ? ` — ${lead.title}` : ""}
          </div>
        </div>

        {/* email */}
        <div>
          <button
            onClick={() => copy(lead.email, "email")}
            data-testid={`button-copy-email-${lead.id}`}
            title="Copy email"
            style={{
              fontFamily: T.mono, fontSize: 12, color: T.dim,
              background: "none", border: "none", cursor: "pointer",
              padding: 0, textAlign: "left", letterSpacing: "-0.01em",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.white; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.dim; }}
          >
            {copied === "email" ? "Copied ✓" : lead.email}
          </button>
          {lead.phone && (
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, marginTop: 5, letterSpacing: "-0.01em" }}>{lead.phone}</div>
          )}
        </div>

        {/* status + expand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, paddingTop: 2 }}>
          {sendResult ? (
            <Label style={{ color: sendResult.success ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
              {sendResult.success ? "Sent" : "Failed"}
            </Label>
          ) : sending ? (
            <Label>Sending</Label>
          ) : null}
          <button
            onClick={() => setOpen(!open)}
            data-testid={`button-expand-email-${lead.id}`}
            style={{
              fontFamily: T.sans, fontSize: 9, fontWeight: 400,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: T.faint, background: "none", border: "none",
              cursor: "pointer", padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.white; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.faint; }}
          >
            {open ? "Close" : "Email →"}
          </button>
        </div>
      </div>

      {/* expanded email */}
      {open && (
        <div style={{ paddingBottom: 32, paddingLeft: 72 }} className="lead-email-expanded">
          {/* subject */}
          <div style={{ marginBottom: 20 }}>
            <Label style={{ display: "block", marginBottom: 10 }}>Subject</Label>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontFamily: T.serif, fontSize: 17, fontWeight: 400, color: T.white, letterSpacing: "-0.01em", lineHeight: 1.4, maxWidth: "70%" }}>
                {lead.emailSubject}
              </p>
              <button
                onClick={() => copy(lead.emailSubject, "subject")}
                data-testid={`button-copy-subject-${lead.id}`}
                style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: copied === "subject" ? T.dim : T.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {copied === "subject" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <HR />

          {/* body */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <Label>Email body</Label>
              <button
                onClick={() => copy(lead.emailBody, "body")}
                data-testid={`button-copy-body-${lead.id}`}
                style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: copied === "body" ? T.dim : T.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {copied === "body" ? "Copied" : "Copy"}
              </button>
            </div>
            <p style={{ margin: 0, fontFamily: T.sans, fontSize: 14, fontWeight: 300, lineHeight: 1.9, color: T.dim, whiteSpace: "pre-line", maxWidth: 580 }}>
              {lead.emailBody}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading ────────────────────────────────────────────────────── */
function LoadingView() {
  const phrases = [
    "Scanning the market.",
    "Identifying prospects.",
    "Profiling companies.",
    "Writing cold emails.",
    "Finalising your report.",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n < phrases.length - 1 ? n + 1 : n)), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ padding: "80px 0 100px", textAlign: "center" }}>
      <p style={{ margin: 0, fontFamily: T.serif, fontSize: 32, fontWeight: 400, fontStyle: "italic", color: T.dim, letterSpacing: "-0.01em" }}>
        {phrases[i]}
      </p>
    </div>
  );
}

/* ─── quick examples ─────────────────────────────────────────────── */
const EXAMPLES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

/* ─── line input ─────────────────────────────────────────────────── */
function LineInput({ label, value, onChange, placeholder, testid }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; testid: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ flex: 1 }}>
      <Label style={{ display: "block", marginBottom: 16 }}>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testid}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: "block", width: "100%",
          background: "none", border: "none",
          borderBottom: `1px solid ${focused ? "rgba(255,255,255,0.5)" : T.rule}`,
          borderRadius: 0, padding: "0 0 14px",
          fontFamily: T.sans, fontSize: 15, fontWeight: 300,
          color: T.white, outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

/* ─── dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auth } = useQuery<AuthStatus>({ queryKey: ["/api/auth/status"], refetchInterval: false });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "true") {
      toast({ title: "Gmail connected." });
      window.history.replaceState({}, "", "/");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (p.get("error")) {
      toast({ title: "Connection failed.", variant: "destructive" });
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Disconnected." });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { businessType: string; location: string }) => {
      const res = await apiRequest("POST", "/api/generate-leads", data);
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      setSendData(null);
      setSendResults({});
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    },
    onError: (err: any) => {
      toast({ title: "Generation failed.", description: err.message, variant: "destructive" });
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
    onError: (err: any) => {
      toast({ title: "Send failed.", description: err.message, variant: "destructive" });
    },
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
    await navigator.clipboard.writeText(result.leads.map((l) => l.email).join(", "));
    toast({ title: "Copied." });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: T.white }}>
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      {/* ── nav ───────────────────────────────────────────────────── */}
      <header style={{ borderBottom: `1px solid ${T.rule}` }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "0 48px",
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 400, letterSpacing: "-0.01em", color: T.white }}>
            LeadForge
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {auth?.connected ? (
              <>
                <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase", color: T.faint }}>
                  {auth.email}
                </span>
                <button
                  onClick={() => disconnectMutation.mutate()}
                  data-testid="button-disconnect-gmail"
                  style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: T.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/auth/google"
                data-testid="button-connect-gmail"
                style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 400, letterSpacing: "0.22em", textTransform: "uppercase", color: T.dim, textDecoration: "none" }}
              >
                Connect Gmail →
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── main ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 48px 160px" }}>

        {/* ── hero ───────────────────────────────────────────────── */}
        <section style={{ paddingTop: 96, paddingBottom: 80 }}>
          <Label style={{ display: "block", marginBottom: 32 }}>AI Sales Intelligence</Label>

          <h1 style={{
            margin: "0 0 0",
            fontFamily: T.serif, fontWeight: 300,
            fontSize: "clamp(64px, 10vw, 128px)",
            lineHeight: 0.95, letterSpacing: "-0.03em",
            color: T.white,
          }}>
            Find your
          </h1>
          <h1 style={{
            margin: "0 0 48px",
            fontFamily: T.serif, fontWeight: 400, fontStyle: "italic",
            fontSize: "clamp(64px, 10vw, 128px)",
            lineHeight: 0.95, letterSpacing: "-0.03em",
            color: T.white,
          }}>
            next 10 clients.
          </h1>

          <p style={{
            margin: "0 0 72px",
            fontFamily: T.sans, fontWeight: 300, fontSize: 16,
            lineHeight: 1.8, color: T.dim,
            maxWidth: 440, letterSpacing: "0.01em",
          }}>
            Enter a business category and city. We surface ten qualified prospects and write each a personalised cold email — in seconds.
          </p>

          <HR />

          {/* ── form ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ paddingTop: 40 }}>
            <div style={{ display: "flex", gap: 48, marginBottom: 48 }} className="form-row">
              <LineInput
                label="Business Type"
                value={businessType}
                onChange={setBusinessType}
                placeholder="plumbers, dentists, HVAC…"
                testid="input-business-type"
              />
              <LineInput
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="Houston, TX or Chicago…"
                testid="input-location"
              />
            </div>

            {/* examples */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 40, alignItems: "center" }}>
              <Label style={{ marginRight: 8 }}>Try —</Label>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.business}
                  type="button"
                  onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                  data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                  style={{
                    fontFamily: T.sans, fontSize: 10, fontWeight: 300,
                    letterSpacing: "0.04em", color: T.faint,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px 0",
                    textDecoration: "underline",
                    textDecorationColor: T.rule,
                    textUnderlineOffset: "3px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.dim; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.faint; }}
                >
                  {ex.business}, {ex.location}
                </button>
              ))}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={generateMutation.isPending}
              data-testid="button-generate-leads"
              style={{
                display: "inline-flex", alignItems: "center", gap: 12,
                padding: "16px 36px",
                background: generateMutation.isPending ? "transparent" : T.white,
                border: `1px solid ${generateMutation.isPending ? T.rule : T.white}`,
                color: generateMutation.isPending ? T.faint : "#000",
                fontFamily: T.sans, fontSize: 9, fontWeight: 400,
                letterSpacing: "0.28em", textTransform: "uppercase",
                cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                borderRadius: 0,
              }}
            >
              {generateMutation.isPending ? "Generating…" : "Generate 10 leads"}
            </button>
          </form>
        </section>

        {/* loading */}
        {generateMutation.isPending && <LoadingView />}

        {/* ── results ────────────────────────────────────────────── */}
        {result && !generateMutation.isPending && (
          <section ref={resultsRef}>
            <HR />

            {/* results header */}
            <div style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 16, padding: "28px 0",
            }}>
              <div>
                <Label style={{ display: "block", marginBottom: 8 }}>Results</Label>
                <p style={{ margin: 0, fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.white, letterSpacing: "-0.02em" }}>
                  {result.leads.length} prospects —{" "}
                  <em>{result.businessType}</em> in {result.location}
                </p>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={copyAllEmails}
                  data-testid="button-copy-all-emails"
                  style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: T.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Copy all emails
                </button>
                <button
                  onClick={() => generateMutation.mutate({ businessType, location })}
                  data-testid="button-regenerate"
                  style={{ fontFamily: T.sans, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: T.faint, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Regenerate
                </button>
                {auth?.connected ? (
                  <button
                    onClick={() => sendMutation.mutate(result.leads)}
                    disabled={sendMutation.isPending}
                    data-testid="button-send-all-emails"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 10,
                      padding: "12px 28px",
                      background: sendMutation.isPending ? "transparent" : T.white,
                      border: `1px solid ${sendMutation.isPending ? T.rule : T.white}`,
                      color: sendMutation.isPending ? T.faint : "#000",
                      fontFamily: T.sans, fontSize: 9, fontWeight: 400,
                      letterSpacing: "0.24em", textTransform: "uppercase",
                      cursor: sendMutation.isPending ? "not-allowed" : "pointer",
                      borderRadius: 0, transition: "all 0.2s",
                    }}
                  >
                    {sendMutation.isPending ? "Sending…" : "Send all via Gmail"}
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    data-testid="button-connect-gmail-results"
                    style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "12px 28px",
                      background: T.white, border: `1px solid ${T.white}`,
                      color: "#000", fontFamily: T.sans, fontSize: 9, fontWeight: 400,
                      letterSpacing: "0.24em", textTransform: "uppercase",
                      cursor: "pointer", borderRadius: 0, textDecoration: "none",
                    }}
                  >
                    Connect Gmail to send
                  </a>
                )}
              </div>
            </div>

            <HR />

            {/* column headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr 1fr auto",
              gap: "0 28px",
              padding: "14px 0",
              borderBottom: `1px solid ${T.rule}`,
            }} className="lead-row-grid">
              <Label>#</Label>
              <Label>Company</Label>
              <Label>Contact</Label>
              <Label></Label>
            </div>

            {/* lead rows */}
            {result.leads.map((lead, i) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                index={i}
                sending={sendMutation.isPending && !sendResults[lead.id]}
                sendResult={sendResults[lead.id]}
              />
            ))}

            <div style={{ height: 40 }} />
            <HR />
          </section>
        )}
      </main>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.15); font-weight: 300; font-family: 'Inter', sans-serif; }
        @media (max-width: 680px) {
          .form-row { flex-direction: column !important; gap: 32px !important; }
          .lead-row-grid { grid-template-columns: 32px 1fr auto !important; }
          .lead-row-grid > *:nth-child(3) { display: none; }
          .lead-email-expanded { padding-left: 0 !important; }
        }
        @media (max-width: 460px) {
          main { padding-left: 24px !important; padding-right: 24px !important; }
          header > div { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </div>
  );
}
