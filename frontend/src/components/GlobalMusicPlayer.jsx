import React, { useEffect, useState, useRef } from 'react'
import focusSounds from '../data/focusSounds'

// A simple persistent audio player (audio-only, no video) that stays mounted
// at the app root and continues playing across route changes.
export default function GlobalMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.6)
  const [primed, setPrimed] = useState(false)
  const audioContextRef = useRef(null)
  const bufferSourceRef = useRef(null)
  const gainNodeRef = useRef(null)
  const intervalRef = useRef(null)

  // Create a single audio element attached to the DOM so playback survives
  // component rerenders and route changes.
  useEffect(() => {
    const a = document.createElement('audio')
    a.preload = 'auto'
    a.crossOrigin = 'anonymous'
    a.volume = volume
    a.muted = false
    a.loop = false
    a.style.position = 'absolute'
    a.style.left = '-9999px'
    document.body.appendChild(a)
    audioRef.current = a

  const onTime = () => setCurrentTime(a.currentTime || 0)
  const onMeta = () => setDuration(a.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onVolume = () => setVolume(a.volume || 0)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    a.addEventListener('volumechange', onVolume)

    // Expose helpers for other pages/components
    try { window.playMusicDirect = (track) => playTrackDirect(track) } catch (e) {}
    try { window.__getGlobalAudio = () => audioRef.current } catch (e) {}

    return () => {
      try {
        a.pause()
        a.src = ''
        a.removeEventListener('timeupdate', onTime)
        a.removeEventListener('loadedmetadata', onMeta)
        a.removeEventListener('ended', onEnded)
        a.removeEventListener('volumechange', onVolume)
        if (a.parentNode) a.parentNode.removeChild(a)
      } catch (e) {}
      try { delete window.playMusicDirect } catch (e) {}
      try { delete window.__getGlobalAudio } catch (e) {}
      // cleanup AudioContext sources and intervals
      try { if (bufferSourceRef.current) { try { bufferSourceRef.current.stop() } catch(e){} bufferSourceRef.current = null } } catch(e){}
      try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } } catch(e){}
      try { if (audioContextRef.current) { audioContextRef.current.close().catch(()=>{}) ; audioContextRef.current = null } } catch(e){}
      try { gainNodeRef.current = null } catch(e){}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper: play a track immediately (used by window.playMusicDirect)
  const playTrackDirect = async (track) => {
    if (!track) return
    setCurrentTrack(track)
    const a = audioRef.current
    // stop any previous bufferSource
    try { if (bufferSourceRef.current) { try { bufferSourceRef.current.stop() } catch(e){} bufferSourceRef.current = null } } catch(e){}

    // Try HTMLAudioElement first
    try {
      if (a) {
        if (a.src !== track.url) a.src = track.url
        a.muted = false
        if (typeof track.volume === 'number') a.volume = track.volume
        await a.play()
        setIsPlaying(true)
        return
      }
    } catch (err) {
      console.warn('HTMLAudio play failed, falling back to AudioContext:', err)
    }

    // Fallback: use Web Audio API (decode + play buffer)
    try {
      let ctx = audioContextRef.current
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = ctx
      }
      if (ctx.state === 'suspended') {
        try { await ctx.resume() } catch(e) { /* ignore */ }
      }

      // stop previous source if any and clear its interval
      if (bufferSourceRef.current) {
        try { bufferSourceRef.current.stop() } catch (e) {}
        bufferSourceRef.current = null
      }
      if (intervalRef.current) { try { clearInterval(intervalRef.current) } catch(e){} intervalRef.current = null }

      const resp = await fetch(track.url, { mode: 'cors' })
      if (!resp.ok) throw new Error('Failed to fetch audio: ' + resp.status)
      const arrayBuffer = await resp.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const src = ctx.createBufferSource()
      src.buffer = audioBuffer
      let gain = gainNodeRef.current
      if (!gain) { gain = ctx.createGain(); gain.connect(ctx.destination); gainNodeRef.current = gain }
      gain.gain.value = (typeof track.volume === 'number') ? track.volume : volume
      src.connect(gain)
      src.start(0)
      bufferSourceRef.current = src
      setIsPlaying(true)
      // set duration for UI
      setDuration(audioBuffer.duration || 0)
      // rudimentary time tracking: update currentTime via setInterval
      try {
        const startTs = Date.now() / 1000
        const tick = () => {
          const elapsed = (Date.now() / 1000) - startTs
          setCurrentTime(Math.min(elapsed, audioBuffer.duration || 0))
        }
        intervalRef.current = setInterval(tick, 500)
        src.onended = () => { setIsPlaying(false); try { clearInterval(intervalRef.current) } catch(e){} intervalRef.current = null; setCurrentTime(0) }
      } catch (e) {}
      return
    } catch (err) {
      console.warn('AudioContext fallback failed', err)
      setIsPlaying(false)
      throw err
    }
  }

  // Listen for legacy playMusic events
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {}
      if (detail && detail.url) { playTrackDirect(detail); return }
      const { category, trackId } = detail
      if (trackId) {
        for (const cat of Object.keys(focusSounds)) {
          const t = focusSounds[cat].find(x => x.id === trackId)
          if (t) { playTrackDirect(t); return }
        }
      }
      if (category) {
        const arr = focusSounds[category]
        if (arr && arr.length) { playTrackDirect(arr[0]); return }
      }
    }
    window.addEventListener('playMusic', handler)
    return () => window.removeEventListener('playMusic', handler)
  }, [])

  // Sync isPlaying -> audio element
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    try {
      if (isPlaying) a.play().catch(() => {})
      else a.pause()
    } catch (e) {}
  }, [isPlaying])

  // Volume control
  const setGlobalVolume = (v) => {
    try {
      const a = audioRef.current
      if (!a) return
      a.volume = v
      setVolume(v)
    } catch (e) {}
  }

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const findCategoryIndex = (track) => {
    const matches = (candidate, target) => {
      if (!candidate || !target) return false
      return (
        (candidate.id && candidate.id === target.id) ||
        (candidate.url && (candidate.url === target.url || candidate.url === target.sourceUrl)) ||
        (candidate.sourceUrl && (candidate.sourceUrl === target.url || candidate.sourceUrl === target.sourceUrl))
      )
    }

    for (const cat of Object.keys(focusSounds)) {
      const idx = focusSounds[cat].findIndex((candidate) => matches(candidate, track))
      if (idx !== -1) return { category: cat, index: idx }
    }
    return { category: null, index: -1 }
  }

  const playNext = () => {
    if (!currentTrack) return
    const { category, index } = findCategoryIndex(currentTrack)
    if (category && index >= 0) {
      const arr = focusSounds[category]
      const next = arr[(index + 1) % arr.length]
      if (next) playTrackDirect(next)
    }
  }

  const playPrev = () => {
    if (!currentTrack) return
    const { category, index } = findCategoryIndex(currentTrack)
    if (category && index >= 0) {
      const arr = focusSounds[category]
      const prev = arr[(index - 1 + arr.length) % arr.length]
      if (prev) playTrackDirect(prev)
    }
  }

  const onSeek = (clientX, target) => {
    try {
      const a = audioRef.current
      if (!a || !duration) return
      const rect = target.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      a.currentTime = pct * duration
      setCurrentTime(a.currentTime)
    } catch (e) {}
  }

  // Primer to unlock audio on some browsers
  const PRIMER_SRC = 'data:audio/wav;base64,UklGRngAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAAA'
  const primeAudio = async () => {
    try {
      if (primed) return
      const a = audioRef.current
      if (!a) return
      a.muted = false
      a.volume = 0.01
      a.src = PRIMER_SRC
      await a.play().catch(() => {})
      try { a.pause() } catch (e) {}
      a.src = ''
      setPrimed(true)
    } catch (e) { console.warn('primeAudio error', e) }
  }

  // keep UI updated (time/duration) - attach listeners after mount
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setCurrentTime(a.currentTime || 0)
    const onMeta = () => setDuration(a.duration || 0)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    return () => {
      try { a.removeEventListener('timeupdate', onTime) } catch (e) {}
      try { a.removeEventListener('loadedmetadata', onMeta) } catch (e) {}
    }
  }, [audioRef.current])

  // The player no longer renders visible UI. It provides a hidden persistent
  // audio element and external helpers (window.playMusicDirect) so other pages
  // and widgets can start playback. Returning null keeps the component mounted
  // without showing UI.

  // Do NOT autoplay a default track on mount. Instead, prime the audio element
  // so user-initiated playback is more likely to succeed when they press Play.
  useEffect(() => {
    try {
      primeAudio()
    } catch (e) {
      /* ignore */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
