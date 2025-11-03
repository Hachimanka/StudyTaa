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
      const [filesRes, foldersRes] = await Promise.all([
        fetch('http://localhost:5000/api/library/files', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/library/folders', {
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
      // Prefer the client-side authenticated user's name when available
      if (user) {
        if (user.name) {
          setFullName(user.name)
          return
        }

        if (user._id) {
          try {
          const API_BASE = import.meta.env.VITE_API_BASE || ''
            const res = await fetch(`${API_BASE}/api/userinfo/${user._id}`);
            const info = await res.json();
            setFullName(info.fullName || profileName);
          } catch {
            setFullName(profileName);
          }
          return
        }
      }

      setFullName(profileName);
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
      <main className="p-12 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300">
        <ChatWidget />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold page-title">
            {fullName ? `Welcome back, ${fullName}!` : "Welcome back!"}
          </h1>
          <p
            className={`mt-1 text-xl page-subtitle ${
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
              icon: "🔥",
              color: "bg-orange-500"
            },
            { 
              label: "Library Files", 
              value: libraryStats.totalFiles.toString(),
              icon: "📁",
              color: "bg-blue-500"
            },
            { 
              label: "Total Time", 
              value: `${Math.floor(studyStats.totalTime / 60)}h ${studyStats.totalTime % 60}m`,
              icon: "⏰",
              color: "bg-green-500"
            },
            { 
              label: "Storage Used", 
              value: libraryStats.totalSize > 0 
                ? `${(libraryStats.totalSize / (1024 * 1024)).toFixed(1)}MB`
                : "0MB",
              icon: "💾",
              color: "bg-purple-500"
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 flex items-center justify-between rounded-2xl shadow transition-transform hover:scale-105 ${
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
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
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
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className={`w-10 h-10 rounded-lg mr-3 flex items-center justify-center text-white ${
                      item.type === 'upload' ? 'bg-blue-500' :
                      item.type === 'study' ? 'bg-green-500' :
                      item.type === 'summary' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}>
                      {item.icon}
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
            }`}
          >
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Link to="/summarize">
                <button
                  className="flex items-center w-full rounded-xl p-4 transition-colors"
                  style={{
                    backgroundColor: darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}30`
                      : `${themeColors.primary}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`;
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg mr-3"
                    style={{ backgroundColor: themeColors.primary }}
                  />
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
                  className="flex items-center w-full rounded-xl p-4 transition-colors"
                  style={{
                    backgroundColor: darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}30`
                      : `${themeColors.primary}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = darkMode 
                      ? `${themeColors.primary}20`
                      : `${themeColors.primary}15`;
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg mr-3"
                    style={{ backgroundColor: themeColors.primary }}
                  />
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
              {weeklyProgress.map((day, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium w-12">{day.day}</span>
                  <div className="flex-1 mx-4">
                      <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-2 rounded-full"
                        style={{
                          background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}dd)`,
                          width: `${Math.min(day.sessions * 20, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-sm w-16 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {day.minutes}min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files */}
          <div
            className={`p-6 rounded-2xl shadow ${
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
            {libraryStats.recentFiles.length > 0 ? (
              <ul className="space-y-3">
                {libraryStats.recentFiles.slice(0, 4).map((file, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-lg mr-3 flex items-center justify-center text-white text-sm ${
                        file.type?.includes('pdf') ? 'bg-red-500' :
                        file.type?.includes('image') ? 'bg-green-500' :
                        file.type?.includes('text') ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {file.type?.includes('pdf') ? '📄' :
                         file.type?.includes('image') ? '🖼️' :
                         file.type?.includes('text') ? '📝' : '📁'}
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
