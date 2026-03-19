import React from "react";

const RADAR_CSS = `
@keyframes radar-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes radar-blip-appear { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
@keyframes radar-ping-scale { 0%{transform:scale(1);opacity:0.65} 100%{transform:scale(2.6);opacity:0} }
@keyframes radar-label-in { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
`;

const BLIPS = [
  { id: 1, name: "Mike's Auto Repair",  type: "Mechanic",  angle: 42,  dist: 0.53, delay: "1.0s" },
  { id: 2, name: "Sunrise Dental Co.",  type: "Dentist",   angle: 118, dist: 0.38, delay: "1.9s" },
  { id: 3, name: "City Plumbing",       type: "Plumber",   angle: 210, dist: 0.62, delay: "2.8s" },
  { id: 4, name: "Elite Cuts Studio",   type: "Barber",    angle: 295, dist: 0.44, delay: "0.4s" },
  { id: 5, name: "Green Clean Co.",     type: "Cleaning",  angle: 338, dist: 0.70, delay: "3.7s" },
  { id: 6, name: "Bright Windows",      type: "Windows",   angle: 74,  dist: 0.76, delay: "2.2s" },
];

export function RadarEffect({ size = 340 }: { size?: number }) {
  const r = size / 2;

  const blips = BLIPS.map(b => {
    const rad = (b.angle - 90) * Math.PI / 180;
    const d = b.dist * (r - 20);
    const x = r + d * Math.cos(rad);
    const y = r + d * Math.sin(rad);
    return { ...b, x, y, onRight: x >= r };
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <style>{RADAR_CSS}</style>

      {/* SVG base — rings, crosshairs, center dot */}
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="rdrGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.10)" />
            <stop offset="100%" stopColor="rgba(6,6,14,0)" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={r - 2} fill="rgba(6,6,14,0.97)" stroke="rgba(99,102,241,0.22)" strokeWidth={1.5} />
        <circle cx={r} cy={r} r={r - 2} fill="url(#rdrGlow)" />
        {/* Rings */}
        <circle cx={r} cy={r} r={(r - 14) * 0.33} fill="none" stroke="rgba(99,102,241,0.09)" strokeWidth={0.8} strokeDasharray="3 9" />
        <circle cx={r} cy={r} r={(r - 14) * 0.66} fill="none" stroke="rgba(99,102,241,0.09)" strokeWidth={0.8} strokeDasharray="3 9" />
        <circle cx={r} cy={r} r={r - 14} fill="none" stroke="rgba(99,102,241,0.16)" strokeWidth={1} />
        {/* Crosshairs */}
        <line x1={r} y1={7} x2={r} y2={size - 7} stroke="rgba(99,102,241,0.07)" strokeWidth={0.7} />
        <line x1={7} y1={r} x2={size - 7} y2={r} stroke="rgba(99,102,241,0.07)" strokeWidth={0.7} />
        {/* Center dot */}
        <circle cx={r} cy={r} r={3.5} fill="#6366f1" />
        <circle cx={r} cy={r} r={1.8} fill="#a5b4fc" />
      </svg>

      {/* Rotating conic sweep */}
      <div style={{
        position: "absolute", top: 2, left: 2, right: 2, bottom: 2,
        borderRadius: "50%",
        background: "conic-gradient(transparent 0deg, transparent 255deg, rgba(99,102,241,0.04) 272deg, rgba(99,102,241,0.16) 306deg, rgba(129,140,248,0.52) 346deg, rgba(129,140,248,0.0) 360deg)",
        animation: "radar-rotate 4s linear infinite",
      }} />

      {/* Sweep leading edge */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: r - 16, height: 2,
        transformOrigin: "0 50%",
        marginTop: -1,
        background: "linear-gradient(90deg, rgba(165,180,252,0.92) 0%, rgba(99,102,241,0.35) 65%, transparent 100%)",
        animation: "radar-rotate 4s linear infinite",
        borderRadius: 2,
      }} />

      {/* Business blips */}
      {blips.map(blip => (
        <React.Fragment key={blip.id}>
          {/* Ping ring + dot container */}
          <div style={{
            position: "absolute",
            left: blip.x - 12, top: blip.y - 12,
            width: 24, height: 24,
            animation: `radar-blip-appear .4s cubic-bezier(.16,1,.3,1) ${blip.delay} both`,
            opacity: 0,
          }}>
            {/* Ping ring */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "1.5px solid rgba(129,140,248,0.55)",
              animation: `radar-ping-scale 2.8s ease-out ${blip.delay} infinite`,
              opacity: 0,
            }} />
            {/* Dot */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 9, height: 9,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #ddd6fe, #818cf8)",
              boxShadow: "0 0 10px rgba(129,140,248,0.9), 0 0 20px rgba(99,102,241,0.5)",
            }} />
          </div>

          {/* Label */}
          <div style={{
            position: "absolute",
            left: blip.onRight ? blip.x + 10 : undefined,
            right: blip.onRight ? undefined : size - blip.x + 10,
            top: blip.y - 10,
            animation: `radar-label-in .35s ease ${blip.delay} both`,
            opacity: 0,
            pointerEvents: "none",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#c4b5fd",
              whiteSpace: "nowrap", lineHeight: 1.35,
              textShadow: "0 1px 10px rgba(0,0,0,0.95)",
            }}>{blip.name}</div>
            <div style={{ fontSize: 8.5, color: "rgba(167,139,250,0.5)", fontWeight: 500 }}>{blip.type}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
