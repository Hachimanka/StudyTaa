import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to StudyTa</h1>
      <p>A simple study group app.</p>
      <div style={{ marginTop: 12 }}>
        <Link to="/register">Get started</Link>
      </div>
    </div>
  )
}
