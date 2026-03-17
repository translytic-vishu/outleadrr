import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";

export const TEMPLATE_STORAGE_KEY = "outleadrr_active_template";

const F    = "'Inter','Helvetica Neue',Arial,sans-serif";
const BG   = "#0a0a0c";
const CARD = "rgba(255,255,255,0.03)";
const CARD_BORDER = "rgba(255,255,255,0.07)";
const TEXT  = "rgba(255,255,255,0.9)";
const TEXT2 = "rgba(255,255,255,0.55)";
const TEXT3 = "rgba(255,255,255,0.28)";
const IND  = "#8b5cf6";

const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  textarea{font-family:${F};resize:none;}
  @keyframes slideIn{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .tpl-card{
    transition:border-color .2s,box-shadow .2s,transform .2s;
    animation:fadeUp .35s cubic-bezier(.16,1,.3,1) both;
  }
  .tpl-card:hover{
    border-color:rgba(255,255,255,.14)!important;
    box-shadow:0 12px 36px rgba(0,0,0,.5)!important;
    transform:translateY(-2px);
  }
  .filter-btn-inactive:hover{
    color:rgba(255,255,255,0.75)!important;
    background:rgba(255,255,255,0.07)!important;
  }
  .use-btn:hover{
    transform:translateY(-1px);
    box-shadow:0 8px 24px rgba(139,92,246,.4)!important;
  }
`;

const TEMPLATES = [
  {
    id: 1, name: "The Value-First Open", tag: "Professional", tagColor: "#6366f1",
    subject: "Quick question about {{Company}}'s growth plans",
    body: `Hi {{FirstName}},

I came across {{Company}} while looking into {{Industry}} businesses in {{City}} and was genuinely impressed by your work.

Most businesses at your stage are focused on [specific challenge]. We've helped 40+ similar companies solve this with [specific approach], typically seeing [result] within the first 90 days.

Would it be worth a 15-minute call this week to see if there's a fit?

Best,
{{YourName}}`,
    uses: 94, tone: "Formal, credibility-led",
  },
  {
    id: 2, name: "The Casual Check-in", tag: "Friendly", tagColor: "#10b981",
    subject: "Hey {{FirstName}} — thought of you",
    body: `Hey {{FirstName}}!

Came across {{Company}} recently and genuinely love what you're building in {{City}}. The kind of business that's clearly doing things right.

I work with businesses like yours to help with [specific value prop]. Nothing pushy — just thought it might be worth a quick chat if the timing's ever right.

Are you open to a 10-minute call sometime this week?

Cheers,
{{YourName}}`,
    uses: 67, tone: "Warm, peer-to-peer",
  },
  {
    id: 3, name: "The Direct Ask", tag: "Direct", tagColor: "#f59e0b",
    subject: "15 minutes to improve {{Company}}'s [metric]?",
    body: `Hi {{FirstName}},

I'll keep this short.

I help {{Industry}} businesses in {{City}} [specific outcome]. Usually takes less than 30 days to see results.

Worth 15 minutes? Book directly here: [calendar link]

{{YourName}}`,
    uses: 51, tone: "No-fluff, fast",
  },
  {
    id: 4, name: "The Case Study Lead", tag: "Persuasive", tagColor: "#8b5cf6",
    subject: "How [Similar Company] got [result] in 90 days",
    body: `Hi {{FirstName}},

[Similar Company in {{City}}] was dealing with the exact same challenge {{Company}} is likely facing right now.

After working with us for 90 days, they [specific measurable result]. Here's how we did it: [brief explanation].

I think we could do the same for {{Company}}. Would you be open to a quick call to explore it?

{{YourName}}`,
    uses: 43, tone: "Proof-first, credible",
  },
  {
    id: 5, name: "The Industry Insight", tag: "Consultative", tagColor: "#3b82f6",
    subject: "One {{Industry}} trend that's affecting businesses like {{Company}}",
    body: `Hi {{FirstName}},

Something I keep hearing from {{Industry}} owners in {{City}}: [specific insight or trend].

Most businesses don't realize how much this is costing them until it's too late. We've built a solution specifically around this — and the results have been strong.

I'd love to share what we're seeing. Would a 20-minute call this week work for you?

{{YourName}}`,
    uses: 38, tone: "Advisory, thought-led",
  },
  {
    id: 6, name: "The Bold Challenger", tag: "Bold", tagColor: "#ef4444",
    subject: "Honest question for {{FirstName}} at {{Company}}",
    body: `{{FirstName}} —

Most {{Industry}} businesses in {{City}} are leaving [opportunity/money] on the table and don't even know it.

{{Company}} might be too.

I can show you in under 10 minutes. No slides, no pitch — just a straight conversation about what we're seeing.

Worth it?

{{YourName}}`,
    uses: 29, tone: "Disruptive, confident",
  },
  {
    id: 7, name: "The Problem Agitator", tag: "Persuasive", tagColor: "#8b5cf6",
    subject: "Is {{Company}} dealing with [common pain]?",
    body: `Hi {{FirstName}},

One thing I hear constantly from {{Industry}} businesses: [common frustration or problem].

It's not a new problem — but most solutions out there either cost too much or take too long to set up.

We built something different. It's working well for businesses in {{City}} already.

Happy to show you a quick demo — no strings attached.

{{YourName}}`,
    uses: 35, tone: "Pain-first, empathetic",
  },
  {
    id: 8, name: "The Quick Win Offer", tag: "Direct", tagColor: "#f59e0b",
    subject: "A free [deliverable] for {{Company}}",
    body: `Hi {{FirstName}},

I put together a free [specific deliverable — audit, analysis, report] for {{Company}} based on what I saw online.

It covers [specific finding 1] and [specific finding 2] — both are quick wins your team could action this week.

Want me to send it over? Takes 2 minutes to review.

{{YourName}}`,
    uses: 48, tone: "Generous, low-friction",
  },
  {
    id: 9, name: "The Mutual Connection", tag: "Friendly", tagColor: "#10b981",
    subject: "[Mutual connection] suggested I reach out",
    body: `Hi {{FirstName}},

[Mutual connection's name] mentioned you're the right person to talk to at {{Company}}.

We recently helped [their business / similar business] with [result], and [mutual connection] thought it might be worth an introduction.

Would you be open to a quick 15-minute call to see if there's a fit?

{{YourName}}`,
    uses: 22, tone: "Trust-transfer, warm",
  },
  {
    id: 10, name: "The FOMO Play", tag: "Bold", tagColor: "#ef4444",
    subject: "Your {{City}} competitors are already doing this",
    body: `Hi {{FirstName}},

I've been working with several {{Industry}} businesses in {{City}} recently, and there's a clear pattern emerging among the ones that are growing fastest.

They all [specific thing they're doing].

{{Company}} isn't on that list yet — but it could be.

Would you be open to a 15-minute call to see what that would look like for you specifically?

{{YourName}}`,
    uses: 31, tone: "Competitive urgency",
  },
  {
    id: 11, name: "The Referral Ask", tag: "Casual", tagColor: "#06b6d4",
    subject: "Not for you — but maybe someone you know?",
    body: `Hi {{FirstName}},

I'll be upfront — this might not be relevant to you directly. But I help {{Industry}} businesses in {{City}} with [specific thing], and I'm looking to connect with a few more this quarter.

If you know anyone who might benefit, I'd love an intro. Happy to return the favour.

Either way, hope things are going well at {{Company}}.

{{YourName}}`,
    uses: 17, tone: "Disarming, indirect",
  },
  {
    id: 12, name: "The Re-engagement", tag: "Friendly", tagColor: "#10b981",
    subject: "Checking back in — still relevant?",
    body: `Hi {{FirstName}},

Reaching back out after a while — hope things are going well at {{Company}}.

Last time we connected, [brief recap of context]. The timing wasn't quite right then, which is completely fine.

I wanted to check in and see if anything has changed on your end. We've had some great results with {{Industry}} businesses in {{City}} recently and thought of you.

Worth a quick catch-up?

{{YourName}}`,
    uses: 26, tone: "Re-engagement, respectful",
  },
  {
    id: 13, name: "The Scarcity Hook", tag: "Bold", tagColor: "#ef4444",
    subject: "Last 2 spots this month — {{City}} businesses only",
    body: `Hi {{FirstName}},

I'm only taking on 2 more clients in {{City}} this month — I keep it small on purpose so I can actually deliver results.

Both spots are for {{Industry}} businesses ready to [specific outcome]. No fluff, no retainer traps.

If the timing works, I'd love to chat. If not, no worries — I'll reach out again next quarter.

{{YourName}}`,
    uses: 19, tone: "Urgency-driven, genuine",
  },
  {
    id: 14, name: "The Compliment Open", tag: "Friendly", tagColor: "#10b981",
    subject: "{{Company}}'s [specific thing] caught my attention",
    body: `Hi {{FirstName}},

I was doing research on {{Industry}} businesses in {{City}} and {{Company}} genuinely stood out — specifically [what you noticed].

That kind of [quality/approach] is rare. I work with businesses like yours on [specific value]. Thought it might be worth a conversation.

Would you be open to a quick intro call?

{{YourName}}`,
    uses: 41, tone: "Compliment-led, warm",
  },
  {
    id: 15, name: "The Results First", tag: "Persuasive", tagColor: "#8b5cf6",
    subject: "[Result] in 30 days — would this interest you?",
    body: `Hi {{FirstName}},

Quick one.

We helped a {{Industry}} business in {{City}} achieve [specific result] in 30 days.

The approach was simple: [one-sentence explanation].

{{Company}} looks like it could benefit from the same playbook. Happy to walk you through it in 15 minutes — no pitch, just the framework.

Interested?

{{YourName}}`,
    uses: 33, tone: "Results-led, concise",
  },
  {
    id: 16, name: "The One Question", tag: "Direct", tagColor: "#f59e0b",
    subject: "One question for {{Company}}",
    body: `{{FirstName}} —

One question: What's the biggest bottleneck stopping {{Company}} from [goal] right now?

I ask because I help {{Industry}} businesses in {{City}} solve exactly this — and the answer is usually the same three things.

Worth 10 minutes to find out if I can help?

{{YourName}}`,
    uses: 28, tone: "Curiosity-driven, minimal",
  },
  {
    id: 17, name: "The Before/After", tag: "Consultative", tagColor: "#3b82f6",
    subject: "Before/after: How {{City}} {{Industry}} businesses are changing",
    body: `Hi {{FirstName}},

Six months ago, most {{Industry}} businesses in {{City}} were dealing with [common before-state].

The ones that adapted are now [after-state].

We've been part of that shift for several of them — helping with [specific area]. The ones that moved early are seeing [result].

Would love to share what's working. Open to a quick chat?

{{YourName}}`,
    uses: 24, tone: "Narrative, advisory",
  },
  {
    id: 18, name: "The Honest Pitch", tag: "Casual", tagColor: "#06b6d4",
    subject: "An honest pitch for {{Company}}",
    body: `Hi {{FirstName}},

I'll be straight with you — this is a cold email. I found {{Company}} while researching {{Industry}} businesses in {{City}}.

I help businesses like yours with [specific thing]. I'm good at it. My clients see [result].

Not asking for a big commitment — just a 15-minute call to see if it's even relevant. If it's not, I won't follow up.

Worth a quick look?

{{YourName}}`,
    uses: 37, tone: "Transparent, refreshing",
  },
];

const TAGS = ["All", "Professional", "Friendly", "Direct", "Persuasive", "Consultative", "Bold", "Casual"];

export default function Templates() {
  const [active, setActive] = useState<typeof TEMPLATES[0] | null>(null);
  const [filter, setFilter] = useState("All");
  const [, setLocation] = useLocation();

  function useInBuilder(t: typeof TEMPLATES[0]) {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify({
      name: t.name,
      subject: t.subject,
      body: t.body,
      tone: t.tag.toLowerCase(),
    }));
    setLocation("/app");
  }

  const visible = filter === "All" ? TEMPLATES : TEMPLATES.filter(t => t.tag === filter);

  return (
    <AppLayout>
      <style>{CSS}</style>
      <PageIntro config={PAGE_INTROS.templates} />

      <div style={{ padding: "32px 40px", fontFamily: F, minHeight: "100vh", background: BG }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-.04em", marginBottom: 4 }}>
              Templates
            </h1>
            <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>
              {TEMPLATES.length} ready-to-use email frameworks. Click any to preview and use.
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {TAGS.map(tag => {
            const isActive = filter === tag;
            return (
              <button
                key={tag}
                className={isActive ? undefined : "filter-btn-inactive"}
                onClick={() => setFilter(tag)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: isActive
                    ? "1.5px solid rgba(139,92,246,0.4)"
                    : "1.5px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(139,92,246,0.15)"
                    : "rgba(255,255,255,0.04)",
                  color: isActive
                    ? "#a78bfa"
                    : "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: F,
                  transition: "all .15s",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {visible.map((t, i) => (
            <div
              key={t.id}
              className="tpl-card"
              onClick={() => setActive(t)}
              style={{
                background: CARD,
                borderRadius: 14,
                border: `1px solid ${CARD_BORDER}`,
                padding: "20px",
                cursor: "pointer",
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, lineHeight: 1.3, flex: 1, marginRight: 8 }}>
                  {t.name}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: `${t.tagColor}20`,
                  color: t.tagColor,
                  flexShrink: 0,
                }}>
                  {t.tag}
                </span>
              </div>
              <div style={{ fontSize: 11, color: TEXT3, marginBottom: 10, fontStyle: "italic" }}>
                {t.tone}
              </div>
              <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 6 }}>
                Subject:
              </div>
              <div style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                marginBottom: 12,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as any,
              }}>
                {t.subject}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: TEXT3 }}>Used {t.uses}×</div>
                <div style={{ fontSize: 12, color: IND, fontWeight: 600 }}>Preview →</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-in drawer */}
      {active && (
        <>
          <div
            onClick={() => setActive(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 201,
              width: 500,
              background: "#111114",
              overflowY: "auto",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-16px 0 64px rgba(0,0,0,.8)",
              animation: "slideIn .22s cubic-bezier(.16,1,.3,1)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              background: "#111114",
              zIndex: 1,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{active.name}</div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: `${active.tagColor}20`,
                    color: active.tagColor,
                  }}>
                    {active.tag}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: TEXT3 }}>{active.tone} · Used {active.uses} times</div>
              </div>
              <button
                onClick={() => setActive(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: TEXT3,
                  fontSize: 22,
                  lineHeight: 1,
                  padding: 4,
                  marginTop: -2,
                }}
              >
                ×
              </button>
            </div>

            {/* Drawer body */}
            <div style={{ padding: "20px 24px" }}>
              {/* Subject */}
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: TEXT3,
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                  marginBottom: 8,
                }}>
                  Subject Line
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 9,
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  {active.subject}
                </div>
              </div>

              {/* Body */}
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: TEXT3,
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                  marginBottom: 8,
                }}>
                  Email Body
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 9,
                  padding: "14px 16px",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.75,
                  border: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "pre-wrap",
                }}>
                  {active.body}
                </div>
              </div>

              {/* Variables */}
              <div style={{
                background: "rgba(139,92,246,0.08)",
                borderRadius: 10,
                border: "1px solid rgba(139,92,246,0.2)",
                padding: "14px 16px",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: IND, marginBottom: 8 }}>Dynamic Variables</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["{{FirstName}}", "{{Company}}", "{{City}}", "{{Industry}}", "{{YourName}}"].map(v => (
                    <span key={v} style={{
                      background: "rgba(139,92,246,0.15)",
                      color: IND,
                      padding: "3px 9px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                className="use-btn"
                onClick={() => active && useInBuilder(active)}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: F,
                  boxShadow: "0 4px 16px rgba(139,92,246,.3)",
                  transition: "transform .15s, box-shadow .15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Use This Template in Builder
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
