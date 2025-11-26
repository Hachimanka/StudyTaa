import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import EyeIcon from "../components/EyeIcon.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      alert("All fields are required!");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    await signup(name, email, password, () => {
      setLoading(false);
      alert("Registration started! Please check your email and verify your account before logging in.");
      navigate("/login");
      // Do not redirect to login until verified
    });
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us today</p>

        <form onSubmit={onSubmit} className="auth-form">
          <input type="text" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} className="auth-input" />
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="auth-input" />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              style={{ paddingRight: 32 }}
            />
            <EyeIcon visible={showPassword} onClick={() => setShowPassword((v) => !v)} />
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              style={{ paddingRight: 32 }}
            />
            <EyeIcon visible={showConfirmPassword} onClick={() => setShowConfirmPassword((v) => !v)} />
          </div>

          <button type="submit" className="btn-modern btn-primary auth-btn-full" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span className="loader" style={{ display: 'inline-block', width: 32, height: 32, border: '4px solid #ddd', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <p className="auth-subtext">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Login</Link>
        </p>
      </div>
    </div>
  );
}
