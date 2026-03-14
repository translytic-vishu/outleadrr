import { AppLayout } from "@/components/AppLayout";
import { PageIntro, PAGE_INTROS } from "@/components/PageIntro";
import { useLocation } from "wouter";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K3  = "#888";
const W   = "#ffffff";
const BDR = "rgba(0,0,0,0.07)";
const IND = "#6366f1";

const CSS = `*,*::before,*::after{box-sizing:border-box;}`;

const COLUMNS = [
  { id: "new",       label: "New",        color: "#6366f1", bg: "#6366f108" },
  { id: "contacted", label: "Contacted",  color: "#3b82f6", bg: "#3b82f608" },
  { id: "replied",   label: "Replied",    color: "#10b981", bg: "#10b98108" },
  { id: "meeting",   label: "Meeting",    color: "#8b5cf6", bg: "#8b5cf608" },
  { id: "closed",    label: "Closed Won", color: "#16a34a", bg: "#16a34a08" },
];

export default function Leads() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <style>{CSS}</style>
      <PageIntro config={PAGE_INTROS.leads} />

      <div style={{ padding: "28px 36px", fontFamily: F, display: "flex", flexDirection: "column", height: "100%" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em", marginBottom: 4 }}>Lead CRM</h1>
          <p style={{ fontSize: 13, color: K3 }}>Track every lead through your pipeline. Leads appear here after you run a campaign.</p>
        </div>

        {/* Empty state with column scaffolding */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "flex", gap: 14, height: "100%", minHeight: 500 }}>
            {COLUMNS.map(col => (
              <div key={col.id} style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column" }}>

                {/* Column header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10, padding: "0 2px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: K }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: K3, background: "#f1f5f9", padding: "1px 7px", borderRadius: 5 }}>0</span>
                </div>

                {/* Drop zone */}
                <div style={{
                  flex: 1, borderRadius: 12,
                  background: col.bg,
                  border: `1.5px dashed ${col.color}30`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "24px 16px", textAlign: "center", minHeight: 200,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${col.color}15`, border: `1px solid ${col.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="4.5" r="2.2" stroke={col.color} strokeWidth="1.4"/>
                      <path d="M2.5 12c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5" stroke={col.color} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: K3, marginBottom: 4 }}>No leads yet</div>
                  <div style={{ fontSize: 11, color: "#bbb", lineHeight: 1.5 }}>Leads from campaigns will appear here</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 24, padding: "20px 24px",
          background: W, borderRadius: 14, border: `1px solid ${BDR}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 6px rgba(0,0,0,.05)",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: K, marginBottom: 3 }}>Run your first campaign</div>
            <div style={{ fontSize: 12, color: K3 }}>Generate leads in the Campaign Builder. They'll automatically populate this board.</div>
          </div>
          <button
            onClick={() => setLocation("/app")}
            style={{
              padding: "10px 22px", borderRadius: 9, border: "none",
              background: IND, color: W, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: F, flexShrink: 0,
              boxShadow: "0 2px 10px rgba(99,102,241,.3)",
              transition: "all .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4f46e5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = IND; }}
          >
            Open Campaign Builder
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
