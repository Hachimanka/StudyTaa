import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'

export default function Settings() {
  const {
    // Settings state
    darkMode,
    language,
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
    
    // Setters
    setDarkMode,
    setLanguage,
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
    getThemeColors,
    playSound
  } = useSettings()
  
  // Active settings tab
  const [activeTab, setActiveTab] = useState('appearance')
  
  // Save settings with feedback
  const saveSettings = () => {
    const success = saveAllSettings()
    if (success) {
      playSound('success')
      
      // Show success message with theme colors
      const themeColors = getThemeColors()
      const toast = document.createElement('div')
      toast.className = `fixed top-4 right-4 ${themeColors.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`
      toast.textContent = '✅ Settings saved successfully!'
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.remove()
      }, 3000)
    } else {
      playSound('error')
      
      // Show error message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
      toast.textContent = '❌ Failed to save settings!'
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.remove()
      }, 3000)
    }
  }

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'study', name: 'Study', icon: '📚' },
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'about', name: 'About', icon: 'ℹ️' }
  ]

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
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Theme & Display
              </h3>
              
              <ToggleSwitch 
                checked={darkMode} 
                onChange={setDarkMode} 
                label="🌙 Dark Mode" 
              />
              
              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🎨 Color Theme
                </label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
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
                  📝 Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  🌍 Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="english">English</option>
                  <option value="spanish">Español</option>
                  <option value="french">Français</option>
                  <option value="german">Deutsch</option>
                  <option value="chinese">中文</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Notification Preferences
              </h3>
              
              <ToggleSwitch 
                checked={emailNotifications} 
                onChange={setEmailNotifications} 
                label="📧 Email Notifications" 
              />
              
              <ToggleSwitch 
                checked={pushNotifications} 
                onChange={setPushNotifications} 
                label="📱 Push Notifications" 
              />
              
              <ToggleSwitch 
                checked={studyReminders} 
                onChange={setStudyReminders} 
                label="⏰ Study Reminders" 
              />
              
              <ToggleSwitch 
                checked={soundEffects} 
                onChange={setSoundEffects} 
                label="🔊 Sound Effects" 
              />
            </div>
          </div>
        )

      case 'study':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Study Preferences
              </h3>
              
              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📚 Default Study Mode
                </label>
                <select
                  value={defaultStudyMode}
                  onChange={(e) => setDefaultStudyMode(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="flashcard">Flashcards</option>
                  <option value="quiz">Quiz Mode</option>
                  <option value="matching">Matching</option>
                  <option value="fillblanks">Fill in the Blanks</option>
                  <option value="truefalse">True/False</option>
                </select>
              </div>

              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  ⏱️ Default Session Duration (minutes)
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>5 min</span>
                  <span className="font-medium">{sessionDuration} min</span>
                  <span>120 min</span>
                </div>
              </div>
              
              <ToggleSwitch 
                checked={autoSave} 
                onChange={setAutoSave} 
                label="💾 Auto-save Progress" 
              />
              
              <ToggleSwitch 
                checked={showProgress} 
                onChange={setShowProgress} 
                label="📊 Show Progress Indicators" 
              />
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
              
              <div className="py-3">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  👤 Display Name
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
                  📧 Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <ToggleSwitch 
                checked={twoFactorAuth} 
                onChange={setTwoFactorAuth} 
                label="🔐 Two-Factor Authentication" 
              />

              <div className="pt-4 space-y-3">
                <button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Change Password
                </button>
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}>
                  Download My Data
                </button>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Privacy & Data
              </h3>
              
              <ToggleSwitch 
                checked={dataCollection} 
                onChange={setDataCollection} 
                label="📊 Allow Data Collection for Improvements" 
              />
              
              <ToggleSwitch 
                checked={analytics} 
                onChange={setAnalytics} 
                label="📈 Analytics & Usage Statistics" 
              />
              
              <ToggleSwitch 
                checked={shareProgress} 
                onChange={setShareProgress} 
                label="🎯 Share Progress with Friends" 
              />

              <div className="pt-4 space-y-3">
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}>
                  Clear All Data
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
                <img src="/StudyTaLogo.png" alt="StudyTa" className="w-16 h-16 mx-auto mb-4" />
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  StudyTa
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Version 2.1.0
                </p>
              </div>

              <div className={`text-left space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h4 className="font-semibold mb-2">📝 What's New</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Enhanced study modes with completion tracking</li>
                    <li>• New focus music with Pomodoro timer</li>
                    <li>• Improved dark mode support</li>
                    <li>• Better file summarization</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔗 Links</h4>
                  <div className="space-y-2 text-sm">
                    <a href="#" className="block text-teal-500 hover:text-teal-600">Privacy Policy</a>
                    <a href="#" className="block text-teal-500 hover:text-teal-600">Terms of Service</a>
                    <a href="#" className="block text-teal-500 hover:text-teal-600">Help & Support</a>
                    <a href="#" className="block text-teal-500 hover:text-teal-600">GitHub Repository</a>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-center text-sm">
                    Made with ❤️ for students everywhere
                  </p>
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
    <div className={`flex min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-teal-50 to-teal-100'
    }`}>
      <Sidebar />
      <main className="flex-1 p-8 ml-20 md:ml-30">
        <ChatWidget />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-5xl font-bold bg-gradient-to-r from-${themeColors.primary}-600 to-${themeColors.primary}-700 bg-clip-text text-transparent`}>
            Settings
          </h1>
          <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : themeColors.text}`}>
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
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
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
            
            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={resetSettings}
                className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} px-6 py-3 rounded-lg font-medium transition-all duration-200`}
              >
                🔄 Reset to Defaults
              </button>
              <button
                onClick={saveSettings}
                className={`bg-gradient-to-r ${themeColors.gradient} ${themeColors.hover} text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                💾 Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
