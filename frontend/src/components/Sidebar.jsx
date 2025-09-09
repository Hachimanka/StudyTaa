import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // ✅ Initialize from localStorage right away
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  const location = useLocation();

  useEffect(() => {
    const handleThemeChange = () => {
      try {
        setIsDark(localStorage.getItem("theme") === "dark");
      } catch {
        setIsDark(false);
      }
    };

    // Listen for custom theme change events
    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Summarize", path: "/summarize", icon: "📝" },
    { name: "Calendar", path: "/calendar", icon: "📅" },
    { name: "Flashcard/Quiz", path: "/flashcards", icon: "🔍" },
    { name: "Library", path: "/library", icon: "📚" },
    { name: "Progress", path: "/progress", icon: "📈" },
    { name: "Quote", path: "/quote", icon: "💬" },
    { name: "Music", path: "/music", icon: "🎵" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  return (
    <aside
      className={`
        fixed left-4 top-4 bottom-4
        flex flex-col
        ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        shadow-xl rounded-2xl
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-50"}
        border
        overflow-hidden
        z-50
      `}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo */}
      <div className="flex items-center px-3 py-4 min-h-[64px]">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <span
          className={`ml-3 text-xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
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
            className={`
              flex items-center p-3 rounded-xl
              transition-colors duration-200
              ${
                location.pathname === item.path
                  ? `${
                      isDark
                        ? "bg-teal-900/30 text-teal-300 border-teal-700"
                        : "bg-teal-100 text-teal-700 border-teal-200"
                    } border`
                  : `${
                      isDark
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
              }
            `}
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

      {/* Logout */}
      <div className="px-1.5 pb-2 mt-auto">
        <Link
          to="/logout"
          className={`
            flex items-center p-3 rounded-xl
            ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}
            transition-colors duration-200
          `}
        >
          <span className="text-xl w-7 text-center flex-shrink-0">🚪</span>
          <span
            className={`ml-3 ${
              isCollapsed ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300 whitespace-nowrap`}
          >
            Logout
          </span>
        </Link>
      </div>
    </aside>
  );
}
