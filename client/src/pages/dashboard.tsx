import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

/* ─── type tokens ────────────────────────────────────────────────── */
const F = "'Fraunces', Georgia, serif";
const S = "'Inter', 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

/* ─── global CSS injected once ───────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; cursor: none !important; }
  html, body { background: #000; color: #fff; overflow-x: hidden; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes drawLine {
    from { width: 0%; opacity: 0; }
    to   { width: 100%; opacity: 1; }
  }
  @keyframes pageFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes grain {
    0%,100%{ transform:translate(0,0)     }
    10%    { transform:translate(-5%,-10%)}
    20%    { transform:translate(-15%, 5%)}
    30%    { transform:translate( 7%,-25%)}
    40%    { transform:translate(-5%, 25%)}
    50%    { transform:translate(-15%,10%)}
    60%    { transform:translate(15%, 0%) }
    70%    { transform:translate(0%,  15%)}
    80%    { transform:translate(3%,  35%)}
    90%    { transform:translate(-10%,10%)}
  }

  .page-wrap { animation: pageFade 1.2s ease forwards; }

  .char-animate {
    display: inline-block;
    opacity: 0;
    animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .draw-line {
    height: 1px;
    background: rgba(255,255,255,0.12);
    width: 0;
    opacity: 0;
    animation: drawLine 1.6s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .grain-layer {
    position: fixed; inset: -50%; z-index: 1; pointer-events: none;
    width: 200%; height: 200%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
    opacity: 0.038;
    mix-blend-mode: screen;
    animation: grain 0.6s steps(2) infinite;
  }

  #cursor-dot {
    position: fixed; top: 0; left: 0; z-index: 9999;
    width: 8px; height: 8px;
    border-radius: 50%; background: #fff;
    pointer-events: none;
    transition: transform 0.08s, width 0.3s, height 0.3s, opacity 0.3s;
    will-change: transform;
    mix-blend-mode: difference;
  }
  #cursor-ring {
    position: fixed; top: 0; left: 0; z-index: 9998;
    width: 36px; height: 36px;
    border-radius: 50%; border: 1px solid rgba(255,255,255,0.28);
    pointer-events: none;
    will-change: transform;
    mix-blend-mode: difference;
  }

  .lf-input {
    display: block; width: 100%;
    background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.12);
    border-radius: 0; padding: 0 0 14px;
    font-family: ${S}; font-size: 15px; font-weight: 200;
    color: #fff; outline: none;
    transition: border-color 0.4s, box-shadow 0.4s;
  }
  .lf-input::placeholder { color: rgba(255,255,255,0.18); font-weight: 200; }
  .lf-input:focus {
    border-bottom-color: rgba(255,255,255,0.7);
    box-shadow: 0 2px 0 0 rgba(255,255,255,0.08);
  }

  .lf-btn {
    display: inline-flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    padding: 16px 40px; border: 1px solid rgba(255,255,255,0.55);
    background: transparent; color: #fff;
    font-family: ${S}; font-size: 9px; font-weight: 500;
    letter-spacing: 0.3em; text-transform: uppercase;
    cursor: none; transition: border-color 0.4s; border-radius: 0;
  }
  .lf-btn:disabled { opacity: 0.3; cursor: none; }
  .lf-btn-fill {
    position: absolute; inset: 0;
    background: #fff;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.55s cubic-bezier(0.76, 0, 0.24, 1);
  }
  .lf-btn:not(:disabled):hover .lf-btn-fill { transform: scaleX(1); }
  .lf-btn-label {
    position: relative; z-index: 1;
    transition: color 0.25s 0.15s;
    color: #fff;
  }
  .lf-btn:not(:disabled):hover .lf-btn-label { color: #000; }
  .lf-btn:not(:disabled):hover { border-color: #fff; }

  .lf-ghost-btn {
    background: none; border: none; padding: 0;
    font-family: ${S}; font-size: 9px; font-weight: 400;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); cursor: none;
    transition: color 0.2s;
  }
  .lf-ghost-btn:hover { color: rgba(255,255,255,0.7); }

  .lead-row { border-bottom: 1px solid rgba(255,255,255,0.07); transition: background 0.2s; }
  .lead-row:hover { background: rgba(255,255,255,0.018); }

  .email-link {
    font-family: ${M}; font-size: 12px; color: rgba(255,255,255,0.35);
    background: none; border: none; padding: 0; cursor: none;
    letter-spacing: -0.01em; transition: color 0.2s; text-align: left;
  }
  .email-link:hover { color: rgba(255,255,255,0.75); }

  .expand-btn {
    font-family: ${S}; font-size: 9px; font-weight: 400;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255,255,255,0.2); background: none; border: none;
    cursor: none; transition: color 0.2s; white-space: nowrap;
  }
  .expand-btn:hover { color: rgba(255,255,255,0.6); }

  .hr { height: 1px; background: rgba(255,255,255,0.1); width: 100%; }

  @media (max-width: 680px) {
    .form-row { flex-direction: column !important; gap: 36px !important; }
    .lead-grid { grid-template-columns: 32px 1fr auto !important; }
    .lead-grid-contact { display: none !important; }
    .email-expanded { padding-left: 0 !important; }
  }
  @media (max-width: 520px) {
    .outer { padding-left: 24px !important; padding-right: 24px !important; }
  }
`;

/* ─── magnetic cursor ─────────────────────────────────────────────── */
function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100, rx: -100, ry: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      pos.current.rx = lerp(pos.current.rx, pos.current.x, 0.1);
      pos.current.ry = lerp(pos.current.ry, pos.current.y, 0.1);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.rx - 18}px, ${pos.current.ry - 18}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
    </>
  );
}

