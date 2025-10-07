import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Summarize from './pages/Summarize'
import Calendar from './pages/Calendar'
import Flashcards from './pages/Flashcards'
import Library from './pages/Library'
import Progress from './pages/Progress'
import Quote from './pages/Quote'
import Music from './pages/Music'
import Settings from './pages/Settings'
import ChatWidget from './components/ChatWidget'
import AuthenticatedWidget from './components/AuthenticatedWidget'

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        {/* ChatWidget will be rendered at the app level and will show only when authenticated */}
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/summarize" element={<RequireAuth><Summarize /></RequireAuth>} />
        <Route path="/calendar" element={<RequireAuth><Calendar /></RequireAuth>} />
        <Route path="/flashcards" element={<RequireAuth><Flashcards /></RequireAuth>} />
        <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
        <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/quote" element={<RequireAuth><Quote /></RequireAuth>} />
        <Route path="/music" element={<RequireAuth><Music /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Render chat widget for authenticated users */}
        <AuthenticatedWidget />
      </SettingsProvider>
    </AuthProvider>
  )
}
