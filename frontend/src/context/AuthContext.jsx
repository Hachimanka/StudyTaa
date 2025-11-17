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
  // Restore user from localStorage if present so refresh doesn't lose identity
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore parse errors
    }
    return null;
  });
  // Persist user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
  }, [user]);
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
        if (data.message === '2FA_REQUIRED') {
          // Notify caller that 2FA is required. We store the partial user info so UI can prompt for code
          setUser({ _id: data.user._id, email: data.user.email, twoFactorPending: true });
          // Persist partial user so refresh doesn't lose the pending state
          try { localStorage.setItem('user', JSON.stringify({ _id: data.user._id, email: data.user.email, twoFactorPending: true })) } catch(e) {}
          if (cb) cb({ twoFactorRequired: true, userId: data.user._id });
          return;
        }
        setIsAuthenticated(true);
        setUser(data.user);
        try { localStorage.setItem('user', JSON.stringify(data.user)) } catch(e) {}
        // Store user ID as token for authenticated API calls
        localStorage.setItem('token', data.user._id);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('authChanged'));
        if (cb) cb();
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error', err);
      // Show a bit more info so users (and devs) can troubleshoot network/CORS issues
      alert('Login error: ' + (err?.message || 'Network or server error'));
    }
  };

  // Verify 2FA code
  const verify2FA = async (userId, code, cb) => {
    try {
      const res = await fetch('http://localhost:5000/api/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setUser(data.user);
        try { localStorage.setItem('user', JSON.stringify(data.user)) } catch(e) {}
        window.dispatchEvent(new Event('authChanged'));
        if (cb) cb(true);
      } else {
        alert(data.message || '2FA verification failed');
        if (cb) cb(false);
      }
    } catch (err) {
      alert('Error verifying 2FA');
      if (cb) cb(false);
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
        // If backend returns created user info later, prefer storing it; registration here triggers email verification flow
        // Keep user null until verification completes or login occurs
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Force default appearance settings so UI reverts immediately and after reload.
      try {
        const defaults = { darkMode: false, fontSize: 'medium', colorTheme: 'teal' };
        const saved = localStorage.getItem('studyTaSettings');
        let settings = saved ? JSON.parse(saved) : {};
        settings.darkMode = defaults.darkMode;
        settings.fontSize = defaults.fontSize;
        settings.colorTheme = defaults.colorTheme;
        localStorage.setItem('studyTaSettings', JSON.stringify(settings));
        localStorage.setItem('theme', 'light'); // keep standalone key consistent
      } catch (e) {
        console.warn('Failed to persist default appearance on logout', e);
      }
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authChanged'));
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    if (cb) cb();
  }

  // Update user profile locally and persist to localStorage.
  // Returns true on success. If a backend exists it may be extended
  // to call an API; for now we perform a local optimistic update.
  const updateProfile = async ({ name, email: newEmail }) => {
    try {
      // If we have an authenticated user with an id, attempt to persist to backend
      if (user && user._id) {
        try {
          const res = await fetch('http://localhost:5000/api/update-name', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, name })
          })
          const data = await res.json()
          if (res.ok) {
            const updatedUser = data.user || { _id: user._id, name, email: user.email }
            setUser(updatedUser)
            try { localStorage.setItem('user', JSON.stringify(updatedUser)) } catch (e) {}
            try { window.dispatchEvent(new Event('authChanged')) } catch (e) {}
            return true
          }
        } catch (err) {
          console.warn('Backend update failed, falling back to local update', err)
          // fallthrough to local update
        }
      }

      // Local optimistic update
      setUser(prev => {
        if (!prev) return prev
        const updated = { ...prev, name: name ?? prev.name, email: newEmail ?? prev.email }
        try { localStorage.setItem('user', JSON.stringify(updated)) } catch (e) {}
        return updated
      })
      try { window.dispatchEvent(new Event('authChanged')) } catch (e) {}
      return true
    } catch (err) {
      console.error('Failed to update profile:', err)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, signup, forgotPassword, user, updateProfile }}>
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
