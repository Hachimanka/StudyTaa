import React, { useState, useEffect, useRef } from 'react'

export default function ChatWidget(){
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I can help summarize text, create flashcards, or answer questions. Try asking me anything.' }
  ])
  const listRef = useRef(null)

  useEffect(()=>{
    if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const send = async ()=>{
    if(!input.trim()) return
    const userMsg = { from: 'user', text: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    // mock bot response
    setTimeout(()=>{
      setMessages(m => [...m, { from: 'bot', text: `I got: "${userMsg.text}" — (mock AI reply)` }])
    }, 700)
  }

  return (
    <div className={`chat-widget ${open ? 'chat-open' : ''}`}>
      <div className="chat-panel" role="dialog" aria-hidden={!open} style={{display: open ? 'flex' : 'none'}}>
        <div className="chat-header">
          <strong>Study AI</strong>
          <button aria-label="Close chat" className="chat-close" onClick={()=>setOpen(false)}>✕</button>
        </div>
        <div className="chat-list" ref={listRef}>
          {messages.map((m, i)=> (
            <div key={i} className={`chat-message ${m.from==='bot' ? 'bot' : 'user'}`}>
              <div className="chat-bubble">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} placeholder="Ask the AI..." className="chat-input" />
          <button className="chat-send btn-modern" onClick={send}>Send</button>
        </div>
      </div>

      <button className="chat-toggle-button" aria-label="Open chat" onClick={()=>setOpen(o=>!o)}>
        {/* neutral speech bubble icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}
