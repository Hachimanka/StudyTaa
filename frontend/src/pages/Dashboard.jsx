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

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <p className="text-sm text-gray-400">Study Streak</p>
            <p className="text-2xl font-bold">{studyStats?.streak ?? 0} Days</p>
          </div>
          <div className={`p-4 rounded-lg shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <p className="text-sm text-gray-400">Library Files</p>
            <p className="text-2xl font-bold">{libraryStats.totalFiles ?? 0}</p>
          </div>
        </div>

        {/* Weekly Progress & Recent Files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Weekly Progress */}
          <div
            className={`p-6 rounded-2xl shadow ${
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

          <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
            <h3 className="text-lg font-semibold mb-3">This Week</h3>
            <div className="space-y-2">
              {weeklyProgress.map((w) => (
                <div key={w.day} className="flex items-center justify-between">
                  <div className="w-16 font-medium">{w.day}</div>
                  <div className="flex-1 mx-3">
                    <div className="h-2 rounded bg-gray-200" style={{ background: darkMode ? "#2d3748" : "#e5e7eb" }}>
                      <div style={{ width: `${Math.min((w.minutes / 120) * 100, 100)}%`, height: 8, background: themeColors.primary }} />
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
