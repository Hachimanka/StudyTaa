import React from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'

export default function Quote(){
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
        <ChatWidget />
        <div className="page-header-group mb-8">
          <h1 className="text-5xl font-bold page-title">Quote</h1>
          <p className="mt-1 text-xl page-subtitle">Daily motivational quotes</p>
        </div>
      </main>
    </div>
  )
}
