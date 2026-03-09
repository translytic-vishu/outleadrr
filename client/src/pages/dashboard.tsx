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
  Search,
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
  ShieldCheck,
  Briefcase,
  Database,
} from "lucide-react";

const EXAMPLE_SEARCHES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

/* ─── decorators ─────────────────────────────────────────────────── */

function GridBg() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
        backgroundSize: "64px 64px", pointerEvents: "none",
      }}
    />
  );
}

function GlowBlob({ top, left, right, color, size = 500, opacity = 0.25 }: {
  top?: number | string; left?: number | string; right?: number | string;
  color: string; size?: number; opacity?: number;
}) {
  return (
    <div aria-hidden style={{
      position: "fixed", top, left, right, width: size, height: size,
      borderRadius: "50%", background: color, filter: "blur(120px)",
      opacity, pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/* ─── Gmail connect strip ────────────────────────────────────────── */

function GmailBar({ auth, onDisconnect }: { auth: AuthStatus; onDisconnect: () => void }) {
  if (!auth.connected) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        padding: "14px 20px", borderRadius: 10,
        background: "rgba(10,10,18,0.92)",
        border: "1px solid rgba(99,102,241,0.22)",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "rgba(156,163,175,0.5)",
            boxShadow: "0 0 6px rgba(156,163,175,0.3)",
          }} />
          <div>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 600,
              fontSize: 13, color: "rgba(255,255,255,0.55)",
            }}>
              Gmail not connected
            </span>
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 12,
              color: "rgba(255,255,255,0.28)", marginLeft: 8,
            }}>
              Connect your account to send emails directly from Gmail
            </span>
          </div>
        </div>
        <a
          href="/api/auth/google"
          data-testid="button-connect-gmail"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", borderRadius: 7,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            border: "1px solid rgba(99,102,241,0.4)",
            boxShadow: "0 0 24px rgba(99,102,241,0.25)",
            color: "#fff",
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
            fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          <Mail size={14} />
          Connect Gmail
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12,
      padding: "14px 20px", borderRadius: 10,
      background: "rgba(6,16,10,0.95)",
      border: "1px solid rgba(34,197,94,0.25)",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#4ade80",
          boxShadow: "0 0 8px rgba(74,222,128,0.7)",
          animation: "glow-pulse 2s ease-in-out infinite",
        }} />
        <div>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
            fontSize: 13, color: "#4ade80",
          }}>
            Gmail connected
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 12,
            color: "rgba(255,255,255,0.4)", marginLeft: 8,
          }}>
            {auth.email}
          </span>
        </div>
      </div>
      <button
        onClick={onDisconnect}
        data-testid="button-disconnect-gmail"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 6,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "rgba(252,165,165,0.8)",
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 600,
          fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <LogOut size={12} />
        Disconnect
      </button>
    </div>
  );
}

/* ─── send results modal ─────────────────────────────────────────── */

