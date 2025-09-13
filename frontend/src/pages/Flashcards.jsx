import React from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'

export default function Flashcards(){
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30"> 
        <ChatWidget />
        <h1 className="text-4xl font-bold mt-6">Flashcards / Quiz</h1>
        <p className="mt-2 text-muted">Practice with flashcards and quizzes</p>
      </main>
    </div>
  )
}
