import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoSrc from "@assets/outleadr_1773257073565.png";

const S = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const INK = "#0f0f0f";
const INK2 = "#555";
const INK3 = "#999";
const WHITE = "#ffffff";
const BG = "#F5F5F5";
const BORDER = "rgba(0,0,0,0.08)";
const ACCENT = "#6366f1";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => { navigate("/app"); },
    onError: (err: any) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: S, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; font-family: ${S}; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .auth-bg {
          position: fixed; inset: 0; z-index: 0;
          background: ${BG};
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0);
          background-size: 28px 28px;
        }
        .auth-input {
          width: 100%; padding: 13px 16px;
          background: ${WHITE}; border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px; font-family: ${S}; font-size: 14px;
          color: ${INK}; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .auth-label { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${INK3}; display: block; margin-bottom: 8px; }
        .google-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 13px; border-radius: 10px;
          border: 1px solid ${BORDER}; background: ${WHITE}; color: ${INK};
          font-family: ${S}; font-size: 14px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .google-btn:hover { background: #f7f7f7; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .submit-btn {
          width: 100%; padding: 14px; border-radius: 10px;
          background: ${INK}; color: ${WHITE}; border: none;
          font-family: ${S}; font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
          cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .submit-btn:hover:not(:disabled) { background: #222; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <div className="auth-bg" />

      {/* Navbar */}
      <header style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, height: 60, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src={logoSrc} alt="Outleadrr" style={{ height: 32, width: "auto" }} />
        </a>
        <a href="/" style={{ fontSize: 13, color: INK2, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
          onMouseEnter={e => (e.currentTarget.style.color = INK)} onMouseLeave={e => (e.currentTarget.style.color = INK2)}>
          ← Back to home
        </a>
      </header>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: "-0.035em", marginBottom: 8 }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: INK2 }}>Log in to your Outleadrr account</p>
          </div>

          <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: "36px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.1)" }}>
            {/* Google button */}
            <a href="/api/auth/google-login" data-testid="button-google-login" className="google-btn" style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Continue with Google
            </a>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ fontSize: 12, color: INK3, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-label">Email address</label>
                <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" data-testid="input-email" required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" data-testid="input-password" required />
              </div>
              <button type="submit" disabled={loginMutation.isPending} data-testid="button-login" className="submit-btn">
                {loginMutation.isPending
                  ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Logging in…</>
                  : "Log in"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: INK2 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color: INK, fontWeight: 700, textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.15)" }}>
              Sign up free →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
