import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query"; // useMutation used for replyMutation
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/AppLayout";
import { useTheme } from "@/lib/theme";
import type { AuthStatus } from "@/../../shared/schema";

const F = "'Inter','Helvetica Neue',Arial,sans-serif";
const ACC = "#8b5cf6";

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  textarea{font-family:${F};resize:none;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
  .thread-row{cursor:pointer;transition:background .1s,border-left-color .1s;border-left:3px solid transparent;}
  .thread-row.active-thread{border-left-color:${ACC};}
  .smart-chip{
    padding:8px 14px;border-radius:20px;border:none;cursor:pointer;
    font-family:${F};font-size:12px;font-weight:500;
    transition:all .15s;text-align:left;
  }
`;

interface GmailMessage {
  id: string; from: string; subject: string;
  date: string; snippet: string; isUnread: boolean;
}

interface SummaryData { summary: string; keyPoints: string[]; }

function parseFrom(from: string) {
  const m = from.match(/^"?(.+?)"?\s*<(.+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: from, email: from };
}

function formatDate(d: string) {
  try {
    const dt = new Date(d), now = new Date(), diff = now.getTime() - dt.getTime();
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    if (diff < 604800000) return dt.toLocaleDateString("en-US", { weekday:"short" });
    return dt.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  } catch { return d; }
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = name.trim()[0]?.toUpperCase() || "?";
  const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6","#06b6d4","#ef4444"];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${c}22`, border:`1px solid ${c}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size/2.8, fontWeight:700, color:c, flexShrink:0 }}>
      {letter}
    </div>
  );
}

export default function Inbox() {
  const { tokens, isDark } = useTheme();
  const [active, setActive] = useState<GmailMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { data: gmailStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: () => apiRequest("GET", "/api/auth/status").then(r => r.json()),
  });

  const { data, isLoading } = useQuery<{ messages: GmailMessage[]; connected: boolean }>({
    queryKey: ["/api/inbox"],
    queryFn: () => apiRequest("GET", "/api/inbox").then(r => r.json()),
    enabled: !!gmailStatus?.connected,
  });

  const replyMutation = useMutation({
    mutationFn: (d: { to: string; subject: string; body: string }) =>
      apiRequest("POST", "/api/inbox/reply", d).then(r => r.json()),
    onSuccess: () => { setReply(""); setSent(true); setTimeout(() => setSent(false), 3000); },
  });

  async function selectMessage(msg: GmailMessage) {
    setActive(msg);
    setSummary(null);
    setSmartReplies([]);
    setSummaryLoading(true);

    // Load summary + smart replies in parallel
    try {
      const [sumRes, srpRes] = await Promise.all([
        apiRequest("POST", "/api/inbox/summarize", { subject: msg.subject, snippet: msg.snippet, from: msg.from }).then(r => r.json()),
        apiRequest("POST", "/api/inbox/smart-replies", { subject: msg.subject, snippet: msg.snippet, from: msg.from }).then(r => r.json()),
      ]);
      setSummary(sumRes);
      setSmartReplies(srpRes.replies || []);
    } catch { /* ignore */ }
    setSummaryLoading(false);
  }

  function sendReply() {
    if (!active || !reply.trim()) return;
    replyMutation.mutate({ to: parseFrom(active.from).email, subject: active.subject, body: reply.trim() });
  }

  const messages = data?.messages || [];

  // Theme tokens
  const panelBg   = isDark ? "#111111" : tokens.panel;
  const detailBg  = isDark ? "#0a0a0a" : tokens.bg;
  const cardBg    = isDark ? "rgba(255,255,255,0.035)" : "#ffffff";
  const bdr       = tokens.border;
  const bdr2      = tokens.border2;
  const text1     = tokens.text;
  const text2     = tokens.text2;
  const text3     = tokens.text3;
  const rowHover  = isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5";
  const rowActive = isDark ? "rgba(139,92,246,0.08)" : "rgba(124,58,237,0.06)";
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5";
  const smartChipBg  = isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
  const smartChipHov = isDark ? "rgba(139,92,246,0.15)" : "rgba(124,58,237,0.08)";
  const smartChipTxt = text2;

  return (
    <AppLayout>
      <style>{CSS}</style>

      <div style={{ display:"flex", height:"100%", fontFamily:F, overflow:"hidden" }}>

        {/* ── Thread list ── */}
        <div style={{ width:300, flexShrink:0, borderRight:`1px solid ${bdr}`, overflowY:"auto", background:panelBg, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"18px 18px 14px", borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
            <div style={{ fontSize:15, fontWeight:800, color:text1, letterSpacing:"-.02em" }}>Inbox</div>
            {messages.length > 0 && (
              <div style={{ fontSize:12, color:text3, marginTop:3 }}>
                {messages.filter(m => m.isUnread).length} unread · {messages.length} messages
              </div>
            )}
          </div>

          {!gmailStatus?.connected ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px", textAlign:"center" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${ACC}18`, border:`1px solid ${ACC}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke={ACC} strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke={ACC} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:text1, marginBottom:6 }}>Gmail not connected</div>
              <div style={{ fontSize:12, color:text3, marginBottom:14 }}>Connect Gmail to see your inbox here.</div>
              <a href="/api/auth/google" style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", color:"#fff", fontSize:12, fontWeight:700, textDecoration:"none" }}>Connect Gmail</a>
            </div>
          ) : isLoading ? (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg style={{ animation:"spin 1s linear infinite" }} width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke={text3} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:600, color:text1, marginBottom:6 }}>No messages</div>
              <div style={{ fontSize:12, color:text3 }}>Your inbox is empty.</div>
            </div>
          ) : (
            <div style={{ flex:1, overflowY:"auto" }}>
              {messages.map(msg => {
                const { name } = parseFrom(msg.from);
                const isAct = active?.id === msg.id;
                return (
                  <div key={msg.id}
                    className={`thread-row${isAct ? " active-thread" : ""}`}
                    onClick={() => selectMessage(msg)}
                    style={{ padding:"13px 16px", borderBottom:`1px solid ${bdr}`, background: isAct ? rowActive : "transparent" }}
                    onMouseEnter={e => { if (!isAct) (e.currentTarget as HTMLDivElement).style.background = rowHover; }}
                    onMouseLeave={e => { if (!isAct) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={name} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                          <div style={{ fontSize:13, fontWeight:msg.isUnread ? 700 : 500, color:text1, display:"flex", alignItems:"center", gap:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                            {msg.isUnread && <div style={{ width:6, height:6, borderRadius:"50%", background:ACC, flexShrink:0, boxShadow:`0 0 6px ${ACC}80` }} />}
                            {name}
                          </div>
                          <div style={{ fontSize:10, color:text3, flexShrink:0, marginLeft:6 }}>{formatDate(msg.date)}</div>
                        </div>
                        <div style={{ fontSize:12, fontWeight:msg.isUnread ? 600 : 400, color:text2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>{msg.subject || "(no subject)"}</div>
                        <div style={{ fontSize:11, color:text3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.snippet}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Message detail ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:detailBg }}>
          {!active ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:56, height:56, borderRadius:16, background:`${ACC}12`, border:`1px solid ${ACC}25`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke={ACC} strokeWidth="1.5" strokeOpacity=".7"/><path d="M2 8l10 7 10-7" stroke={ACC} strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".7"/></svg>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:text1, marginBottom:6 }}>Select a message</div>
              <div style={{ fontSize:13, color:text3 }}>{gmailStatus?.connected ? "Click a message on the left to read it." : "Connect Gmail to see your inbox."}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding:"18px 28px", borderBottom:`1px solid ${bdr}`, background:panelBg, flexShrink:0 }}>
                <div style={{ fontSize:17, fontWeight:700, color:text1, marginBottom:4 }}>{active.subject || "(no subject)"}</div>
                <div style={{ fontSize:12, color:text3 }}>From: {active.from} · {formatDate(active.date)}</div>
              </div>

              {/* Body + right panel */}
              <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

                {/* Email body + reply */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto", minWidth:0 }}>
                  <div style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
                    <div style={{ background:cardBg, borderRadius:14, border:`1px solid ${bdr}`, padding:"20px 22px", animation:"slideIn .2s ease both" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                        <Avatar name={parseFrom(active.from).name} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:text1 }}>{parseFrom(active.from).name}</div>
                          <div style={{ fontSize:11, color:text3 }}>{parseFrom(active.from).email}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:text2, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{active.snippet}</div>
                      <div style={{ marginTop:16, padding:"10px 14px", background:isDark ? "rgba(255,255,255,0.035)" : "#f4f4f5", borderRadius:8, border:`1px solid ${bdr}`, fontSize:11, color:text3 }}>
                        Showing preview — full message available in Gmail.
                      </div>
                    </div>
                  </div>

                  {/* Smart reply chips */}
                  {smartReplies.length > 0 && (
                    <div style={{ padding:"0 28px 12px", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0 }}>
                      {smartReplies.map((r, i) => (
                        <button key={i} className="smart-chip"
                          style={{ background:smartChipBg, color:smartChipTxt }}
                          onClick={() => setReply(r)}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = smartChipHov; (e.currentTarget as HTMLButtonElement).style.color = ACC; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = smartChipBg; (e.currentTarget as HTMLButtonElement).style.color = smartChipTxt; }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reply box */}
                  <div style={{ padding:"14px 28px 18px", borderTop:`1px solid ${bdr}`, background:panelBg, flexShrink:0 }}>
                    <div style={{ background:inputBg, borderRadius:10, border:`1.5px solid ${bdr2}`, overflow:"hidden", transition:"border-color .18s" }}
                      onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,.5)"; }}
                      onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = bdr2; }}
                    >
                      <textarea value={reply} onChange={e => setReply(e.target.value)}
                        placeholder={`Reply to ${parseFrom(active.from).name}...`}
                        rows={3}
                        style={{ width:"100%", padding:"12px 16px", background:"transparent", border:"none", outline:"none", fontSize:13, color:text1, lineHeight:1.6 }}
                      />
                      <div style={{ padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"flex-end", borderTop:`1px solid ${bdr}`, gap:8 }}>
                        {sent && (
                          <span style={{ fontSize:12, color:"#4ade80", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5L11 3" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Sent
                          </span>
                        )}
                        <button onClick={sendReply} disabled={!reply.trim() || replyMutation.isPending}
                          style={{ padding:"7px 18px", borderRadius:8, border:"none", background: reply.trim() ? "linear-gradient(135deg,#7c3aed,#8b5cf6)" : (isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)"), color: reply.trim() ? "#fff" : text3, fontSize:13, fontWeight:700, cursor: reply.trim() && !replyMutation.isPending ? "pointer" : "not-allowed", fontFamily:F, transition:"all .15s", display:"flex", alignItems:"center", gap:6 }}
                        >
                          {replyMutation.isPending
                            ? <><svg style={{ animation:"spin 1s linear infinite" }} width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Sending…</>
                            : "Send Reply"}
                        </button>
                      </div>
                    </div>
                    {gmailStatus?.email && (
                      <div style={{ fontSize:11, color:text3, marginTop:8 }}>Sending from: {gmailStatus.email}</div>
                    )}
                  </div>
                </div>

                {/* ── AI Summary panel ── */}
                <div style={{ width:280, flexShrink:0, borderLeft:`1px solid ${bdr}`, overflowY:"auto", background:panelBg, display:"flex", flexDirection:"column" }}>
                  <div style={{ padding:"16px 18px", borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:ACC, letterSpacing:".1em", textTransform:"uppercase" }}>AI Summary</div>
                    <div style={{ fontSize:11, color:text3, marginTop:2 }}>Instant email breakdown</div>
                  </div>

                  <div style={{ flex:1, padding:"16px 18px", display:"flex", flexDirection:"column", gap:14 }}>
                    {summaryLoading ? (
                      <div style={{ display:"flex", alignItems:"center", gap:8, color:text3, fontSize:12 }}>
                        <svg style={{ animation:"spin 1s linear infinite", flexShrink:0 }} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        Analyzing email…
                      </div>
                    ) : summary ? (
                      <>
                        {/* Summary */}
                        <div style={{ animation:"fadeUp .3s ease both" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:text3, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Summary</div>
                          <div style={{ fontSize:13, color:text2, lineHeight:1.7, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius:10, padding:"12px 14px", border:`1px solid ${bdr}` }}>
                            {summary.summary}
                          </div>
                        </div>

                        {/* Key points */}
                        {summary.keyPoints?.length > 0 && (
                          <div style={{ animation:"fadeUp .3s ease both .05s" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:text3, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Key Points</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              {summary.keyPoints.map((pt, i) => (
                                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                                  <div style={{ width:5, height:5, borderRadius:"50%", background:ACC, marginTop:6, flexShrink:0 }} />
                                  <div style={{ fontSize:12, color:text2, lineHeight:1.6 }}>{pt}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Smart replies header */}
                        {smartReplies.length > 0 && (
                          <div style={{ animation:"fadeUp .3s ease both .1s" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:text3, letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Suggested Replies</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              {smartReplies.map((r, i) => (
                                <button key={i}
                                  onClick={() => setReply(r)}
                                  style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${bdr}`, background:isDark ? "rgba(255,255,255,0.04)" : "#f8f8fb", color:text2, fontSize:12, fontWeight:500, textAlign:"left", cursor:"pointer", fontFamily:F, transition:"all .15s", lineHeight:1.5 }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACC}60`; (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(139,92,246,0.1)" : "rgba(124,58,237,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = ACC; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = bdr; (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "#f8f8fb"; (e.currentTarget as HTMLButtonElement).style.color = text2; }}
                                >
                                  "{r}"
                                </button>
                              ))}
                            </div>
                            <div style={{ fontSize:10, color:text3, marginTop:8 }}>Click to fill reply box</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize:12, color:text3, lineHeight:1.6 }}>Select an email to see an AI-powered summary and reply suggestions.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
