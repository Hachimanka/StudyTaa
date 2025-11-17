import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import Modal from '../components/Modal'

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
  // About modals
  const [aboutModal, setAboutModal] = useState(null) // 'privacy' | 'terms' | 'help' | null
  
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
    }).catch((err) => {
      console.error('Profile update failed', err)
      playSound('error')
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
      toast.textContent = '❌ Failed to save settings!'
      document.body.appendChild(toast)
      setTimeout(() => { toast.remove() }, 3000)
    })
  }

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'account', name: 'Account', icon: '👤' },
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
            <div className={`p-6 rounded-xl shadow-lg`} style={{ background: 'var(--surface)' }}>
              <h3 className={`text-lg font-semibold mb-4`} style={{ color: 'var(--text)' }}>
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
                  📝 Font Size
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
                  Version 1.0.0
                </p>
              </div>

              <div className={`text-left space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h4 className="font-semibold mb-2 text-center">What's New</h4>
                  <ul className="text-sm space-y-1 text-center mb-5">
                    <li>Enhanced study modes with completion tracking</li>
                    <li>New focus music with Pomodoro timer</li>
                    <li>Improved dark mode support</li>
                    <li>Better file summarization</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-center">Links</h4>
                  <div className="space-y-2 text-sm text-center">
                    <button onClick={() => setAboutModal('privacy')} className="block w-full text-teal-500 hover:text-teal-600">Privacy Policy</button>
                    <button onClick={() => setAboutModal('terms')} className="block w-full text-teal-500 hover:text-teal-600">Terms of Service</button>
                    <button onClick={() => setAboutModal('help')} className="block w-full text-teal-500 hover:text-teal-600">Help & Support</button>
                    <a href="https://github.com/Hachimanka/StudyTaa.git" target="_blank" rel="noopener noreferrer" className="block text-teal-500 hover:text-teal-600">GitHub Repository</a>
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
        <div className="mb-8">
          <h1 className={`text-5xl font-bold page-title`}>
            Settings
          </h1>
          <p className={`mt-2 text-lg`} style={{ color: 'var(--muted)' }}>
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
            {/* About Modals */}
            <Modal
              isOpen={aboutModal === 'privacy'}
              onClose={() => setAboutModal(null)}
              title="Privacy Policy"
              darkMode={darkMode}
            >
              <div className="space-y-4 text-sm leading-6">
                <p className='italic text-sm'>Last Updated: November 25, 2025</p>
                <p>Lemivon is a personalized study tool designed to help students learn better. This Privacy Policy explains how we collect, use, and protect your information.</p>

                <div className="space-y-2">
                  <h4 className="font-semibold">1. Information We Collect</h4>
                  <p>We may collect:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Files you upload (documents, images, notes)</li>
                    <li>Your study activities (flashcards, quizzes, events)</li>
                    <li>Basic account information (name, email, password)</li>
                    <li>Your saved notes, tasks, and preferences</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. How We Use Your Information</h4>
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Summarize files and generate study materials</li>
                    <li>Create calendar events from images</li>
                    <li>Save and organize your notes</li>
                    <li>Improve your studying experience</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. How We Protect Your Data</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We use secure storage to protect your files and notes.</li>
                    <li>Your password is encrypted.</li>
                    <li>Only you can access your personal study materials.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">4. Sharing Your Information</h4>
                  <p>We do not sell or share your information with third-party companies. We may only share data:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>If required by law</li>
                    <li>If you give permission</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">5. Your Rights</h4>
                  <p>You may:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Delete your account</li>
                    <li>Remove your files or notes</li>
                    <li>Request a copy of your stored data</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">6. Contact Us</h4>
                  <p>If you have concerns about privacy, message us at: Lemivon</p>
                </div>
              </div>
            </Modal>
            <Modal
              isOpen={aboutModal === 'terms'}
              onClose={() => setAboutModal(null)}
              title="Terms of Service"
              darkMode={darkMode}
            >
              <div className="space-y-4 text-sm leading-6">
                <p className='italic text-sm'>Last Updated: November 25, 2025</p>
                <p>These Terms explain how you may use Lemivon.</p>

                <div className="space-y-2">
                  <h4 className="font-semibold">1. Using Lemivon</h4>
                  <p>By creating an account, you agree to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use Lemivon for personal study only</li>
                    <li>Upload files that you have permission to use</li>
                    <li>Not misuse the app (no hacking, flooding, illegal activity)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. Your Content</h4>
                  <p>You own the files, notes, and materials you upload. Lemivon only processes them to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Summarize</li>
                    <li>Generate study tools</li>
                    <li>Save them in your personal library</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. AI-Generated Content</h4>
                  <p>The AI may sometimes make mistakes. Always double-check important information.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">4. Account Responsibilities</h4>
                  <p>You are responsible for:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Keeping your password safe</li>
                    <li>Using your account properly</li>
                    <li>Reporting suspicious activity</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">5. Service Changes</h4>
                  <p>We may update or improve features at any time. We will inform users if there are major changes.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">6. Ending Your Account</h4>
                  <p>You may delete your account anytime. We may suspend accounts that violate the rules.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">7. Disclaimer</h4>
                  <p>Lemivon is a study aid and not a replacement for official lessons, teachers, or school materials.</p>
                </div>
              </div>
            </Modal>
            <Modal
              isOpen={aboutModal === 'help'}
              onClose={() => setAboutModal(null)}
              title="Help & Support"
              darkMode={darkMode}
            >
              <div className="space-y-4 text-sm leading-6">
                <p>Need help? Lemivon is here for you!</p>

                <div className="space-y-2">
                  <h4 className="font-semibold">1. Common Questions</h4>
                  <p><span className="font-medium">How do I upload a file?</span><br />
                  Go to “Add File,” select your document or image, and Lemivon will scan it.</p>
                  <p><span className="font-medium">How do I create flashcards or quizzes?</span><br />
                  Upload your file → choose “Generate Study Tools” → pick flashcards, true/false, quiz, or summary.</p>
                  <p><span className="font-medium">Where are my notes saved?</span><br />
                  All notes appear in your Personal Library.</p>
                  <p><span className="font-medium">Can I listen to music while studying?</span><br />
                  Yes! Open Study Mode → tap Music Player.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. Troubleshooting</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">AI not generating?</span> Try re-uploading the file or checking your internet connection.</li>
                    <li><span className="font-medium">Calendar event not appearing?</span> Make sure calendar access is enabled in your device settings.</li>
                    <li><span className="font-medium">App is lagging?</span> Restart Lemivon or clear temporary files.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Contact Support</h4>
                  <p>Need more help?<br />
                  📧 Email: Lemivon<br />
                  📱 Facebook: Lemivon</p>
                </div>
              </div>
            </Modal>
            
            {/* Action buttons: Reset only on Appearance; Save on Appearance and Account */}
            {(activeTab === 'appearance' || activeTab === 'account') && (
              <div className="mt-8 flex justify-end gap-4">
                {/* Show Reset only for the Appearance tab */}
                {activeTab === 'appearance' && (
                  <button
                    onClick={resetAppearance}
                    className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} px-6 py-3 rounded-lg font-medium transition-all duration-200`}
                  >
                    🔄 Reset to Defaults
                  </button>
                )}

                {/* Save is still available for Appearance and Account */}
                <button
                  onClick={saveSettings}
                  className={`bg-gradient-to-r ${themeColors.gradient} ${themeColors.hover} text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  💾 Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
