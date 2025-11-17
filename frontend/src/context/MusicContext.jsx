import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react'
import focusSounds from '../data/focusSounds'
import { useSettings } from './SettingsContext'

const MusicContext = createContext()

const API_BASE = import.meta.env.VITE_API_BASE || ''
const FALLBACK_CATEGORY = 'lofi'
const TIMER_ALARM_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBkOR2e/GdSUEKITMBiteCARBNj/'

const formatDurationLabel = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const parseDurationToSeconds = (value) => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  if (value.includes('/')) return 0

  const parts = value.split(':').map((segment) => Number.parseInt(segment, 10))
  if (parts.some((segment) => Number.isNaN(segment))) return 0

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }
  return 0
}

const buildFallbackLibrary = () => {
  const library = {}
  Object.entries(focusSounds).forEach(([category, tracks]) => {
    library[category] = tracks.map((track, index) => {
      const durationSeconds = parseDurationToSeconds(track.duration)
      return {
        id: `local-${category}-${track.id ?? index}`,
        name: track.name,
        artist: 'StudyTa Focus Library',
        album: '',
        url: track.url,
        originalUrl: track.sourceUrl || track.url,
        artwork: track.artwork || '',
        durationSeconds,
        durationLabel: typeof track.duration === 'string' ? track.duration : formatDurationLabel(durationSeconds),
        category,
        source: 'local'
      }
    })
  })
  return library
}

const FALLBACK_LIBRARY = buildFallbackLibrary()

const FALLBACK_CATEGORIES = Object.keys(FALLBACK_LIBRARY).map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
  description: 'Offline focus sounds',
  artwork: '',
  source: 'local'
}))

export const useMusicPlayer = () => {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicProvider')
  }
  return context
}

