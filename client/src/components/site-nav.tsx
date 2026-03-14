/**
 * Shared nav + footer components — used on every page so the header/logo
 * looks identical site-wide.
 */
import logoSrc from "@assets/outleadr_1773257073565.png";

const FONT  = "'Inter','Helvetica Neue',Arial,sans-serif";
const INK   = "#0f0f0f";
const INK2  = "#555";
const INK3  = "#999";
const WHITE = "#ffffff";
const BDR   = "rgba(0,0,0,0.08)";
const IND   = "#6366f1";

/* ── Logo ──────────────────────────────────────────────────────────
   The source image has large built-in whitespace padding.
   We clip it with overflow:hidden + negative margins so every page
   shows exactly the same logo at exactly the right size.
────────────────────────────────────────────────────────────────── */
export function Logo({ size = 36 }: { size?: number }) {
  const ratio = size / 36;
  const imgH  = Math.round(130 * ratio);
  const neg   = -Math.round(47 * ratio);
  return (
    <div style={{ height: size, overflow: "hidden", display: "flex", alignItems: "center" }}>
      <img
        src={logoSrc}
        alt="Outleadrr"
        style={{ height: imgH, width: "auto", objectFit: "contain", marginTop: neg, marginBottom: neg, display: "block" }}
      />
    </div>
  );
}

/* ── Auth Nav (login / signup pages) ─────────────────────────────── */
export function AuthNav() {
  return (
    <header style={{
      position: "relative", zIndex: 10,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BDR}`,
      height: 64, display: "flex", alignItems: "center",
      padding: "0 40px", justifyContent: "space-between",
      fontFamily: FONT,
    }}>
      <a href="/" style={{ textDecoration: "none" }}>
        <Logo size={36} />
      </a>
      <a
        href="/"
        style={{ fontSize: 13, color: INK2, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, fontFamily: FONT, fontWeight: 500 }}
        onMouseEnter={e => (e.currentTarget.style.color = INK)}
        onMouseLeave={e => (e.currentTarget.style.color = INK2)}
      >
        ← Back to home
      </a>
    </header>
  );
}

/* ── Site Footer (auth pages) ───────────────────────────────────── */
export function AuthFooter() {
  return (
    <footer style={{
      borderTop: `1px solid ${BDR}`, background: WHITE,
      padding: "24px 40px", fontFamily: FONT,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12, position: "relative", zIndex: 10,
    }}>
      <Logo size={28} />
      <p style={{ fontSize: 12, color: INK3 }}>© {new Date().getFullYear()} Outleadrr. All rights reserved.</p>
      <div style={{ display: "flex", gap: 20 }}>
        {[["Privacy","#"],["Terms","#"]].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: 12, color: INK3, textDecoration: "none" }}
            onMouseEnter={e=>(e.currentTarget.style.color=INK2)} onMouseLeave={e=>(e.currentTarget.style.color=INK3)}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}

/* ── App Navbar (logged-in dashboard) ───────────────────────────── */
interface AppNavProps {
  email: string;
  gmailStatus: { connected: boolean; email?: string } | null;
  onDisconnectGmail: () => void;
  onLogout: () => void;
  disconnecting?: boolean;
  loggingOut?: boolean;
}

export function AppNav({ email, gmailStatus, onDisconnectGmail, onLogout, disconnecting, loggingOut }: AppNavProps) {
  return (
    <header style={{
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${BDR}`,
      position: "sticky", top: 0, zIndex: 50, fontFamily: FONT,
    }}>
      <div style={{ width: "100%", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <Logo size={36} />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: INK3, fontWeight: 500 }}>{email}</span>

          {gmailStatus?.connected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "4px 12px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{gmailStatus.email}</span>
              </div>
              <button
                onClick={onDisconnectGmail}
                disabled={disconnecting}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BDR}`, background: WHITE, fontSize: 12, fontWeight: 600, color: INK2, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BDR; (e.currentTarget as HTMLButtonElement).style.color = INK2; }}
              >
                Disconnect Gmail
              </button>
            </div>
          ) : (
            <a href="/api/auth/google" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: IND, color: WHITE, fontSize: 13, fontWeight: 700,
              textDecoration: "none", fontFamily: FONT,
              boxShadow: "0 2px 8px rgba(99,102,241,.3)",
            }}>
              Connect Gmail →
            </a>
          )}

          <button
            onClick={onLogout}
            disabled={loggingOut}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BDR}`, background: WHITE, fontSize: 12, fontWeight: 600, color: INK3, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = INK; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = INK3; }}
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
