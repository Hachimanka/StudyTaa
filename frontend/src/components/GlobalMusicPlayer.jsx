import React, { useEffect, useState, useRef } from 'react'
import focusSounds from '../data/focusSounds'

export default function GlobalMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {}
      // If a full track object is passed, use it directly
      if (detail && (detail.url || detail.viewUrl || detail.downloadUrl)) {
        setCurrentTrack({ ...detail, url: detail.url || detail.viewUrl || detail.downloadUrl })
        setIsPlaying(true)
        return
      }
      const { category, trackId } = detail
      // Resolve track from category / trackId
      if (trackId) {
        for (const cat of Object.keys(focusSounds)) {
          const t = focusSounds[cat].find(x => x.id === trackId)
          if (t) { setCurrentTrack(t); setIsPlaying(true); return }
        }
      }
      if (category) {
        const arr = focusSounds[category]
        if (arr && arr.length > 0) {
          setCurrentTrack(arr[0])
          setIsPlaying(true)
          return
        }
      }
    }
    window.addEventListener('playMusic', handler)
    return () => window.removeEventListener('playMusic', handler)
  }, [])

  // Control audio element when currentTrack or isPlaying changes
  useEffect(() => {
    if (!currentTrack) return
    if (currentTrack.type === 'audio' || (!currentTrack.type && currentTrack.url && !currentTrack.url.includes('youtube.com'))) {
      if (audioRef.current) {
        if (isPlaying) audioRef.current.play().catch(() => {})
        else audioRef.current.pause()
      }
    }
  }, [currentTrack, isPlaying])

  if (!currentTrack) return null

  return (
    <div style={{ position: 'fixed', left: 20, right: 20, bottom: 16, zIndex: 70 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.6)', color: 'white' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{currentTrack.name || 'Playing'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setIsPlaying(p => !p)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'white', padding: '6px 10px', borderRadius: 8 }}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {/* YouTube embed */}
      {currentTrack.type === 'youtube' && currentTrack.url && (
        <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', height: 0, paddingBottom: '56.25%' }}>
          <iframe
            ref={iframeRef}
            src={currentTrack.url + (currentTrack.url.includes('?') ? '&' : '?') + `autoplay=${isPlaying ? '1' : '0'}`}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Global Music Player"
          />
        </div>
      )}

      {/* Direct audio */}
      {(currentTrack.type === 'audio' || (currentTrack.url && !currentTrack.url.includes('youtube.com'))) && (
        <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden' }}>
          <audio ref={audioRef} src={currentTrack.url} controls style={{ width: '100%', borderRadius: 8 }} autoPlay={isPlaying} />
        </div>
      )}
    </div>
  )
}
