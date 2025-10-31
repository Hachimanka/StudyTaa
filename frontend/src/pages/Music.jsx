import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'

export default function Music() {
  const { 
    darkMode, 
    soundEffects, 
    sessionDuration, 
    getThemeColors, 
    playSound, 
    sendNotification,
    incrementStudySession 
  } = useSettings()
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('nature')
  const [showTimer, setShowTimer] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(sessionDuration)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(false)
  
  const themeColors = getThemeColors()
  
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // Focus sounds with YouTube embed or local audio support
  const focusSounds = {
    nature: [
      { id: 1, name: 'Forest Rain', url: 'https://www.youtube.com/embed/nDq6TstdEi8?autoplay=1&loop=1&playlist=nDq6TstdEi8', type: 'youtube', duration: '8:00:00' },
      { id: 2, name: 'Ocean Waves', url: 'https://www.youtube.com/embed/V1bFr2SWP1I?autoplay=1&loop=1&playlist=V1bFr2SWP1I', type: 'youtube', duration: '10:00:00' },
      { id: 3, name: 'Thunderstorm', url: 'https://www.youtube.com/embed/nDGKK6y8OtQ?autoplay=1&loop=1&playlist=nDGKK6y8OtQ', type: 'youtube', duration: '8:00:00' },
      { id: 4, name: 'Crackling Fire', url: 'https://www.youtube.com/embed/L_LUpnjgPso?autoplay=1&loop=1&playlist=L_LUpnjgPso', type: 'youtube', duration: '12:00:00' }
    ],
    lofi: [
      { id: 5, name: 'Lofi Hip Hop', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk', type: 'youtube', duration: '24/7' },
      { id: 6, name: 'Chill Beats', url: 'https://www.youtube.com/embed/DWcJFNfaw9c?autoplay=1&loop=1&playlist=DWcJFNfaw9c', type: 'youtube', duration: '24/7' },
      { id: 7, name: 'Study Jazz', url: 'https://www.youtube.com/embed/Dx5qFachd3A?autoplay=1&loop=1&playlist=Dx5qFachd3A', type: 'youtube', duration: '24/7' }
    ],
    ambient: [
      { id: 8, name: 'Space Ambient', url: 'https://www.youtube.com/embed/1SL5erKGqzk?autoplay=1&loop=1&playlist=1SL5erKGqzk', type: 'youtube', duration: '8:00:00' },
      { id: 9, name: 'Deep Meditation', url: 'https://www.youtube.com/embed/sGkh1W5cbH4?autoplay=1&loop=1&playlist=sGkh1W5cbH4', type: 'youtube', duration: '8:00:00' },
      { id: 10, name: 'Binaural Beats', url: 'https://www.youtube.com/embed/GqH9SDmxr8k?autoplay=1&loop=1&playlist=GqH9SDmxr8k', type: 'youtube', duration: '8:00:00' }
    ],
    classical: [
      { id: 11, name: 'Bach Focus', url: 'https://www.youtube.com/embed/6JQm5aSjX6g?autoplay=1&loop=1&playlist=6JQm5aSjX6g', type: 'youtube', duration: '2:00:00' },
      { id: 12, name: 'Mozart Study', url: 'https://www.youtube.com/embed/Rb0UmrCXxVA?autoplay=1&loop=1&playlist=Rb0UmrCXxVA', type: 'youtube', duration: '3:00:00' },
      { id: 13, name: 'Chopin Peaceful', url: 'https://www.youtube.com/embed/9E6b3swbnWg?autoplay=1&loop=1&playlist=9E6b3swbnWg', type: 'youtube', duration: '2:30:00' }
    ]
  }

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && (timerMinutes > 0 || timerSeconds > 0)) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1)
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1)
          setTimerSeconds(59)
        } else {
          setIsTimerRunning(false)
          // Timer finished - show notification and play sound
          const timeSpent = sessionDuration - timerMinutes
          incrementStudySession(timeSpent)
          playSound('success')
          sendNotification('Study Session Complete!', '🎉 Great job! Time for a break.')
        }
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isTimerRunning, timerMinutes, timerSeconds])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playTrack = (track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  // Listen for global playMusic events (dispatched by ChatWidget)
  useEffect(() => {
    const handler = (e) => {
      try {
        const { category, trackId } = e?.detail || {}
        if (category && focusSounds[category] && focusSounds[category].length > 0) {
          setSelectedCategory(category)
          const track = focusSounds[category][0]
          setCurrentTrack(track)
          setIsPlaying(true)
          setShowVisualizer(track.type === 'youtube')
          return
        }
        if (trackId) {
          // find track across categories
          let found = null
          for (const cat of Object.keys(focusSounds)) {
            const t = focusSounds[cat].find(x => x.id === trackId)
            if (t) { found = t; setSelectedCategory(cat); break }
          }
          if (found) {
            setCurrentTrack(found)
            setIsPlaying(true)
            setShowVisualizer(found.type === 'youtube')
            return
          }
        }
        // Default: play first track of selected category
        const track = focusSounds[selectedCategory][0]
        setCurrentTrack(track)
        setIsPlaying(true)
        setShowVisualizer(track.type === 'youtube')
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('playMusic', handler)
    return () => window.removeEventListener('playMusic', handler)
  }, [selectedCategory])

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerMinutes(sessionDuration)
    setTimerSeconds(0)
  }

  const formatTime = (minutes, seconds) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300`} style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 p-8 ml-20 md:ml-30">
        <ChatWidget />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-5xl font-bold page-title`}>
            Focus Music
          </h1>
          <p className={`mt-2 text-lg`} style={{ color: 'var(--muted)' }}>
            Enhance your concentration with ambient sounds
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Music Player Section */}
          <div className="xl:col-span-2">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.keys(focusSounds).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300`}
                  style={selectedCategory === category ? { background: 'var(--gradient)', color: 'white', boxShadow: '0 10px 30px rgba(2,6,23,0.12)' } : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)' }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Track Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {focusSounds[selectedCategory].map((track) => (
                <div
                  key={track.id}
                  className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer`}
                  onClick={() => playTrack(track)}
                  style={currentTrack?.id === track.id ? { background: 'var(--gradient)', color: 'white', border: '1px solid var(--color-primary)', boxShadow: '0 20px 40px rgba(2,6,23,0.18)' } : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{track.name}</h3>
                      <p className="text-sm" style={currentTrack?.id === track.id ? { color: 'rgba(255,255,255,0.9)' } : { color: 'var(--muted)' }}>
                        Duration: {track.duration}
                      </p>
                    </div>
                    <div className="p-3 rounded-full" style={currentTrack?.id === track.id ? { background: 'rgba(255,255,255,0.12)' } : { background: 'color-mix(in srgb, var(--color-primary) 8%, var(--surface))' }}>
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Player */}
            {currentTrack && (
              <div className={`rounded-2xl p-6 shadow-xl border`} style={darkMode ? { background: 'var(--surface)', border: '1px solid var(--glass-border)' } : { background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Now Playing
                    </h3>
                    <p style={{ color: 'var(--muted)' }}>{currentTrack.name}</p>
                  </div>
                  <button
                    onClick={() => setShowVisualizer(!showVisualizer)}
                    className={`px-4 py-2 rounded-lg transition-colors`}
                    style={darkMode ? { background: 'var(--surface)', color: 'var(--muted)' } : { background: 'color-mix(in srgb, var(--color-primary) 12%, var(--surface))', color: 'var(--text)' }}
                  >
                    {showVisualizer ? 'Hide' : 'Show'} Player
                  </button>
                </div>
                
                {showVisualizer && currentTrack.type === 'youtube' && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={currentTrack.url}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            {/* Pomodoro Timer */}
            <div className={`rounded-2xl p-6 shadow-xl border`} style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Focus Timer
                </h3>
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className={darkMode ? 'text-gray-400 hover:text-gray-300' : ''}
                  style={!darkMode ? { color: 'var(--color-primary)' } : {}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className={darkMode ? 'text-gray-700' : `text-${themeColors.primary}-100`}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={283}
                      strokeDashoffset={283 - (283 * ((sessionDuration * 60 - (timerMinutes * 60 + timerSeconds)) / (sessionDuration * 60)))}
                      className={`text-${themeColors.primary}-500 transition-all duration-300`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {formatTime(timerMinutes, timerSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={toggleTimer}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors`}
                    style={isTimerRunning ? { background: 'var(--accent, #ef4444)', color: 'white' } : { background: 'var(--color-primary)', color: 'white' }}
                  >
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`rounded-2xl p-6 shadow-xl border`} style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Today's Focus
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sessions</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Time</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>0h 0m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Streak</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>0 days</span>
                </div>
              </div>
            </div>

            {/* Sound Mix */}
            <div className="rounded-2xl p-6 shadow-xl border" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ color: 'var(--text)' }}>Sound Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Master Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => setVolume(e.target.value / 100)}
                    className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Auto-loop</span>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      className="checked:bg-teal-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      defaultChecked
                    />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>

            {/* Music Tips */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--gradient)', color: 'white' }}>
              <h3 className="text-xl font-semibold mb-3">💡 Focus Tips</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use nature sounds for deep concentration</li>
                <li>• Try 25-minute focus sessions (Pomodoro)</li>
                <li>• Keep volume at 30-50% for best results</li>
                <li>• Take 5-minute breaks between sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
