import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse, AuthStatus, SendEmailsResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Mail, Copy, CheckCheck, ChevronDown, ChevronUp,
  Globe, Phone, Building2, MapPin, Sparkles, Target,
  Users, ArrowRight, Send, LogOut, CheckCircle,
  XCircle, AlertCircle, Loader2, Briefcase,
} from "lucide-react";

/* ─── ambient background ─────────────────────────────────────────── */
function AmbientBg() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* base */}
      <div style={{ position: "absolute", inset: 0, background: "#000" }} />
      {/* top-left blue orb */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: "70vw", height: "70vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)",
        filter: "blur(40px)",
      }} />
      {/* top-right purple orb */}
      <div style={{
        position: "absolute", top: "-10%", right: "-15%",
        width: "60vw", height: "60vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 65%)",
        filter: "blur(40px)",
      }} />
      {/* bottom center teal */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "20%",
        width: "60vw", height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 65%)",
        filter: "blur(60px)",
      }} />
      {/* subtle noise grain */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        opacity: 0.4,
        mixBlendMode: "overlay",
      }} />
    </div>
  );
}

/* ─── top nav ────────────────────────────────────────────────────── */
function TopNav({ auth, onDisconnect }: { auth?: AuthStatus; onDisconnect: () => void }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "saturate(180%) blur(24px)",
      WebkitBackdropFilter: "saturate(180%) blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{
        maxWidth: 980, margin: "0 auto", padding: "0 28px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={13} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'SF Pro Display', 'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-0.03em",
          }}>LeadForge</span>
        </div>

        {/* gmail */}
        {auth?.connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
              <span style={{ fontFamily: "'SF Pro Text', Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{auth.email}</span>
            </div>
            <button
              onClick={onDisconnect}
              data-testid="button-disconnect-gmail"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 13px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500,
                cursor: "pointer", letterSpacing: "0.01em",
              }}
            >
              <LogOut size={10} /> Disconnect
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            data-testid="button-connect-gmail"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 18px", borderRadius: 99,
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              border: "none", color: "#fff",
              fontFamily: "'SF Pro Display', 'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 13, textDecoration: "none",
              letterSpacing: "-0.01em",
              boxShadow: "0 0 20px rgba(99,102,241,0.35)",
            }}
          >
            <Mail size={13} /> Connect Gmail
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
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 480, borderRadius: 20,
        background: "rgba(18,18,24,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08)",
        backdropFilter: "blur(40px)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Send Report</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
              {data.sent} sent · {data.failed} failed · {data.total} total
            </p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 99, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 26px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ padding: "14px", borderRadius: 12, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#34d399" />
            <div>
              <div style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#34d399" }}>{data.sent}</div>
              <div style={{ fontSize: 10, color: "rgba(52,211,153,0.6)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sent</div>
            </div>
          </div>
          <div style={{ padding: "14px", borderRadius: 12, background: data.failed > 0 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${data.failed > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", gap: 10 }}>
            {data.failed > 0 ? <XCircle size={18} color="#f87171" /> : <CheckCircle size={18} color="rgba(255,255,255,0.3)" />}
            <div>
              <div style={{ fontSize: 22, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: data.failed > 0 ? "#f87171" : "rgba(255,255,255,0.4)" }}>{data.failed}</div>
              <div style={{ fontSize: 10, color: data.failed > 0 ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.25)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Failed</div>
            </div>
          </div>
        </div>
        <div style={{ maxHeight: 250, overflowY: "auto", padding: "12px 26px 22px" }}>
          {data.results.map((r) => (
            <div key={r.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
              {r.success ? <CheckCircle size={13} color="#34d399" style={{ flexShrink: 0 }} /> : <XCircle size={13} color="#f87171" style={{ flexShrink: 0 }} />}
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

  const copy = async (text: string, key: "email" | "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const borderGlow = sendResult
    ? sendResult.success
      ? "0 0 0 1px rgba(52,211,153,0.3)"
      : "0 0 0 1px rgba(239,68,68,0.3)"
    : "none";

  const borderColor = sendResult
    ? sendResult.success ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"
    : "rgba(255,255,255,0.07)";

  return (
    <div
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${borderColor}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: borderGlow,
        transition: "all 0.2s ease",
        opacity: sending ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!sendResult) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = sendResult ? borderColor : "rgba(255,255,255,0.13)";
      }}
      onMouseLeave={(e) => {
        if (!sendResult) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)";
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
      }}
    >
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* avatar + info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11,
              color: "rgba(255,255,255,0.35)", letterSpacing: "-0.01em",
            }}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                {lead.companyName}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>{lead.contactName}</span>
                {lead.title && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif" }}>
                      <Briefcase size={9} color="rgba(255,255,255,0.25)" />
                      {lead.title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sending && <Loader2 size={13} color="rgba(255,255,255,0.3)" style={{ animation: "spin-slow 1s linear infinite" }} />}
            {sendResult && (
              sendResult.success
                ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#34d399", padding: "3px 10px", borderRadius: 99, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <CheckCircle size={10} /> Sent
                  </span>
                : <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#f87171", padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <XCircle size={10} /> Failed
                  </span>
            )}
            {!sendResult && !sending && (
              <span style={{ fontSize: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", letterSpacing: "0.05em" }}>
                New
              </span>
            )}
          </div>
        </div>

        {/* chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          <button
            onClick={() => copy(lead.email, "email")}
            title="Copy email"
            data-testid={`button-copy-email-${lead.id}`}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace", cursor: "pointer" }}
          >
            <Mail size={11} color="rgba(255,255,255,0.25)" />
            {lead.email}
            {copied === "email" ? <CheckCheck size={11} color="#34d399" style={{ marginLeft: 3 }} /> : <Copy size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: 3 }} />}
          </button>
          {lead.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace" }}>
              <Phone size={11} color="rgba(255,255,255,0.25)" />{lead.phone}
            </div>
          )}
          {lead.website && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace", maxWidth: 190, overflow: "hidden" }}>
              <Globe size={11} color="rgba(255,255,255,0.25)" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.website}</span>
            </div>
          )}
        </div>

        {/* email toggle */}
        <button
          onClick={() => setOpen(!open)}
          data-testid={`button-expand-email-${lead.id}`}
          style={{
            marginTop: 12, width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "9px 13px", borderRadius: 10,
            background: open ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: "pointer", transition: "background 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={12} color="rgba(139,92,246,0.8)" />
            <span style={{ fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Cold Email</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>— {lead.emailSubject}</span>
          </div>
          {open ? <ChevronUp size={14} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.2)" />}
        </button>
      </div>

      {/* expanded email */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ padding: "14px 22px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 4 }}>Subject</div>
              <div style={{ fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{lead.emailSubject}</div>
            </div>
            <button onClick={() => copy(lead.emailSubject, "subject")} data-testid={`button-copy-subject-${lead.id}`}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: copied === "subject" ? "#34d399" : "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: "pointer" }}>
              {copied === "subject" ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied === "subject" ? "Copied" : "Copy"}
            </button>
          </div>
          <div style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Email Body</div>
              <button onClick={() => copy(lead.emailBody, "body")} data-testid={`button-copy-body-${lead.id}`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: copied === "body" ? "#34d399" : "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: "pointer" }}>
                {copied === "body" ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copied === "body" ? "Copied" : "Copy"}
              </button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,0.55)", whiteSpace: "pre-line", fontFamily: "Inter, sans-serif" }}>
              {lead.emailBody}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── loading ────────────────────────────────────────────────────── */
function LoadingIndicator() {
  const steps = ["Scanning market data...", "Identifying prospects...", "Profiling companies...", "Writing cold emails...", "Finalizing your report..."];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s < steps.length - 1 ? s + 1 : s)), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px", gap: 24 }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 30px rgba(99,102,241,0.15)",
      }}>
        <Loader2 size={20} color="rgba(255,255,255,0.4)" style={{ animation: "spin-slow 1s linear infinite" }} />
      </div>
      <div key={step} style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        {steps[step]}
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            height: 3, borderRadius: 99,
            width: i === step ? 20 : 5,
            background: i <= step
              ? "linear-gradient(90deg, #3b82f6, #8b5cf6)"
              : "rgba(255,255,255,0.08)",
            transition: "all 0.4s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

const EXAMPLE_SEARCHES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

/* ─── main ───────────────────────────────────────────────────────── */
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
      if (result) data.results.forEach((r, i) => { map[result.leads[i]?.id] = r; });
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

  const copyAllEmails = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.leads.map((l) => l.email).join(", "));
    toast({ title: "Copied", description: "All 10 email addresses copied." });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", position: "relative" }}>
      <AmbientBg />
      {sendData && <SendResultsPanel data={sendData} onClose={() => setSendData(null)} />}
      <TopNav auth={auth} onDisconnect={() => disconnectMutation.mutate()} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "0 28px 140px" }}>

        {/* ── hero ─────────────────────────────────────────────────── */}
        <section style={{ textAlign: "center", paddingTop: 100, paddingBottom: 80 }}>

          {/* pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 16px 5px 12px", borderRadius: 99,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            marginBottom: 36, backdropFilter: "blur(12px)",
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 6, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={10} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.01em" }}>
              AI-powered sales intelligence
            </span>
          </div>

          {/* headline */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
            fontSize: "clamp(52px, 9vw, 96px)", lineHeight: 1.0,
            letterSpacing: "-0.04em", margin: "0 0 8px", color: "#fff",
          }}>
            Find your next
          </h1>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
            fontSize: "clamp(52px, 9vw, 96px)", lineHeight: 1.0,
            letterSpacing: "-0.04em", margin: "0 0 32px",
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            10 clients.
          </h1>

          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: "clamp(15px, 2vw, 18px)",
            lineHeight: 1.75, color: "rgba(255,255,255,0.4)",
            maxWidth: 500, margin: "0 auto 60px",
          }}>
            Enter a business type and city. Our AI finds 10 real prospects
            and writes a personalized cold email for each — instantly.
          </p>

          {/* ── form card ────────────────────────────────────────── */}
          <div style={{
            borderRadius: 20, padding: "28px 28px 22px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.4)",
            textAlign: "left",
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }} className="form-grid">
                {[
                  { label: "Business Type", value: businessType, set: setBusinessType, placeholder: "e.g. dentists, plumbers, HVAC…", icon: Building2, testid: "input-business-type" },
                  { label: "Location", value: location, set: setLocation, placeholder: "e.g. Houston, TX or Chicago…", icon: MapPin, testid: "input-location" },
                ].map(({ label, value, set, placeholder, icon: Icon, testid }) => (
                  <div key={label}>
                    <label style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <Icon size={14} color="rgba(255,255,255,0.2)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        placeholder={placeholder}
                        data-testid={testid}
                        style={{
                          width: "100%", padding: "12px 13px 12px 37px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif",
                          outline: "none", boxSizing: "border-box",
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending}
                data-testid="button-generate-leads"
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12,
                  background: generateMutation.isPending
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  border: generateMutation.isPending ? "1px solid rgba(255,255,255,0.08)" : "none",
                  color: generateMutation.isPending ? "rgba(255,255,255,0.3)" : "#fff",
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
                  letterSpacing: "-0.01em",
                  cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: generateMutation.isPending ? "none" : "0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.15)",
                }}
              >
                {generateMutation.isPending
                  ? <><Loader2 size={15} style={{ animation: "spin-slow 1s linear infinite" }} /> Generating...</>
                  : <><Zap size={15} /> Generate 10 leads + emails <ArrowRight size={14} /></>}
              </button>
            </form>

            {/* quick start */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Try:</span>
              {EXAMPLE_SEARCHES.map((ex) => (
                <button
                  key={ex.business}
                  onClick={() => { setBusinessType(ex.business); setLocation(ex.location); }}
                  data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                  style={{
                    padding: "5px 13px", borderRadius: 99,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "Inter, sans-serif",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  }}
                >
                  {ex.business} · {ex.location}
                </button>
              ))}
            </div>
          </div>

          {/* how it works */}
          {!result && !generateMutation.isPending && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 32 }}>
              {[
                { icon: MapPin, label: "Search", desc: "Enter any business type and city to target" },
                { icon: Sparkles, label: "Generate", desc: "AI finds 10 prospects and writes each a cold email" },
                { icon: Send, label: "Send", desc: "Connect Gmail and send all emails in one click" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{
                  padding: "22px 20px", borderRadius: 16, textAlign: "left",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, marginBottom: 14,
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={15} color="rgba(255,255,255,0.4)" />
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 6, letterSpacing: "-0.01em" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, fontFamily: "Inter, sans-serif" }}>{desc}</div>
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
            {/* stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 26 }}>
              {[
                { icon: Users, label: "Leads", value: String(result.leads.length), color: "#60a5fa" },
                { icon: Mail, label: "Emails", value: String(result.leads.length), color: "#a78bfa" },
                { icon: Target, label: "Industry", value: result.businessType, color: "#f472b6" },
                { icon: MapPin, label: "Location", value: result.location, color: "#34d399" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(20px)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* action bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.025em" }}>Lead Report</h2>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
                  {result.leads.length} prospects — <span style={{ color: "rgba(255,255,255,0.55)" }}>{result.businessType}</span> in <span style={{ color: "rgba(255,255,255,0.55)" }}>{result.location}</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={copyAllEmails}
                  data-testid="button-copy-all-emails"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em" }}
                >
                  <Copy size={12} /> Copy all emails
                </button>

                {auth?.connected ? (
                  <button
                    onClick={() => sendMutation.mutate(result.leads)}
                    disabled={sendMutation.isPending}
                    data-testid="button-send-all-emails"
                    style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 99,
                      background: sendMutation.isPending ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      border: "none",
                      color: sendMutation.isPending ? "rgba(255,255,255,0.3)" : "#fff",
                      fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                      cursor: sendMutation.isPending ? "not-allowed" : "pointer", letterSpacing: "-0.01em",
                      boxShadow: sendMutation.isPending ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
                    }}
                  >
                    {sendMutation.isPending ? <><Loader2 size={13} style={{ animation: "spin-slow 1s linear infinite" }} /> Sending...</> : <><Send size={13} /> Send all via Gmail</>}
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    data-testid="button-connect-gmail-results"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 99, background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", border: "none", color: "#fff", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", letterSpacing: "-0.01em" }}
                  >
                    <Mail size={13} /> Connect Gmail to send
                  </a>
                )}

                <button
                  onClick={() => generateMutation.mutate({ businessType, location })}
                  data-testid="button-regenerate"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em" }}
                >
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>

            {/* gmail warning */}
            {!auth?.connected && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.13)", marginBottom: 16 }}>
                <AlertCircle size={13} color="rgba(245,158,11,0.8)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: "rgba(245,158,11,0.6)", fontFamily: "Inter, sans-serif" }}>
                  Connect Gmail via the nav bar to send these emails directly from your inbox with one click.
                </p>
              </div>
            )}

            {/* cards */}
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
        @media (max-width: 620px) { .form-grid { grid-template-columns: 1fr !important; } }
        input::placeholder { color: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
