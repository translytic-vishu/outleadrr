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
    onSuccess: () => {
      navigate("/app");
    },
    onError: (err: any) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: S, display: "flex", flexDirection: "column" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; font-family: ${S}; }
        .auth-input {
          width: 100%; padding: 13px 16px;
          background: ${WHITE}; border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px; font-family: ${S}; font-size: 14px;
          color: ${INK}; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus { border-color: rgba(0,0,0,0.35); box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .auth-label { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${INK3}; display: block; margin-bottom: 8px; }
      `}</style>

      {/* Navbar */}
      <header style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, height: 60, display: "flex", alignItems: "center", padding: "0 32px" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src={logoSrc} alt="Outleadr" style={{ height: 120, width: "auto", marginLeft: -26, marginRight: -26 }} />
        </a>
      </header>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: "-0.035em", marginBottom: 8 }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: INK2 }}>Log in to your Outleadr account</p>
          </div>

          <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: "36px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-label">Email address</label>
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  data-testid="input-email"
                  required
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  data-testid="input-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                data-testid="button-login"
                style={{
                  width: "100%", padding: "14px", borderRadius: 10,
                  background: INK, color: WHITE, border: "none",
                  fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
                  cursor: loginMutation.isPending ? "not-allowed" : "pointer",
                  opacity: loginMutation.isPending ? 0.6 : 1,
                  transition: "opacity 0.2s, transform 0.15s",
                }}
              >
                {loginMutation.isPending ? "Logging in…" : "Log in"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: INK2 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color: INK, fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
              Sign up free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
