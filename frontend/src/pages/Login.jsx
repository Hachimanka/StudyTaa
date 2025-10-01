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
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("All fields are required!");
      return;
    }
    setLoading(true);
    await login(email, password, () => {
      setLoading(false);
      navigate("/dashboard");
    });
    setLoading(false);
  };

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

          <button type="submit" className="btn-modern btn-primary auth-btn-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
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
