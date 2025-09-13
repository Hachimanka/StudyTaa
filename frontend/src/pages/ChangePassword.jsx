import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChangePassword(){
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const navigate = useNavigate()
  const onSubmit = (e) => {
    e.preventDefault()
    if(password.length < 6){ alert('Password must be at least 6 characters'); return }
    if(password !== confirm){ alert('Passwords do not match'); return }
    // Mock change
  alert('Password changed (mock)')
  navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Change Password</h2>
        <p className="auth-subtitle">Set a new password for your account.</p>
        <form onSubmit={onSubmit} className="auth-form">
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="auth-input" />
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" className="auth-input" />
          <button className="btn-modern btn-primary auth-btn-full" type="submit">Change Password</button>
        </form>
      </div>
    </div>
  )
}
