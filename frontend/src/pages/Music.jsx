import React, { useState, useEffect } from 'react'
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

  const [showTimer, setShowTimer] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const MIN_TIMER_MINUTES = 5
  const MAX_TIMER_MINUTES = 120

  const themeColors = getThemeColors()
  const primaryKey = themeColors.primary || 'teal'
  const pageBackground = darkMode
    ? 'bg-gradient-to-br from-gray-900 to-gray-800'
    : lightBackgroundByTheme[primaryKey] || lightBackgroundByTheme.teal

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

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

  return (
    <div className={`flex min-h-screen transition-colors duration-300 animate-fade-up-slow ${pageBackground}`}>
      <Sidebar />
      <main className="relative flex-1 p-6 md:p-10 ml-20 animate-fade-up-slow">
        <ChatWidget />

        <header className="mb-10 animate-fade-up-slow">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-500 to-teal-600 bg-clip-text text-transparent">
            Focus Music
          </h1>
          <p className={`mt-2 text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Pick a soundscape to stay in the zone while you study.
          </p>
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
              {categoryTracks.map((track) => {
                const selected = currentTrack?.id === track.id
                return (
                  <article
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-transform hover:-translate-y-1 hover:shadow-lg animate-fade-up-slow ${
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
                          <section className={`rounded-2xl border p-6 shadow-xl animate-fade-up-slow ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-teal-500">Now Playing</p>
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
            <section className={`rounded-2xl border p-6 animate-fade-up-slow ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
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
                    <div className="text-4xl font-bold text-teal-500">{formatTime(timeLeft)}</div>
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

            <section className={`rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br animate-fade-up-slow ${themeColors.gradient}`}>
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
