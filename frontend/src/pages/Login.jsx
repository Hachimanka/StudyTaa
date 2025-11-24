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
          <button className="btn-modern btn-secondary auth-btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <g fill="none" fillRule="evenodd" clipRule="evenodd">
                  <path fill="#F44336" d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86" opacity=".987"/>
                  <path fill="#FFC107" d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92" opacity=".997"/>
                  <path fill="#448AFF" d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49" opacity=".999"/>
                  <path fill="#43A047" d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z" opacity=".993"/>
                </g>
              </svg>
            </span>
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="auth-subtext">
          Don’t have an account?{' '}
          <Link to="/register" className="auth-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
