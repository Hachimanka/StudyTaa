import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    // For now accept any credentials
    login(() => navigate("/home"));
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="btn-modern btn-primary auth-btn-full">Login</button>
        </form>

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
