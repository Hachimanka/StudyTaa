import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";
import { Link } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth();
  const { darkMode, studyStats, profileName, getThemeColors } = useSettings();
  const [fullName, setFullName] = useState("");
  const [libraryStats, setLibraryStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    recentFiles: [],
    totalSize: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch library statistics
  const fetchLibraryStats = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`${API_BASE}/api/library/files`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE}/api/library/folders`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (filesRes.ok && foldersRes.ok) {
        const files = await filesRes.json();
        const folders = await foldersRes.json();
        
        // Calculate total size and get recent files
        const totalSize = files.reduce((sum, file) => sum + (file.fileSize || 0), 0);
        const recentFiles = files
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(file => ({
            name: file.originalName || file.fileName,
            uploadDate: file.createdAt,
            size: file.fileSize,
            type: file.fileType
          }));

        setLibraryStats({
          totalFiles: files.length,
          totalFolders: folders.length,
          recentFiles,
          totalSize
        });
      }
    } catch (error) {
      console.log('Library stats unavailable:', error.message);
    }
  };

  // Generate recent activities based on app usage
  const generateRecentActivities = () => {
    const activities = [];
    const now = new Date();
    
    // Add library-based activities
    if (libraryStats.recentFiles.length > 0) {
      libraryStats.recentFiles.slice(0, 3).forEach((file, index) => {
        const uploadTime = new Date(file.uploadDate);
        const timeDiff = Math.floor((now - uploadTime) / (1000 * 60 * 60)); // hours ago
        
        activities.push({
          icon: '📁',
          text: `Uploaded "${file.name}"`,
          time: timeDiff < 1 ? 'Just now' : `${timeDiff} hours ago`,
          type: 'upload'
        });
      });
    }

    // Add study session activities (from localStorage or settings)
    const lastStudySession = localStorage.getItem('lastStudySession');
    if (lastStudySession) {
      const sessionTime = new Date(lastStudySession);
      const hoursAgo = Math.floor((now - sessionTime) / (1000 * 60 * 60));
      activities.push({
        icon: '🎯',
        text: 'Completed study session',
        time: hoursAgo < 1 ? 'Just now' : `${hoursAgo} hours ago`,
        type: 'study'
      });
    }

    // Add summary activities
    const summaryHistory = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    if (summaryHistory.length > 0) {
      const lastSummary = summaryHistory[summaryHistory.length - 1];
      activities.push({
        icon: '📋',
        text: `Created summary: "${lastSummary.title || 'Content Summary'}"`,
        time: '2 hours ago',
        type: 'summary'
      });
    }

    // Sort by most recent and limit to 5
    setRecentActivities(activities.slice(0, 5));
  };

  // Generate weekly progress data
  const generateWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const progress = days.map((day, index) => ({
      day,
      sessions: Math.floor(Math.random() * 5) + 1, // Mock data for now
      minutes: Math.floor(Math.random() * 120) + 30
    }));
    setWeeklyProgress(progress);
  };

  useEffect(() => {
    async function fetchUserInfo() {
      if (user?._id) {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || ''
          const res = await fetch(`${API_BASE}/api/userinfo/${user._id}`);
          const info = await res.json();
          setFullName(info.fullName || profileName);
        } catch {
          setFullName(profileName);
        }
      } else {
        setFullName(profileName);
      }
    }

    const loadDashboardData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserInfo(),
        fetchLibraryStats()
      ]);
      generateRecentActivities();
      generateWeeklyProgress();
      setLoading(false);
    };

    loadDashboardData();
  }, [user, profileName]);

  // Update activities when library stats change
  useEffect(() => {
    if (!loading) {
      generateRecentActivities();
    }
  }, [libraryStats, loading]);

  const themeColors = getThemeColors();

  // Utility function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Utility function to format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const days = Math.floor(diffInHours / 24);
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    return `${weeks} weeks ago`;
  };

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Dashboard */}
      <main className="p-12 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300 animate-fade-up">
        <ChatWidget />
        
        {/* Header */}
        <div className="mb-8 animate-fade-up">
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
          
          {loading && (
            <div className="flex items-center mt-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Loading your data...</span>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {[
            {
              label: "Study Streak",
              value: `${studyStats.streak} Days`,
              color: "bg-orange-500",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5C7 13 6 11 6 9.5c0-2.5 2-4.5 4.5-4.5 1.5 0 2.5 0.7 3 1.5.5.8 1.5 1.5 1.5 3 0 2-2 4-4 5-2 1-4 1-4 1" />
                </svg>
              )
            },
            {
              label: "Library Files",
              value: libraryStats.totalFiles.toString(),
              color: "bg-blue-500",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              )
            },
            {
              label: "Total Time",
              value: `${Math.floor(studyStats.totalTime / 60)}h ${studyStats.totalTime % 60}m`,
              color: "bg-green-500",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )
            },
            {
              label: "Storage Used",
              value: libraryStats.totalSize > 0
                ? `${(libraryStats.totalSize / (1024 * 1024)).toFixed(1)}MB`
                : "0MB",
              color: "bg-purple-500",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="12" rx="2" />
                  <path d="M9 9h6" />
                </svg>
              )
            }
          ].map((stat, i) => (
            loading ? (
              <div key={i} className={`p-6 flex items-center justify-between rounded-2xl shadow transition-transform hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"} animate-fade-up`}>
                <div className="mx-auto w-full max-w-sm rounded-md p-2">
                  <div className="flex animate-pulse space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 rounded bg-gray-200 w-40"></div>
                      <div className="space-y-2">
                        <div className="h-6 rounded bg-gray-200 w-28"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={i}
                className={`p-6 flex items-center justify-between rounded-2xl shadow transition-transform hover:scale-105 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                } animate-fade-up`}
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
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  style={{ color: themeColors.primary }}
                >
                  {stat.icon}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Main Grid: Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <div
            className={`p-6 rounded-2xl shadow ${
              darkMode ? "bg-gray-800" : "bg-white"
            } animate-fade-up`}
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
            className={`p-6 rounded-2xl shadow ${
              darkMode ? "bg-gray-800" : "bg-white"
            } animate-fade-up`}
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
            className={`p-6 rounded-2xl shadow ${
              darkMode ? "bg-gray-800" : "bg-white"
            } animate-fade-up`}
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
            className={`p-6 rounded-2xl shadow ${
              darkMode ? "bg-gray-800" : "bg-white"
            } animate-fade-up`}
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
                ))}
              </div>
            ) : libraryStats.recentFiles.length > 0 ? (
              <ul className="space-y-3">
                {libraryStats.recentFiles.slice(0, 4).map((file, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-lg mr-3 flex items-center justify-center text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ color: themeColors.primary }}>
                        {/* File type icons (SVG) */}
                        {file.type?.includes('pdf') && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M10 14h4M10 17h4" />
                          </svg>
                        )}
                        {file.type?.includes('image') && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="14" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 21l-6-5-4 4-3-3-4 4" />
                          </svg>
                        )}
                        {file.type?.includes('text') && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                            <path d="M8 7h8M8 11h8" />
                          </svg>
                        )}
                        {!file.type && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <p className="text-lg">No files yet</p>
                <p className="text-sm mt-1">Upload your first file to get started!</p>
                <Link to="/library">
                  <button 
                    className="mt-3 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    Go to Library
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}