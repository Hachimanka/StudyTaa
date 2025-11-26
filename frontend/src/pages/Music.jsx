import React, { useState, useEffect, useMemo, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import { useMusicPlayer } from '../context/MusicContext'

const lightBackgroundByTheme = {
  teal: 'bg-gradient-to-br from-teal-50 to-teal-100',
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100',
  green: 'bg-gradient-to-br from-green-50 to-green-100',
  pink: 'bg-gradient-to-br from-pink-50 to-pink-100'
}

const tipList = [
  'Use nature sounds for deep concentration',
  'Try 25-minute focus sessions (Pomodoro)',
  'Keep volume around 30-50% for comfort',
  'Take short breaks after each session'
]

export default function Music() {
  const {
    darkMode,
    getThemeColors,
    setSessionDuration
  } = useSettings()

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    selectedCategory,
    categories = [],
    tracks: categoryTracks = [],
    isFetchingTracks,
    fetchError,
    timeLeft,
    timerDurationMinutes,
    isTimerRunning,
    playTrack,
    togglePlayPause,
    seek,
    playNext,
    playPrev,
    setVolume,
    setSelectedCategory,
    toggleTimer: toggleFocusTimer,
    resetTimer: resetFocusTimer,
    updateTimerDuration
  } = useMusicPlayer()

  // Listen for external requests to play the first track after navigation.
  useEffect(() => {
    const playFromDetail = (payload) => {
      try {
        const det = payload || {}
        const playTrackByCandidates = (candidates) => {
          if (!candidates || !candidates.length) return null
          // if a specific id was provided, prefer that
          if (det && (det.trackId || det.id)) {
            const id = det.trackId || det.id
            const found = candidates.find(t => String(t.id) === String(id))
            if (found) return found
          }
          return candidates[0]
        }

        if (det.category) {
          // set the selected category, then attempt to play first track from that category
          try { setSelectedCategory(det.category) } catch (e) {}
          // ensure floating widget is visible
          try { localStorage.setItem('floatingMusicVisible', 'true') } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('floatingMusicVisibility', { detail: { visible: true } })) } catch (e) {}

          setTimeout(() => {
            const first = playTrackByCandidates(categoryTracks)
            if (first) playTrack(first)
          }, 250)
          return
        }

        // make sure the floating widget is visible
        try { localStorage.setItem('floatingMusicVisible', 'true') } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('floatingMusicVisibility', { detail: { visible: true } })) } catch (e) {}

        // no category specified: try current categoryTracks first
        const firstInCategory = playTrackByCandidates(categoryTracks)
        if (firstInCategory) {
          playTrack(firstInCategory)
          return
        }

        // fallback: pick the very first available track across categories
        for (const catKey of Object.keys(focusSounds)) {
          const arr = focusSounds[catKey] || []
          if (arr.length) {
            const candidate = playTrackByCandidates(arr)
            if (candidate) { playTrack(candidate); return }
          }
        }
      } catch (e) { console.error('[Music] playFromDetail failed', e) }
    }

    const handler = (e) => {
      const d = (e && e.detail) ? e.detail : null
      playFromDetail(d)
    }

    window.addEventListener('playMusic', handler)

    // Also check localStorage flag set by voice/ChatWidget when navigating
    try {
      const raw = localStorage.getItem('playFirstOnNavigate')
      if (raw) {
        localStorage.removeItem('playFirstOnNavigate')
        const parsed = JSON.parse(raw)
        const payload = (parsed && parsed.payload) ? parsed.payload : parsed
        setTimeout(() => playFromDetail(payload), 250)
      }
    } catch (e) {
      // ignore parse errors
    }

    return () => window.removeEventListener('playMusic', handler)
  }, [categoryTracks, playTrack, setSelectedCategory])

  // NOTE: don't access or pause the global audio element here — the GlobalMusicPlayer
  // owns playback and should continue when navigating between pages.

  const [showTimer, setShowTimer] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const trackRefs = useRef(new Map())
  const [visibleTrackIds, setVisibleTrackIds] = useState(new Set())

  const MIN_TIMER_MINUTES = 5
  const MAX_TIMER_MINUTES = 120

  const themeColors = getThemeColors()
  const primaryKey = themeColors.primary || 'teal'
  // Use neutral light background for consistency across pages (remove per-theme gradients)
  const pageBackground = darkMode ? 'bg-gray-900' : 'bg-gray-50'

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    // no-op: keep audio playing state as managed by GlobalMusicPlayer
  }, [])

  // debounce search input to avoid excessive re-computation
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const filteredTracks = useMemo(() => {
    if (!debouncedSearch) return categoryTracks
    const q = debouncedSearch.toLowerCase()
    return categoryTracks.filter((t) => {
      const name = (t.name || '').toLowerCase()
      const artist = (t.artist || '').toLowerCase()
      return name.includes(q) || artist.includes(q)
    })
  }, [categoryTracks, debouncedSearch])

  const formatTime = (seconds) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    const minutesPortion = Math.floor(safeSeconds / 60)
    const secondsPortion = safeSeconds % 60
    return `${String(minutesPortion).padStart(2, '0')}:${String(secondsPortion).padStart(2, '0')}`
  }

  const formatPlayTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleTimerToggle = () => {
    toggleFocusTimer()
  }

  const handleResetTimer = () => {
    resetFocusTimer()
  }

  const handleTimerDurationChange = (value) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) return
    const clamped = Math.min(MAX_TIMER_MINUTES, Math.max(MIN_TIMER_MINUTES, parsed))
    setSessionDuration(clamped)
    updateTimerDuration(clamped)
  }

  const handleTimerStep = (delta) => {
    handleTimerDurationChange(timerDurationMinutes + delta)
  }

  // Scroll-trigger fade-up for track cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            for (const [id, el] of trackRefs.current.entries()) {
              if (el === entry.target) {
                setVisibleTrackIds((prev) => {
                  if (prev.has(id)) return prev
                  const next = new Set(prev)
                  next.add(id)
                  return next
                })
                observer.unobserve(entry.target)
                break
              }
            }
          }
        })
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    )
    trackRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [filteredTracks])

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${pageBackground}`}>
      <Sidebar />
      <main className="p-10 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300 min-w-0 overflow-x-visible pr-6">
        <ChatWidget />

        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* LEFT SIDE: Title + Subtitle */}
          <div className="page-header-group">
            <h1 className="text-5xl font-bold page-title">Focus Music</h1>
            <p className={`mt-2 text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} page-subtitle`}>
              Pick a soundscape to stay in the zone while you study.
            </p>
          </div>

          {/* RIGHT SIDE: Buttons */}
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try {
                  const cur = localStorage.getItem('floatingMusicVisible');
                  const next = !(cur === 'true');
                  localStorage.setItem('floatingMusicVisible', next ? 'true' : 'false');
                  window.dispatchEvent(new CustomEvent('floatingMusicVisibility', { detail: { visible: next } }));
                } catch (e) {}
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Toggle Floating Music
            </button>

            <button
              type="button"
              onClick={() => {
                try {
                  const cur = localStorage.getItem('floatingTimerVisible');
                  const next = !(cur === 'true');
                  localStorage.setItem('floatingTimerVisible', next ? 'true' : 'false');
                  window.dispatchEvent(new CustomEvent('floatingTimerVisibility', { detail: { visible: next } }));
                } catch (e) {}
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Toggle Floating Timer
            </button>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="space-y-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const key = category.key
                const selected = selectedCategory === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                      selected
                        ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-lg`
                        : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {category.label}
                  </button>
                )
              })}
            </div>

            {fetchError && (
              <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-200">
                Streaming playlist is temporarily unavailable. Offline sounds are ready ({fetchError}).
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="col-span-full mb-2 flex items-center gap-3">
                <input
                  aria-label="Search tracks"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tracks or artists..."
                  className="w-full md:w-64 px-3 py-2 rounded-lg border bg-white text-sm"
                  style={{ borderColor: themeColors.primary || '#0C969C' }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filteredTracks.map((track) => {
                const selected = currentTrack?.id === track.id
                return (
                  <article
                    key={track.id}
                    ref={(el) => { if (el) trackRefs.current.set(track.id, el) }}
                    onClick={() => playTrack(track)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-transform hover:-translate-y-1 hover:shadow-lg ${visibleTrackIds.has(track.id) ? 'animate-fade-up duration-700' : 'opacity-0 translate-y-5'} ${
                      selected
                        ? `bg-gradient-to-br ${themeColors.gradient} text-white border-white/30`
                        : darkMode
                          ? 'bg-gray-900 border-gray-700 text-gray-100'
                          : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">{track.name}</p>
                        <p className={`text-sm ${selected ? 'text-white/80' : 'text-gray-500'}`}>
                          {track.artist}
                        </p>
                        <p className={`text-xs ${selected ? 'text-white/70' : 'text-gray-400'}`}>
                          Duration: {track.durationLabel}
                          {track.isPreview ? ' (Preview)' : ''}
                        </p>
                      </div>
                      <span className={`grid h-10 w-10 place-items-center rounded-full ${selected ? 'bg-white/20 text-white' : darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
                        {selected && isPlaying ? (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            {isFetchingTracks && (
              <div className="rounded-xl border border-teal-200 bg-white/80 p-4 text-sm text-teal-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/70 dark:text-teal-300">
                Loading fresh tracks... stay tuned.
              </div>
            )}

            {!isFetchingTracks && categoryTracks.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white/80 p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
                No tracks ready for this category yet. Try another vibe while we refresh.
              </div>
            )}

            {currentTrack && (
              <section className={`rounded-2xl border p-6 shadow-xl ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${themeColors.text}`}>Now Playing</p>
                    <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentTrack.name}</h2>
                    {currentTrack.artist && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentTrack.artist}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowControls((prev) => !prev)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showControls ? 'Hide Controls' : 'Show Controls'}
                  </button>
                </div>

                {showControls && (
                  <div className="mt-6 space-y-6">
                    <div
                      className={`group h-2 w-full cursor-pointer overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const percentage = (event.clientX - rect.left) / rect.width
                        seek(percentage * duration)
                      }}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${themeColors.bg}`}
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatPlayTime(currentTime)}</span>
                      <span>{formatPlayTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={playPrev}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          darkMode
                            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${themeColors.bg}`}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        onClick={playNext}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          darkMode
                            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(volume * 100)}
                        onChange={(event) => setVolume(event.target.value / 100)}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-sm text-gray-500 dark:text-gray-400">{Math.round(volume * 100)}%</span>
                    </div>
                  </div>
                )}
              </section>
            )}
          </section>

          <aside className="space-y-6">
            <section className={`rounded-2xl border p-6 animate-fade-left ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Focus Timer</h3>
                <button
                  type="button"
                  onClick={() => setShowTimer((prev) => !prev)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {showTimer ? 'Hide' : 'Show'}
                </button>
              </div>

              {showTimer ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className={`text-4xl font-bold ${themeColors.text}`}>{formatTime(timeLeft)}</div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Session length: {timerDurationMinutes} minutes</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <span>Adjust timer</span>
                      <span>{timerDurationMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min={MIN_TIMER_MINUTES}
                      max={MAX_TIMER_MINUTES}
                      step="1"
                      value={timerDurationMinutes}
                      onChange={(event) => handleTimerDurationChange(event.target.value)}
                      className="w-full"
                    />
                    <div className="flex gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleTimerStep(-5)}
                        className={`${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex-1 rounded-lg px-3 py-2 font-medium`}
                      >
                        -5 min
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimerStep(5)}
                        className={`${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex-1 rounded-lg px-3 py-2 font-medium`}
                      >
                        +5 min
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleTimerToggle}
                      className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white ${isTimerRunning ? 'bg-red-500 hover:bg-red-600' : `${themeColors.bg} ${themeColors.hoverBg}`}`}
                    >
                      {isTimerRunning ? 'Pause' : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className={`flex-1 rounded-lg px-4 py-2 font-semibold ${darkMode ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bring the Pomodoro timer into view to track deep focus sessions while your music plays in the background.
                </p>
              )}
            </section>

            <section className={`rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br animate-fade-left ${themeColors.gradient}`}>
              <h3 className="text-lg font-semibold">Focus Tips</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {tipList.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
