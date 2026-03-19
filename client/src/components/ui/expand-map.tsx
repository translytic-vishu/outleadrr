import React from "react";

interface LocationMapProps {
  businessName: string;
  address?: string;
  onClose: () => void;
}

export function LocationMap({ businessName, address, onClose }: LocationMapProps) {
  const query = encodeURIComponent(address ? `${businessName} ${address}` : businessName);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&z=15&iwloc=A`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,4,10,0.72)", backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        animation: "fadeIn .18s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0c0c14",
          borderRadius: 20,
          width: "100%", maxWidth: 560,
          boxShadow: "0 40px 120px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          animation: "fadeUp .22s cubic-bezier(.16,1,.3,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "15px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.025)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <path d="M7 1C4.24 1 2 3.24 2 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="#818cf8"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Business Location</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{businessName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.45)", fontSize: 17, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
          >×</button>
        </div>

        {/* Address bar */}
        {address && (
          <div style={{
            padding: "11px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
              <path d="M5.5 0.5C3.29 0.5 1.5 2.29 1.5 4.5c0 3.1 4 8 4 8s4-4.9 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="rgba(129,140,248,0.55)"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>{address}</span>
          </div>
        )}

        {/* Map embed */}
        <div style={{ position: "relative", height: 290, background: "rgba(0,0,0,0.4)" }}>
          <iframe
            title={`Map for ${businessName}`}
            src={embedUrl}
            width="100%"
            height="290"
            style={{ border: 0, display: "block", opacity: 0.9, filter: "brightness(0.9) saturate(0.85)" }}
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            {address || businessName}
          </span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 18px", borderRadius: 9,
              background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)",
              color: "#c4b5fd", fontSize: 12, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
              transition: "all .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.24)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(99,102,241,0.14)"; }}
          >
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
              <path d="M5.5 0.5C3.29 0.5 1.5 2.29 1.5 4.5c0 3.1 4 8 4 8s4-4.9 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#c4b5fd"/>
            </svg>
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