/* ─── animated headline text ──────────────────────────────────────── */
function AnimatedText({ text, delay = 0, style }: {
  text: string; delay?: number; style?: React.CSSProperties;
}) {
  const chars = text.split("");
  return (
    <span style={style}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="char-animate"
          style={{ animationDelay: `${delay + i * 0.028}s` }}
        >
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

/* ─── animated rule ───────────────────────────────────────────────── */
function AnimatedRule({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="draw-line"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/* ─── label ───────────────────────────────────────────────────────── */
function Lbl({ children, style }: { children: string; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontFamily: S, fontSize: 9, fontWeight: 500,
      letterSpacing: "0.24em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.28)", ...style,
    }}>
      {children}
    </span>
  );
}

/* ─── liquid button ───────────────────────────────────────────────── */
function LiquidBtn({
  children, onClick, type = "button", disabled = false, style, testid,
}: {
  children: React.ReactNode; onClick?: () => void;
  type?: "button" | "submit"; disabled?: boolean;
  style?: React.CSSProperties; testid?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className="lf-btn"
      style={style}
    >
      <span className="lf-btn-fill" />
      <span className="lf-btn-label">{children}</span>
    </button>
  );
}

/* ─── send results overlay ────────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.96)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 48 }}>
          <div>
            <Lbl style={{ display: "block", marginBottom: 14 }}>Send report</Lbl>
            <h2 style={{ fontFamily: F, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(36px,6vw,64px)", color: "#fff", letterSpacing: "-0.03em", lineHeight: 0.95 }}>
              {data.sent} of {data.total}<br />sent.
            </h2>
          </div>
          <button onClick={onClose} className="lf-ghost-btn" data-testid="button-close-results">Close ×</button>
        </div>
        <div className="hr" />
        <div style={{ marginTop: 0 }}>
          {data.results.map((r) => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontFamily: M, fontSize: 12, color: r.success ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)", letterSpacing: "-0.01em" }}>
                {r.email}
              </span>
              <Lbl style={{ color: r.success ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)" }}>
                {r.success ? "Sent" : "Failed"}
              </Lbl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── lead row ────────────────────────────────────────────────────── */
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
    <div className="lead-row" style={{ opacity: sending ? 0.3 : 1, transition: "opacity 0.3s" }}>
      <div
        className="lead-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr 1fr auto",
          gap: "0 32px",
          padding: "22px 0",
          alignItems: "start",
        }}
      >
        {/* number */}
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.18)", paddingTop: 2, fontVariantNumeric: "tabular-nums" }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* company */}
        <div>
          <div style={{ fontFamily: F, fontSize: 19, fontWeight: 500, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 5 }}>
            {lead.companyName}
          </div>
          <div style={{ fontFamily: S, fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.38)", letterSpacing: "0.01em" }}>
            {lead.contactName}{lead.title ? ` — ${lead.title}` : ""}
          </div>
        </div>

        {/* email */}
        <div className="lead-grid-contact">
          <button className="email-link" onClick={() => copy(lead.email, "email")} data-testid={`button-copy-email-${lead.id}`} title="Copy">
            {copied === "email" ? "Copied ✓" : lead.email}
          </button>
          {lead.phone && (
            <div style={{ fontFamily: M, fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 5 }}>{lead.phone}</div>
          )}
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingTop: 3 }}>
          {sendResult && (
            <Lbl style={{ color: sendResult.success ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)" }}>
              {sendResult.success ? "Sent" : "Failed"}
            </Lbl>
          )}
          {sending && <Lbl>Sending</Lbl>}
          <button className="expand-btn" onClick={() => setOpen(!open)} data-testid={`button-expand-email-${lead.id}`}>
            {open ? "Close" : "Email →"}
          </button>
        </div>
      </div>

      {open && (
        <div className="email-expanded" style={{ paddingLeft: 84, paddingBottom: 32 }}>
          <div style={{ marginBottom: 18 }}>
            <Lbl style={{ display: "block", marginBottom: 10 }}>Subject</Lbl>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <p style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.45, maxWidth: "72%", margin: 0 }}>
                {lead.emailSubject}
              </p>
              <button className="lf-ghost-btn" onClick={() => copy(lead.emailSubject, "subject")} data-testid={`button-copy-subject-${lead.id}`}>
                {copied === "subject" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="hr" style={{ marginBottom: 18 }} />
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <Lbl>Email body</Lbl>
              <button className="lf-ghost-btn" onClick={() => copy(lead.emailBody, "body")} data-testid={`button-copy-body-${lead.id}`}>
                {copied === "body" ? "Copied" : "Copy"}
              </button>
            </div>
            <p style={{ fontFamily: S, fontSize: 14, fontWeight: 200, lineHeight: 1.9, color: "rgba(255,255,255,0.4)", whiteSpace: "pre-line", maxWidth: 580, margin: 0 }}>
              {lead.emailBody}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading ─────────────────────────────────────────────────────── */
function LoadingView() {
  const steps = ["Scanning the market.", "Identifying prospects.", "Profiling companies.", "Writing cold emails.", "Finalising your report."];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n < steps.length - 1 ? n + 1 : n)), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ padding: "72px 0 100px", textAlign: "center" }}>
      <p key={i} style={{
        margin: 0, fontFamily: F, fontSize: "clamp(24px,4vw,38px)",
        fontWeight: 300, fontStyle: "italic",
        color: "rgba(255,255,255,0.35)", letterSpacing: "-0.01em",
        animation: "pageFade 0.6s ease forwards",
      }}>
        {steps[i]}
      </p>
    </div>
  );
}

