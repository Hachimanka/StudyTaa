import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { darkMode, studyStats = {}, profileName, getThemeColors } = useSettings();

  const [fullName, setFullName] = useState("");
  const [libraryStats, setLibraryStats] = useState({ totalFiles: 0, recentFiles: [], totalSize: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const fetchUserInfo = async () => {
    try {
      if (!user?._id) {
        setFullName(profileName || "");
        return;
      }
      const res = await fetch(`${API_BASE}/api/userinfo/${user._id}`);
      if (!res.ok) return setFullName(profileName || "");
      const info = await res.json();
      setFullName(info.fullName || profileName || "");
    } catch (err) {
      console.warn("fetchUserInfo failed", err);
      setFullName(profileName || "");
    }
  };

  const fetchLibraryStats = async () => {
    try {
      const [filesRes] = await Promise.all([
        fetch(`${API_BASE}/api/library/files`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      ]);

      if (filesRes.ok) {
        const files = await filesRes.json();
        const totalSize = Array.isArray(files) ? files.reduce((s, f) => s + (f.fileSize || 0), 0) : 0;
        const recentFiles = (files || []).slice(-5).reverse().map(f => ({ name: f.originalName || f.fileName, uploadDate: f.createdAt, size: f.fileSize }));
        setLibraryStats({ totalFiles: Array.isArray(files) ? files.length : 0, recentFiles, totalSize });
      }
    } catch (err) {
      console.warn("fetchLibraryStats failed", err);
    }
  };

  const generateRecentActivities = () => {
    const activities = [];
    const now = new Date();
    (libraryStats.recentFiles || []).slice(0, 3).forEach((f) => {
      const when = f.uploadDate ? new Date(f.uploadDate) : now;
      const hours = Math.max(0, Math.floor((now - when) / (1000 * 60 * 60)));
      activities.push({ icon: "", text: `Uploaded \"${f.name}\"`, time: hours < 1 ? "Just now" : `${hours} hours ago` });
    });
    setRecentActivities(activities);
  };

  const generateWeeklyProgress = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    setWeeklyProgress(days.map((d) => ({ day: d, minutes: Math.floor(Math.random() * 90) + 10 })));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUserInfo(), fetchLibraryStats()]);
      generateRecentActivities();
      generateWeeklyProgress();
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const themeColors = getThemeColors ? getThemeColors() : { primary: "#3b82f6" };

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <Sidebar />
      <main className="p-8 flex-1 ml-20 md:ml-30 mr-6 transition-all duration-300">
        <ChatWidget />

        <header className="mb-6">
          <h1 className="text-4xl font-bold">{fullName ? `Welcome back, ${fullName}` : "Welcome back!"}</h1>
          <p className="text-sm text-gray-500">Here's your learning progress overview.</p>
        </header>

        {/* Main Grid: Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <div
            className={`p-6 rounded-2xl shadow animate-fade-up ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Recent Activity</h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(n => (
                  <div key={n} className="flex animate-pulse items-start space-x-4">
                    <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className={`h-3 rounded bg-gray-200 w-3/4`}></div>
                      <div className={`h-2 rounded bg-gray-200 w-1/3`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className={`w-10 h-10 rounded-lg mr-3 flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ color: themeColors.primary }}>
                      {/* Render a small SVG based on activity type */}
                      {item.type === 'upload' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 5 17 10" />
                          <line x1="12" y1="5" x2="12" y2="19" />
                        </svg>
                      )}
                      {item.type === 'study' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      )}
                      {item.type === 'summary' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 21h10a2 2 0 0 0 2-2V7l-6-4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                          <line x1="9" y1="9" x2="15" y2="9" />
                          <line x1="9" y1="13" x2="15" y2="13" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
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
            ) : (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <p className="text-lg">No recent activity</p>
                <p className="text-sm mt-1">Start by uploading files or creating summaries!</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            className={`p-6 rounded-2xl shadow animate-fade-up ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Link to="/summarize">
                <button
                  className="flex items-center w-full rounded-xl p-4 transition-colors hover-bounce"
                  style={{
                    backgroundColor: darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`,
                    border: `1px solid ${themeColors.primary}33`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}30`
                      : `${themeColors.primary}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`;
                  }}
                >
                  <div className="quick-icon mr-1" style={{ color: themeColors.primary }}>
                    {/* Document / summary icon (simple, aesthetic) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M14 2v6h6"></path>
                      <path d="M8 12h8M8 16h8" strokeOpacity="0.9"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Create Summary</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Summarize a new content
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/flashcards">
                <button
                  className="flex items-center w-full rounded-xl p-4 transition-colors hover-bounce"
                  style={{
                    backgroundColor: darkMode ? `${themeColors.primary}20` : `${themeColors.primary}15`,
                    border: `1px solid ${themeColors.primary}33`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? `${themeColors.primary}30` : `${themeColors.primary}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? `${themeColors.primary}20` : `${themeColors.primary}15`;
                  }}
                >
                  <div className="quick-icon mr-1" style={{ color: themeColors.primary }}>
                    {/* Stack of cards icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="14" height="12" rx="2"></rect>
                      <path d="M7 7V5a2 2 0 0 1 2-2h8"></path>
                      <rect x="7" y="3" width="14" height="12" rx="2" opacity="0.06"></rect>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Make Flashcards</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Generate study cards
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/library">
                <button
                  className="flex items-center w-full rounded-xl p-4 transition-colors hover-bounce"
                  style={{
                    backgroundColor: darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`,
                    border: `1px solid ${themeColors.primary}33`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}30`
                      : `${themeColors.primary}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`;
                  }}
                >
                  <div className="quick-icon mr-1" style={{ color: themeColors.primary }}>
                    {/* Folder icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Browse Library</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Access your files
                    </p>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Progress & Recent Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Weekly Progress */}
          <div
            className={`p-6 rounded-2xl shadow animate-fade-up animate-fade-up-slow ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">This Week's Progress</h3>
            <div className="space-y-3">
              {loading ? (
                ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <span className="w-12 h-4 rounded bg-gray-200"></span>
                    <div className="flex-1 mx-4">
                      <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div className="h-2 rounded-full bg-gray-200 w-3/4"></div>
                      </div>
                    </div>
                    <span className={`w-16 h-4 rounded bg-gray-200`} />
                  </div>
                ))
              ) : (
                (() => {
                  const maxMinutes = weeklyProgress.reduce((m, d) => Math.max(m, d.minutes || 0), 0) || 1;
                  return weeklyProgress.map((day, i) => {
                    const pct = (day.minutes / maxMinutes) * 100;
                    const widthPct = Math.max(pct, day.minutes > 0 ? 4 : 0); // ensure tiny visible bar if >0
                    return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium w-12">{day.day}</span>
                    <div className="flex-1 mx-4">
                        <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 rounded-full"
                          style={{
                            background: themeColors.gradientCss || `linear-gradient(to right, ${themeColors.primaryHex || themeColors.primary}, ${(themeColors.primaryHex || themeColors.primary)}dd)`,
                            width: `${Math.min(widthPct, 100)}%`,
                            transition: 'width 0.4s ease'
                          }}
                            aria-label={`${day.minutes} minutes studied on ${day.day}`}
                            role="progressbar"
                            aria-valuenow={day.minutes}
                            aria-valuemin={0}
                            aria-valuemax={maxMinutes}
                        ></div>
                      </div>
                    </div>
                    <span className={`text-sm w-16 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {day.minutes}min
                    </span>
                  </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div
            className={`p-6 rounded-2xl shadow animate-fade-up animate-fade-up-slow ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Recent Files</h3>
              <Link 
                to="/library" 
                className={`text-sm hover:underline ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(n => (
                  <div key={n} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-lg mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 rounded bg-gray-200 w-3/4"></div>
                        <div className="h-2 rounded bg-gray-200 w-1/3 mt-2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-14 text-right text-sm text-gray-500">{w.minutes}m</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Files</h3>
          <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
            {libraryStats.recentFiles.length ? (
              <ul className="space-y-2">
                {libraryStats.recentFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium truncate">{f.name}</div>
                      <div className="text-sm text-gray-400">{f.uploadDate ? new Date(f.uploadDate).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="text-sm text-gray-500">{f.size ? `${Math.round(f.size / 1024)} KB` : ''}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">No files yet  upload to get started.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
