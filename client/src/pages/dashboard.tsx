import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Mail,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Globe,
  Phone,
  Building2,
  MapPin,
  Sparkles,
  Target,
  Users,
  ArrowRight,
  Send,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Briefcase,
} from "lucide-react";

/* ─── design tokens ──────────────────────────────────────────────── */
const C = {
  bg: "#09090b",
  surface: "rgba(255,255,255,0.025)",
  surfaceHover: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.07)",
  borderSubtle: "rgba(255,255,255,0.04)",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.45)",
  textFaint: "rgba(255,255,255,0.22)",
  accent: "#ffffff",
  pill: "rgba(255,255,255,0.06)",
  pillBorder: "rgba(255,255,255,0.09)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.08)",
  greenBorder: "rgba(34,197,94,0.15)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.08)",
  redBorder: "rgba(239,68,68,0.15)",
  amber: "#f59e0b",
  amberBg: "rgba(245,158,11,0.06)",
  amberBorder: "rgba(245,158,11,0.15)",
};

const F = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "monospace",
};

const EXAMPLE_SEARCHES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

/* ─── background mesh ────────────────────────────────────────────── */
function BgMesh() {
  return (
    <>
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
      }} />
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
    </>
  );
}

/* ─── top nav ────────────────────────────────────────────────────── */
function TopNav({ auth, onDisconnect }: { auth?: AuthStatus; onDisconnect: () => void }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: `1px solid ${C.borderSubtle}`,
      background: "rgba(9,9,11,0.85)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "0 24px",
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: C.text, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={15} color={C.bg} strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: F.display, fontWeight: 700, fontSize: 15,
            color: C.text, letterSpacing: "-0.02em",
          }}>LeadForge</span>
        </div>

        {/* gmail status */}
        {auth?.connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.textMuted }}>
                {auth.email}
              </span>
            </div>
            <button
              onClick={onDisconnect}
              data-testid="button-disconnect-gmail"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 6,
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.textMuted, fontFamily: F.body, fontSize: 12,
                cursor: "pointer",
              }}
            >
              <LogOut size={11} />
              Disconnect
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            data-testid="button-connect-gmail"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 7,
              background: C.text, border: "none",
              color: C.bg, fontFamily: F.display, fontWeight: 600,
              fontSize: 13, textDecoration: "none", letterSpacing: "-0.01em",
            }}
          >
            <Mail size={13} />
            Connect Gmail
          </a>
        )}
      </div>
    </nav>
  );
}

