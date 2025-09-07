import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <div style={{ width: 200, background: '#f3f4f6', padding: 12, height: '100%' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="/home">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </div>
  )
}
