import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Sidebar from "../components/Sidebar";
import ChatWidget from "../components/ChatWidget";
import { Link } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth();
  const { darkMode, studyStats, profileName, getThemeColors, sessionHistory, updateStudyStats, playSound } = useSettings();
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
  const [derivedStreak, setDerivedStreak] = useState(studyStats?.streak || 0);
  const [derivedTotalMinutes, setDerivedTotalMinutes] = useState(studyStats?.totalTime || 0);
  const [toast, setToast] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

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
    // Determine Monday of current week
    const now = new Date()
    const dayIdx = now.getDay() // 0 (Sun) .. 6 (Sat)
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayIdx + 6) % 7))

    const progress = days.map((day, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const end = start + 24 * 60 * 60 * 1000

      const minutes = (sessionHistory || []).reduce((sum, s) => {
        const ts = Number(s?.ts) || 0
        if (ts >= start && ts < end) return sum + (Number(s?.minutes) || 0)
        return sum
      }, 0)

      const sessions = (sessionHistory || []).filter(s => {
        const ts = Number(s?.ts) || 0
        return ts >= start && ts < end
      }).length

      return {
        day,
        sessions,
        minutes
      }
    })

    setWeeklyProgress(progress)
  };

  // --- Badges / Achievements ---
  const BADGES = [
    { id: 'perfect-quiz', title: 'Quiz Master', desc: 'Score 100% on a quiz session', type: 'perfectMode', mode: 'quiz' },
    { id: 'perfect-truefalse', title: 'True/False Ace', desc: 'Score 100% on a True/False session', type: 'perfectMode', mode: 'trueFalse' },
    { id: 'perfect-matching', title: 'Matching Pro', desc: 'Match all pairs correctly', type: 'perfectMode', mode: 'matching' },
    { id: 'perfect-fillblanks', title: 'Blank Buster', desc: 'Score 100% on Fill-in-the-Blanks', type: 'perfectMode', mode: 'fillBlanks' },
    { id: 'multi-perfect', title: 'Polyglot of Practice', desc: 'Get perfect sessions across 3 different study modes', type: 'aggregatePerfect', neededModes: 3 },
    { id: 'first-session', title: 'First Session', desc: 'Complete your first study session', type: 'one-off' },
    { id: '5-sessions', title: '5 Sessions', desc: 'Complete 5 study sessions', type: 'sessions', count: 5 },
    { id: '10-sessions', title: '10 Sessions', desc: 'Complete 10 study sessions', type: 'sessions', count: 10 },
    { id: 'first-summary', title: 'First Summary', desc: 'Create your first summary', type: 'one-off' },
    { id: '10-summaries', title: '10 Summaries', desc: 'Create 10 summaries', type: 'summaries', count: 10 },
    { id: 'first-upload', title: 'First Upload', desc: 'Upload your first file', type: 'one-off' },
    { id: '10-uploads', title: '10 Uploads', desc: 'Upload 10 files to your library', type: 'uploads', count: 10 },
    { id: '3-day-streak', title: '3-Day Streak', desc: 'Study 3 days in a row', type: 'streak', days: 3 },
    { id: '7-day-streak', title: '7-Day Streak', desc: 'Study 7 days in a row', type: 'streak', days: 7 },
    { id: '5-hours', title: '5 Hours', desc: 'Accumulate 5 hours of study', type: 'totalMinutes', minutes: 300 },
    { id: '10-hours', title: '10 Hours', desc: 'Accumulate 10 hours of study', type: 'totalMinutes', minutes: 600 },
    { id: 'single-30-min', title: 'Focused 30', desc: 'Study 30 minutes in a single session', type: 'singleSessionMinutes', minutes: 30 },
    { id: '100-files', title: 'Library Power', desc: 'Have 100 files in your library', type: 'files', count: 100 }
  ];

  // Difficult / long-term badges (placed last)
  BADGES.push(
    { id: '30-day-streak', title: '30-Day Streak', desc: 'Study 30 days in a row', type: 'streak', days: 30 },
    { id: '100-sessions', title: 'Century Club', desc: 'Complete 100 study sessions', type: 'sessions', count: 100 },
    { id: '50-hours', title: '50 Hours', desc: 'Accumulate 50 hours of study', type: 'totalMinutes', minutes: 3000 },
    { id: 'single-120-min', title: 'Marathon Session', desc: 'Study 120 minutes in a single session', type: 'singleSessionMinutes', minutes: 120 },
    { id: 'master-collector', title: 'Master Collector', desc: 'Have 500 files in your library', type: 'files', count: 500 },
    { id: 'perfect-all-modes', title: 'Omni-Perfect', desc: 'Get perfect sessions across all study modes', type: 'aggregatePerfectAll' }
  );

  const evaluateBadges = () => {
    const unlockedSet = new Set((studyStats?.badges || []).map(b => b.id));
    const newly = [];

    // quick accessors
    const hist = Array.isArray(sessionHistory) ? sessionHistory : [];
    const totalMinutes = hist.reduce((s, e) => s + (Number(e?.minutes) || 0), 0);
    const summaries = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    const totalFiles = libraryStats?.totalFiles || 0;
    const sessionsCount = hist.length;

    // study mode session history persisted by Flashcards on completion
    const modeSessions = JSON.parse(localStorage.getItem('studyModeSessions') || '[]');

    // single session max
    const maxSingle = hist.reduce((m, e) => Math.max(m, Number(e?.minutes) || 0), 0);

    // one-off: first session / summary / upload
    if (!unlockedSet.has('first-session') && sessionsCount > 0) newly.push('first-session');
    if (!unlockedSet.has('first-summary') && summaries.length > 0) newly.push('first-summary');
    if (!unlockedSet.has('first-upload') && totalFiles > 0) newly.push('first-upload');

    // sessions count badges
    if (!unlockedSet.has('5-sessions') && sessionsCount >= 5) newly.push('5-sessions');
    if (!unlockedSet.has('10-sessions') && sessionsCount >= 10) newly.push('10-sessions');

    // long-term / difficult session count
    if (!unlockedSet.has('100-sessions') && sessionsCount >= 100) newly.push('100-sessions');

    // summaries count
    if (!unlockedSet.has('10-summaries') && summaries.length >= 10) newly.push('10-summaries');

    // uploads / library size
    if (!unlockedSet.has('10-uploads') && totalFiles >= 10) newly.push('10-uploads');
    if (!unlockedSet.has('100-files') && totalFiles >= 100) newly.push('100-files');

    // total minutes badges
    if (!unlockedSet.has('5-hours') && totalMinutes >= 300) newly.push('5-hours');
    if (!unlockedSet.has('10-hours') && totalMinutes >= 600) newly.push('10-hours');

    // long-term total minutes
    if (!unlockedSet.has('50-hours') && totalMinutes >= 3000) newly.push('50-hours');

    // single session milestone
    if (!unlockedSet.has('single-30-min') && maxSingle >= 30) newly.push('single-30-min');

    // long single-session milestone
    if (!unlockedSet.has('single-120-min') && maxSingle >= 120) newly.push('single-120-min');

    // perfect-mode badges: check modeSessions for 100% accuracy entries
    try {
      const modesWithPerfect = new Set();
      if (Array.isArray(modeSessions) && modeSessions.length > 0) {
        modeSessions.forEach(s => {
          if (!s || typeof s !== 'object') return;
          const mode = s.mode;
          const acc = Number(s.accuracy) || 0;
          if (acc === 100 && mode) modesWithPerfect.add(mode);
        });
      }
      // map to badge ids
      const modeBadgeMap = {
        quiz: 'perfect-quiz',
        trueFalse: 'perfect-truefalse',
        matching: 'perfect-matching',
        fillBlanks: 'perfect-fillblanks'
      };
      modesWithPerfect.forEach(m => {
        const bid = modeBadgeMap[m];
        if (bid && !unlockedSet.has(bid)) newly.push(bid);
      });

      // aggregate badge: if user has perfect in N distinct modes
      const needed = 3;
      if (!unlockedSet.has('multi-perfect') && modesWithPerfect.size >= needed) newly.push('multi-perfect');

      // very difficult: perfect across all known modes
      // treat "all modes" as at least 4 distinct modes (current set)
      if (!unlockedSet.has('perfect-all-modes') && modesWithPerfect.size >= 4) newly.push('perfect-all-modes');
    } catch (e) {
      // ignore mode session parsing errors
    }

    // streak calculation (local days)
    const dayKeys = new Set(hist.map(s => {
      const d = new Date(Number(s.ts));
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    let streak = 0;
    const today = new Date();
    let cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (dayKeys.has(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`)) {
      streak++; cur.setDate(cur.getDate() - 1);
    }
    if (!unlockedSet.has('3-day-streak') && streak >= 3) newly.push('3-day-streak');
    if (!unlockedSet.has('7-day-streak') && streak >= 7) newly.push('7-day-streak');
    if (!unlockedSet.has('30-day-streak') && streak >= 30) newly.push('30-day-streak');

    return newly;
  }

  // Run badge evaluation when relevant data changes
  useEffect(() => {
    try {
      const newly = evaluateBadges();
      if (newly.length === 0) return;

      const now = Date.now();
      const newEntries = newly.map(id => ({ id, unlockedAt: now }));

      // merge into studyStats.badges and persist via updateStudyStats
      const existing = Array.isArray(studyStats?.badges) ? studyStats.badges : [];
      const merged = [...existing, ...newEntries];
      updateStudyStats({ badges: merged });

      // small feedback: play success sound if available
      try { playSound && playSound('success') } catch (e) {}

      // show a toast for the first newly unlocked badge
      try {
        const firstId = newly[0];
        const badgeMeta = BADGES.find(b => b.id === firstId) || { title: firstId };
        setToast({ id: firstId, title: badgeMeta.title, time: now });
        setTimeout(() => setToast(null), 4000);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.warn('Badge evaluation failed', err)
    }
  }, [sessionHistory, libraryStats?.totalFiles, loading]);

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

  // Compute derived metrics from sessionHistory: total time and current streak
  useEffect(() => {
    const hist = Array.isArray(sessionHistory) ? sessionHistory : [];

    // Total minutes
    const total = hist.reduce((s, e) => s + (Number(e?.minutes) || 0), 0);
    setDerivedTotalMinutes(total);

    // Build a set of date keys (local calendar days) for sessions
    const daySet = new Set();
    hist.forEach(s => {
      const ts = Number(s?.ts) || 0;
      if (!ts) return;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      daySet.add(key);
    });

    // Count consecutive days up to today
    let streak = 0;
    const today = new Date();
    let cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (true) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`;
      if (daySet.has(key)) {
        streak += 1;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
    setDerivedStreak(streak);
  }, [sessionHistory]);

  // Recompute weekly progress when session history updates
  useEffect(() => {
    if (!loading) {
      generateWeeklyProgress();
    }
  }, [sessionHistory]);

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
      <main className="p-12 flex-1 ml-20 md:ml-30 mr-7.5 transition-all duration-300 min-w-0 overflow-x-visible pr-6">
        <ChatWidget />
        {/* Local styles to hide scrollbars while keeping scrolling functional */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold">
            <span className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${themeColors.gradient}`} style={{ WebkitBackgroundClip: 'text', backgroundImage: themeColors.gradientCss || undefined }}>
              {fullName ? `Welcome back, ${fullName}!` : "Welcome back!"}
            </span>
          </h1>
          <p
            className={`mt-1 text-xl ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {fullName ? `Here's your learning progress overview, ${fullName}` : "Here's your learning progress overview"}
          </p>
          
          {/* Removed loading indicator per request */}
        </div>

        {/* Achievements */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Achievements</h3>
          <div className="flex items-center gap-3 flex-nowrap overflow-x-auto hide-scrollbar py-2 pr-6">
            {BADGES.map(b => {
              const unlocked = (studyStats?.badges || []).some(x => x.id === b.id);
              const clickableProps = unlocked ? {
                role: 'button',
                tabIndex: 0,
                onClick: () => setSelectedBadge(b),
                onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedBadge(b); }
              } : { 'aria-disabled': true };
              return (
                <div
                  key={b.id}
                  {...clickableProps}
                  className={`${unlocked ? 'cursor-pointer' : 'cursor-default opacity-70'} focus:outline-none ${unlocked ? 'focus:ring-2 focus:ring-offset-1' : ''} flex-shrink-0 flex items-center gap-2 p-2 rounded-lg ${unlocked ? 'border-transparent text-white' : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}`}
                  style={unlocked ? { background: themeColors.gradientCss || `linear-gradient(to right, ${themeColors.primaryHex || themeColors.primary}, ${(themeColors.primaryHex || themeColors.primary)}dd)` } : undefined}
                  title={b.desc}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${unlocked ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {/* simple star icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={unlocked ? '#fff' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.86l6.92-1L12 2l3.08 6.86L22 9.86l-5.02 4.2 1.18 6.88z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{b.title}</div>
                    <div className={`text-xs ${unlocked ? 'text-white/90' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>{unlocked ? 'Unlocked' : 'Locked'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          {[
            {
              label: "Study Streak",
              value: `${derivedStreak} Days`,
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
              value: `${Math.floor(derivedTotalMinutes / 60)}h ${derivedTotalMinutes % 60}m`,
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
              <div key={i} className={`p-6 flex items-center justify-between rounded-2xl shadow transition-transform hover:scale-105 ${darkMode ? "bg-gray-800" : "bg-white"} animate-fade-up duration-700`}>
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
                } animate-fade-up duration-700`}
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
            } animate-fade-up duration-1000`}
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
            } animate-fade-up duration-1000`}
          >
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Link to="/summarize">
                <button
                  className="flex items-start justify-start gap-4 w-full rounded-xl p-4 transition-colors hover-bounce"
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
                  <div className="quick-icon w-10 h-10 flex-none flex items-start justify-start rounded-md" style={{ color: themeColors.primary }}>
                    {/* Document / summary icon (simple, aesthetic) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M14 2v6h6"></path>
                      <path d="M8 12h8M8 16h8" strokeOpacity="0.9"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold m-0 leading-tight">Create Summary</p>
                    <p className={`text-sm m-0 leading-tight ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Summarize a new content
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/flashcards">
                <button
                  className="flex items-start justify-start gap-4 w-full rounded-xl p-4 transition-colors hover-bounce"
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
                  <div className="quick-icon w-10 h-10 flex-none flex items-center justify-center rounded-md" style={{ color: themeColors.primary }}>
                    {/* Stack of cards icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="14" height="12" rx="2"></rect>
                      <path d="M7 7V5a2 2 0 0 1 2-2h8"></path>
                      <rect x="7" y="3" width="14" height="12" rx="2" opacity="0.06"></rect>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold m-0 leading-tight">Make Flashcards</p>
                    <p className={`text-sm m-0 leading-tight ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Generate study cards
                    </p>
                  </div>
                </button>
              </Link>

              <Link to="/library">
                <button
                  className="flex items-start justify-start gap-4 w-full rounded-xl p-4 transition-colors hover-bounce"
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
                  <div className="quick-icon w-10 h-10 flex-none flex items-center justify-center rounded-md" style={{ color: themeColors.primary }}>
                    {/* Folder icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold m-0 leading-tight">Browse Library</p>
                    <p className={`text-sm m-0 leading-tight ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
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
            } animate-fade-up duration-1500`}
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
            } animate-fade-up duration-1500`}
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
      {/* Toast: shows when a badge is unlocked */}
      {toast && (
        <div className="fixed top-6 right-6 z-50" aria-live="polite" role="status">
          <div className="max-w-xs rounded-lg shadow-lg overflow-hidden border p-3 flex items-center gap-3" style={{ background: darkMode ? '#0f172a' : '#ffffff' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.86l6.92-1L12 2l3.08 6.86L22 9.86l-5.02 4.2 1.18 6.88z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Congratulations! 🎉👏</div>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{toast.title} 🎊</div>
            </div>
          </div>
        </div>
      )}

      {/* Badge details modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedBadge(null)} />
          <div className={`relative w-full max-w-md p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} role="dialog" aria-modal="true">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-400 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.86l6.92-1L12 2l3.08 6.86L22 9.86l-5.02 4.2 1.18 6.88z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>🎉 Congratulations!</div>
                    <h4 className="text-lg font-semibold">{selectedBadge.title}</h4>
                  </div>
                  <button onClick={() => setSelectedBadge(null)} className="ml-3 text-sm text-gray-500 hover:text-gray-700">Close</button>
                </div>
                <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedBadge.desc}</p>
                <div className="mt-4 text-xs text-gray-400">
                  {(() => {
                    const entry = (studyStats?.badges || []).find(b => b.id === selectedBadge.id);
                    if (entry) return `Unlocked: ${new Date(entry.unlockedAt).toLocaleString()}`;
                    return 'Locked';
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}