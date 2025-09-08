import React from 'react'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ padding: 24, flex: 1 }}>
          <h2>Home</h2>
          <p>This is your home dashboard after login.</p>
        </main>
      </div>
    </div>
  )
}