export const MusicProvider = ({ children }) => {
  const {
    sessionDuration,
    incrementStudySession,
    playSound,
    sendNotification
  } = useSettings()

  const initialTimerMinutes = Number.isFinite(sessionDuration) ? sessionDuration : 25

  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(FALLBACK_CATEGORY)
  const [tracksByCategory, setTracksByCategory] = useState(FALLBACK_LIBRARY)
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [isFetchingTracks, setIsFetchingTracks] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(initialTimerMinutes)
  const [timeLeft, setTimeLeft] = useState(() => initialTimerMinutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Initialize audio element (only once)
  useEffect(() => {
    if (audioRef.current) return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audio.volume = volume
    audio.loop = false
    audio.muted = false
    audio.style.position = 'absolute'
    audio.style.left = '-9999px'
    document.body.appendChild(audio)
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0)
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }
    const handleError = (event) => {
      console.warn('Audio error', event)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)

    try { window.__getGlobalAudio = () => audioRef.current } catch (e) {}
    try {
      window.playMusicDirect = (track) => {
        if (!track || !audioRef.current) {
          return Promise.reject(new Error('No audio element or track'))
        }
        const element = audioRef.current
        element.muted = false
        if (element.src !== track.url) element.src = track.url
        if (typeof track.volume === 'number') element.volume = track.volume
        return element.play()
          .then(() => {
            setCurrentTrack(track)
            setIsPlaying(true)
            return track
          })
          .catch((err) => {
            console.warn('playMusicDirect failed', err)
            setIsPlaying(false)
            throw err
          })
      }
    } catch (e) {}

    return () => {
  audio.removeEventListener('timeupdate', handleTimeUpdate)
  audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
  audio.removeEventListener('error', handleError)
      try { delete window.__getGlobalAudio } catch (e) {}
      try { delete window.playMusicDirect } catch (e) {}
    }
  }, [volume])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Sync playing state
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio play failed:', err)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const safeDuration = Number.isFinite(sessionDuration) ? sessionDuration : 25

    setTimerDurationMinutes((prev) => (prev === safeDuration ? prev : safeDuration))

    if (!isTimerRunning) {
      const nextSeconds = safeDuration * 60
      setTimeLeft((prev) => (prev === nextSeconds ? prev : nextSeconds))
    }
  }, [sessionDuration, isTimerRunning])

  const playTimerAlarm = useCallback(() => {
    const fallback = () => {
      try {
        if (typeof Audio === 'undefined') return
        const alarm = new Audio(TIMER_ALARM_BASE64)
        alarm.volume = 0.6
        alarm.play().catch(() => {})
      } catch (error) {
        console.warn('Timer alarm fallback failed', error)
      }
    }

    try {
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null
      if (!AudioCtx) {
        fallback()
        return
      }

      const ctx = new AudioCtx()

      const startOscillator = () => {
        try {
          const oscillator = ctx.createOscillator()
          const gain = ctx.createGain()

          oscillator.type = 'sine'
          oscillator.frequency.value = 880

          gain.gain.setValueAtTime(0.0001, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4)

          oscillator.connect(gain)
          gain.connect(ctx.destination)

          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 1.5)
          oscillator.onended = () => {
            try {
              gain.disconnect()
              oscillator.disconnect()
            } catch (disconnectError) {
              console.warn('Timer alarm disconnect failed', disconnectError)
            }
            ctx.close().catch(() => {})
          }
        } catch (oscillatorError) {
          console.warn('Timer alarm oscillator setup failed', oscillatorError)
          ctx.close().catch(() => {})
          fallback()
        }
      }

      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume()
          .then(startOscillator)
          .catch((resumeError) => {
            console.warn('Timer alarm resume failed', resumeError)
            ctx.close().catch(() => {})
            fallback()
          })
      } else {
        startOscillator()
      }

      return
    } catch (error) {
      console.warn('Timer alarm oscillator failed', error)
    }

    fallback()
  }, [])

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!isTimerRunning) return undefined

    timerRef.current = setInterval(() => {
      let shouldComplete = false
      setTimeLeft((prev) => {
        if (prev <= 1) {
          shouldComplete = true
          return 0
        }
        return prev - 1
      })

      if (shouldComplete) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setIsTimerRunning(false)

        const minutesSpent = timerDurationMinutes

        playTimerAlarm()

        try {
          incrementStudySession(minutesSpent)
        } catch (error) {
          console.warn('Failed to increment study stats', error)
        }

        try {
          playSound('success')
        } catch (error) {
          console.warn('Failed to play success sound', error)
        }

        try {
          sendNotification('Study Session Complete!', 'Great job! Time for a break.')
        } catch (error) {
          console.warn('Failed to send notification', error)
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isTimerRunning, timerDurationMinutes, incrementStudySession, playSound, sendNotification, playTimerAlarm])

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Fetch remote categories once
  useEffect(() => {
    let ignore = false

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/music/categories`)
        if (!response.ok) {
          throw new Error(`Category request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (!payload?.categories || !Array.isArray(payload.categories)) return

        const uniqueKeys = new Set()
        const resolved = payload.categories
          .map((item) => ({
            key: item.key,
            label: item.label || (item.key ? item.key.charAt(0).toUpperCase() + item.key.slice(1) : ''),
            description: item.description || '',
            artwork: item.artwork || '',
            source: 'remote'
          }))
          .filter((item) => {
            if (!item.key || uniqueKeys.has(item.key)) return false
            uniqueKeys.add(item.key)
            return true
          })

        FALLBACK_CATEGORIES.forEach((fallback) => {
          if (!uniqueKeys.has(fallback.key)) {
            uniqueKeys.add(fallback.key)
            resolved.push({ ...fallback })
          }
        })

        if (!ignore && resolved.length) {
          setCategories(resolved)
          setSelectedCategory((prev) => {
            if (resolved.some((cat) => cat.key === prev)) return prev
            return resolved[0].key
          })
        }
      } catch (error) {
        console.warn('Unable to load remote music categories:', error)
      }
    }

    fetchCategories()

    return () => {
      ignore = true
    }
  }, [])

  // Fetch tracks for active category (only once per remote category)
  useEffect(() => {
    let ignore = false

    const existingTracks = tracksByCategory[selectedCategory]
    if (existingTracks?.some((track) => track.source === 'deezer')) {
      return () => {
        ignore = true
      }
    }

    const categoryMeta = categories.find((item) => item.key === selectedCategory)
    if (!categoryMeta || categoryMeta.source !== 'remote') {
      setIsFetchingTracks(false)
      setFetchError(null)
      if (!existingTracks?.length) {
        setTracksByCategory((prev) => {
          if (prev[selectedCategory]?.length) return prev
          return {
            ...prev,
            [selectedCategory]: FALLBACK_LIBRARY[selectedCategory] || []
          }
        })
      }
      return () => {
        ignore = true
      }
    }

    const fetchTracks = async () => {
      setIsFetchingTracks(true)
      setFetchError(null)
      try {
        const response = await fetch(`${API_BASE}/api/music/tracks?category=${encodeURIComponent(selectedCategory)}`)
        if (!response.ok) {
          throw new Error(`Track request failed with status ${response.status}`)
        }

        const payload = await response.json()
        const resolvedCategory = payload?.category || selectedCategory

        const remoteTracks = (payload?.tracks || [])
          .filter((item) => Boolean(item?.url))
          .map((item, index) => {
            const durationSeconds = item.durationSeconds ?? 0
            return {
              id: `deezer-${resolvedCategory}-${item.id ?? index}`,
              name: item.title || item.name || `Track ${index + 1}`,
              artist: item.artist || 'Unknown artist',
              album: item.album || '',
              url: item.url,
              artwork: item.artwork || payload?.playlist?.artwork || '',
              durationSeconds,
              durationLabel: item.durationLabel || formatDurationLabel(durationSeconds),
              category: resolvedCategory,
              source: 'deezer',
              isPreview: Boolean(item.isPreview)
            }
          })

        if (!ignore && remoteTracks.length) {
          setTracksByCategory((prev) => ({
            ...prev,
            [resolvedCategory]: remoteTracks
          }))

          setCurrentTrack((prev) => {
            if (prev && prev.category === resolvedCategory) return prev
            return remoteTracks[0]
          })
        }
      } catch (error) {
        if (!ignore) {
          console.warn('Unable to load remote tracks:', error)
          setFetchError(error.message)
        }
      } finally {
        if (!ignore) setIsFetchingTracks(false)
      }
    }

    fetchTracks()

    return () => {
      ignore = true
    }
  }, [selectedCategory, tracksByCategory, categories])

  const getTracksForCategory = useCallback((categoryKey) => {
    const loaded = tracksByCategory[categoryKey]
    if (loaded && loaded.length) return loaded
    return FALLBACK_LIBRARY[categoryKey] || []
  }, [tracksByCategory])

  const tracks = useMemo(() => getTracksForCategory(selectedCategory), [getTracksForCategory, selectedCategory])

  useEffect(() => {
    if (!tracks.length) return
    setCurrentTrack((prev) => {
      if (prev && prev.category === selectedCategory) return prev
      return prev || tracks[0]
    })
  }, [tracks, selectedCategory])


  const playTrack = useCallback((track) => {
    if (!audioRef.current || !track) return

    const element = audioRef.current
    const isSameTrack = currentTrack?.id === track.id

    if (track.category && track.category !== selectedCategory) {
      setSelectedCategory(track.category)
    }

    if (isSameTrack) {
      setIsPlaying((prev) => {
        const next = !prev
        try {
          element.muted = false
          if (next) {
            const promise = element.play()
            if (promise && typeof promise.then === 'function') {
              promise.catch((err) => console.warn('Resume play blocked', err))
            }
          } else {
            element.pause()
          }
        } catch (err) {
          console.warn('Toggle play error', err)
        }
        return next
      })
      return
    }

    try {
      element.muted = false
      if (element.src !== track.url) element.src = track.url
      element.currentTime = 0
      if (typeof track.volume === 'number') element.volume = track.volume
      const playPromise = element.play()
      setCurrentTrack(track)
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('audio.play() failed', err)
            setIsPlaying(false)
          })
      } else {
        setIsPlaying(true)
      }
    } catch (err) {
      console.warn('playTrack error', err)
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }, [currentTrack, selectedCategory])

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const playNext = useCallback(() => {
    if (!currentTrack) return
    const activeCategory = currentTrack.category || selectedCategory
    const categoryTracks = getTracksForCategory(activeCategory)
    if (!categoryTracks.length) return

    const currentIndex = categoryTracks.findIndex((track) => track.id === currentTrack.id)
    const nextTrack = categoryTracks[(currentIndex + 1) % categoryTracks.length]
    if (nextTrack) playTrack(nextTrack)
  }, [currentTrack, selectedCategory, getTracksForCategory, playTrack])

  const playPrev = useCallback(() => {
    if (!currentTrack) return
    const activeCategory = currentTrack.category || selectedCategory
    const categoryTracks = getTracksForCategory(activeCategory)
    if (!categoryTracks.length) return

    const currentIndex = categoryTracks.findIndex((track) => track.id === currentTrack.id)
    const prevTrack = categoryTracks[(currentIndex - 1 + categoryTracks.length) % categoryTracks.length]
    if (prevTrack) playTrack(prevTrack)
  }, [currentTrack, selectedCategory, getTracksForCategory, playTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      try {
        audio.currentTime = 0
      } catch (error) {
        console.warn('Failed to reset audio position', error)
      }

      const activeCategory = currentTrack?.category || selectedCategory
      const categoryTracks = getTracksForCategory(activeCategory)

      if (categoryTracks.length <= 1) {
        try {
          const playResult = audio.play()
          setIsPlaying(true)
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch((error) => {
              console.warn('Failed to restart solo track', error)
              setIsPlaying(false)
            })
          }
        } catch (error) {
          console.warn('Failed to restart solo track', error)
        }
        return
      }

      try {
        playNext()
      } catch (error) {
        console.warn('Failed to auto-advance track', error)
      }
    }

    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack, selectedCategory, getTracksForCategory, playNext])

  const startTimer = useCallback(() => {
    setTimeLeft((prev) => (prev > 0 ? prev : timerDurationMinutes * 60))
    setIsTimerRunning(true)
  }, [timerDurationMinutes])

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false)
  }, [])

  const toggleTimer = useCallback(() => {
    setIsTimerRunning((prev) => {
      if (prev) return false
      setTimeLeft((prevSeconds) => (prevSeconds > 0 ? prevSeconds : timerDurationMinutes * 60))
      return true
    })
  }, [timerDurationMinutes])

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false)
    setTimeLeft(timerDurationMinutes * 60)
  }, [timerDurationMinutes])

  const updateTimerDuration = useCallback((minutes) => {
    const nextMinutes = Number.isFinite(minutes) ? Math.max(1, Math.round(minutes)) : initialTimerMinutes
    setTimerDurationMinutes(nextMinutes)
    setTimeLeft(nextMinutes * 60)
  }, [initialTimerMinutes])

  const value = {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    selectedCategory,
    categories,
    tracks,
    isFetchingTracks,
    fetchError,
    timeLeft,
    timerDurationMinutes,
    isTimerRunning,
    audioRef,
    setVolume,
    setSelectedCategory,
    playTrack,
    togglePlayPause,
    seek,
    playNext,
    playPrev,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    updateTimerDuration
  }

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  )
}
