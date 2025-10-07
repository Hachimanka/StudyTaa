import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Sidebar from "../components/Sidebar";
import { Link } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth();
  const { darkMode, studyStats, profileName, getThemeColors } = useSettings();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    async function fetchUserInfo() {
      if (user?._id) {
        try {
          const res = await fetch(`http://localhost:5000/api/userinfo/${user._id}`);
          const info = await res.json();
          setFullName(info.fullName || profileName);
        } catch {
          setFullName(profileName);
        }
      } else {
        setFullName(profileName);
      }
    }
    fetchUserInfo();
  }, [user, profileName]);

  const themeColors = getThemeColors();

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Dashboard */}
      <main className="p-12 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300">
        {/* Header */}
        <h1 className="text-5xl font-bold">
          {fullName ? `Welcome back, ${fullName}!` : "Welcome back!"}
        </h1>
        <p
          className={`mt-1 text-xl ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {fullName ? `Here's your learning progress overview, ${fullName}` : "Here's your learning progress overview"}
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {[
            { label: "Study Streak", value: `${studyStats.streak} Days` },
            { label: "Daily Sessions", value: studyStats.dailySessions.toString() },
            { label: "Total Time", value: `${Math.floor(studyStats.totalTime / 60)}h ${studyStats.totalTime % 60}m` },
            { label: "Avg Session", value: studyStats.dailySessions > 0 ? `${Math.round(studyStats.totalTime / studyStats.dailySessions)}min` : "0min" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 flex items-center justify-between rounded-2xl shadow ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div>
                <p
                  className={`text-lg ${
                    darkMode ? "text-gray-400" : "text-gray-500"
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
              darkMode ? "bg-gray-800" : "bg-white"
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
                        darkMode ? "text-gray-400" : "text-gray-500"
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
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Link to="/summarize">
                <button
                  className={`flex items-center w-full rounded-xl p-4 transition-colors ${
                    darkMode
                      ? `bg-${themeColors.primary}-900/40 hover:bg-${themeColors.primary}-900/60`
                      : `bg-${themeColors.primary}-100 hover:bg-${themeColors.primary}-200`
                  }`}
                >
                  <div className={`w-8 h-8 bg-${themeColors.primary}-700 rounded-lg mr-3`} />
                  <div>
                    <p className="font-semibold">Create Summary</p>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Summarize a new content
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/flashcards">
                <button
                  className={`flex items-center w-full rounded-xl p-4 border transition-colors ${
                    darkMode
                      ? "bg-blue-900/30 hover:bg-blue-900/50 border-blue-700"
                      : "bg-blue-100 hover:bg-blue-200 border-blue-400"
                  }`}
                >
                  <div className={`w-8 h-8 bg-${themeColors.primary}-700 rounded-lg mr-3`} />
                  <div>
                    <p className="font-semibold">Make Flashcards</p>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Generate study cards
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/library">
                <button
                  className={`flex items-center w-full rounded-xl p-4 transition-colors ${
                    darkMode
                      ? `bg-${themeColors.primary}-900/40 hover:bg-${themeColors.primary}-900/60`
                      : `bg-${themeColors.primary}-100 hover:bg-${themeColors.primary}-200`
                  }`}
                >
                  <div className={`w-8 h-8 bg-${themeColors.primary}-700 rounded-lg mr-3`} />
                  <div>
                    <p className="font-semibold">Browse Library</p>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Access your files
                    </p>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
