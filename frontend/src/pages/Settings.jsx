import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Settings() {
  const {
    // Settings state
    darkMode,
    fontSize,
    colorTheme,
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
    
    // Setters
    setDarkMode,
    setFontSize,
    setColorTheme,
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
  resetAppearance,
  getThemeColors,
    playSound
  } = useSettings()
  const { user } = useAuth()
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    // If navigated with state specifying a tab, activate it (e.g., from ChangePassword Cancel)
    if(location?.state?.tab){
      setActiveTab(location.state.tab)
    }
  }, [location])

  // Keep local profileName in sync with authenticated user if present.
  useEffect(() => {
    if (user?.name) {
      // Only overwrite if different to avoid clobbering edits in-progress
      setProfileName(prev => (prev !== user.name ? user.name : prev))
    }
    if (user?.email) {
      setEmail(prev => (prev !== user.email ? user.email : prev))
    }
  }, [user, setProfileName, setEmail])
  
  // Active settings tab
  const [activeTab, setActiveTab] = useState('appearance')
  // Modal visibility state
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Reusable themed modal component
  const ThemedModal = ({ open, onClose, title, children }) => {
    if (!open) return null
    // Lock body scroll while modal open
    useEffect(() => {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }, [])
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
        {/* Blurry backdrop */}
        <div
          className="absolute inset-0" 
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        />
        <div
          className="relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl p-6 animate-fadeIn"
          style={{
            background: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255, 255, 255, 0.45)',
            color: darkMode ? '#ffffff' : '#000000',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
          <div className="space-y-4 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
            {children}
          </div>
        </div>
      </div>
    )
  }
  
  // Save settings with feedback
  const saveSettings = () => {
    const success = saveAllSettings()
    // Attempt to update authenticated user's profile if present
  const updatePromise = user ? updateProfile({ name: profileName }) : Promise.resolve(true)

    updatePromise.then((profileOk) => {
      if (success && profileOk) {
        playSound('success')

        // Show success message using CSS variables so it follows the current theme
        const toast = document.createElement('div')
        toast.style.position = 'fixed'
        toast.style.top = '1rem'
        toast.style.right = '1rem'
        toast.style.background = 'linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, transparent))'
        toast.style.color = 'white'
        toast.style.padding = '0.5rem 1rem'
        toast.style.borderRadius = '0.5rem'
        toast.style.boxShadow = '0 8px 30px rgba(2,6,23,0.2)'
        toast.style.zIndex = 50
        toast.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024" style="display: inline; margin-right: 0.5rem;"><path fill="currentColor" d="M512 0C229.232 0 0 229.232 0 512c0 282.784 229.232 512 512 512c282.784 0 512-229.216 512-512C1024 229.232 794.784 0 512 0zm0 961.008c-247.024 0-448-201.984-448-449.01c0-247.024 200.976-448 448-448s448 200.977 448 448s-200.976 449.01-448 449.01zm204.336-636.352L415.935 626.944l-135.28-135.28c-12.496-12.496-32.752-12.496-45.264 0c-12.496 12.496-12.496 32.752 0 45.248l158.384 158.4c12.496 12.48 32.752 12.48 45.264 0c1.44-1.44 2.673-3.009 3.793-4.64l318.784-320.753c12.48-12.496 12.48-32.752 0-45.263c-12.512-12.496-32.768-12.496-45.28 0z"/></svg> Settings saved successfully!'
        document.body.appendChild(toast)
        setTimeout(() => {
          toast.remove()
        }, 3000)
      } else {
        playSound('error')

        // Show error message
        const toast = document.createElement('div')
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
        toast.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" style="display: inline; margin-right: 0.5rem;"><path fill="currentColor" d="M165.66 101.66L139.31 128l26.35 26.34a8 8 0 0 1-11.32 11.32L128 139.31l-26.34 26.35a8 8 0 0 1-11.32-11.32L116.69 128l-26.35-26.34a8 8 0 0 1 11.32-11.32L128 116.69l26.34-26.35a8 8 0 0 1 11.32 11.32ZM232 128A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104Zm-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88Z"/></svg> Failed to save settings!'
        document.body.appendChild(toast)
        setTimeout(() => {
          toast.remove()
        }, 3000)
      }
    }).catch((err) => {
      console.error('Profile update failed', err)
      playSound('error')
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
      toast.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" style="display: inline; margin-right: 0.5rem;"><path fill="currentColor" d="M165.66 101.66L139.31 128l26.35 26.34a8 8 0 0 1-11.32 11.32L128 139.31l-26.34 26.35a8 8 0 0 1-11.32-11.32L116.69 128l-26.35-26.34a8 8 0 0 1 11.32-11.32L128 116.69l26.34-26.35a8 8 0 0 1 11.32 11.32ZM232 128A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104Zm-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88Z"/></svg> Failed to save settings!'
      document.body.appendChild(toast)
      setTimeout(() => { toast.remove() }, 3000)
    })
  }

  // SVG Icons
  const IconPalette = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
      <circle cx="10" cy="12" r="2" fill="currentColor"/>
      <circle cx="16" cy="9" r="2" fill="currentColor"/>
      <circle cx="22" cy="12" r="2" fill="currentColor"/>
      <circle cx="23" cy="18" r="2" fill="currentColor"/>
      <circle cx="19" cy="23" r="2" fill="currentColor"/>
      <path fill="currentColor" d="M16.54 2A14 14 0 0 0 2 16a4.82 4.82 0 0 0 6.09 4.65l1.12-.31a3 3 0 0 1 3.79 2.9V27a3 3 0 0 0 3 3a14 14 0 0 0 14-14.54A14.05 14.05 0 0 0 16.54 2Zm8.11 22.31A11.93 11.93 0 0 1 16 28a1 1 0 0 1-1-1v-3.76a5 5 0 0 0-5-5a5.07 5.07 0 0 0-1.33.18l-1.12.31A2.82 2.82 0 0 1 4 16A12 12 0 0 1 16.47 4A12.18 12.18 0 0 1 28 15.53a11.89 11.89 0 0 1-3.35 8.79Z"/>
    </svg>
  );

  const IconUser = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2Z"/>
        <path d="M4.271 18.346S6.5 15.5 12 15.5s7.73 2.846 7.73 2.846M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"/>
      </g>
    </svg>
  );

  const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
      <path fill="currentColor" fillRule="evenodd" d="M256 42.667C138.18 42.667 42.667 138.179 42.667 256c0 117.82 95.513 213.334 213.333 213.334c117.822 0 213.334-95.513 213.334-213.334S373.822 42.667 256 42.667m0 384c-94.105 0-170.666-76.561-170.666-170.667S161.894 85.334 256 85.334c94.107 0 170.667 76.56 170.667 170.666S350.107 426.667 256 426.667m26.714-256c0 15.468-11.262 26.667-26.497 26.667c-15.851 0-26.837-11.2-26.837-26.963c0-15.15 11.283-26.37 26.837-26.37c15.235 0 26.497 11.22 26.497 26.666m-48 64h42.666v128h-42.666z"/>
    </svg>
  );

  const IconMoon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12.058 20q-3.333 0-5.667-2.334Q4.058 15.333 4.058 12q0-2.47 1.413-4.536t4.01-2.972q.306-.107.536-.056q.231.05.381.199t.191.38q.042.233-.062.489q-.194.477-.282.966t-.087 1.03q0 2.667 1.866 4.533q1.867 1.867 4.534 1.867q.698 0 1.278-.148q.58-.148.987-.24q.217-.04.4.01q.18.051.287.176q.119.125.16.308q.042.182-.047.417q-.715 2.45-2.803 4.014Q14.733 20 12.058 20Zm0-1q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.158 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5.058 12q0 2.9 2.05 4.95t4.95 2.05Zm-.25-6.75Z"/>
    </svg>
  );

  const IconReset = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
      <path fill="currentColor" d="M18 28A12 12 0 1 0 6 16v6.2l-3.6-3.6L1 20l6 6l6-6l-1.4-1.4L8 22.2V16a10 10 0 1 1 10 10Z"/>
    </svg>
  );

  const IconSave = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.25 21v-4.765a1.59 1.59 0 0 0-1.594-1.588H9.344a1.59 1.59 0 0 0-1.594 1.588V21m8.5-17.715v2.362a1.59 1.59 0 0 1-1.594 1.588H9.344A1.59 1.59 0 0 1 7.75 5.647V3m8.5.285A3.196 3.196 0 0 0 14.93 3H7.75m8.5.285c.344.156.661.374.934.645l2.382 2.375A3.17 3.17 0 0 1 20.5 8.55v9.272A3.182 3.182 0 0 1 17.312 21H6.688A3.182 3.182 0 0 1 3.5 17.823V6.176A3.182 3.182 0 0 1 6.688 3H7.75"/>
    </svg>
  );

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: <IconPalette /> },
    { id: 'account', name: 'Account', icon: <IconUser /> },
    { id: 'about', name: 'About', icon: <IconInfo /> }
  ];

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-3">
      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      <div 
        className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors ${
          checked ? 'bg-teal-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  )

  const themeColors = getThemeColors()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl shadow-lg`} style={{ background: 'var(--surface)' }}>
              <h3 className={`text-lg font-semibold mb-4`} style={{ color: 'var(--text)' }}>
                Theme & Display
              </h3>
              
              <ToggleSwitch 
                checked={darkMode} 
                onChange={setDarkMode} 
                label={
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: '0.5rem' }}>
                      <path fill="currentColor" d="M12.058 20q-3.333 0-5.667-2.334Q4.058 15.333 4.058 12q0-2.47 1.413-4.536t4.01-2.972q.306-.107.536-.056q.231.05.381.199t.191.38q.042.233-.062.489q-.194.477-.282.966t-.087 1.03q0 2.667 1.866 4.533q1.867 1.867 4.534 1.867q.698 0 1.278-.148q.58-.148.987-.24q.217-.04.4.01q.18.051.287.176q.119.125.16.308q.042.182-.047.417q-.715 2.45-2.803 4.014Q14.733 20 12.058 20Zm0-1q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.158 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5.058 12q0 2.9 2.05 4.95t4.95 2.05Zm-.25-6.75Z"/>
                    </svg>
                    Dark Mode
                  </span>
                } 
              />
              
              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" style={{ display: 'inline', marginRight: '0.5rem' }}>
                    <circle cx="10" cy="12" r="2" fill="currentColor"/>
                    <circle cx="16" cy="9" r="2" fill="currentColor"/>
                    <circle cx="22" cy="12" r="2" fill="currentColor"/>
                    <circle cx="23" cy="18" r="2" fill="currentColor"/>
                    <circle cx="19" cy="23" r="2" fill="currentColor"/>
                    <path fill="currentColor" d="M16.54 2A14 14 0 0 0 2 16a4.82 4.82 0 0 0 6.09 4.65l1.12-.31a3 3 0 0 1 3.79 2.9V27a3 3 0 0 0 3 3a14 14 0 0 0 14-14.54A14.05 14.05 0 0 0 16.54 2Zm8.11 22.31A11.93 11.93 0 0 1 16 28a1 1 0 0 1-1-1v-3.76a5 5 0 0 0-5-5a5.07 5.07 0 0 0-1.33.18l-1.12.31A2.82 2.82 0 0 1 4 16A12 12 0 0 1 16.47 4A12.18 12.18 0 0 1 28 15.53a11.89 11.89 0 0 1-3.35 8.79Z"/>
                  </svg>
                  Color Theme
                </label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className={`w-full p-3 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value="teal">Teal</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="pink">Pink</option>
                </select>
              </div>

              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15" style={{ display: 'inline', marginRight: '0.5rem' }}>
                    <path fill="currentColor" fillRule="evenodd" d="M2.782 2.217a.4.4 0 0 0-.565 0l-2 2a.4.4 0 0 0 .565.566L2.1 3.466v8.068L.782 10.217a.4.4 0 0 0-.565.566l2 2a.4.4 0 0 0 .565 0l2-2a.4.4 0 0 0-.565-.566l-1.318 1.317V3.466l1.318 1.317a.4.4 0 0 0 .565-.566l-2-2Zm7.718.533a.5.5 0 0 1 .47.33l3 8.32a.5.5 0 0 1-.94.34l-.982-2.724H8.952l-.982 2.723a.5.5 0 0 1-.94-.34l3-8.319a.5.5 0 0 1 .47-.33Zm0 1.974l1.241 3.442H9.26l1.24-3.442Z" clipRule="evenodd"/>
                  </svg>
                  Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className={`w-full p-3 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

            </div>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Account Information
              </h3>
              
              <div className={`py-3`}>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: '0.5rem' }}>
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2Z"/>
                      <path d="M4.271 18.346S6.5 15.5 12 15.5s7.73 2.846 7.73 2.846M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"/>
                    </g>
                  </svg>
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 14" style={{ display: 'inline', marginRight: '0.5rem' }}>
                    <path fill="currentColor" d="M14.5 13h-13C.67 13 0 12.33 0 11.5v-9C0 1.67.67 1 1.5 1h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5ZM1.5 2c-.28 0-.5.22-.5.5v9c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-9c0-.28-.22-.5-.5-.5h-13Z"/>
                    <path fill="currentColor" d="M8 8.96c-.7 0-1.34-.28-1.82-.79L.93 2.59c-.19-.2-.18-.52.02-.71c.2-.19.52-.18.71.02l5.25 5.58c.57.61 1.61.61 2.18 0l5.25-5.57c.19-.2.51-.21.71-.02c.2.19.21.51.02.71L9.82 8.18c-.48.51-1.12.79-1.82.79Z"/>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || email}
                  readOnly
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-300' 
                      : 'bg-white border-gray-300 text-gray-500'
                  } cursor-not-allowed`}
                />
              </div>
              
              <div className="py-3">
                {/* Two-Factor Authentication option removed per request */}
              </div>

              <div className="pt-4 space-y-3">
                <button onClick={() => navigate('/change-password')} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Change Password
                </button>
                <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )

      case 'about':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg text-center`}>
              <div className="mb-6">
                <img src="/Lemivon.ico" alt="StudyTa" className="w-16 h-16 mx-auto mb-4" />
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Lemivon
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Version 2.1.0
                </p>
              </div>

              <div className={`text-center space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h4 className="font-semibold mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: '0.5rem' }}>
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0c1.172 1.025 1.172 2.687 0 3.712c-.203.179-.43.326-.67.442c-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
                    </svg>
                    What's New
                  </h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>Enhanced study modes with completion tracking</li>
                    <li>New focus music with Pomodoro timer</li>
                    <li>Improved dark mode support</li>
                    <li>Better file summarization</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: '0.5rem' }}>
                      <path fill="currentColor" fillRule="evenodd" d="M12.588 5.02a4.525 4.525 0 0 1 6.399 6.399l-.01.01l-2.264 2.264a4.525 4.525 0 0 1-6.824-.489a.75.75 0 1 1 1.201-.898a3.026 3.026 0 0 0 4.562.327l2.26-2.26a3.026 3.026 0 0 0-4.278-4.277L12.34 7.383a.75.75 0 1 1-1.058-1.064zM8.905 9.266a4.525 4.525 0 0 1 5.205 1.53a.75.75 0 0 1-1.201.898a3.024 3.024 0 0 0-4.562-.327l-2.26 2.26a3.025 3.025 0 0 0 4.277 4.278l1.286-1.286a.75.75 0 0 1 1.061 1.06l-1.3 1.3a4.525 4.525 0 0 1-6.399-6.398l.01-.01l2.264-2.264a4.5 4.5 0 0 1 1.62-1.04" clipRule="evenodd"/>
                    </svg>
                    Links
                  </h4>
                  <div className={`flex flex-col items-center space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <button onClick={() => setShowPrivacy(true)} className="block text-teal-500 hover:text-teal-600">Privacy Policy</button>
                    <button onClick={() => setShowTerms(true)} className="block text-teal-500 hover:text-teal-600">Terms of Service</button>
                    <button onClick={() => setShowHelp(true)} className="block text-teal-500 hover:text-teal-600">Help & Support</button>
                    <a
                      href="https://github.com/Hachimanka/StudyTaa.git"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-teal-500 hover:text-teal-600"
                    >
                      GitHub Repository
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300`} style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 p-8 ml-20 md:ml-30">
        <ChatWidget />
        
        {/* Header */}
        <div className="mb-8 page-header-group">
          <h1 className={`text-5xl font-bold page-title`}>
            Settings
          </h1>
          <p className={`mt-2 text-lg page-subtitle`} style={{ color: 'var(--muted)' }}>
            Customize your StudyTa experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className={`p-4 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-md`
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : `text-gray-700 hover:bg-${themeColors.primary}-50`
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
            
            {/* Action buttons: Reset only on Appearance; Save on Appearance and Account */}
            {(activeTab === 'appearance' || activeTab === 'account') && (
              <div className="mt-8 flex justify-end gap-4">
                {/* Show Reset only for the Appearance tab */}
                {activeTab === 'appearance' && (
                  <button
                    onClick={resetAppearance}
                    className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32">
                      <path fill="currentColor" d="M18 28A12 12 0 1 0 6 16v6.2l-3.6-3.6L1 20l6 6l6-6l-1.4-1.4L8 22.2V16a10 10 0 1 1 10 10Z"/>
                    </svg>
                    Reset to Defaults
                  </button>
                )}

                {/* Save is still available for Appearance and Account */}
                <button
                  onClick={saveSettings}
                  className={`bg-gradient-to-r ${themeColors.gradient} ${themeColors.hover} text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.25 21v-4.765a1.59 1.59 0 0 0-1.594-1.588H9.344a1.59 1.59 0 0 0-1.594 1.588V21m8.5-17.715v2.362a1.59 1.59 0 0 1-1.594 1.588H9.344A1.59 1.59 0 0 1 7.75 5.647V3m8.5.285A3.196 3.196 0 0 0 14.93 3H7.75m8.5.285c.344.156.661.374.934.645l2.382 2.375A3.17 3.17 0 0 1 20.5 8.55v9.272A3.182 3.182 0 0 1 17.312 21H6.688A3.182 3.182 0 0 1 3.5 17.823V6.176A3.182 3.182 0 0 1 6.688 3H7.75"/>
                  </svg>
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Modals */}
      <ThemedModal
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
      >
        <p><em>Last Updated: November 23, 2025</em></p>
        <p>Lemivon is a personalized study tool designed to help students learn better. This Privacy Policy explains how we collect, use, and protect your information.</p>
        <h3 className="text-lg font-semibold mt-4">1. Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Files you upload (documents, images, notes)</li>
          <li>Your study activities (flashcards, quizzes, events)</li>
          <li>Basic account information (name, email, password)</li>
          <li>Your saved notes, tasks, and preferences</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">2. How We Use Your Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Summarize files and generate study materials</li>
          <li>Create calendar events from images</li>
          <li>Save and organize your notes</li>
          <li>Improve your studying experience</li>
          <li>Provide customer support</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">3. How We Protect Your Data</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>We use secure storage to protect your files and notes.</li>
          <li>Your password is encrypted.</li>
          <li>Only you can access your personal study materials.</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">4. Sharing Your Information</h3>
        <p>We do not sell or share your information with third-party companies. We may only share data:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>If required by law</li>
          <li>If you give permission</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">5. Your Rights</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Delete your account</li>
          <li>Remove your files or notes</li>
          <li>Request a copy of your stored data</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">6. Contact Us</h3>
        <p>If you have concerns about privacy, message us at: Lemivon.com</p>
      </ThemedModal>
      <ThemedModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
      >
        <p><em>Last Updated: November 23, 2025</em></p>
        <p>These Terms explain how you may use Lemivon.</p>
        <h3 className="text-lg font-semibold mt-4">1. Using Lemivon</h3>
        <p>By creating an account, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use Lemivon for personal study only</li>
          <li>Upload files that you have permission to use</li>
          <li>Not misuse the app (no hacking, flooding, illegal activity)</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">2. Your Content</h3>
        <p>You own the files, notes, and materials you upload. Lemivon only processes them to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Summarize</li>
          <li>Generate study tools</li>
          <li>Save them in your personal library</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">3. AI-Generated Content</h3>
        <p>The AI may sometimes make mistakes. Always double-check important information.</p>
        <h3 className="text-lg font-semibold mt-4">4. Account Responsibilities</h3>
        <p>You are responsible for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Keeping your password safe</li>
          <li>Using your account properly</li>
          <li>Reporting suspicious activity</li>
        </ul>
        <h3 className="text-lg font-semibold mt-4">5. Service Changes</h3>
        <p>We may update or improve features at any time. We will inform users if there are major changes.</p>
        <h3 className="text-lg font-semibold mt-4">6. Ending Your Account</h3>
        <p>You may delete your account anytime. We may suspend accounts that violate the rules.</p>
        <h3 className="text-lg font-semibold mt-4">7. Disclaimer</h3>
        <p>Lemivon is a study aid and not a replacement for official lessons, teachers, or school materials.</p>
      </ThemedModal>
      <ThemedModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Help & Support"
      >
        <p>Need help? Lemivon is here for you!</p>
        <h3 className="text-lg font-semibold mt-4">1. Common Questions</h3>
        <p><strong>How do I upload a file?</strong><br />Go to “Add File,” select your document or image, and Lemivon will scan it.</p>
        <p><strong>How do I create flashcards or quizzes?</strong><br />Upload your file → choose “Generate Study Tools” → pick flashcards, true/false, quiz, or summary.</p>
        <p><strong>Where are my notes saved?</strong><br />All notes appear in your Personal Library.</p>
        <p><strong>Can I listen to music while studying?</strong><br />Yes! Open Study Mode → tap Music Player.</p>
        <h3 className="text-lg font-semibold mt-4">2. Troubleshooting</h3>
        <p><strong>AI not generating?</strong> Try re-uploading the file or checking your internet connection.</p>
        <p><strong>Calendar event not appearing?</strong> Make sure calendar access is enabled in your device settings.</p>
        <p><strong>App is lagging?</strong> Restart Lemivon or clear temporary files.</p>
        <h3 className="text-lg font-semibold mt-4">3. Contact Support</h3>
        <p>Need more help?<br />Email: Lemivon.com<br />Facebook Page: Lemivon</p>
        <h3 className="text-lg font-semibold mt-4">Extra Tips</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Keep uploads concise for faster summarization.</li>
          <li>Use focus sounds + timer for structured sessions.</li>
          <li>Report bugs or suggest features on GitHub.</li>
        </ul>
      </ThemedModal>
    </div>
  )
}