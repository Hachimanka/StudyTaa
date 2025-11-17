import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";
import { Link } from 'react-router-dom'

export default function Home() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleThemeChange = () => {
      try {
        setIsDark(localStorage.getItem("theme") === "dark");
      } catch {
        setIsDark(false);
      }
    };

    window.addEventListener("themeChanged", handleThemeChange);
    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  return (
    <div
      className={`flex min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar />

  <ChatWidget />

      {/* Main Dashboard */}
      <main className="p-12 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300">
        {/* Header */}
          <h1 className="text-5xl font-bold page-title">Welcome back, Student!</h1>
          <p className={`mt-1 text-xl page-subtitle ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Here's your learning progress overview
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {[
            { label: "Study Streak", value: "7 Days" },
            { label: "Flashcards Reviewed", value: "142" },
            { label: "Documents Summarized", value: "23" },
            { label: "Quiz Score", value: "87%" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 flex items-center justify-between rounded-2xl shadow ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div>
                <p
                  className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {stat.label}
                </p>
                <h2 className="text-4xl font-bold">{stat.value}</h2>
              </div>
              <div className="w-12 h-12 bg-teal-700 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Main Grid: Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <div
            className={`p-6 rounded-2xl shadow ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Recent Activity</h3>
            <ul className="space-y-4">
              {[
                { text: 'Summarized "Biology Chapter 5"', time: "2 hours ago" },
                { text: "Created 15 new flashcards", time: "5 hours ago" },
                { text: "Completed Math Quiz", time: "1 week ago" },
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-10 h-10 bg-teal-700 rounded-lg mr-3" />
                  <div>
                    <p className="font-medium">{item.text}</p>
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div
            className={`p-6 rounded-2xl shadow ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button
                className={`flex items-center w-full rounded-xl p-4 transition-colors ${
                  isDark
                    ? "bg-teal-900/40 hover:bg-teal-900/60"
                    : "bg-teal-100 hover:bg-teal-200"
                }`}
              >
                <div className="w-8 h-8 bg-teal-700 rounded-lg mr-2" />
                <div>
                  <p className="font-semibold">Create Summary</p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Summarize a new content
                  </p>
                </div>
              </button>

              <button
                className={`flex items-center w-full rounded-xl p-4 border transition-colors ${
                  isDark
                    ? "bg-blue-900/30 hover:bg-blue-900/50 border-blue-700"
                    : "bg-blue-100 hover:bg-blue-200 border-blue-400"
                }`}
              >
                <div className="w-8 h-8 bg-teal-700 rounded-lg mr-2" />
                <div>
                  <p className="font-semibold">Make Flashcards</p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Generate study cards
                  </p>
                </div>
              </button>

              <button
                className={`flex items-center w-full rounded-xl p-4 transition-colors ${
                  isDark
                    ? "bg-teal-900/40 hover:bg-teal-900/60"
                    : "bg-teal-100 hover:bg-teal-200"
                }`}
              >
                <div className="w-8 h-8 bg-teal-700 rounded-lg mr-2" />
                <div>
                  <p className="font-semibold">Browse Library</p>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Access your files
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
