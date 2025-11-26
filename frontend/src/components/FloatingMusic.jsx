import React, { useEffect, useRef, useState } from 'react'
import { useMusicPlayer } from '../context/MusicContext'
import { useSettings } from '../context/SettingsContext'

export default function FloatingMusic() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume
  } = useMusicPlayer()

  const { getThemeColors } = useSettings()
  const theme = getThemeColors()

  const [visible, setVisible] = useState(() => {
    try {
      const s = localStorage.getItem('floatingMusicVisible')
      return s === null ? true : s === 'true'
    } catch (e) { return true }
  })
  const [minimized, setMinimized] = useState(false)
  const [autoPlayPending, setAutoPlayPending] = useState(false)
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('floatingMusicPos')
      return saved ? JSON.parse(saved) : { right: 20, bottom: 140 }
    } catch (e) {
      return { right: 20, bottom: 140 }
    }
  })

  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 })
  const moveHandlerRef = useRef(null)
  const upHandlerRef = useRef(null)

  useEffect(() => {
    const onVisibility = (e) => {
      try {
        if (e && e.detail && typeof e.detail.visible === 'boolean') {
          setVisible(Boolean(e.detail.visible))
        } else {
          const s = localStorage.getItem('floatingMusicVisible')
          setVisible(s === null ? true : s === 'true')
        }
      } catch (err) {}
    }

    window.addEventListener('floatingMusicVisibility', onVisibility)
    const onAutoPlayPending = (ev) => {
      try {
        if (ev && ev.detail && typeof ev.detail.pending === 'boolean') {
          setAutoPlayPending(Boolean(ev.detail.pending))
        } else {
          const pending = localStorage.getItem('floatingMusicAutoPlayPending') === 'true'
          setAutoPlayPending(Boolean(pending))
        }
      } catch (e) {}
    }
    window.addEventListener('floatingMusicAutoPlayPending', onAutoPlayPending)

    // Listen for logout-triggered stop/hide events
    const onStop = () => {
      try {
        if (isPlaying && typeof togglePlayPause === 'function') togglePlayPause();
      } catch (e) {}
    };
    window.addEventListener('floatingMusicStop', onStop);

    // check autoplay-pending flag initially
    try {
      const pending = localStorage.getItem('floatingMusicAutoPlayPending') === 'true'
      setAutoPlayPending(Boolean(pending))
    } catch (e) {}

    return () => {
      try {
        window.removeEventListener('floatingMusicVisibility', onVisibility)
        window.removeEventListener('floatingMusicAutoPlayPending', onAutoPlayPending)
        window.removeEventListener('floatingMusicStop', onStop);
        if (moveHandlerRef.current) window.removeEventListener('mousemove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('mouseup', upHandlerRef.current)
        if (moveHandlerRef.current) window.removeEventListener('touchmove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('touchend', upHandlerRef.current)
      } catch (e) {}
    }
  }, [isPlaying, togglePlayPause])

  const startDrag = (e) => {
    e.preventDefault()
    dragging.current = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, right: pos.right, bottom: pos.bottom }

    const onMove = (ev) => {
      const clientX2 = ev.touches ? ev.touches[0].clientX : ev.clientX
      const clientY2 = ev.touches ? ev.touches[0].clientY : ev.clientY
      const dx = clientX2 - dragStart.current.x
      const dy = clientY2 - dragStart.current.y
      const newRight = Math.max(8, Math.min(window.innerWidth - 160, dragStart.current.right - dx))
      const newBottom = Math.max(8, Math.min(window.innerHeight - 60, dragStart.current.bottom - dy))
      setPos({ right: newRight, bottom: newBottom })
    }

    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      try { localStorage.setItem('floatingMusicPos', JSON.stringify(pos)) } catch (e) {}
      try {
        if (moveHandlerRef.current) window.removeEventListener('mousemove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('mouseup', upHandlerRef.current)
        if (moveHandlerRef.current) window.removeEventListener('touchmove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('touchend', upHandlerRef.current)
      } catch (e) {}
      moveHandlerRef.current = null
      upHandlerRef.current = null
    }

    moveHandlerRef.current = onMove
    upHandlerRef.current = onUp

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const format = (s) => {
    const sec = Math.max(0, Math.floor(s || 0))
    const m = Math.floor(sec / 60)
    const r = sec % 60
    return `${m}:${String(r).padStart(2, '0')}`
  }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', right: pos.right, bottom: pos.bottom, zIndex: 9999, cursor: 'grab' }} className="select-none" onMouseDown={startDrag} onTouchStart={startDrag}>
      <div className="w-72 rounded-lg shadow-lg overflow-hidden" style={{ background: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? '#0b1220' : '#ffffff', border: `1px solid ${theme.primaryHex}` }}>
        <div className="p-3 flex items-center justify-between" style={{ gap: 8 }}>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold" style={{ color: theme.primaryHex }}>{currentTrack ? currentTrack.name : 'No track'}</div>
            <div className="text-xs text-gray-400 truncate" style={{ fontSize: 12 }}>{currentTrack?.artist || ''}</div>
          </div>
          {autoPlayPending && (
            <div className="px-3 pb-2">
              <div className="text-xs text-yellow-600" style={{ fontSize: 12 }}>Autoplay blocked — tap Play to start audio.</div>
            </div>
          )}
          <div className="flex items-center gap-2 ml-3">
            <button onClick={(e) => { e.stopPropagation(); playPrev() }} className="px-2 py-1 rounded text-sm" title="Previous">⏮</button>
            <button onClick={(e) => { e.stopPropagation(); try { togglePlayPause() } catch(err){} try { localStorage.removeItem('floatingMusicAutoPlayPending'); setAutoPlayPending(false) } catch(e){} }} className="px-3 py-1 rounded text-sm font-semibold" title="Play/Pause" style={{ background: theme.gradientCss, color: '#fff' }}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button onClick={(e) => { e.stopPropagation(); playNext() }} className="px-2 py-1 rounded text-sm" title="Next">⏭</button>
          </div>
        </div>

        {!minimized && (
          <div className="px-3 pb-3">
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden cursor-pointer" onClick={(e) => { try { seek(((e.nativeEvent.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.clientWidth) * duration) } catch (err) {} }}>
              <div className="h-full rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: theme.gradientCss || theme.primary }} />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
              <span>{format(currentTime)}</span>
              <span>{format(duration)}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input type="range" min="0" max="100" value={Math.round((volume || 0) * 100)} onChange={(e) => setVolume(e.target.value / 100)} className="flex-1" />
              <button onClick={(e) => { e.stopPropagation(); setMinimized(true); try { localStorage.setItem('floatingMusicMinimized','true') } catch(e){} }} className="px-2 py-1 rounded text-xs" title="Minimize">—</button>
              <button onClick={(e) => { e.stopPropagation(); setVisible(false); try { localStorage.setItem('floatingMusicVisible','false'); window.dispatchEvent(new CustomEvent('floatingMusicVisibility',{detail:{visible:false}})) } catch(e){} }} className="px-2 py-1 rounded text-xs" title="Close">✕</button>
            </div>
          </div>
        )}

        {minimized && (
          <div className="px-3 pb-3 flex items-center justify-between">
            <div className="text-xs text-gray-400">{currentTrack ? `${currentTrack.name}` : 'No track'}</div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); try { togglePlayPause() } catch(err){} try { localStorage.removeItem('floatingMusicAutoPlayPending'); setAutoPlayPending(false) } catch(e){} }} className="px-2 py-1 rounded text-sm" title="Play/Pause">{isPlaying ? '▮▮' : '▶'}</button>
              <button onClick={(e) => { e.stopPropagation(); setMinimized(false) }} className="px-2 py-1 rounded text-sm" title="Restore">▣</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}