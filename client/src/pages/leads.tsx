import { AppLayout } from "@/components/AppLayout";

const F   = "'Inter','Helvetica Neue',Arial,sans-serif";
const K   = "#0a0a0a";
const K2  = "#3a3a3a";
const K3  = "#888";
const W   = "#ffffff";
const BG  = "#f8f8f9";
const BDR = "rgba(0,0,0,0.07)";

const COLUMNS = [
  {
    id: "new", label: "New", color: "#6366f1",
    leads: [
      { name: "Torres Plumbing", contact: "Carlos Torres", score: 82 },
      { name: "Summit Law Group", contact: "Rachel Kim", score: 74 },
      { name: "Bright Dental Co", contact: "Dr. James Park", score: 91 },
    ],
  },
  {
    id: "contacted", label: "Contacted", color: "#3b82f6",
    leads: [
      { name: "Pacific Realty", contact: "Megan Cole", score: 68 },
      { name: "Central HVAC", contact: "Tom Nguyen", score: 77 },
    ],
  },
  {
    id: "replied", label: "Replied", color: "#10b981",
    leads: [
      { name: "Chen & Partners", contact: "Alex Chen", score: 85 },
      { name: "Verde Landscaping", contact: "Luis Verde", score: 63 },
      { name: "Harbor Insurance", contact: "Dana White", score: 79 },
    ],
  },
  {
    id: "meeting", label: "Meeting", color: "#8b5cf6",
    leads: [
      { name: "Apex Marketing", contact: "Nina Patel", score: 88 },
    ],
  },
  {
    id: "closed", label: "Closed Won", color: "#16a34a",
    leads: [
      { name: "Blue Ridge Media", contact: "Sam Ford", score: 92 },
    ],
  },
];

function ScoreBar({ score }: { score: number }) {
  const col = score >= 75 ? "#16a34a" : score >= 55 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: K3 }}>Lead Score</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: col }}>{score}</span>
      </div>
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: col, borderRadius: 2, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

export default function Leads() {
  return (
    <AppLayout>
      <style>{`*,*::before,*::after{box-sizing:border-box;}`}</style>

      <div style={{ padding: "28px 36px", fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: K, letterSpacing: "-.03em" }}>Lead CRM</h1>
          <p style={{ fontSize: 13, color: K3, marginTop: 3 }}>Track every lead through your sales pipeline.</p>
        </div>

        {/* Kanban board */}
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
          {COLUMNS.map(col => (
            <div
              key={col.id}
              style={{ width: 230, flexShrink: 0 }}
            >
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: K }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 11, color: K3, background: "#f1f5f9", padding: "1px 7px", borderRadius: 5 }}>{col.leads.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.leads.map((lead, i) => (
                  <div
                    key={i}
                    style={{
                      background: W, borderRadius: 10, border: `1px solid ${BDR}`,
                      padding: "12px 14px", cursor: "grab",
                      boxShadow: "0 1px 4px rgba(0,0,0,.05)",
                      transition: "box-shadow .15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: K, marginBottom: 3 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: K3 }}>{lead.contact}</div>
                    <ScoreBar score={lead.score} />
                  </div>
                ))}

                {/* Add card button */}
                <button
                  style={{
                    width: "100%", padding: "9px", borderRadius: 10,
                    border: `1.5px dashed #e4e4e8`, background: "transparent",
                    color: K3, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F,
                    transition: "border-color .15s, color .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = col.color; (e.currentTarget as HTMLButtonElement).style.color = col.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e4e4e8"; (e.currentTarget as HTMLButtonElement).style.color = K3; }}
                >
                  + Add Lead
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
