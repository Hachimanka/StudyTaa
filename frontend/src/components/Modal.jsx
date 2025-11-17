import React, { useEffect, useMemo } from 'react'
import { useSettings } from '../context/SettingsContext'

export default function Modal({ isOpen, onClose, title, children, darkMode = false }) {
  const { getThemeColors } = useSettings()
  const theme = useMemo(() => getThemeColors(), [getThemeColors])

  const hexToRgba = (hex, alpha = 1) => {
    try {
      let h = hex.replace('#', '')
      if (h.length === 3) {
        h = h.split('').map(c => c + c).join('')
      }
      const r = parseInt(h.substring(0, 2), 16)
      const g = parseInt(h.substring(2, 4), 16)
      const b = parseInt(h.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    } catch {
      return `rgba(0,0,0,${alpha})`
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      overflow: document.body.style.overflow,
      width: document.body.style.width
    }
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = original.position
      document.body.style.top = original.top
      document.body.style.overflow = original.overflow
      document.body.style.width = original.width
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  if (!isOpen) return null

  const panelClasses = darkMode
    ? 'bg-black/80 text-gray-100 border-white/10'
    : 'bg-gray-900/75 text-white border-black/10'

  const stopOnBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onMouseDown={stopOnBackdrop}
      style={{ backgroundColor: 'transparent' }}
    >
      <div className={`mx-4 w-full max-w-2xl rounded-xl shadow-2xl backdrop-blur-sm ${panelClasses} max-h-[90vh] flex flex-col`}>
        <div
          className="flex items-center justify-between px-5 py-4 rounded-t-xl"
          style={{
            background: theme?.gradientCss || undefined
          }}
        >
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm hover:bg-white/10 text-white"
          >
            ✕
          </button>
        </div>
        <div
          className="px-5 py-5 rounded-b-xl flex-1 overflow-y-auto modal-scroll"
          style={{
            background: 'var(--bg)',
            color: 'var(--text)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