/* ─── send results modal ─────────────────────────────────────────── */
function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 480, borderRadius: 16,
        background: "#111113", border: `1px solid ${C.border}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${C.borderSubtle}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.text, margin: 0 }}>
              Send Report
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted, fontFamily: F.body }}>
              {data.sent} sent · {data.failed} failed · {data.total} total
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, background: C.surface,
            border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 16,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 24px", borderBottom: `1px solid ${C.borderSubtle}` }}>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color={C.green} />
            <div>
              <div style={{ fontSize: 22, fontFamily: F.display, fontWeight: 700, color: C.green }}>{data.sent}</div>
              <div style={{ fontSize: 11, color: "rgba(34,197,94,0.6)", fontFamily: F.display, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sent</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: data.failed > 0 ? C.redBg : C.surface, border: `1px solid ${data.failed > 0 ? C.redBorder : C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            {data.failed > 0 ? <XCircle size={18} color={C.red} /> : <CheckCircle size={18} color={C.textMuted} />}
            <div>
              <div style={{ fontSize: 22, fontFamily: F.display, fontWeight: 700, color: data.failed > 0 ? C.red : C.textMuted }}>{data.failed}</div>
              <div style={{ fontSize: 11, color: data.failed > 0 ? "rgba(239,68,68,0.6)" : C.textFaint, fontFamily: F.display, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Failed</div>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: 240, overflowY: "auto", padding: "12px 24px 20px" }}>
          {data.results.map((r) => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
              <span style={{ fontSize: 12, fontFamily: F.mono, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
              {r.success ? <CheckCircle size={13} color={C.green} style={{ flexShrink: 0 }} /> : <XCircle size={13} color={C.red} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
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
  const [hovered, setHovered] = useState(false);

  const copy = async (text: string, key: "email" | "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const borderColor = sendResult
    ? sendResult.success ? C.greenBorder : C.redBorder
    : hovered ? C.border : C.borderSubtle;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12, overflow: "hidden",
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${borderColor}`,
        transition: "background 0.15s, border-color 0.15s",
        opacity: sending ? 0.6 : 1,
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* left: number + info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: C.pill, border: `1px solid ${C.pillBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.display, fontWeight: 700, fontSize: 11, color: C.textFaint,
            }}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15, color: C.text, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {lead.companyName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F.body }}>{lead.contactName}</span>
                {lead.title && (
                  <>
                    <span style={{ color: C.textFaint, fontSize: 11 }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textFaint, fontFamily: F.body }}>
                      <Briefcase size={10} color={C.textFaint} />
                      {lead.title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* right: status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sending && <Loader2 size={13} color={C.textMuted} style={{ animation: "spin-slow 1s linear infinite" }} />}
            {sendResult && (
              sendResult.success
                ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: F.display, fontWeight: 600, color: C.green, padding: "3px 9px", borderRadius: 99, background: C.greenBg, border: `1px solid ${C.greenBorder}` }}>
                    <CheckCircle size={10} /> Sent
                  </span>
                : <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: F.display, fontWeight: 600, color: C.red, padding: "3px 9px", borderRadius: 99, background: C.redBg, border: `1px solid ${C.redBorder}` }}>
                    <XCircle size={10} /> Failed
                  </span>
            )}
            {!sendResult && !sending && (
              <span style={{ fontSize: 10, fontFamily: F.display, fontWeight: 600, color: C.textFaint, padding: "3px 9px", borderRadius: 99, background: C.pill, border: `1px solid ${C.pillBorder}`, letterSpacing: "0.05em" }}>
                New
              </span>
            )}
          </div>
        </div>

        {/* detail chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          <button
            onClick={() => copy(lead.email, "email")}
            title="Copy email"
            data-testid={`button-copy-email-${lead.id}`}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 6, background: C.pill, border: `1px solid ${C.pillBorder}`, color: C.textMuted, fontSize: 12, fontFamily: F.mono, cursor: "pointer" }}
          >
            <Mail size={11} color={C.textFaint} />
            {lead.email}
            {copied === "email" ? <CheckCheck size={11} color={C.green} style={{ marginLeft: 3 }} /> : <Copy size={10} color={C.textFaint} style={{ marginLeft: 3 }} />}
          </button>
          {lead.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 6, background: C.pill, border: `1px solid ${C.pillBorder}`, color: C.textMuted, fontSize: 12, fontFamily: F.mono }}>
              <Phone size={11} color={C.textFaint} />{lead.phone}
            </div>
          )}
          {lead.website && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 6, background: C.pill, border: `1px solid ${C.pillBorder}`, color: C.textMuted, fontSize: 12, fontFamily: F.mono, maxWidth: 200, overflow: "hidden" }}>
              <Globe size={11} color={C.textFaint} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.website}</span>
            </div>
          )}
        </div>

        {/* expand email toggle */}
        <button
          onClick={() => setOpen(!open)}
          data-testid={`button-expand-email-${lead.id}`}
          style={{
            marginTop: 12, width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "9px 13px", borderRadius: 8,
            background: open ? "rgba(255,255,255,0.04)" : "transparent",
            border: `1px solid ${open ? C.border : C.borderSubtle}`,
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={12} color={C.textFaint} />
            <span style={{ fontSize: 11, fontFamily: F.display, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.textMuted }}>Cold Email</span>
            <span style={{ fontSize: 12, color: C.textFaint, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>— {lead.emailSubject}</span>
          </div>
          {open ? <ChevronUp size={14} color={C.textFaint} /> : <ChevronDown size={14} color={C.textFaint} />}
        </button>
      </div>

      {/* expanded email view */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.borderSubtle}` }}>
          {/* subject */}
          <div style={{
            padding: "14px 20px", background: "rgba(255,255,255,0.015)",
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontFamily: F.display, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 4 }}>Subject</div>
              <div style={{ fontSize: 14, fontFamily: F.display, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>{lead.emailSubject}</div>
            </div>
            <button
              onClick={() => copy(lead.emailSubject, "subject")}
              data-testid={`button-copy-subject-${lead.id}`}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, background: C.pill, border: `1px solid ${C.pillBorder}`, color: copied === "subject" ? C.green : C.textMuted, fontSize: 12, fontFamily: F.display, fontWeight: 600, cursor: "pointer" }}
            >
              {copied === "subject" ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied === "subject" ? "Copied" : "Copy"}
            </button>
          </div>

          {/* body */}
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 10, fontFamily: F.display, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint }}>Email Body</div>
              <button
                onClick={() => copy(lead.emailBody, "body")}
                data-testid={`button-copy-body-${lead.id}`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, background: C.pill, border: `1px solid ${C.pillBorder}`, color: copied === "body" ? C.green : C.textMuted, fontSize: 12, fontFamily: F.display, fontWeight: 600, cursor: "pointer" }}
              >
                {copied === "body" ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copied === "body" ? "Copied" : "Copy"}
              </button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: C.textMuted, whiteSpace: "pre-line", fontFamily: F.body }}>
              {lead.emailBody}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading indicator ──────────────────────────────────────────── */
function LoadingIndicator() {
  const steps = ["Scanning market data...", "Identifying prospects...", "Profiling companies...", "Writing cold emails...", "Finalizing report..."];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s < steps.length - 1 ? s + 1 : s)), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px", gap: 24 }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: C.surface,
      }}>
        <Loader2 size={20} color={C.textMuted} style={{ animation: "spin-slow 1s linear infinite" }} />
      </div>
      <div key={step} style={{ fontFamily: F.body, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
        {steps[step]}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 16 : 4, height: 4, borderRadius: 99,
            background: i <= step ? C.text : C.surface,
            transition: "all 0.4s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── main dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auth } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    refetchInterval: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast({ title: "Gmail connected", description: "You can now send emails directly from your inbox." });
      window.history.replaceState({}, "", "/");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (params.get("error")) {
      toast({ title: "Connection failed", description: "Could not connect Gmail. Try again.", variant: "destructive" });
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/disconnect", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({ title: "Disconnected", description: "Gmail account unlinked." });
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
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err.message || "Please try again.", variant: "destructive" });
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
      if (result) {
        data.results.forEach((r, i) => { map[result.leads[i]?.id] = r; });
      }
      setSendResults(map);
    },
    onError: (err: any) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      toast({ title: "Missing fields", description: "Enter a business type and location.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({ businessType: businessType.trim(), location: location.trim() });
  };

  const handleSendAll = () => {
    if (!result || !auth?.connected) return;
    sendMutation.mutate(result.leads);
  };

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map((l) => l.email).join(", "));
    toast({ title: "Copied", description: "All 10 email addresses copied to clipboard." });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <BgMesh />

      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      {/* nav */}
      <TopNav auth={auth} onDisconnect={() => disconnectMutation.mutate()} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "0 24px 120px" }}>

        {/* ── hero ─────────────────────────────────────────────────── */}
        <section style={{ textAlign: "center", paddingTop: 96, paddingBottom: 72 }}>

          {/* pill badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 99, background: C.pill, border: `1px solid ${C.pillBorder}`, marginBottom: 32 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.text }} />
            <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted }}>
              AI Sales Agent
            </span>
          </div>

          <h1 style={{
            fontFamily: F.display, fontWeight: 800,
            fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 1.0,
            letterSpacing: "-0.04em", margin: "0 0 24px", color: C.text,
          }}>
            Find your next<br />
            <span style={{ color: C.textMuted }}>10 clients.</span>
          </h1>

          <p style={{
            fontFamily: F.body, fontSize: "clamp(15px, 2vw, 17px)",
            lineHeight: 1.7, color: C.textMuted, maxWidth: 460,
            margin: "0 auto 56px",
          }}>
            Type a business category and city. We find 10 real prospects and write a personalized cold email for every one — in seconds.
          </p>

          {/* ── search form ──────────────────────────────────────── */}
          <div style={{
            borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`,
            padding: "28px 28px 24px", textAlign: "left",
            backdropFilter: "blur(12px)",
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }} className="form-grid">
                <div>
                  <label style={{ display: "block", fontFamily: F.display, fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 7 }}>
                    Business Type
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={14} color={C.textFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. plumbers, dentists, HVAC..."
                      data-testid="input-business-type"
                      style={{
                        width: "100%", padding: "11px 12px 11px 36px",
                        borderRadius: 8, background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${C.border}`, color: C.text,
                        fontSize: 14, fontFamily: F.body, outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: F.display, fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 7 }}>
                    Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={14} color={C.textFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Houston, TX or Chicago..."
                      data-testid="input-location"
                      style={{
                        width: "100%", padding: "11px 12px 11px 36px",
                        borderRadius: 8, background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${C.border}`, color: C.text,
                        fontSize: 14, fontFamily: F.body, outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending}
                data-testid="button-generate-leads"
                style={{
                  width: "100%", padding: "13px 20px", borderRadius: 9,
                  background: generateMutation.isPending ? "rgba(255,255,255,0.1)" : C.text,
                  border: "none", color: generateMutation.isPending ? C.textMuted : C.bg,
                  fontFamily: F.display, fontWeight: 700, fontSize: 14,
                  letterSpacing: "-0.01em", cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {generateMutation.isPending
                  ? <><Loader2 size={15} style={{ animation: "spin-slow 1s linear infinite" }} /> Generating leads...</>
                  : <><Zap size={15} /> Generate 10 leads + emails <ArrowRight size={14} /></>}
              </button>
            </form>

            {/* quick start */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.borderSubtle}` }}>
              <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginRight: 10 }}>Try:</span>
              <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
                {EXAMPLE_SEARCHES.map((ex) => (
                  <button
                    key={ex.business}
                    onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                    data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                    style={{
                      padding: "5px 12px", borderRadius: 99,
                      background: "transparent", border: `1px solid ${C.pillBorder}`,
                      color: C.textMuted, fontSize: 12, fontFamily: F.body, cursor: "pointer",
                    }}
                  >
                    {ex.business} · {ex.location}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* how it works — only before first search */}
          {!result && !generateMutation.isPending && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 32 }}>
              {[
                { icon: MapPin, label: "Search", desc: "Enter any business category and city" },
                { icon: Sparkles, label: "Generate", desc: "AI finds 10 prospects and writes cold emails" },
                { icon: Mail, label: "Send", desc: "Connect Gmail and send all in one click" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ padding: "20px", borderRadius: 12, background: C.surface, border: `1px solid ${C.borderSubtle}`, textAlign: "left" }}>
                  <Icon size={16} color={C.textFaint} style={{ marginBottom: 12 }} />
                  <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, fontFamily: F.body }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* loading */}
        {generateMutation.isPending && <LoadingIndicator />}

        {/* ── results ──────────────────────────────────────────────── */}
        {result && !generateMutation.isPending && (
          <div ref={resultsRef}>
            {/* stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { icon: Users, label: "Leads", value: String(result.leads.length) },
                { icon: Mail, label: "Emails", value: String(result.leads.length) },
                { icon: Target, label: "Industry", value: result.businessType },
                { icon: MapPin, label: "Location", value: result.location },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  padding: "14px 16px", borderRadius: 10,
                  background: C.surface, border: `1px solid ${C.borderSubtle}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <Icon size={14} color={C.textFaint} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, fontFamily: F.display, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textFaint, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontFamily: F.display, fontWeight: 700, color: C.text, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* action bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: C.text, margin: "0 0 3px", letterSpacing: "-0.02em" }}>
                  Lead Report
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: C.textMuted, fontFamily: F.body }}>
                  {result.leads.length} prospects — {result.businessType} in {result.location}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={copyAllEmails}
                  data-testid="button-copy-all-emails"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontFamily: F.display, fontWeight: 600, cursor: "pointer" }}
                >
                  <Copy size={12} /> Copy all emails
                </button>

                {auth?.connected ? (
                  <button
                    onClick={handleSendAll}
                    disabled={sendMutation.isPending}
                    data-testid="button-send-all-emails"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 7,
                      background: sendMutation.isPending ? C.surface : C.text,
                      border: `1px solid ${sendMutation.isPending ? C.border : "transparent"}`,
                      color: sendMutation.isPending ? C.textMuted : C.bg,
                      fontSize: 12, fontFamily: F.display, fontWeight: 700,
                      cursor: sendMutation.isPending ? "not-allowed" : "pointer",
                    }}
                  >
                    {sendMutation.isPending
                      ? <><Loader2 size={12} style={{ animation: "spin-slow 1s linear infinite" }} /> Sending...</>
                      : <><Send size={12} /> Send all via Gmail</>}
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    data-testid="button-connect-gmail-results"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, background: C.text, border: "none", color: C.bg, fontSize: 12, fontFamily: F.display, fontWeight: 700, textDecoration: "none" }}
                  >
                    <Mail size={12} /> Connect Gmail to send
                  </a>
                )}

                <button
                  onClick={() => generateMutation.mutate({ businessType, location })}
                  data-testid="button-regenerate"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${C.borderSubtle}`, color: C.textFaint, fontSize: 12, fontFamily: F.display, fontWeight: 600, cursor: "pointer" }}
                >
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>

            {/* not connected warning */}
            {!auth?.connected && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 8, background: C.amberBg, border: `1px solid ${C.amberBorder}`, marginBottom: 16 }}>
                <AlertCircle size={13} color={C.amber} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: "rgba(245,158,11,0.75)", fontFamily: F.body }}>
                  Connect Gmail above to send emails directly from your inbox with one click.
                </p>
              </div>
            )}

            {/* lead cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.leads.map((lead, i) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  index={i}
                  sending={sendMutation.isPending && !sendResults[lead.id]}
                  sendResult={sendResults[lead.id]}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr !important; } }
        input::placeholder { color: rgba(255,255,255,0.18); }
        input { transition: border-color 0.15s; }
      `}</style>
    </div>
  );
}
