import React from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'

export default function Library(){
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
  <ChatWidget />
        <h1 className="text-4xl font-bold mt-6">Library</h1>
        <p className="mt-2 text-muted">Your saved documents and resources</p>
      </main>
    </div>
  )
}
