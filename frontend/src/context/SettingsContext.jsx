import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  // Theme and appearance settings
  // Initialize darkMode from saved settings (studyTaSettings) when present,
  // otherwise fall back to the standalone 'theme' key ('dark'|'light').
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('studyTaSettings')
      if (saved) {
        const s = JSON.parse(saved)
        if (typeof s.darkMode === 'boolean') return s.darkMode
      }
      const theme = localStorage.getItem('theme')
      return theme === 'dark'
    } catch (e) {
      return false
    }
  })
  const [fontSize, setFontSize] = useState(() => {
    try {
      const saved = localStorage.getItem('studyTaSettings')
      if (saved) {
        const s = JSON.parse(saved)
        if (s && typeof s.fontSize === 'string') return s.fontSize
      }
      return 'medium'
    } catch (e) {
      return 'medium'
    }
  })
  const [colorTheme, setColorTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('studyTaSettings')
      if (saved) {
        const s = JSON.parse(saved)
        if (s && typeof s.colorTheme === 'string') return s.colorTheme
      }
      return 'teal'
    } catch (e) {
      return 'teal'
    }
  })
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [studyReminders, setStudyReminders] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  
  // Study preferences
  const [defaultStudyMode, setDefaultStudyMode] = useState('flashcard')
  const [sessionDuration, setSessionDuration] = useState(25)
  const [autoSave, setAutoSave] = useState(true)
  const [showProgress, setShowProgress] = useState(true)
  
  // Account settings
  const [profileName, setProfileName] = useState('Student')
  const [email, setEmail] = useState('student@studyta.com')
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  
  // Privacy settings
  const [dataCollection, setDataCollection] = useState(true)
  const [analytics, setAnalytics] = useState(true)
  const [shareProgress, setShareProgress] = useState(false)
  
  // Study session stats
  const [studyStats, setStudyStats] = useState({
    dailySessions: 0,
    totalTime: 0,
    streak: 0
  })

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('studyTaSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        
        // Theme settings: prefer explicit boolean saved value; otherwise fall back
        // to the standalone 'theme' key which some earlier flows may set.
        if (typeof settings.darkMode === 'boolean') {
          setDarkMode(settings.darkMode)
        } else {
          const theme = localStorage.getItem('theme')
          setDarkMode(theme === 'dark')
        }
  setFontSize(settings.fontSize || 'medium')
        setColorTheme(settings.colorTheme || 'teal')
        
        // Notification settings
        setEmailNotifications(settings.emailNotifications !== false)
        setPushNotifications(settings.pushNotifications !== false)
        setStudyReminders(settings.studyReminders !== false)
        setSoundEffects(settings.soundEffects !== false)
        
        // Study preferences
        setDefaultStudyMode(settings.defaultStudyMode || 'flashcard')
        setSessionDuration(settings.sessionDuration || 25)
        setAutoSave(settings.autoSave !== false)
        setShowProgress(settings.showProgress !== false)
        
        // Account settings
        setProfileName(settings.profileName || 'Student')
        setEmail(settings.email || 'student@studyta.com')
        setTwoFactorAuth(settings.twoFactorAuth || false)
        
        // Privacy settings
        setDataCollection(settings.dataCollection !== false)
        setAnalytics(settings.analytics !== false)
        setShareProgress(settings.shareProgress || false)
      }

      // Load study stats
      const savedStats = localStorage.getItem('studyTaStats')
      if (savedStats) {
        setStudyStats(JSON.parse(savedStats))
      }

    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }, [])
  
  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    // Dispatch theme change event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { darkMode } }))
  }, [darkMode])

  // Persist darkMode and fontSize into studyTaSettings so they survive reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studyTaSettings')
      const settings = saved ? JSON.parse(saved) : {}
      settings.darkMode = darkMode
      settings.fontSize = fontSize
      // keep existing colorTheme if present
      localStorage.setItem('studyTaSettings', JSON.stringify(settings))
    } catch (err) {
      console.warn('Failed to persist darkMode/fontSize:', err)
    }
  }, [darkMode, fontSize])

  // Keep local darkMode in sync if other components change localStorage or dispatch events
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'theme') {
        setDarkMode(e.newValue === 'dark')
      }
    }

    const onThemeChanged = (ev) => {
      try {
        // event may be either a CustomEvent with detail or a simple Event
        const d = ev.detail && typeof ev.detail === 'object' ? ev.detail : null
        if (d && typeof d.darkMode === 'boolean') setDarkMode(d.darkMode)
        else {
          const t = localStorage.getItem('theme')
          setDarkMode(t === 'dark')
        }
      } catch (err) {
        // fallback
        const t = localStorage.getItem('theme')
        setDarkMode(t === 'dark')
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('themeChanged', onThemeChanged)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('themeChanged', onThemeChanged)
    }
  }, [])

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl')
    
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'medium':
        root.classList.add('text-base')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      case 'extra-large':
        root.classList.add('text-xl')
        break
      default:
        root.classList.add('text-base')
    }
  }, [fontSize])

  // Apply color theme to document
  useEffect(() => {
    const root = document.documentElement
    const applyThemeForPath = () => {
      const path = window.location.pathname.toLowerCase()
      const excluded = new Set(['/', '/landing', '/login', '/register', '/forgot-password'])
      // Always reset existing theme classes
      root.classList.remove('theme-teal', 'theme-blue', 'theme-purple', 'theme-green', 'theme-pink')
      if (excluded.has(path)) {
        // Force default (teal) theme on auth/landing pages, independent of user selection
        root.classList.add('theme-teal')
      } else {
        root.classList.add(`theme-${colorTheme}`)
      }
    }
    applyThemeForPath()
    // Listen for route changes (history navigation)
    const handleLocationChange = () => applyThemeForPath()
    window.addEventListener('popstate', handleLocationChange)
    // Patch pushState/replaceState to catch SPA navigations
    const originalPush = history.pushState
    const originalReplace = history.replaceState
    history.pushState = function(...args) { originalPush.apply(this, args); handleLocationChange() }
    history.replaceState = function(...args) { originalReplace.apply(this, args); handleLocationChange() }
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      history.pushState = originalPush
      history.replaceState = originalReplace
    }
  }, [colorTheme])

  // Persist selected colorTheme to studyTaSettings so it survives reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studyTaSettings')
      const settings = saved ? JSON.parse(saved) : {}
      settings.colorTheme = colorTheme
      localStorage.setItem('studyTaSettings', JSON.stringify(settings))
    } catch (err) {
      console.warn('Failed to persist colorTheme:', err)
    }
  }, [colorTheme])
  
  // Save all settings to localStorage
  const saveAllSettings = () => {
    try {
      const settings = {
        darkMode,
        fontSize,
        colorTheme,
        emailNotifications,
        pushNotifications,
        studyReminders,
        soundEffects,
        defaultStudyMode,
        sessionDuration,
        autoSave,
        showProgress,
        profileName,
        email,
        twoFactorAuth,
        dataCollection,
        analytics,
        shareProgress
      }
      
      localStorage.setItem('studyTaSettings', JSON.stringify(settings))
      localStorage.setItem('studyTaStats', JSON.stringify(studyStats))
      
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }

  // Update study stats
  const updateStudyStats = (newStats) => {
    setStudyStats(prev => {
      const updated = { ...prev, ...newStats }
      localStorage.setItem('studyTaStats', JSON.stringify(updated))
      return updated
    })
  }

  // Increment study session
  const incrementStudySession = (timeSpent = 0) => {
    const today = new Date().toDateString()
    const lastSessionDate = localStorage.getItem('lastStudySession')
    
    setStudyStats(prev => {
      let newStreak = prev.streak
      
      // Update streak logic
      if (lastSessionDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (lastSessionDate === yesterday.toDateString()) {
          newStreak += 1 // Continue streak
        } else if (lastSessionDate !== today) {
          newStreak = 1 // Start new streak
        }
        
        localStorage.setItem('lastStudySession', today)
      }
      
      const updated = {
        dailySessions: lastSessionDate === today ? prev.dailySessions + 1 : 1,
        totalTime: prev.totalTime + timeSpent,
        streak: newStreak
      }
      
      localStorage.setItem('studyTaStats', JSON.stringify(updated))
      return updated
    })
  }

  // Reset all settings to defaults
  const resetSettings = () => {
    setDarkMode(false)
    setFontSize('medium')
    setColorTheme('teal')
    setEmailNotifications(true)
    setPushNotifications(true)
    setStudyReminders(true)
    setSoundEffects(true)
    setDefaultStudyMode('flashcard')
    setSessionDuration(25)
    setAutoSave(true)
    setShowProgress(true)
    setProfileName('Student')
    setEmail('student@studyta.com')
    setTwoFactorAuth(false)
    setDataCollection(true)
    setAnalytics(true)
    setShareProgress(false)
    
    localStorage.removeItem('studyTaSettings')
    localStorage.removeItem('studyTaStats')
  }

  // Reset only appearance-related settings to defaults and persist them
  // This does NOT touch account/privacy/stats, so Account and About remain unaffected.
  const resetAppearance = () => {
    const defaults = {
      darkMode: false,
      fontSize: 'medium',
      colorTheme: 'teal'
    }

    // Apply to current state
    setDarkMode(defaults.darkMode)
    setFontSize(defaults.fontSize)
    setColorTheme(defaults.colorTheme)

    try {
      // Merge into existing persisted settings without removing other keys
      const saved = localStorage.getItem('studyTaSettings')
      const settings = saved ? JSON.parse(saved) : {}
      settings.darkMode = defaults.darkMode
      settings.fontSize = defaults.fontSize
      settings.colorTheme = defaults.colorTheme
      localStorage.setItem('studyTaSettings', JSON.stringify(settings))

      // Also update the standalone 'theme' key used elsewhere
      localStorage.setItem('theme', defaults.darkMode ? 'dark' : 'light')
    } catch (err) {
      console.warn('Failed to persist appearance defaults:', err)
    }
  }

  // Apply only the appearance-related defaults (used on logout)
  // This intentionally does NOT remove `studyTaSettings` from localStorage so
  // the user's saved preferences remain available to be restored on login.
  const applyDefaultAppearance = () => {
    console.debug('[Settings] applyDefaultAppearance: applying default appearance (logout)')
    setDarkMode(false)
    setFontSize('medium')
    setColorTheme('teal')
    // Do not touch persisted settings here
  }

  // Load appearance-related settings from persisted storage without
  // overwriting other ephemeral state. Used on login to restore the user's
  // selected theme/font-size.
  const loadSavedSettingsFromStorage = () => {
    try {
      const savedSettings = localStorage.getItem('studyTaSettings')
      console.debug('[Settings] loadSavedSettingsFromStorage: found', savedSettings)
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        console.debug('[Settings] loadSavedSettingsFromStorage: parsed', settings)
        if (typeof settings.darkMode === 'boolean') setDarkMode(settings.darkMode)
        if (settings.fontSize) setFontSize(settings.fontSize)
        if (settings.colorTheme) setColorTheme(settings.colorTheme)
      } else {
        console.debug('[Settings] loadSavedSettingsFromStorage: no saved settings found')
      }
    } catch (err) {
      console.warn('Failed to load saved settings on auth change', err)
    }
  }

  // Get theme colors based on current color theme
  const getThemeColors = () => {
    const themes = {
      teal: {
        primary: 'teal',
        gradient: 'from-teal-500 to-teal-600',
        darkGradient: 'from-teal-900 to-teal-800',
        hover: 'hover:from-teal-600 hover:to-teal-700',
        bg: 'bg-teal-500',
        hoverBg: 'hover:bg-teal-600',
        text: 'text-teal-600',
        border: 'border-teal-200',
        primaryHex: '#0C969C',
        gradientCss: 'linear-gradient(90deg, #0C969C, #0A8086)'
      },
      blue: {
        primary: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        darkGradient: 'from-blue-900 to-blue-800',
        hover: 'hover:from-blue-600 hover:to-blue-700',
        bg: 'bg-blue-500',
        hoverBg: 'hover:bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-200',
        primaryHex: '#3b82f6',
        gradientCss: 'linear-gradient(90deg, #3b82f6, #2563eb)'
      },
      purple: {
        primary: 'purple',
        gradient: 'from-purple-500 to-purple-600',
        darkGradient: 'from-purple-900 to-purple-800',
        hover: 'hover:from-purple-600 hover:to-purple-700',
        bg: 'bg-purple-500',
        hoverBg: 'hover:bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-200',
        primaryHex: '#7c3aed',
        gradientCss: 'linear-gradient(90deg, #7c3aed, #6d28d9)'
      },
      green: {
        primary: 'green',
        gradient: 'from-green-500 to-green-600',
        darkGradient: 'from-green-900 to-green-800',
        hover: 'hover:from-green-600 hover:to-green-700',
        bg: 'bg-green-500',
        hoverBg: 'hover:bg-green-600',
        text: 'text-green-600',
        border: 'border-green-200',
        primaryHex: '#10b981',
        gradientCss: 'linear-gradient(90deg, #10b981, #059669)'
      },
      pink: {
        primary: 'pink',
        gradient: 'from-pink-500 to-pink-600',
        darkGradient: 'from-pink-900 to-pink-800',
        hover: 'hover:from-pink-600 hover:to-pink-700',
        bg: 'bg-pink-500',
        hoverBg: 'hover:bg-pink-600',
        text: 'text-pink-600',
        border: 'border-pink-200',
        primaryHex: '#ec4899',
        gradientCss: 'linear-gradient(90deg, #ec4899, #db2777)'
      }
    }
    
    return themes[colorTheme] || themes.teal
  }

  // Play sound effect if enabled
  const playSound = (soundType = 'notification') => {
    if (!soundEffects) return
    
    try {
      const audio = new Audio()
      switch (soundType) {
        case 'success':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBkOR2e/GdSUEKITMBiteCARBNj/'
          break
        case 'error':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBkOR2e/GdSUEKITMBiteCARBNjVgodDbq2EcBj+a'
          break
        default:
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBkOR2e/GdSUEKITMBiteCARBNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+Pwt'
      }
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors
    } catch (error) {
      // Ignore sound errors
    }
  }

  // Send notification if enabled
  const sendNotification = (title, body, options = {}) => {
    if (!pushNotifications) return
    
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/StudyTaLogo.png',
          ...options
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/StudyTaLogo.png',
              ...options
            })
          }
        })
      }
    }
  }

  // Listen for auth changes (login/logout) so we can apply appearance defaults
  // on logout (landing page) and restore saved user appearance on login.
  useEffect(() => {
    const onAuthChanged = () => {
      try {
        const isAuth = localStorage.getItem('stuyta_auth') === '1' || !!localStorage.getItem('token') || !!localStorage.getItem('user')
        console.debug('[Settings] authChanged event, isAuth=', isAuth)
        if (isAuth) {
          // User logged in -> restore saved appearance
          console.debug('[Settings] authChanged -> loading saved appearance')
          loadSavedSettingsFromStorage()
        } else {
          // User logged out -> apply default landing appearance
          console.debug('[Settings] authChanged -> applying default appearance')
          applyDefaultAppearance()
        }
      } catch (err) {
        console.warn('Error handling authChanged in SettingsContext', err)
      }
    }

    window.addEventListener('authChanged', onAuthChanged)

    // Run once on mount so initial UI matches current auth state
    onAuthChanged()

    return () => window.removeEventListener('authChanged', onAuthChanged)
  }, [])

  const value = {
    // Settings state
    darkMode,
    fontSize,
    colorTheme,
    emailNotifications,
    pushNotifications,
    studyReminders,
    soundEffects,
    defaultStudyMode,
    sessionDuration,
    autoSave,
    showProgress,
    profileName,
    email,
    twoFactorAuth,
    dataCollection,
    analytics,
    shareProgress,
    studyStats,
    
    // Setters
    setDarkMode,
    setFontSize,
    setColorTheme,
    setEmailNotifications,
    setPushNotifications,
    setStudyReminders,
    setSoundEffects,
    setDefaultStudyMode,
    setSessionDuration,
    setAutoSave,
    setShowProgress,
    setProfileName,
    setEmail,
    setTwoFactorAuth,
    setDataCollection,
    setAnalytics,
    setShareProgress,
    
  // Functions
  saveAllSettings,
  resetSettings,
  // Reset only appearance-related settings (does not affect account/privacy/stats)
  resetAppearance,
  updateStudyStats,
    incrementStudySession,
    getThemeColors,
    playSound,
    sendNotification
    ,
    // New helpers for auth-based flows
    applyDefaultAppearance,
    loadSavedSettingsFromStorage
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}