function SendResultsPanel({ data, onClose }: { data: SendEmailsResponse; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 520, borderRadius: 14,
        background: "rgba(10,10,20,0.98)",
        border: "1px solid rgba(99,102,241,0.25)",
        boxShadow: "0 0 80px rgba(99,102,241,0.1)",
        overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
              fontSize: 16, color: "#fff", margin: 0,
            }}>
              Send Report
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
              {data.sent} sent · {data.failed} failed · {data.total} total
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 6,
            background: "rgba(255,255,255,0.06)", border: "none",
            color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 12, padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            padding: "14px 16px", borderRadius: 8,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <CheckCircle size={18} color="#4ade80" />
            <div>
              <div style={{ fontSize: 22, fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, color: "#4ade80" }}>
                {data.sent}
              </div>
              <div style={{ fontSize: 11, color: "rgba(74,222,128,0.6)", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Sent
              </div>
            </div>
          </div>
          <div style={{
            padding: "14px 16px", borderRadius: 8,
            background: data.failed > 0 ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.06)",
            border: data.failed > 0 ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(99,102,241,0.12)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {data.failed > 0 ? <XCircle size={18} color="#f87171" /> : <CheckCircle size={18} color="#818cf8" />}
            <div>
              <div style={{ fontSize: 22, fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, color: data.failed > 0 ? "#f87171" : "#818cf8" }}>
                {data.failed}
              </div>
              <div style={{ fontSize: 11, color: data.failed > 0 ? "rgba(248,113,113,0.6)" : "rgba(129,140,248,0.6)", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Failed
              </div>
            </div>
          </div>
        </div>

        {/* per-email list */}
        <div style={{ maxHeight: 260, overflowY: "auto", padding: "12px 24px 20px" }}>
          {data.results.map((r) => (
            <div key={r.email} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10, padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.email}
              </span>
              {r.success
                ? <CheckCircle size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                : <XCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── lead card ──────────────────────────────────────────────────── */

function LeadCard({ lead, index, sending, sendResult }: {
  lead: Lead; index: number;
  sending: boolean;
  sendResult?: { success: boolean; error?: string };
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"email" | "subject" | "body" | null>(null);

  const copy = async (text: string, key: "email" | "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const borderColor = sendResult
    ? sendResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
    : "rgba(99,102,241,0.14)";

  return (
    <div
      style={{
        borderRadius: 10, background: "rgba(8,8,14,0.95)",
        border: `1px solid ${borderColor}`, overflow: "hidden",
        transition: "border-color 0.25s, box-shadow 0.25s",
        opacity: sending ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!sending) (e.currentTarget as HTMLDivElement).style.borderColor = sendResult ? borderColor : "rgba(99,102,241,0.38)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
      }}
    >
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(168,85,247,0.22))",
              border: "1px solid rgba(99,102,241,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 12, color: "#a5b4fc",
            }}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 15, color: "#ffffff", lineHeight: 1.3 }}>
                {lead.companyName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{lead.contactName}</span>
                {lead.title && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 12 }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(167,139,250,0.7)", fontFamily: "Inter, sans-serif" }}>
                      <Briefcase size={10} color="rgba(167,139,250,0.6)" />
                      {lead.title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* send status + source badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {sending && <Loader2 size={14} color="#818cf8" style={{ animation: "spin-slow 1s linear infinite" }} />}
            {sendResult && (
              sendResult.success
                ? <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4ade80", padding: "3px 9px", borderRadius: 5, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle size={11} /> Sent
                  </span>
                : <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", padding: "3px 9px", borderRadius: 5, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <XCircle size={11} /> Failed
                  </span>
            )}
            {!sendResult && !sending && (
              <span style={{ fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                New Lead
              </span>
            )}
          </div>
        </div>

        {/* chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => copy(lead.email, "email")}
            title="Click to copy"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 6, background: lead.emailVerified ? "rgba(34,197,94,0.07)" : "rgba(99,102,241,0.07)", border: `1px solid ${lead.emailVerified ? "rgba(34,197,94,0.18)" : "rgba(99,102,241,0.12)"}`, color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
            data-testid={`button-copy-email-${lead.id}`}
          >
            {lead.emailVerified
              ? <ShieldCheck size={12} color="#4ade80" />
              : <Mail size={12} color="#818cf8" />}
            {lead.email}
            {lead.emailVerified && (
              <span style={{ fontSize: 9, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4ade80", marginLeft: 2 }}>✓</span>
            )}
            {copied === "email" ? <CheckCheck size={12} color="#4ade80" style={{ marginLeft: 4 }} /> : <Copy size={11} color="rgba(255,255,255,0.25)" style={{ marginLeft: 4 }} />}
          </button>
          {lead.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 6, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>
              <Phone size={12} color="#818cf8" />{lead.phone}
            </div>
          )}
          {lead.website && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 6, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace", overflow: "hidden", maxWidth: 200 }}>
              <Globe size={12} color="#818cf8" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.website}</span>
            </div>
          )}
        </div>

        {/* expand email */}
        <button
          onClick={() => setOpen(!open)}
          style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 7, background: open ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.16)", cursor: "pointer", transition: "background 0.2s" }}
          data-testid={`button-expand-email-${lead.id}`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={13} color="#c084fc" />
            <span style={{ fontSize: 11, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>AI Cold Email</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>— {lead.emailSubject}</span>
          </div>
          {open ? <ChevronUp size={15} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.35)" />}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ padding: "14px 22px", background: "rgba(99,102,241,0.07)", borderBottom: "1px solid rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Subject</div>
              <div style={{ fontSize: 14, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: "#ffffff" }}>{lead.emailSubject}</div>
            </div>
            <button onClick={() => copy(lead.emailSubject, "subject")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "rgba(99,102,241,0.18)", border: "none", color: copied === "subject" ? "#4ade80" : "#a5b4fc", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, cursor: "pointer" }} data-testid={`button-copy-subject-${lead.id}`}>
              {copied === "subject" ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied === "subject" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div style={{ padding: "18px 22px", background: "rgba(4,4,10,0.9)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Email Body</div>
              <button onClick={() => copy(lead.emailBody, "body")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "rgba(99,102,241,0.18)", border: "none", color: copied === "body" ? "#4ade80" : "#a5b4fc", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, cursor: "pointer" }} data-testid={`button-copy-body-${lead.id}`}>
                {copied === "body" ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied === "body" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.72)", whiteSpace: "pre-line", fontFamily: "Inter, sans-serif" }}>
              {lead.emailBody}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading state ──────────────────────────────────────────────── */

function LoadingIndicator() {
  const steps = ["Scanning business directory...", "Identifying top prospects...", "Analyzing company profiles...", "Crafting personalized emails...", "Finalizing lead intelligence..."];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s < steps.length - 1 ? s + 1 : s)), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 28 }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(10,10,22,0.9)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 40px rgba(99,102,241,0.25), inset 0 0 20px rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={26} color="#818cf8" />
        </div>
        <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgba(168,85,247,0.3)", animation: "spin-slow 6s linear infinite" }} />
      </div>
      <div key={step} style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
        {steps[step]}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= step ? "#6366f1" : "rgba(99,102,241,0.2)", boxShadow: i <= step ? "0 0 6px rgba(99,102,241,0.7)" : "none", transition: "all 0.4s ease" }} />
        ))}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────── */

export default function Dashboard() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [sendData, setSendData] = useState<SendEmailsResponse | null>(null);
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [sendResults, setSendResults] = useState<Record<number, { success: boolean; error?: string }>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check OAuth status on load + after redirect
  const { data: auth } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    refetchInterval: false,
  });

  // Handle redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast({ title: "Gmail Connected!", description: "Your Gmail account is now linked." });
      window.history.replaceState({}, "", "/");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    }
    if (params.get("error")) {
      toast({ title: "Connection Failed", description: "Could not connect Gmail. Please try again.", variant: "destructive" });
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
      toast({ title: "Generation Failed", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      const res = await apiRequest("POST", "/api/send-emails", { leads });
      return res.json() as Promise<SendEmailsResponse>;
    },
    onSuccess: (data) => {
      setSendData(data);
      // apply per-card results
      const map: Record<number, { success: boolean; error?: string }> = {};
      if (result) {
        data.results.forEach((r, i) => {
          map[result.leads[i]?.id] = r;
        });
      }
      setSendResults(map);
    },
    onError: (err: any) => {
      toast({ title: "Send Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      toast({ title: "Missing Info", description: "Enter a business type and location.", variant: "destructive" });
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
    toast({ title: "Copied!", description: "All 10 email addresses copied." });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", position: "relative", overflowX: "hidden" }}>
      <GridBg />
      <GlowBlob top={-160} left={-160} color="radial-gradient(circle, rgba(99,102,241,0.7) 0%, transparent 70%)" size={600} opacity={0.22} />
      <GlowBlob top={-100} right={-100} color="radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)" size={420} opacity={0.16} />

      {/* send results modal */}
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 24px 120px" }}>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <section style={{ textAlign: "center", paddingTop: 100, paddingBottom: 60 }}>
          {/* badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.28)", marginBottom: 36 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px rgba(99,102,241,0.9)", animation: "glow-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a5b4fc" }}>
              AI Sales Intelligence
            </span>
          </div>

          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 24px", color: "#ffffff" }}>
            Find Your Next{" "}
            <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 45%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              10 Clients
            </span>
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.7, color: "rgba(255,255,255,0.48)", maxWidth: 520, margin: "0 auto 48px" }}>
            Enter a business type and city. Our AI finds 10 real prospects
            and writes a personalized cold email for each one — instantly.
          </p>

          {/* ── GMAIL BAR ─────────────────────────────────────── */}
          {auth && <GmailBar auth={auth} onDisconnect={() => disconnectMutation.mutate()} />}

          {/* ── FORM CARD ─────────────────────────────────────── */}
          <div style={{ borderRadius: 16, background: "rgba(10,10,18,0.92)", border: "1px solid rgba(99,102,241,0.22)", boxShadow: "0 0 80px rgba(99,102,241,0.07)", padding: "36px 36px 28px", backdropFilter: "blur(20px)", textAlign: "left" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="form-grid">
                {/* business */}
                <div>
                  <label style={{ display: "block", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 8 }}>
                    Business Type
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={15} color="#6366f1" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. plumbers, dentists, HVAC..."
                      data-testid="input-business-type"
                      style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.18)", color: "#ffffff", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.18)")}
                    />
                  </div>
                </div>
                {/* location */}
                <div>
                  <label style={{ display: "block", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 8 }}>
                    Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={15} color="#6366f1" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Houston, TX or Chicago..."
                      data-testid="input-location"
                      style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.18)", color: "#ffffff", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.18)")}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending}
                data-testid="button-generate-leads"
                style={{ width: "100%", padding: "15px 24px", borderRadius: 9, background: generateMutation.isPending ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", border: "1px solid rgba(99,102,241,0.45)", boxShadow: generateMutation.isPending ? "none" : "0 0 40px rgba(99,102,241,0.35), 0 0 80px rgba(168,85,247,0.12)", color: "#ffffff", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", cursor: generateMutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.3s ease" }}
              >
                {generateMutation.isPending ? (
                  <><Zap size={17} style={{ animation: "spin-slow 2s linear infinite" }} />Generating Intelligence...</>
                ) : (
                  <><Zap size={17} />Generate 10 Leads + Emails<ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* quick start */}
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>Quick Start</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EXAMPLE_SEARCHES.map((ex) => (
                  <button
                    key={ex.business}
                    onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                    data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                    style={{ padding: "6px 13px", borderRadius: 6, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.16)", color: "rgba(165,180,252,0.8)", fontSize: 12, fontFamily: "Inter, sans-serif", cursor: "pointer" }}
                  >
                    {ex.business} · {ex.location}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* how it works */}
          {!result && !generateMutation.isPending && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 40 }}>
              {[
                { icon: Search, label: "1. Search", desc: "Enter any business category and city" },
                { icon: Sparkles, label: "2. Generate", desc: "AI finds 10 prospects and writes each a cold email" },
                { icon: Mail, label: "3. Send", desc: "Connect Gmail and send all emails in one click" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ padding: "22px 20px", borderRadius: 10, background: "rgba(8,8,14,0.7)", border: "1px solid rgba(99,102,241,0.1)", textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Icon size={18} color="rgba(129,140,248,0.7)" />
                  </div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* loading */}
        {generateMutation.isPending && <LoadingIndicator />}

        {/* results */}
        {result && !generateMutation.isPending && (
          <div ref={resultsRef}>
            {/* stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { icon: Users, label: "Leads Found", value: result.leads.length },
                { icon: Mail, label: "Emails Written", value: result.leads.length },
                { icon: Target, label: "Business", value: result.businessType },
                { icon: MapPin, label: "Location", value: result.location },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, background: "rgba(15,15,22,0.9)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, background: "rgba(99,102,241,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", lineHeight: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 16, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* action bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 20, color: "#ffffff", margin: 0 }}>Lead Intelligence Report</h2>
                  {result.source === "apollo" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34d399", padding: "3px 9px", borderRadius: 5, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
                      <Database size={10} /> Apollo.io
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#818cf8", padding: "3px 9px", borderRadius: 5, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                      <Sparkles size={10} /> AI Generated
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
                  {result.leads.length} prospects · <span style={{ color: "#818cf8" }}>{result.businessType}</span> in <span style={{ color: "#c084fc" }}>{result.location}</span>
                  {result.source === "apollo" && (
                    <span style={{ marginLeft: 8, color: "rgba(52,211,153,0.6)", fontSize: 12 }}>
                      · {result.leads.filter((l) => l.emailVerified).length} verified emails
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={copyAllEmails}
                  data-testid="button-copy-all-emails"
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 7, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", color: "#a5b4fc", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em" }}
                >
                  <Copy size={13} />Copy All Emails
                </button>

                {/* send all button */}
                {auth?.connected ? (
                  <button
                    onClick={handleSendAll}
                    disabled={sendMutation.isPending}
                    data-testid="button-send-all-emails"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 18px", borderRadius: 7,
                      background: sendMutation.isPending ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      border: "1px solid rgba(34,197,94,0.35)",
                      boxShadow: sendMutation.isPending ? "none" : "0 0 20px rgba(34,197,94,0.2)",
                      color: "#ffffff", fontSize: 12, fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700, cursor: sendMutation.isPending ? "not-allowed" : "pointer",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}
                  >
                    {sendMutation.isPending
                      ? <><Loader2 size={13} style={{ animation: "spin-slow 1s linear infinite" }} />Sending...</>
                      : <><Send size={13} />Send All via Gmail</>}
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    data-testid="button-connect-gmail-results"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 7, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase" }}
                  >
                    <Mail size={13} />Connect Gmail to Send
                  </a>
                )}

                <button
                  onClick={() => generateMutation.mutate({ businessType, location })}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 7, background: "transparent", border: "1px solid rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.55)", fontSize: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em" }}
                  data-testid="button-regenerate"
                >
                  <Sparkles size={13} />New Batch
                </button>
              </div>
            </div>

            {/* not connected warning */}
            {!auth?.connected && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)", marginBottom: 20 }}>
                <AlertCircle size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: "rgba(251,191,36,0.8)", fontFamily: "Inter, sans-serif" }}>
                  Connect your Gmail account above to send emails directly from your inbox.
                </p>
              </div>
            )}

            {/* lead cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
