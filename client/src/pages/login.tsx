import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import mailcheck from "mailcheck";
import logoSrc from "@assets/outleadr_1773257073565.png";

const F = "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin   { to { transform: rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes orb1   { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(60px,-40px) scale(1.15) } }
  @keyframes orb2   { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(-50px,50px) scale(1.1) } }
  @keyframes orb3   { 0%,100% { transform:translate(0,0) } 60% { transform:translate(30px,60px) } }

  .auth-root {
    min-height: 100vh; display:flex; flex-direction:column;
    background: #07070a;
    font-family: ${F};
    position: relative; overflow: hidden;
  }
  .auth-grid {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
  }
  .auth-orb {
    position: fixed; border-radius: 50%;
    filter: blur(80px); pointer-events: none; z-index: 0;
  }
  .auth-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 36px;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.6);
    animation: fadeUp .5s cubic-bezier(.16,1,.3,1) both;
  }
  .auth-input {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; font-family: ${F}; font-size: 14px;
    color: rgba(255,255,255,0.9); outline: none;
    transition: border-color .2s, background .2s;
    -webkit-appearance: none;
  }
  .auth-input::placeholder { color: rgba(255,255,255,0.22); }
  .auth-input:focus {
    border-color: rgba(139,92,246,0.7);
    background: rgba(139,92,246,0.06);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
  .auth-label {
    font-size: 11px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
    display: block; margin-bottom: 8px;
  }
  .google-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 13px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85);
    font-family: ${F}; font-size: 14px; font-weight: 600;
    text-decoration: none; cursor: pointer;
    transition: background .15s, border-color .15s, box-shadow .15s;
  }
  .google-btn:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.16);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  .submit-btn {
    width: 100%; padding: 14px; border-radius: 10px;
    background: linear-gradient(135deg,#7c3aed,#8b5cf6);
    color: #fff; border: none;
    font-family: ${F}; font-size: 15px; font-weight: 700; letter-spacing: -.01em;
    cursor: pointer; transition: opacity .2s, transform .15s, box-shadow .15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 2px 20px rgba(139,92,246,0.35);
  }
  .submit-btn:hover:not(:disabled) {
    opacity: .92; transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(139,92,246,0.45);
  }
  .submit-btn:active { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .divider-line { flex:1; height:1px; background: rgba(255,255,255,0.08); }
`;

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const oauthError = new URLSearchParams(search).get("error");
  const [email, setEmail] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Login failed"); }
      return res.json();
    },
    onSuccess: () => { sessionStorage.setItem("outleadrr_new_login", "1"); navigate("/dashboard"); },
    onError: (err: any) => { toast.error(err.message); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="auth-root">
      <style>{CSS}</style>

      {/* Background */}
      <div className="auth-grid" />
      <div className="auth-orb" style={{ width:500, height:500, top:"-20%", left:"-10%", background:"rgba(139,92,246,0.12)", animation:"orb1 18s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:400, height:400, bottom:"-10%", right:"-5%", background:"rgba(59,130,246,0.08)", animation:"orb2 22s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:300, height:300, top:"40%", right:"20%", background:"rgba(16,185,129,0.06)", animation:"orb3 26s ease-in-out infinite" }} />

      {/* Header */}
      <header style={{ position:"relative", zIndex:10, padding:"22px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <a href="/" style={{ height:26, overflow:"hidden", display:"flex", alignItems:"center", textDecoration:"none", cursor:"pointer" }}>
          <img src={logoSrc} alt="Outleadrr" style={{ height:Math.round(130*(26/36)), width:"auto", objectFit:"contain", marginTop:-Math.round(47*(26/36)), marginBottom:-Math.round(47*(26/36)), filter:"brightness(0) invert(1)" }} />
        </a>
        <a href="/signup" style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.45)", textDecoration:"none", transition:"color .15s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.85)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.45)";}}
        >Create account →</a>
      </header>

      {/* Card */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", zIndex:10 }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"rgba(139,92,246,0.9)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:12 }}>Welcome back</div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"rgba(255,255,255,0.95)", letterSpacing:"-.045em", lineHeight:1.1, marginBottom:8 }}>Sign in to Outleadrr</h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.6 }}>Your outreach command center awaits.</p>
          </div>

          <div className="auth-card">
            {oauthError && (
              <div style={{ marginBottom:16, padding:"12px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, fontSize:13, color:"#f87171", wordBreak:"break-all" }}>
                <strong>Auth error:</strong> {oauthError}
              </div>
            )}

            <a href="/api/auth/google-login" data-testid="button-google-login" className="google-btn" style={{ marginBottom:20 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Continue with Google
            </a>

            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div className="divider-line" />
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)", fontWeight:500 }}>or</span>
              <div className="divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:16 }}>
                <label className="auth-label">Email address</label>
                <input className="auth-input" type="email" value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    mailcheck.run({ email: e.target.value, suggested: (s: any) => setEmailSuggestion(s.full), empty: () => setEmailSuggestion(null) });
                  }}
                  placeholder="you@company.com" autoComplete="email" data-testid="input-email" required />
                {emailSuggestion && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#f59e0b" }}>
                    Did you mean{" "}
                    <span style={{ cursor: "pointer", textDecoration: "underline", fontWeight: 600 }} onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(null); }}>
                      {emailSuggestion}
                    </span>?
                  </div>
                )}
              </div>
              <div style={{ marginBottom:24 }}>
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" data-testid="input-password" required />
              </div>
              <button type="submit" disabled={loginMutation.isPending} data-testid="button-login" className="submit-btn">
                {loginMutation.isPending
                  ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} /> Signing in…</>
                  : "Sign in →"}
              </button>
            </form>
          </div>

          <p style={{ textAlign:"center", marginTop:22, fontSize:14, color:"rgba(255,255,255,0.3)" }}>
            No account?{" "}
            <a href="/signup" style={{ color:"rgba(139,92,246,0.9)", fontWeight:700, textDecoration:"none" }}>
              Create one free →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
