import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const onSubmit = (e) => { e.preventDefault(); alert('If this email exists, a reset link was sent (mock)') }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Enter your email and we'll send reset instructions.</p>
        <form onSubmit={onSubmit} className="auth-form">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="auth-input" />
          <button className="btn-modern btn-primary auth-btn-full" type="submit">Send Reset Link</button>
        </form>
        <p className="auth-subtext">Remembered? <Link to="/login" className="auth-link">Sign in</Link></p>
      </div>
    </div>
  )
}