const EXAMPLES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

/* ─── dashboard ───────────────────────────────────────────────────── */
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

  /* headline character counts for stagger timing */
  const line1 = "Find your";
  const line2 = "next 10 clients.";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <MagneticCursor />
      <div className="grain-layer" aria-hidden />

      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      <div className="page-wrap">
        {/* ── nav ───────────────────────────────────────────────── */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="outer"
            style={{
              maxWidth: 1100, margin: "0 auto", padding: "0 56px",
              height: 54, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 400, letterSpacing: "-0.02em", color: "#fff" }}>
              LeadForge
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {auth?.connected ? (
                <>
                  <span style={{ fontFamily: S, fontSize: 10, fontWeight: 200, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)" }}>
                    {auth.email}
                  </span>
                  <button className="lf-ghost-btn" onClick={() => disconnectMutation.mutate()} data-testid="button-disconnect-gmail">
                    Disconnect
                  </button>
                </>
              ) : (
                <a
                  href="/api/auth/google"
                  data-testid="button-connect-gmail"
                  style={{ fontFamily: S, fontSize: 9, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
                >
                  Connect Gmail →
                </a>
              )}
            </div>
          </div>
        </header>

        {/* ── main ──────────────────────────────────────────────── */}
        <main className="outer" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 56px 160px" }}>

          {/* ── hero ─────────────────────────────────────────────── */}
          <section style={{ paddingTop: 100, paddingBottom: 80 }}>
            <Lbl style={{ display: "block", marginBottom: 36, animation: "pageFade 1s ease 0.2s both" }}>
              AI Sales Intelligence
            </Lbl>

            {/* headline */}
            <div style={{ marginBottom: 0 }}>
              <h1 style={{
                fontFamily: F, fontWeight: 100,
                fontSize: "clamp(62px, 10vw, 130px)",
                lineHeight: 0.95, letterSpacing: "-0.04em", color: "#fff",
                marginBottom: "0.04em",
              }}>
                <AnimatedText text={line1} delay={0.3} />
              </h1>
              <h1 style={{
                fontFamily: F, fontWeight: 800, fontStyle: "italic",
                fontSize: "clamp(62px, 10vw, 130px)",
                lineHeight: 0.95, letterSpacing: "-0.04em", color: "#fff",
                marginBottom: 44,
              }}>
                <AnimatedText text={line2} delay={0.3 + line1.length * 0.028 + 0.06} />
              </h1>
            </div>

            <p style={{
              fontFamily: S, fontWeight: 200, fontSize: 15,
              lineHeight: 1.85, color: "rgba(255,255,255,0.38)",
              maxWidth: 400, marginBottom: 64, letterSpacing: "0.01em",
              animation: `pageFade 0.8s ease ${0.3 + (line1.length + line2.length) * 0.028 + 0.2}s both`,
            }}>
              Enter a business category and city. Surface ten qualified prospects, each with a personalised cold email — generated in seconds.
            </p>

            <AnimatedRule delay={0.5 + (line1.length + line2.length) * 0.028} />

            {/* ── form ─────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} style={{ paddingTop: 44 }}>
              <div className="form-row" style={{ display: "flex", gap: 56, marginBottom: 44 }}>
                {[
                  { label: "Business Type", value: businessType, set: setBusinessType, placeholder: "plumbers, dentists, HVAC…", testid: "input-business-type" },
                  { label: "Location",      value: location,     set: setLocation,     placeholder: "Houston, TX or Chicago…",  testid: "input-location" },
                ].map(({ label, value, set, placeholder, testid }) => (
                  <div key={label} style={{ flex: 1 }}>
                    <Lbl style={{ display: "block", marginBottom: 14 }}>{label}</Lbl>
                    <input
                      className="lf-input"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      data-testid={testid}
                    />
                  </div>
                ))}
              </div>

              {/* examples */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 44 }}>
                <Lbl style={{ marginRight: 6 }}>Try —</Lbl>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.business}
                    type="button"
                    onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                    data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                    style={{
                      fontFamily: S, fontSize: 10, fontWeight: 200,
                      color: "rgba(255,255,255,0.28)",
                      background: "none", border: "none",
                      textDecoration: "underline",
                      textDecorationColor: "rgba(255,255,255,0.1)",
                      textUnderlineOffset: "4px",
                      letterSpacing: "0.02em",
                      cursor: "none", transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.28)"; }}
                  >
                    {ex.business}, {ex.location}
                  </button>
                ))}
              </div>

              <LiquidBtn type="submit" disabled={generateMutation.isPending} testid="button-generate-leads">
                {generateMutation.isPending ? "Generating…" : "Generate 10 leads"}
              </LiquidBtn>
            </form>
          </section>

          {/* loading */}
          {generateMutation.isPending && <LoadingView />}

          {/* ── results ────────────────────────────────────────────── */}
          {result && !generateMutation.isPending && (
            <section ref={resultsRef}>
              <div className="hr" />

              {/* results header */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16, padding: "30px 0" }}>
                <div>
                  <Lbl style={{ display: "block", marginBottom: 10 }}>Results</Lbl>
                  <p style={{ fontFamily: F, fontSize: "clamp(18px,3vw,26px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.025em", margin: 0 }}>
                    {result.leads.length} prospects —{" "}
                    <em style={{ fontWeight: 300 }}>{result.businessType}</em> in {result.location}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="lf-ghost-btn" onClick={copyAllEmails} data-testid="button-copy-all-emails">
                    Copy all emails
                  </button>
                  <button className="lf-ghost-btn" onClick={() => generateMutation.mutate({ businessType, location })} data-testid="button-regenerate">
                    Regenerate
                  </button>
                  {auth?.connected ? (
                    <LiquidBtn
                      onClick={() => sendMutation.mutate(result.leads)}
                      disabled={sendMutation.isPending}
                      testid="button-send-all-emails"
                      style={{ padding: "13px 30px" }}
                    >
                      {sendMutation.isPending ? "Sending…" : "Send all via Gmail"}
                    </LiquidBtn>
                  ) : (
                    <a
                      href="/api/auth/google"
                      data-testid="button-connect-gmail-results"
                      className="lf-btn"
                      style={{ padding: "13px 30px", textDecoration: "none" }}
                    >
                      <span className="lf-btn-fill" />
                      <span className="lf-btn-label">Connect Gmail to send</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="hr" />

              {/* column headers */}
              <div
                className="lead-grid"
                style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr auto", gap: "0 32px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Lbl>#</Lbl>
                <Lbl>Company</Lbl>
                <Lbl className="lead-grid-contact">Contact</Lbl>
                <span />
              </div>

              {result.leads.map((lead, i) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  index={i}
                  sending={sendMutation.isPending && !sendResults[lead.id]}
                  sendResult={sendResults[lead.id]}
                />
              ))}

              <div style={{ height: 48 }} />
              <div className="hr" />
            </section>
          )}
        </main>
      </div>
    </>
  );
}
