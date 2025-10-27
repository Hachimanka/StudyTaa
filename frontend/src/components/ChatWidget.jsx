import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import focusSounds from '../data/focusSounds'
import { useAuth } from '../context/AuthContext'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I can help summarize text, create flashcards, or answer questions about Lemivon. Try asking me anything.' }
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const settings = useSettings()
  const auth = useAuth()

  // refs
  const recognitionRef = useRef(null)
  const voiceSendTimeoutRef = useRef(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  // Configuration
  const VOICE_DEBOUNCE_MS = 800

  const navMap = [
    { phrases: ['open the homepage', 'go to home', 'open homepage', 'open home', 'homepage'], path: '/', label: 'Homepage' },
    { phrases: ['open dashboard', 'go to dashboard', 'open the dashboard', 'dashboard'], path: '/dashboard', label: 'Dashboard' },
    { phrases: ['open calendar', 'go to calendar', 'open the calendar', 'calendar'], path: '/calendar', label: 'Calendar' },
    { phrases: ['open flashcards', 'go to flashcards', 'open the flashcards', 'flashcards'], path: '/flashcards', label: 'Flashcards' },
    { phrases: ['open library', 'go to library', 'open the library', 'library'], path: '/library', label: 'Library' },
    { phrases: ['open summarize', 'go to summarize', 'open the summarize page', 'summarize'], path: '/summarize', label: 'Summarize' },
    { phrases: ['open music', 'go to music', 'play music', 'music'], path: '/music', label: 'Music' },
    { phrases: ['open settings', 'go to settings', 'open the settings', 'settings'], path: '/settings', label: 'Settings' },
  ]

  const darkOnPhrases = ['apply the darkmode', 'apply darkmode', 'enable dark mode', 'enable darkmode', 'turn on dark mode', 'turn on darkmode', 'darkmode on', 'apply dark mode', 'dark mode on']
  const darkOffPhrases = ['disable dark mode', 'turn off dark mode', 'disable darkmode', 'turn off darkmode', 'darkmode off', 'apply light mode', 'apply the light mode', 'enable light mode', 'light mode', 'go to light mode']
  const logoutPhrases = ['log out', 'logout', 'sign out', 'sign me out']
  const playPhrases = ['play music', 'play the music', 'play the song', 'play', 'play the chillbeats', 'play the chill beats', 'play chill beats']
  const playMap = [
    { phrases: ['chill beats', 'chillbeats', 'chill beat'], detail: { category: 'lofi', trackId: 6 } },
    { phrases: ['lofi hip hop', 'lofi', 'lofi hiphop'], detail: { category: 'lofi', trackId: 5 } },
    { phrases: ['forest rain', 'forest'], detail: { category: 'nature', trackId: 1 } },
    { phrases: ['ocean waves', 'ocean'], detail: { category: 'nature', trackId: 2 } },
    { phrases: ['study jazz'], detail: { category: 'lofi', trackId: 7 } },
  ]
  // helper to resolve track id to full track
  const resolveTrack = (detail) => {
    if (!detail) return null
    const { category, trackId } = detail
    if (trackId) {
      for (const cat of Object.keys(focusSounds)) {
        const t = focusSounds[cat].find(x => x.id === trackId)
        if (t) return t
      }
    }
    if (category) {
      const arr = focusSounds[category]
      if (arr && arr.length) return arr[0]
    }
    return null
  }

  // textParam: string or undefined (use input)
  // skipAddUser: if true, don't append user message (voice handler already did)
  // skipActions: if true, do not perform local dark-mode or navigation actions (used when voice already triggered them)
  const send = async (textParam, skipAddUser = false, skipActions = false) => {
    const text = typeof textParam === 'string' ? textParam : input
    if (!text || !text.trim()) return

    if (!skipAddUser) {
      const userMsg = { from: 'user', text: text.trim() }
      setMessages(m => [...m, userMsg])
    }
    setInput('')

    const lc = text.trim().toLowerCase()

    // Local handling for a few commands (immediate behavior)
    if (!skipActions) {
      // Logout command
      if (logoutPhrases.some(p => lc.includes(p))) {
        if (auth && auth.logout) {
          auth.logout()
          setMessages(m => [...m, { from: 'bot', text: 'Logged out' }])
        } else {
          setMessages(m => [...m, { from: 'bot', text: 'Logged out (client).' }])
        }
        return
      }
      // Dark mode commands
      if (darkOnPhrases.some(p => lc.includes(p))) {
        settings.setDarkMode(true)
        setMessages(m => [...m, { from: 'bot', text: 'Dark mode enabled' }])
        return
      }
      if (darkOffPhrases.some(p => lc.includes(p))) {
        settings.setDarkMode(false)
        setMessages(m => [...m, { from: 'bot', text: 'Dark mode disabled' }])
        return
      }

      // Play music commands (typed)
      for (const p of playPhrases) {
        if (lc.includes(p)) {
          if (!auth.isAuthenticated) {
            setMessages(m => [...m, { from: 'bot', text: 'Please log in to access music.' }])
            return
          }
          // If user specified a specific track, find it
          let found = null
          for (const pm of playMap) {
            if (pm.phrases.some(ph => lc.includes(ph))) { found = pm.detail; break }
          }
          navigate('/music')
          // resolve to full track object if possible
          const full = resolveTrack(found)
          try { window.dispatchEvent(new CustomEvent('playMusic', { detail: full || (found || {}) })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: found ? 'Playing...' : 'Playing Music...' }])
          return
        }
      }

      // Navigation commands
      for (const item of navMap) {
        if (item.phrases.some(p => lc.includes(p))) {
          // Protect routes that require auth
          const protectedPaths = ['/dashboard', '/summarize', '/flashcards', '/library', '/progress', '/music', '/settings']
          if (protectedPaths.includes(item.path) && !auth.isAuthenticated) {
            setMessages(m => [...m, { from: 'bot', text: 'Please log in to access that page.' }])
            return
          }
          navigate(item.path)
          setMessages(m => [...m, { from: 'bot', text: `Opening ${item.label}...` }])
          if (item.path === '/music') {
            // dispatch a global event so the Music page can start playback
            try { window.dispatchEvent(new CustomEvent('playMusic', { detail: { category: 'lofi' } })) } catch (e) { /* ignore */ }
          }
          return
        }
      }
    }

    // If skipActions is true and the text is a local command (nav/dark), do not call backend.
    const isLocalCommand = darkOnPhrases.some(p => lc.includes(p)) || darkOffPhrases.some(p => lc.includes(p)) || navMap.some(item => item.phrases.some(p => lc.includes(p)))
    if (skipActions && isLocalCommand) {
      return
    }

    // Fallback: send to AI backend
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      })
      const data = await res.json()
      setMessages(m => [...m, { from: 'bot', text: data.reply || '⚠️ Error: No reply from AI' }])
    } catch (err) {
      setMessages(m => [...m, { from: 'bot', text: '⚠️ Error: Could not connect to AI server.' }])
    } finally {
      setLoading(false)
    }
  }

  // Voice handling
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessages(m => [...m, { from: 'bot', text: 'Voice commands are not supported in this browser.' }])
      return
    }
    if (recognitionRef.current) return

    const r = new SpeechRecognition()
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1

    r.onresult = (event) => {
      const text = event.results[0][0].transcript
      setInput(text)

      // clear debounce if already scheduled
      if (voiceSendTimeoutRef.current) {
        clearTimeout(voiceSendTimeoutRef.current)
        voiceSendTimeoutRef.current = null
      }

      // Append the user's transcribed text once immediately
      setMessages(m => [...m, { from: 'user', text }])

      // immediate actions for voice (navigation/dark mode), but still send the full prompt after debounce
      const lc = text.toLowerCase()
      if (darkOnPhrases.some(p => lc.includes(p))) {
        settings.setDarkMode(true)
        setMessages(m => [...m, { from: 'bot', text: 'Dark mode enabled' }])
      } else if (darkOffPhrases.some(p => lc.includes(p))) {
        settings.setDarkMode(false)
        setMessages(m => [...m, { from: 'bot', text: 'Dark mode disabled' }])
      }

      // Voice logout handling (also protect against scheduling auto-send)
      if (logoutPhrases.some(p => lc.includes(p))) {
        if (auth && auth.logout) {
          auth.logout()
          setMessages(m => [...m, { from: 'bot', text: 'Logged out' }])
        } else {
          setMessages(m => [...m, { from: 'bot', text: 'Logged out (client).' }])
        }
        // Cancel pending auto-send if any
        if (voiceSendTimeoutRef.current) {
          clearTimeout(voiceSendTimeoutRef.current)
          voiceSendTimeoutRef.current = null
        }
        return
      }

      // Play via voice
      let handledPlay = false
      for (const p of playPhrases) {
        if (lc.includes(p)) {
          if (!auth.isAuthenticated) {
            setMessages(m => [...m, { from: 'bot', text: 'Please log in to access music.' }])
            handledPlay = true
            break
          }
          // check for specific track
          let found = null
          for (const pm of playMap) {
            if (pm.phrases.some(ph => lc.includes(ph))) { found = pm.detail; break }
          }
          navigate('/music')
          const full = resolveTrack(found)
          try { window.dispatchEvent(new CustomEvent('playMusic', { detail: full || (found || {}) })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: full ? `Playing ${full.name}...` : 'Playing Music...' }])
          handledPlay = true
          break
        }
      }

      if (!handledPlay) {
        const voiceNav = navMap.find(item => item.phrases.some(p => lc.includes(p)))
        if (voiceNav) {
          navigate(voiceNav.path)
          setMessages(m => [...m, { from: 'bot', text: `Opening ${voiceNav.label}` }])
          if (voiceNav.path === '/music') {
            try { window.dispatchEvent(new CustomEvent('playMusic', { detail: { category: 'lofi' } })) } catch (e) { /* ignore */ }
          }
        }
      }

      // schedule auto-send after debounce; skip adding the user again inside send
      voiceSendTimeoutRef.current = setTimeout(() => {
        // skipAddUser=true because we've already appended the user message in the voice handler
        // skipActions=true because immediate actions (nav/dark mode) were already handled
        send(text, true, true)
        voiceSendTimeoutRef.current = null
      }, VOICE_DEBOUNCE_MS)
    }

    r.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }

    r.onerror = (e) => {
      setMessages(m => [...m, { from: 'bot', text: 'Voice recognition error: ' + e.error }])
      recognitionRef.current = null
      setListening(false)
    }

    recognitionRef.current = r
    r.start()
    setListening(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (voiceSendTimeoutRef.current) {
      clearTimeout(voiceSendTimeoutRef.current)
      voiceSendTimeoutRef.current = null
    }
    setListening(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (voiceSendTimeoutRef.current) {
        clearTimeout(voiceSendTimeoutRef.current)
        voiceSendTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <div className={`chat-widget ${open ? 'chat-open' : ''}`}>
      <div
        className="chat-panel"
        role="dialog"
        aria-hidden={!open}
        style={{ display: open ? 'flex' : 'none' }}
      >
        <div className="chat-header">
          <strong>Study AI</strong>
          <button
            aria-label="Close chat"
            className="chat-close"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="chat-list" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.from === 'bot' ? 'bot' : 'user'}`}>
              <div className="chat-bubble">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div className="chat-bubble">Typing...</div>
            </div>
          )}
        </div>
        <div className="chat-input-row">
          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Ask the AI..."
              className="chat-input"
              disabled={loading}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              className={`chat-mic btn-modern ${listening ? 'listening' : ''}`}
              aria-pressed={listening}
              onClick={() => {
                if (listening) stopListening()
                else startListening()
              }}
              title="Toggle voice input"
              style={{ width: 44, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {listening ? (
                // simple pulsing dot when listening
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="6" fill="currentColor">
                    <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                // modern mic icon
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 11v1a7 7 0 01-14 0v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button className="chat-send btn-modern" onClick={() => send()} style={{ width: 72 }}>Send</button>
          </div>
        </div>

      </div>

      <button
        className="chat-toggle-button"
        aria-label="Open chat"
        onClick={() => setOpen(o => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke="currentColor" strokeWidth="1.2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
