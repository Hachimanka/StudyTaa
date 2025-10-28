import React, { useEffect, useState, useRef } from 'react'
import focusSounds from '../data/focusSounds'

export default function GlobalMusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const { category, trackId } = e?.detail || {}
      // If a full track object is passed, use it directly
      if (e?.detail && e.detail.url) {
        setCurrentTrack(e.detail)
        setIsPlaying(true)
        return
      }
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
    </div>
  )
}
