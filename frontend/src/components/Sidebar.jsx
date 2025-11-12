import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { isAuthenticated, logout } = useAuth();
  const { darkMode, getThemeColors } = useSettings();
  const navigate = useNavigate();

  const themeColors = getThemeColors();

  const location = useLocation();

  const handleLogout = () => {
    logout(() => navigate("/"));
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="8" stroke="currentColor" strokeWidth="1.2"/><rect x="14" y="3" width="7" height="5" stroke="currentColor" strokeWidth="1.2"/><rect x="14" y="12" width="7" height="9" stroke="currentColor" strokeWidth="1.2"/></svg>
    ) },
    { name: "Summarize", path: "/summarize", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M5 8h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="5" y="12" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
    ) },
    { name: "Calendar", path: "/calendar", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    ) },
    { name: "Flashcard/Quiz", path: "/flashcards", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M7 8h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    ) },
    { name: "Library", path: "/library", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5V6a1 1 0 011-1h3v15M13 4h6a1 1 0 011 1v15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { name: "Music", path: "/music", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5l10-2v13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
    ) },
    { name: "Settings", path: "/settings", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 013.28 17.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 017.1 3.28l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001 1.51V7a2 2 0 014 0v.09c.3.13.57.32.8.55l.06.06a1.65 1.65 0 001.82.33l.06-.06A2 2 0 0120.72 6.1l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="0.9"/></svg>
    ) },
  ];

  return (
    <aside
      className={`
        fixed left-4 top-4 bottom-4
        flex flex-col
        shadow-xl rounded-2xl
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-50"}
        overflow-hidden
        z-50
      `}
      style={{ background: 'var(--surface)', border: `1px solid var(--glass-border)` }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo */}
      <div className="flex items-center px-3 py-4 min-h-[64px]">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src="/Lemivon.ico"
              alt="Lemivon logo"
              className="w-full h-full object-contain"
              width={32}
              height={32}
              loading="eager"
              style={{ imageRendering: 'auto' }}
            />
        </div>
        <span
          className={`ml-3 text-xl font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          } ${isCollapsed ? "opacity-0" : "opacity-100"} transition-opacity duration-300 whitespace-nowrap`}
        >
          Lemivon
        </span>
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col flex-grow px-1.5 space-y-1">
        {menuItems.map((item, i) => (
          <Link
            key={i}
            to={item.path}
            className={`flex items-center p-3 rounded-xl transition-colors duration-200`}
            style={location.pathname === item.path ? {
              border: '1px solid rgba(0,0,0,0.04)',
              background: 'color-mix(in srgb, var(--color-primary) 12%, transparent) ',
              color: 'var(--color-primary)'
            } : undefined}
          >
            <span className="text-xl w-7 text-center flex-shrink-0">
              {item.icon}
            </span>
            <span
              className={`ml-3 ${
                isCollapsed ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300 whitespace-nowrap`}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* Logout - Only show when authenticated */}
      {isAuthenticated && (
        <div className="px-1.5 pb-2 mt-auto">
          <button
            onClick={handleLogout}
            className={`
              flex items-center p-3 rounded-xl w-full text-left
              ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}
              transition-colors duration-200
            `}
          >
          <span className="text-xl w-7 text-center flex-shrink-0" style={{lineHeight:0}}>
            {/* Standard logout icon (arrow leaving a door) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 19H6a2 2 0 01-2-2V7a2 2 0 012-2h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
            <span
              className={`ml-3 ${
                isCollapsed ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300 whitespace-nowrap`}
            >
              Logout
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
