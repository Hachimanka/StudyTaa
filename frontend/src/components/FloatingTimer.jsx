import React, { useEffect, useState, useRef } from 'react'
import { useMusicPlayer } from '../context/MusicContext'
import { useSettings } from '../context/SettingsContext'

export default function FloatingTimer() {
  const { timeLeft, timerDurationMinutes, isTimerRunning, toggleTimer, resetTimer } = useMusicPlayer()
  const { getThemeColors } = useSettings()
  const theme = getThemeColors()
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('floatingTimerPos')
      return saved ? JSON.parse(saved) : { right: 20, bottom: 80 }
    } catch (e) {
      return { right: 20, bottom: 80 }
    }
  })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 })
  const nodeRef = useRef(null)
  const moveHandlerRef = useRef(null)
  const upHandlerRef = useRef(null)

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (moveHandlerRef.current) window.removeEventListener('mousemove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('mouseup', upHandlerRef.current)
        if (moveHandlerRef.current) window.removeEventListener('touchmove', moveHandlerRef.current)
        if (upHandlerRef.current) window.removeEventListener('touchend', upHandlerRef.current)
      } catch (e) {}
    }
  }, [])

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
      const newRight = Math.max(8, Math.min(window.innerWidth - 80, dragStart.current.right - dx))
      const newBottom = Math.max(8, Math.min(window.innerHeight - 40, dragStart.current.bottom - dy))
      setPos({ right: newRight, bottom: newBottom })
    }

    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      try { localStorage.setItem('floatingTimerPos', JSON.stringify(pos)) } catch (e) {}
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

  // show when running or when timer was started (timeLeft < initial)
  const shouldShow = (isTimerRunning || (typeof timeLeft === 'number' && timeLeft < (timerDurationMinutes * 60))) && visible

  if (!shouldShow) return null

  return (
    <div
      ref={nodeRef}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      style={{ position: 'fixed', right: pos.right, bottom: pos.bottom, zIndex: 9999, cursor: 'grab' }}
      className="select-none"
    >
      <div
        className="w-40 rounded-lg shadow-lg overflow-hidden"
        style={{
          background: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme.primaryHex}`
        }}
      >
        <div className="p-2 flex items-center justify-between" style={{ gap: 8 }}>
          <div>
            <div className="text-xs" style={{ color: theme.primaryHex, opacity: 0.95 }}>Focus Timer</div>
            <div className="text-lg font-semibold" style={{ color: theme.primaryHex }}>{format(timeLeft)}</div>
          </div>
          <div className="flex flex-col items-end">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTimer() }}
              className="px-2 py-1 rounded text-xs mb-1"
              title="Start/Pause"
              style={{ background: theme.gradientCss, color: '#fff' }}
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            <div className="flex space-x-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(m => !m) }}
                className="px-2 py-1 rounded text-xs"
                title="Minimize"
                style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
              >
                {minimized ? '▣' : '—'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setVisible(false) }}
                className="px-2 py-1 rounded text-xs"
                title="Close"
                style={{ background: '#fff0f0', color: '#c53030', border: `1px solid ${theme.primaryHex}` }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        {!minimized && (
          <div className="px-3 pb-3 text-xs" style={{ color: theme.primaryHex, opacity: 0.95 }}>
            <div>Remaining: {format(timeLeft)}</div>
            <div className="mt-2">
              <button onClick={(e) => { e.stopPropagation(); resetTimer() }} className="px-3 py-1 rounded text-xs" style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}>Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
