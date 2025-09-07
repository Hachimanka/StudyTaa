import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function TopNav() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout(() => navigate("/"));
  };

  return (
    <nav className="glass-card mx-6 mt-6 px-8 py-4 animate-fadeInUp">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 animate-scaleIn">
          <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <Link to="/" className="text-heading text-primary">
            StudyTa
          </Link>
        </div>

        {/* Links */}
        <div className="hidden md:flex space-x-8">
          <a
            href="#features"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-body text-muted hover:text-accent transition-all duration-300 interactive"
          >
            Contact
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="btn-modern btn-secondary text-caption"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-modern btn-secondary text-caption">
                Login
              </Link>
              <Link to="/register" className="btn-modern btn-primary text-caption">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
