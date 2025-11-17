import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import EyeIcon from "../components/EyeIcon.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { verify2FA } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("All fields are required!");
      return;
    }
    setLoading(true);
    await login(email, password, ({ twoFactorRequired, userId } = {}) => {
      setLoading(false);
      if (twoFactorRequired) {
        // Show 2FA code input
        setTwoFactorPending(true);
        setPendingUserId(userId);
        return;
      }
      navigate("/dashboard");
    });
    setLoading(false);
  };

  // Two-factor UI state
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const submit2FA = async () => {
    if (!pendingUserId || !twoFactorCode) return alert('Enter the verification code');
    setLoading(true);
    verify2FA(pendingUserId, twoFactorCode, (ok) => {
      setLoading(false);
      if (ok) {
        setTwoFactorPending(false);
        setPendingUserId(null);
        navigate('/dashboard');
      }
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

  <form onSubmit={onSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              style={{ paddingRight: 32 }}
            />
            {/* Eye icon for show/hide password */}
            <EyeIcon visible={showPassword} onClick={() => setShowPassword((v) => !v)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
          </div>

          {!twoFactorPending ? (
            <button type="submit" className="btn-modern btn-primary auth-btn-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">A verification code has been sent to your email. Enter it below to continue.</p>
              <input type="text" placeholder="Enter verification code" value={twoFactorCode} onChange={(e)=>setTwoFactorCode(e.target.value)} className="auth-input" />
              <div className="flex gap-2">
                <button type="button" onClick={submit2FA} className="btn-modern btn-primary auth-btn-full">Verify</button>
                <button type="button" onClick={() => { setTwoFactorPending(false); setPendingUserId(null); setTwoFactorCode('') }} className="btn-modern btn-secondary auth-btn-full">Cancel</button>
              </div>
            </div>
          )}
        </form>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span className="loader" style={{ display: 'inline-block', width: 32, height: 32, border: '4px solid #ddd', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <button className="btn-modern btn-secondary auth-btn-full">Continue with Google</button>
          <button className="btn-modern btn-secondary auth-btn-full">Continue with other accounts</button>
        </div>

        <p className="auth-subtext">
          Don’t have an account?{' '}
          <Link to="/register" className="auth-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
