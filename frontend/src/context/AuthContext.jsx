import React, { createContext, useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      // Clear any stale authentication state on app load
      const authState = localStorage.getItem('stuyta_auth');
      console.log('Initial auth state from localStorage:', authState);
      return authState === '1'
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    try {
      if (isAuthenticated) localStorage.setItem('stuyta_auth', '1')
      else localStorage.removeItem('stuyta_auth')
    } catch (e) {
      // ignore
    }
  }, [isAuthenticated])

  // Login with backend
  const [user, setUser] = useState(null);
  const login = async (email, password, cb) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setUser(data.user);
        // Store user ID as token for authenticated API calls
        localStorage.setItem('token', data.user._id);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('authChanged'));
        if (cb) cb();
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Login error');
    }
  };

  // Register with backend
  const signup = async (name, email, password, cb) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        if (cb) cb();
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  };

  // Forgot password (mock, needs backend route)
  const forgotPassword = async (email) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Reset link sent to your email');
      } else {
        alert(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      alert('Error sending reset link');
    }
  };

  const logout = (cb) => {
    console.log('Logging out...');
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem('stuyta_auth');
      localStorage.removeItem('token');
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authChanged'));
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    if (cb) cb();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, signup, forgotPassword, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth({ children }) {
  const { isAuthenticated } = React.useContext(AuthContext)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
