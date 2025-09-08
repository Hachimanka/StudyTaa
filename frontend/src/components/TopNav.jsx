import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function TopNav() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout(() => navigate("/"));
  };

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
    } catch (e) {
      // ignore
    }
  }, [isDark])

  const location = useLocation()
  const isLanding = location && location.pathname === '/'
  return (
  <nav className={"glass-card mx-6 mt-6 px-8 py-4 animate-fadeInUp" + (isLanding ? ' topbar-landing' : '')}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 animate-scaleIn">
          <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold text-xl">L</span>
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
        <div className="flex items-center space-x-4">
          {/* Dark Mode Button Placeholder (optional to implement later) */}
          {/* neutral SVG icons instead of emoji */}
          <button
            onClick={() => setIsDark(d => !d)}
            aria-label="Toggle dark mode"
            title="Toggle Dark Mode"
            className="theme-toggle p-3 rounded-2xl hover:bg-gray-100 transition-all duration-300 interactive"
            style={{ lineHeight: 0 }}
          >
            {isDark ? (
              /* neutral sun */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="btn-modern btn-secondary text-caption"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-modern btn-secondary text-caption"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-modern btn-primary text-caption"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
