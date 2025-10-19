import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import EyeIcon from '../components/EyeIcon'

export default function ChangePassword(){
  const { darkMode, getThemeColors } = useSettings()
  const themeColors = getThemeColors()
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    if (!newPassword || newPassword.length < 8) return 'Password must be at least 8 characters long'
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) return 'Include uppercase and lowercase letters'
    if (!/\d/.test(newPassword)) return 'Include at least one number'
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { alert(err); return }

    // TODO: call API to change password
    alert('Password updated (mock)')
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300`} style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-8" style={{ background: 'var(--surface)', color: 'var(--text)', border: `1px solid rgba(0,0,0,0.04)` }}>
  <h2 className="text-2xl font-bold text-center mb-2" style={{ backgroundImage: themeColors.gradientCss, WebkitBackgroundClip: 'text', color: 'transparent' }}>Create New Password</h2>
  <p className="text-center text-sm mb-6" style={{ color: 'var(--muted)' }}>Enter your new password below</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-3 rounded-lg border" style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: themeColors.primaryHex }} />
          <div style={{ position: 'relative' }}>
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full p-3 rounded-lg border" style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: themeColors.primaryHex, paddingRight: 36 }} />
            <EyeIcon visible={showCurrent} onClick={() => setShowCurrent(v => !v)} />
          </div>

          <div style={{ position: 'relative' }}>
            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New Password" className="w-full p-3 rounded-lg border" style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: themeColors.primaryHex, paddingRight: 36 }} />
            <EyeIcon visible={showNew} onClick={() => setShowNew(v => !v)} />
          </div>

          <div style={{ position: 'relative' }}>
            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full p-3 rounded-lg border" style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: themeColors.primaryHex, paddingRight: 36 }} />
            <EyeIcon visible={showConfirm} onClick={() => setShowConfirm(v => !v)} />
          </div>

          <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--surface-muted)', color: themeColors.primaryHex }}>
            <div className="font-medium" style={{ color: themeColors.primaryHex }}>Password requirements:</div>
            <ul className="list-disc ml-5 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
            </ul>
          </div>

          <button type="submit" className="w-full text-white py-3 rounded-lg font-semibold" style={{ background: themeColors.gradientCss, border: 'none' }}>Update Password</button>

          <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            <button type="button" onClick={()=>navigate('/settings', { state: { tab: 'account' } })} className="underline" style={{ color: themeColors.primaryHex }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
