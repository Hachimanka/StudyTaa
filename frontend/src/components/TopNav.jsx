import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function TopNav() {
  const { isAuthenticated } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth events
    const handleAuthChange = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('authChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  // Debug log to check authentication state
  console.log('TopNav isAuthenticated:', isAuthenticated);
  console.log('TopNav localStorage stuyta_auth:', localStorage.getItem('stuyta_auth'));

  // Theme (dark mode) state: persisted to localStorage and applied via a `dark` class
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark'
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    try {
      if (isDark) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
  // notify other parts of the app that theme changed
  try { window.dispatchEvent(new Event('themeChanged')) } catch(e){}
    } catch (e) {
      // ignore
    }
  }, [isDark])

  const location = useLocation()
  const isLanding = location && location.pathname === '/'
  return (
  <nav className={"glass-card mx-6 px-8 mt-5 py-4 animate-fadeIn" + (isLanding ? ' topbar-landing' : ' mt-6') + " relative z-10"}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 animate-scaleIn">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden animate-pulse-glow">
            {/* Using public asset so path is absolute from site root */}
              <img
                src="/Lemivon.ico"
                alt="Lemivon logo"
                className="w-full h-full object-contain"
                width={40}
                height={40}
                style={{ imageRendering: 'auto' }}
                loading="eager"
              />
          </div>
          <span className="text-heading text-primary font-bold">Lemivon</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <a
            href="#features"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            About Us
          </a>
          <a
            href="#contact"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            Contact
          </a>
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            aria-label="Toggle dark mode"
            title="Toggle Dark Mode"
            className="theme-toggle p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 interactive flex-shrink-0"
            style={{ lineHeight: 0 }}
          >
            {isDark ? (
              /* neutral sun */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M12 1v2" />
                  <path d="M12 21v2" />
                  <path d="M4.2 4.2l1.4 1.4" />
                  <path d="M18.4 18.4l1.4 1.4" />
                  <path d="M1 12h2" />
                  <path d="M21 12h2" />
                  <path d="M4.2 19.8l1.4-1.4" />
                  <path d="M18.4 5.6l1.4-1.4" />
                </g>
              </svg>
            ) : (
              /* neutral crescent moon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </button>

          {/* Authentication Buttons */}
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="btn-modern btn-secondary text-caption whitespace-nowrap"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn-modern btn-primary text-caption whitespace-nowrap"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
