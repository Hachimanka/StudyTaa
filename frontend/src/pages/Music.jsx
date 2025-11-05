import React, { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWidget from '../components/ChatWidget'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import focusSounds from '../data/focusSounds'

// A lightweight Folder view specialized for music files (derived from Library.jsx)
function Folder({ folder, onAddFile, onAddFolder, onDeleteFile, onDeleteFolder, onViewFile, level = 0 }) {
  const [expanded, setExpanded] = useState(folder.expanded !== undefined ? folder.expanded : level === 0)
  const [showFileInput, setShowFileInput] = useState(false)
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const indentPx = level * 16

  return (
    <div className="mb-3" style={{ marginLeft: indentPx }}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900" onClick={() => setExpanded(e => !e)}>
            <div className="p-1 text-blue-600">
              {expanded ? (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/></svg>
              ) : (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v9A1.5 1.5 0 0 0 1.5 12h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 0h-13zm1 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
              )}
            </div>
            <span className="font-medium">{folder.name}</span>
          </button>

          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onClick={() => setShowFileInput(true)}>Upload</button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors" onClick={() => setShowFolderInput(true)}>New Folder</button>
            {level > 0 && (
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors" onClick={() => onDeleteFolder(folder.id)}>Delete</button>
            )}
          </div>
        </div>

        {showFileInput && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Audio</h3>
            <form onSubmit={e => { e.preventDefault(); if (selectedFile) { onAddFile(folder.id, selectedFile); setShowFileInput(false); setSelectedFile(null); } }}>
              <div className="mb-4">
                <input type="file" accept="audio/*" className="w-full p-3 border border-gray-300 rounded-lg" onChange={e => setSelectedFile(e.target.files[0])} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled={!selectedFile}>Upload</button>
                <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg" onClick={() => { setShowFileInput(false); setSelectedFile(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {showFolderInput && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Create Folder</h3>
            <form onSubmit={e => { e.preventDefault(); if (newFolderName.trim()) { onAddFolder(folder.id, newFolderName.trim()); setNewFolderName(''); setShowFolderInput(false); } }}>
              <div className="mb-4">
                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name" className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg" disabled={!newFolderName.trim()}>Create</button>
                <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg" onClick={() => { setShowFolderInput(false); setNewFolderName(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {expanded && (
          <div className="mt-4">
            {(folder.files.length > 0 || folder.folders.length > 0) ? (
              <div className="space-y-2">
                {folder.files.map((file, idx) => (
                  <div key={file.id || idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer" onClick={() => onViewFile(file)}>
                    <div className="flex items-center gap-3">
                      <div className="p-1 text-gray-600">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v13A1.5 1.5 0 0 0 6.5 16h3A1.5 1.5 0 0 0 11 14.5v-13A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 block">{file.name}</span>
                        {file.size && <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>}
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{file.name.split('.').pop()?.toUpperCase() || 'AUDIO'}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={(e) => { e.stopPropagation(); onViewFile(file); }}>Play</button>
                      <button className="px-2 py-1 text-sm bg-red-600 text-white rounded" onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this file?')) onDeleteFile(folder.id, idx); }}>Delete</button>
                    </div>
                  </div>
                ))}
                {folder.folders.map(sub => (
                  <Folder key={sub.id} folder={sub} onAddFile={onAddFile} onAddFolder={onAddFolder} onDeleteFile={onDeleteFile} onDeleteFolder={onDeleteFolder} onViewFile={onViewFile} level={level + 1} />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm">This folder is empty</p>
                <p className="text-xs mt-1">Upload audio files or create subfolders to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Music() {
  const { user } = useAuth()
  const { darkMode, sessionDuration, getThemeColors, playSound, sendNotification, incrementStudySession } = useSettings()
  const themeColors = getThemeColors()
  const API_BASE = import.meta.env.VITE_API_BASE || ''

  const [root, setRoot] = useState({ id: 'root', name: 'My Music', files: [], folders: [], expanded: true })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [volume, setVolume] = useState(0.5)

  // Timer related state (restore right-side timer)
  const [showTimer, setShowTimer] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(sessionDuration || 25)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef(null)

  // Fetch user's library and filter for audio files
  useEffect(() => {
    if (user) fetchUserMusic()
  }, [user])

  const fetchUserMusic = async () => {
    try {
      setLoading(true)
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(`${API_BASE}/api/library/files`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${API_BASE}/api/library/folders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ])

      if (filesResponse.ok && foldersResponse.ok) {
        const files = await filesResponse.json()
        const folders = await foldersResponse.json()

        const folderMap = new Map()
        const rootFolder = { id: 'root', name: 'My Music', files: [], folders: [], expanded: true }
        folderMap.set('root', rootFolder)

        folders.forEach(folder => {
          folderMap.set(folder._id, { id: folder._id, name: folder.name, files: [], folders: [], expanded: folder.expanded || false })
        })

        folders.forEach(folder => {
          const parentId = folder.parentFolderId || 'root'
          const parent = folderMap.get(parentId)
          if (parent) parent.folders.push(folderMap.get(folder._id))
        })

        // Only include audio files
        files.forEach(file => {
          const isAudio = (file.fileType && file.fileType.startsWith('audio')) || /\.(mp3|m4a|wav|ogg|flac)$/i.test(file.originalName || file.fileName || '')
          if (!isAudio) return
          const folderId = file.folderId || 'root'
          const folder = folderMap.get(folderId)
          if (folder) {
            folder.files.push({
              id: file._id,
              name: file.originalName || file.fileName,
              size: file.fileSize,
              type: file.fileType,
              uploadDate: file.createdAt || new Date().toISOString(),
              downloadUrl: file.filePath ? `${API_BASE}/api/library/download/${file._id}` : null,
              viewUrl: file.filePath ? `${API_BASE}/api/library/view/${file._id}` : null
            })
          }
        })

        setRoot(rootFolder)
      } else {
        throw new Error('Failed to fetch music library')
      }
    } catch (err) {
      console.error('Error fetching music:', err)
      setError('Unable to load your music. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const countFiles = useCallback((folder) => {
    let count = folder.files.length
    folder.folders.forEach(sub => { count += countFiles(sub) })
    return count
  }, [])

  const countFolders = useCallback((folder) => {
    let count = folder.folders.length
    folder.folders.forEach(sub => { count += countFolders(sub) })
    return count
  }, [])

  const handleAddFile = async (folderId, file) => {
    if (!file || !user) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (folderId !== 'root') formData.append('folderId', folderId)
      const res = await fetch(`${API_BASE}/api/library/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
      if (res.ok) await fetchUserMusic()
      else throw new Error('Upload failed')
    } catch (err) {
      console.error(err)
      setError('Upload failed')
    }
  }

  const handleAddFolder = async (folderId, name) => {
    if (!name || !user) return
    try {
      const res = await fetch(`${API_BASE}/api/library/folders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name, parentFolderId: folderId === 'root' ? undefined : folderId }) })
      if (res.ok) await fetchUserMusic()
      else throw new Error('Create folder failed')
    } catch (err) {
      console.error(err)
      setError('Create folder failed')
    }
  }

  const handleDeleteFile = async (folderId, fileIndex) => {
    // find file
    const findFile = (folder) => {
      if (folder.id === folderId) return folder.files[fileIndex]
      for (const sub of folder.folders) {
        const f = findFile(sub)
        if (f) return f
      }
      return null
    }
    const fileToDelete = findFile(root)
    if (!fileToDelete) return
    if (!window.confirm('Delete this file?')) return
    try {
      const res = await fetch(`${API_BASE}/api/library/files/${fileToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      if (res.ok) await fetchUserMusic()
      else throw new Error('Delete failed')
    } catch (err) {
      console.error(err)
      setError('Delete failed')
    }
  }

  const handleDeleteFolder = async (folderId) => {
    if (!user || folderId === 'root') return
    if (!window.confirm('Delete this folder and its contents?')) return
    try {
      const res = await fetch(`${API_BASE}/api/library/folders/${folderId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      if (res.ok) await fetchUserMusic()
      else throw new Error('Delete folder failed')
    } catch (err) {
      console.error(err)
      setError('Delete folder failed')
    }
  }

  const handleViewFile = (file) => {
    // trigger global player to play either by viewUrl or downloadUrl
    setSelectedFile(file)
    setIsModalOpen(true)
    // dispatch playMusic event with file
    window.dispatchEvent(new CustomEvent('playMusic', { detail: { name: file.name, url: file.viewUrl || file.downloadUrl, type: 'audio' } }))
    // increment local play count
    if (file && file.id) incrementPlayCount(file.id)
  }

  const handleDownloadFile = async (file) => {
    try {
      if (file.downloadUrl) {
        const res = await fetch(file.downloadUrl, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Download failed')
    }
  }

  const handleCloseModal = () => { setIsModalOpen(false); setSelectedFile(null) }

  // Search
  const searchInFolder = useCallback((folder, term) => {
    if (!term.trim()) return folder
    const filteredFiles = folder.files.filter(f => f.name.toLowerCase().includes(term.toLowerCase()))
    const filteredFolders = folder.folders.map(sub => searchInFolder(sub, term)).filter(sub => sub.name.toLowerCase().includes(term.toLowerCase()) || sub.files.length > 0 || sub.folders.length > 0)
    return { ...folder, files: filteredFiles, folders: filteredFolders, expanded: true }
  }, [])

  // Apply sorting to a folder and its subfolders
  const applySorting = useCallback((folder, option) => {
    if (!folder) return folder
    const sortedFiles = [...(folder.files || [])]
    sortedFiles.sort((a, b) => {
      const aDate = a.uploadDate ? Date.parse(a.uploadDate) : 0
      const bDate = b.uploadDate ? Date.parse(b.uploadDate) : 0
      const aPlays = a.playCount || 0
      const bPlays = b.playCount || 0
      switch (option) {
        case 'newest':
          return bDate - aDate
        case 'oldest':
          return aDate - bDate
        case 'most_played':
          return bPlays - aPlays
        case 'least_played':
          return aPlays - bPlays
        default:
          return 0
      }
    })
    return {
      ...folder,
      files: sortedFiles,
      folders: (folder.folders || []).map(f => applySorting(f, option))
    }
  }, [])

  const totalFiles = countFiles(root)
  const totalFolders = countFolders(root)

  // Built-in ambient tracks
  const [selectedCategory, setSelectedCategory] = useState('nature')
  const categories = ['nature', 'lofi', 'ambient', 'classical']
  const ambientTracks = focusSounds[selectedCategory] || []

  // Increment local play count for a file id (stored in root state)
  const incrementPlayCount = (fileId) => {
    setRoot(prevRoot => {
      const clone = JSON.parse(JSON.stringify(prevRoot))
      const walk = (folder) => {
        folder.files = folder.files.map(f => {
          if (f.id === fileId) {
            f.playCount = (f.playCount || 0) + 1
          }
          return f
        })
        folder.folders.forEach(sub => walk(sub))
      }
      walk(clone)
      return clone
    })
  }

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && (timerMinutes > 0 || timerSeconds > 0)) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prevSec => {
          if (prevSec > 0) return prevSec - 1
          if (timerMinutes > 0) {
            setTimerMinutes(prevMin => prevMin - 1)
            return 59
          }
          // finished
          setIsTimerRunning(false)
          const timeSpent = (sessionDuration || 25) - timerMinutes
          try { incrementStudySession(timeSpent) } catch (e) {}
          try { playSound && playSound('success') } catch (e) {}
          try { sendNotification && sendNotification('Study Session Complete!', '🎉 Great job! Time for a break.') } catch (e) {}
          return 0
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isTimerRunning, timerMinutes, timerSeconds])

  useEffect(() => {
    if (Notification && Notification.permission === 'default') Notification.requestPermission()
  }, [])

  const toggleTimer = () => setIsTimerRunning(r => !r)
  const resetTimer = () => { setIsTimerRunning(false); setTimerMinutes(sessionDuration || 25); setTimerSeconds(0) }
  const formatTime = (minutes, seconds) => `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-12 ml-20 md:ml-30">
          <ChatWidget />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your music...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
        <ChatWidget />

        {error && (<div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}<button onClick={() => setError(null)} className="ml-2">×</button></div>)}

        <div className="mb-8">
          <h1 className="text-5xl font-bold page-title">Music</h1>
          <p className="mt-2 text-gray-600">Manage your uploaded music and play built-in ambient tracks</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-blue-600"><path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z"/></svg></div>
              <div><p className="text-sm text-gray-600">Sessions</p><p className="text-2xl font-bold text-gray-900">0</p></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-green-600"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z"/></svg></div><div><p className="text-sm text-gray-600">Total Time</p><p className="text-2xl font-bold text-gray-900">0h 0m</p></div></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-purple-600"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z"/></svg></div><div><p className="text-sm text-gray-600">Streak</p><p className="text-lg font-semibold text-gray-900">0 days</p></div></div>
          </div>
        </div>

        {/* (Search moved below ambient tracks) */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: ambient + library */}
          <div className="xl:col-span-2">
            {/* Built-in Ambient Tracks (category + list in a white box) */}
            <div className="mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block w-auto max-w-full">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedCategory === cat ? 'text-white' : (darkMode ? 'text-gray-200' : 'text-gray-700')}`}
                      style={selectedCategory === cat ? { background: themeColors.primaryHex } : { border: '1px solid rgba(0,0,0,0.06)', background: 'transparent' }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {ambientTracks.map(track => (
                    <div key={track.id} className={`p-3 rounded-lg shadow-sm w-full flex items-center gap-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: themeColors.gradientCss || 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 opacity-90" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                          </svg>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="flex-1">
                        <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{track.name}</h3>
                        {track.duration && <div className="text-xs text-gray-500">{track.duration}</div>}
                      </div>

                      {/* Icon-only Play button (theme aware) */}
                      <div>
                        <button
                          aria-label={`Play ${track.name}`}
                          onClick={() => window.dispatchEvent(new CustomEvent('playMusic', { detail: track }))}
                          className="w-9 h-9 flex items-center justify-center rounded-full shadow focus:outline-none"
                          style={{ background: themeColors.primaryHex || '#0C969C', color: '#fff' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Library removed as per request: search bar, filter, and My Music view have been taken out */}
          </div>

          {/* Right: Controls (timer, stats, sound settings, tips) */}
          <div className="space-y-6">
            {/* Pomodoro Timer */}
            <div className={`rounded-2xl p-6 shadow-xl border`} style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Focus Timer
                </h3>
                <button onClick={() => setShowTimer(!showTimer)} className={darkMode ? 'text-gray-400 hover:text-gray-300' : ''} style={!darkMode ? { color: 'var(--color-primary)' } : {}}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" style={{ color: darkMode ? '#374151' : 'rgba(59,130,246,0.12)' }} />
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={283} strokeDashoffset={283 - (283 * ((sessionDuration * 60 - (timerMinutes * 60 + timerSeconds)) / (sessionDuration * 60)))} style={{ color: 'var(--color-primary)' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {formatTime(timerMinutes, timerSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <button onClick={toggleTimer} className={`px-4 py-2 rounded-lg font-medium transition-colors`} style={isTimerRunning ? { background: 'var(--accent, #ef4444)', color: 'white' } : { background: 'var(--color-primary)', color: 'white' }}>
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button onClick={resetTimer} className={`px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                    Reset
                  </button>
                </div>
              </div>
            </div>

            

            {/* Sound Mix */}
            <div className="rounded-2xl p-6 shadow-xl border" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ color: 'var(--text)' }}>Sound Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Master Volume</label>
                  <input type="range" min="0" max="100" value={volume * 100} onChange={(e) => setVolume(e.target.value / 100)} className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer slider" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Auto-loop</span>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none">
                    <input type="checkbox" className="checked:bg-teal-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>

            {/* Music Tips */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--gradient)', color: 'white' }}>
              <h3 className="text-xl font-semibold mb-3">💡 Focus Tips</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use nature sounds for deep concentration</li>
                <li>• Try 25-minute focus sessions (Pomodoro)</li>
                <li>• Keep volume at 30-50% for best results</li>
                <li>• Take 5-minute breaks between sessions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Simple modal for selected file */}
        {isModalOpen && selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => handleDownloadFile(selectedFile)}>Download</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleCloseModal()}>Close</button>
                </div>
              </div>
              <div>
                <audio controls autoPlay src={selectedFile.viewUrl || selectedFile.downloadUrl} className="w-full" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
