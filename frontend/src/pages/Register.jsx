import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Placeholder signup logic
    signup(() => navigate("/home"));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us today</p>

        <form onSubmit={onSubmit} className="auth-form">
          <input type="text" placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} className="auth-input" />
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="auth-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="auth-input" />
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="auth-input" />

          <button type="submit" className="btn-modern btn-primary auth-btn-full">Sign Up</button>
        </form>

        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <button className="btn-modern btn-secondary auth-btn-full">Continue with Google</button>
          <button className="btn-modern btn-secondary auth-btn-full">Continue with other accounts</button>
        </div>

        <p className="auth-subtext">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Login</Link>
        </p>
      </div>
    </div>
  );
}
