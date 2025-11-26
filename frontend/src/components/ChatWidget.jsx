import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import focusSounds from '../data/focusSounds'
import { useMusicPlayer } from '../context/MusicContext'
import { useAuth } from '../context/AuthContext'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi I am LemivonAI! Try asking me anything.' }
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const settings = useSettings()
  const auth = useAuth()
  let music
  try {
    music = useMusicPlayer()
  } catch (e) {
    music = null
  }

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
    { phrases: ['open music', 'go to music', 'music'], path: '/music', label: 'Music' },
    { phrases: ['open settings', 'go to settings', 'open the settings', 'settings'], path: '/settings', label: 'Settings' },
  ]

  const darkOnPhrases = ['apply the darkmode', 'apply darkmode', 'enable dark mode', 'enable darkmode', 'turn on dark mode', 'turn on darkmode', 'darkmode on', 'apply dark mode', 'dark mode on']
  const darkOffPhrases = ['disable dark mode', 'turn off dark mode', 'disable darkmode', 'turn off darkmode', 'darkmode off', 'apply light mode', 'apply the light mode', 'enable light mode', 'light mode', 'go to light mode']
  const logoutPhrases = ['log out', 'logout', 'sign out', 'sign me out']
  const playPhrases = ['play music', 'play the music', 'play the song', 'play', 'play the chillbeats', 'play the chill beats', 'play chill beats']
  // accept more natural variants
  playPhrases.push('play a music')
  playPhrases.push('play a song')
  playPhrases.push('play a track')
  const playMap = [
    { phrases: ['chill beats', 'chillbeats', 'chill beat'], detail: { category: 'lofi', trackId: 6 } },
    { phrases: ['lofi hip hop', 'lofi', 'lofi hiphop'], detail: { category: 'lofi', trackId: 5 } },
    { phrases: ['forest rain', 'forest'], detail: { category: 'nature', trackId: 1 } },
    { phrases: ['ocean waves', 'ocean'], detail: { category: 'nature', trackId: 2 } },
    { phrases: ['study jazz'], detail: { category: 'lofi', trackId: 7 } },
  ]
  // additional voice/typed command phrases
  const nextPhrases = ['next song', 'next track', 'skip', 'skip song', 'play next', 'next']
  const prevPhrases = ['previous', 'previous song', 'previous track', 'go back', 'play previous', 'prev']
  const pausePhrases = ['pause music', 'pause', 'stop music', 'stop']
  const togglePhrases = ['toggle music', 'toggle playback', 'play or pause']
  const volumeUpPhrases = ['volume up', 'raise volume', 'increase volume']
  const volumeDownPhrases = ['volume down', 'lower volume', 'decrease volume', 'turn down volume']
  const themePhrasesMap = {
    blue: ['apply blue theme', 'set theme to blue', 'use blue theme', 'blue theme'],
    teal: ['apply teal theme', 'set theme to teal', 'use teal theme', 'teal theme'],
    purple: ['apply purple theme', 'set theme to purple', 'use purple theme', 'purple theme'],
    green: ['apply green theme', 'set theme to green', 'use green theme', 'green theme'],
    pink: ['apply pink theme', 'set theme to pink', 'use pink theme', 'pink theme'],
  }
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

  const pickRandomTrack = () => {
    try {
      const all = []
      for (const cat of Object.keys(focusSounds)) {
        const arr = focusSounds[cat]
        if (arr && arr.length) all.push(...arr)
      }
      if (!all.length) return null
      return all[Math.floor(Math.random() * all.length)]
    } catch (e) { return null }
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

      // Quick music controls (typed)
      if (nextPhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'next' } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Skipping to next track' }])
        return
      }
      if (prevPhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'prev' } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Going to previous track' }])
        return
      }
      if (pausePhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'pause' } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Music paused' }])
        return
      }
      if (togglePhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'toggle' } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Toggled playback' }])
        return
      }
      if (volumeUpPhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'setVolume', volume: 0.9 } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Volume increased' }])
        return
      }
      if (volumeDownPhrases.some(p => lc.includes(p))) {
        try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'setVolume', volume: 0.2 } })) } catch (e) {}
        setMessages(m => [...m, { from: 'bot', text: 'Volume decreased' }])
        return
      }

      // Theme color commands (typed)
      for (const key of Object.keys(themePhrasesMap)) {
        if (themePhrasesMap[key].some(p => lc.includes(p))) {
          try {
            if (settings && typeof settings.setColorTheme === 'function') {
              settings.setColorTheme(key)
              setMessages(m => [...m, { from: 'bot', text: `Applied ${key} theme` }])
            }
          } catch (e) {}
          return
        }
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
          // resolve to full track object if possible
          let full = resolveTrack(found)
          if (!full) full = pickRandomTrack()
          // normalize URL so player always has a valid source (use original sourceUrl if proxy not configured)
          if (full && !full.url && (full.sourceUrl || full.source)) {
            full = { ...full, url: full.sourceUrl || full.source }
          }
          // Show floating music widget and navigate to Music page so it can start playback.
          try {
            const payload = full || (found || {})
            // Ensure floating widget will be visible on the Music page
            try { localStorage.setItem('floatingMusicVisible', 'true') } catch (e) {}
            // Store a small flag with payload so the Music page will play the first track on arrival.
            try { localStorage.setItem('playFirstOnNavigate', JSON.stringify({ payload })) } catch (e) {}
            // Navigate to /music; Music page will check the flag and start playback.
            navigate('/music')
            setMessages(m => [...m, { from: 'bot', text: payload && payload.name ? `Opening Music and will play ${payload.name}...` : 'Opening Music and will play the first track...' }])
          } catch (e) {
            console.error('[ChatWidget] failed to navigate+play', e)
          }
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
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/ai`, {
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
      // Fallback: if SpeechRecognition is not available, try MediaRecorder -> /api/stt upload
      recordAudioFallback()
      return
    }
    if (recognitionRef.current) return

    // Secure context check: SpeechRecognition typically requires HTTPS except on localhost.
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setMessages(m => [...m, { from: 'bot', text: 'Voice recognition requires a secure (HTTPS) connection. Please access the app over HTTPS or use localhost for voice features.' }])
      return
    }

    // Helper: check microphone permission state (where supported) and optionally request permission
    const ensureMicrophonePermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: 'microphone' })
            if (status.state === 'denied') {
              return { ok: false, reason: 'denied' }
            }
            if (status.state === 'prompt') {
              // Attempt to prompt via getUserMedia to ensure the browser asks for permission
              try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
                return { ok: true }
              } catch (err) {
                return { ok: false, reason: err.name || 'not-allowed' }
              }
            }
            return { ok: true }
          } catch (e) {
            // Permissions API might throw on some browsers; fall back to getUserMedia
          }
        }

        // Fallback: try requesting getUserMedia which will trigger permission prompt on most browsers
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true })
            return { ok: true }
          } catch (err) {
            return { ok: false, reason: err.name || 'not-allowed' }
          }
        }

        return { ok: true }
      } catch (err) {
        return { ok: false, reason: err.message }
      }
    }

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
          let full = resolveTrack(found)
          if (!full) full = pickRandomTrack()
          // For reliable behavior across browsers, navigate to the Music page and request it play the first track.
          try {
            const payload = full || (found || {})
            try { localStorage.setItem('floatingMusicVisible', 'true') } catch (e) {}
            try { localStorage.setItem('playFirstOnNavigate', JSON.stringify({ payload })) } catch (e) {}
            navigate('/music')
            setMessages(m => [...m, { from: 'bot', text: payload ? `Opening Music and will play ${payload.name || 'the first track'}...` : 'Opening Music and will play the first track...' }])
          } catch (e) {
            console.error('[ChatWidget] voice navigate+play failed', e)
            // fallback: dispatch an event if navigation fails
            try { window.dispatchEvent(new CustomEvent('playMusic', { detail: full || (found || {}) })) } catch (err) {}
          }
          handledPlay = true
          break
        }
      }

      if (!handledPlay) {
        // quick voice-only music controls and theme commands
        if (nextPhrases.some(p => lc.includes(p))) {
          try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'next' } })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: 'Skipping to next track' }])
          if (voiceSendTimeoutRef.current) { clearTimeout(voiceSendTimeoutRef.current); voiceSendTimeoutRef.current = null }
          return
        }
        if (prevPhrases.some(p => lc.includes(p))) {
          try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'prev' } })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: 'Playing previous track' }])
          if (voiceSendTimeoutRef.current) { clearTimeout(voiceSendTimeoutRef.current); voiceSendTimeoutRef.current = null }
          return
        }
        if (pausePhrases.some(p => lc.includes(p))) {
          try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'pause' } })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: 'Music paused' }])
          if (voiceSendTimeoutRef.current) { clearTimeout(voiceSendTimeoutRef.current); voiceSendTimeoutRef.current = null }
          return
        }
        if (togglePhrases.some(p => lc.includes(p))) {
          try { window.dispatchEvent(new CustomEvent('musicControl', { detail: { action: 'toggle' } })) } catch (e) {}
          setMessages(m => [...m, { from: 'bot', text: 'Toggled playback' }])
          if (voiceSendTimeoutRef.current) { clearTimeout(voiceSendTimeoutRef.current); voiceSendTimeoutRef.current = null }
          return
        }
        for (const key of Object.keys(themePhrasesMap)) {
          if (themePhrasesMap[key].some(p => lc.includes(p))) {
            try { if (settings && typeof settings.setColorTheme === 'function') settings.setColorTheme(key) } catch (e) {}
            setMessages(m => [...m, { from: 'bot', text: `Applied ${key} theme` }])
            if (voiceSendTimeoutRef.current) { clearTimeout(voiceSendTimeoutRef.current); voiceSendTimeoutRef.current = null }
            return
          }
        }

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

    r.onerror = async (e) => {
      // Provide a clearer message for permission issues and attempt to help
      if (e && e.error === 'not-allowed') {
        setMessages(m => [...m, { from: 'bot', text: 'Voice recognition error: permission denied or blocked. Please allow microphone access for this site (check the padlock icon or browser site settings).' }])

        // Try to prompt permission via getUserMedia as a fallback to trigger browser permission dialog
        try {
          const resp = await ensureMicrophonePermission()
          if (!resp.ok) {
            if (resp.reason === 'denied') {
              setMessages(m => [...m, { from: 'bot', text: 'Microphone access appears to be blocked. Open your browser settings (Privacy & security → Site settings → Microphone) and allow this site.' }])
            } else {
              setMessages(m => [...m, { from: 'bot', text: `Microphone permission could not be obtained: ${resp.reason}` }])
            }
          } else {
            setMessages(m => [...m, { from: 'bot', text: 'Microphone permission granted — please try voice input again.' }])
          }
        } catch (permErr) {
          setMessages(m => [...m, { from: 'bot', text: 'Unable to request microphone permission programmatically. Please enable it in your browser settings.' }])
        }
      } else {
        setMessages(m => [...m, { from: 'bot', text: 'Voice recognition error: ' + (e && e.error ? e.error : String(e)) }])
      }
      recognitionRef.current = null
      setListening(false)
    }

    recognitionRef.current = r
    r.start()
    setListening(true)
  }

  // Fallback for browsers without SpeechRecognition (eg. iOS Safari)
  const recordAudioFallback = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE || ''
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessages(m => [...m, { from: 'bot', text: 'This browser does not support audio capture.' }])
        return
      }
      setMessages(m => [...m, { from: 'bot', text: 'Recording audio (fallback) — please speak now...' }])
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.start()
      // record for up to 4 seconds by default
      await new Promise(res => setTimeout(res, 4000))
      recorder.stop()
      await new Promise(resolve => { recorder.onstop = resolve })
      stream.getTracks().forEach(t => t.stop())

      const blob = new Blob(chunks, { type: 'audio/webm' })
      const fd = new FormData()
      fd.append('audio', blob, 'recording.webm')

      setMessages(m => [...m, { from: 'bot', text: 'Uploading audio for transcription...' }])
      const res = await fetch(`${API_BASE}/api/stt`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages(m => [...m, { from: 'bot', text: `Transcription failed: ${err.error || res.statusText}` }])
        return
      }
      const data = await res.json()
      const text = data.transcript || data.text || ''
      if (!text) {
        setMessages(m => [...m, { from: 'bot', text: 'No speech detected in the recording.' }])
        return
      }
      // Append user's transcribed message and send to AI (skip re-appending inside send)
      setMessages(m => [...m, { from: 'user', text }])
      send(text, true, true)
    } catch (err) {
      setMessages(m => [...m, { from: 'bot', text: 'Recording or upload failed: ' + err.message }])
    }
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
          <strong>Lemivon AI</strong>
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
