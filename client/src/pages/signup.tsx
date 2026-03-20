import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoSrc from "@assets/outleadr_1773257073565.png";

const F = "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin   { to { transform: rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes orb1   { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(60px,-40px) scale(1.15) } }
  @keyframes orb2   { 0%,100% { transform:translate(0,0) scale(1) } 50% { transform:translate(-50px,50px) scale(1.1) } }
  .auth-root {
    min-height: 100vh; display:flex; flex-direction:column;
    background: #07070a; font-family: ${F};
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
  .auth-orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:0; }
  .auth-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 36px;
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
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .divider-line { flex:1; height:1px; background: rgba(255,255,255,0.08); }
`;

function passwordStrength(pw: string) {
  if (!pw) return { label: "", color: "transparent", w: "0%" };
  if (pw.length < 8) return { label: "Too short", color: "#f87171", w: "25%" };
  if (pw.length < 12 && !/[^a-zA-Z0-9]/.test(pw)) return { label: "Weak", color: "#fb923c", w: "50%" };
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw) && /[0-9]/.test(pw)) return { label: "Strong", color: "#4ade80", w: "100%" };
  return { label: "Medium", color: "#fbbf24", w: "70%" };
}

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const str = passwordStrength(password);

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/signup", data);
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Sign up failed"); }
      return res.json();
    },
    onSuccess: () => { sessionStorage.setItem("outleadrr_new_login", "1"); navigate("/dashboard"); },
    onError: (err: any) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    if (password.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    signupMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="auth-root">
      <style>{CSS}</style>

      <div className="auth-grid" />
      <div className="auth-orb" style={{ width:500, height:500, top:"-20%", right:"-10%", background:"rgba(139,92,246,0.12)", animation:"orb1 18s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:400, height:400, bottom:"-10%", left:"-5%", background:"rgba(59,130,246,0.08)", animation:"orb2 22s ease-in-out infinite" }} />

      {/* Header */}
      <header style={{ position:"relative", zIndex:10, padding:"22px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ height:26, overflow:"hidden", display:"flex", alignItems:"center" }}>
          <img src={logoSrc} alt="Outleadrr" style={{ height:Math.round(130*(26/36)), width:"auto", objectFit:"contain", marginTop:-Math.round(47*(26/36)), marginBottom:-Math.round(47*(26/36)), filter:"brightness(0) invert(1)" }} />
        </div>
        <a href="/login" style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.45)", textDecoration:"none", transition:"color .15s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.85)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.45)";}}
        >Sign in →</a>
      </header>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", zIndex:10 }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"rgba(139,92,246,0.9)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:12 }}>Get started free</div>
            <h1 style={{ fontSize:32, fontWeight:900, color:"rgba(255,255,255,0.95)", letterSpacing:"-.045em", lineHeight:1.1, marginBottom:8 }}>Create your account</h1>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.6 }}>Generate leads and send cold emails in minutes.</p>
          </div>

          <div className="auth-card">
            <a href="/api/auth/google-login" data-testid="button-google-signup" className="google-btn" style={{ marginBottom:20 }}>
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
                <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="you@company.com" autoComplete="email" data-testid="input-email" required />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="At least 8 characters" autoComplete="new-password" data-testid="input-password" required />
                {password.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:str.w, background:str.color, borderRadius:99, transition:"width .3s, background .3s" }} />
                    </div>
                    <div style={{ fontSize:11, color:str.color, fontWeight:600, marginTop:4 }}>{str.label}</div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom:24 }}>
                <label className="auth-label">Confirm password</label>
                <input className="auth-input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="Repeat your password" autoComplete="new-password" data-testid="input-confirm-password" required
                  style={{ borderColor: confirm && confirm !== password ? "rgba(248,113,113,0.7)" : "" }} />
                {confirm && confirm !== password && (
                  <div style={{ fontSize:11, color:"#f87171", fontWeight:600, marginTop:4 }}>Passwords don't match</div>
                )}
              </div>
              <button type="submit" disabled={signupMutation.isPending} data-testid="button-signup" className="submit-btn">
                {signupMutation.isPending
                  ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} /> Creating account…</>
                  : "Create account →"}
              </button>
            </form>
          </div>

          <p style={{ textAlign:"center", marginTop:22, fontSize:14, color:"rgba(255,255,255,0.3)" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color:"rgba(139,92,246,0.9)", fontWeight:700, textDecoration:"none" }}>Sign in →</a>
          </p>
          <p style={{ textAlign:"center", marginTop:12, fontSize:12, color:"rgba(255,255,255,0.18)" }}>
            By creating an account you agree to our{" "}
            <a href="#" style={{ color:"rgba(255,255,255,0.35)", textDecoration:"underline" }}>Terms</a> and{" "}
            <a href="#" style={{ color:"rgba(255,255,255,0.35)", textDecoration:"underline" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
