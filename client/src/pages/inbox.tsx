import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";
import type { AuthStatus } from "@shared/schema";

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
  textarea{font-family:${F};resize:none;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .thread-row{cursor:pointer;transition:background .12s;}
  .thread-row:hover{background:#fafafa;}
`;

interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

function parseFrom(from: string) {
  const match = from.match(/^"?(.+?)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function InitialAvatar({ name }: { name: string }) {
  const letter = name.trim()[0]?.toUpperCase() || "?";
  const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6","#06b6d4","#ef4444"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors[idx], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: W, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

export default function Inbox() {
  const [active, setActive] = useState<GmailMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  const replyMutation = useMutation({
    mutationFn: (data: { to: string; subject: string; body: string }) =>
      apiRequest("POST", "/api/inbox/reply", data).then(r => r.json()),
    onSuccess: () => {
      setReply("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    },
  });

  function sendReply() {
    if (!active || !reply.trim()) return;
    const { email } = parseFrom(active.from);
    replyMutation.mutate({ to: email, subject: active.subject, body: reply.trim() });
  }

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  const { data, isLoading } = useQuery<{ messages: GmailMessage[]; connected: boolean }>({
    queryKey: ["/api/inbox"],
    queryFn: () => apiRequest("GET", "/api/inbox").then(r => r.json()),
    enabled: !!gmailStatus?.connected,
  });

  const messages = data?.messages || [];

  return (
    <AppLayout>
      <style>{CSS}</style>
      <PageIntro config={PAGE_INTROS.inbox} />

      <div style={{ display: "flex", height: "100%", fontFamily: F, overflow: "hidden" }}>

        {/* Thread list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${BDR}`, overflowY: "auto", background: W, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: K, letterSpacing: "-.02em" }}>Inbox</div>
            {messages.length > 0 && (
              <div style={{ fontSize: 12, color: K3, marginTop: 3 }}>
                {messages.filter(m => m.isUnread).length} unread · {messages.length} messages
              </div>
            )}
          </div>

          {!gmailStatus?.connected ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${IND}10`, border: `1px solid ${IND}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke={IND} strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke={IND} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: K, marginBottom: 6 }}>Gmail not connected</div>
              <div style={{ fontSize: 12, color: K3, marginBottom: 14 }}>Connect Gmail to see your inbox here.</div>
              <a href="/api/auth/google" style={{ padding: "8px 16px", borderRadius: 8, background: IND, color: W, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Connect Gmail</a>
            </div>
          ) : isLoading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ animation: "spin 1s linear infinite" }} width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke={K3} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: K, marginBottom: 6 }}>No messages</div>
              <div style={{ fontSize: 12, color: K3 }}>Your inbox is empty or no messages loaded.</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {messages.map(msg => {
                const { name, email } = parseFrom(msg.from);
                const isActive = active?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    className="thread-row"
                    onClick={() => setActive(msg)}
                    style={{
                      padding: "13px 16px",
                      borderBottom: `1px solid ${BDR}`,
                      background: isActive ? `${IND}08` : "transparent",
                      borderLeft: isActive ? `3px solid ${IND}` : "3px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <InitialAvatar name={name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <div style={{ fontSize: 13, fontWeight: msg.isUnread ? 700 : 500, color: K, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {msg.isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: IND, flexShrink: 0 }} />}
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: K3, flexShrink: 0, marginLeft: 6 }}>{formatDate(msg.date)}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: msg.isUnread ? 600 : 400, color: K2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{msg.subject || "(no subject)"}</div>
                        <div style={{ fontSize: 11, color: K3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.snippet}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!active ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: BG }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${IND}10`, border: `1px solid ${IND}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke={IND} strokeWidth="1.5"/><path d="M2 8l10 7 10-7" stroke={IND} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: K, marginBottom: 6 }}>Select a message</div>
              <div style={{ fontSize: 13, color: K3 }}>{gmailStatus?.connected ? "Click a message on the left to read it." : "Connect Gmail to see your inbox."}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "18px 28px", borderBottom: `1px solid ${BDR}`, background: W, flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: K, marginBottom: 4 }}>{active.subject || "(no subject)"}</div>
                <div style={{ fontSize: 12, color: K3 }}>
                  From: {active.from} · {formatDate(active.date)}
                </div>
              </div>

              {/* Message body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: BG }}>
                <div style={{ background: W, borderRadius: 12, border: `1px solid ${BDR}`, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <InitialAvatar name={parseFrom(active.from).name} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K }}>{parseFrom(active.from).name}</div>
                      <div style={{ fontSize: 11, color: K3 }}>{parseFrom(active.from).email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: K2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{active.snippet}</div>
                  <div style={{ marginTop: 16, padding: "10px 14px", background: BG, borderRadius: 8, border: `1px solid ${BDR}`, fontSize: 11, color: K3 }}>
                    Full message preview — open in Gmail for complete view.
                  </div>
                </div>
              </div>

              {/* Reply box */}
              <div style={{ padding: "14px 28px 18px", borderTop: `1px solid ${BDR}`, background: W, flexShrink: 0 }}>
                <div style={{ background: BG, borderRadius: 10, border: `1.5px solid #e4e4e8`, overflow: "hidden", transition: "border-color .18s" }}
                  onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = IND; }}
                  onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e4e4e8"; }}
                >
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={`Reply to ${parseFrom(active.from).name}...`}
                    rows={3}
                    style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", outline: "none", fontSize: 13, color: K, lineHeight: 1.6 }}
                  />
                  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "flex-end", borderTop: `1px solid ${BDR}`, gap: 8 }}>
                    {sent && (
                      <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5L11 3" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Sent
                      </span>
                    )}
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || replyMutation.isPending}
                      style={{
                        padding: "7px 18px", borderRadius: 8, border: "none",
                        background: reply.trim() ? IND : "#e4e4e8",
                        color: reply.trim() ? W : K3,
                        fontSize: 13, fontWeight: 700,
                        cursor: reply.trim() && !replyMutation.isPending ? "pointer" : "not-allowed",
                        fontFamily: F, transition: "all .15s",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {replyMutation.isPending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: K3, marginTop: 8 }}>
                  Replies are sent via your connected Gmail: {gmailStatus?.email}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
