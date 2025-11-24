import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export default function Summarize() {
  const { darkMode, getThemeColors, playSound } = useSettings();
  const themeColors = getThemeColors();
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text"); // "text" or "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('summaryHistory')) || [];
    } catch (e) {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim() && !selectedFile) return;

    setLoading(true);
    setSummary("");

    try {
      let textToSummarize = inputText;

      // If we have a file but no text, extract text from file first
      if (selectedFile && !inputText.trim()) {
        const formData = new FormData();
        formData.append("pdf", selectedFile);

        const extractResponse = await axios.post(
          `${API_BASE}/api/pdf/extract-text`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        textToSummarize = extractResponse.data.text;
      }

      // Now summarize the text
      const res = await axios.post(`${API_BASE}/api/ai/summarize`, {
        text: textToSummarize,
      });
      setSummary(res.data.summary);
    } catch (error) {
      console.error("Summarize error:", error);
      setSummary("Error: Failed to summarize the content. Please try again.");
    }

    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert("File size must be less than 20MB.");
      return;
    }

    // Supported file types
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json',
      'text/markdown',
      'text/html'
    ];

    if (!supportedTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv|json|html|htm)$/i)) {
      alert("Supported file types: PDF, TXT, DOC, DOCX, CSV, JSON, MD, HTML");
      return;
    }

    setSelectedFile(file);
    setInputText(""); // Clear text input when file is selected
  };

  const clearAll = () => {
    setInputText("");
    setSelectedFile(null);
    setSummary("");
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const saveSummary = () => {
    if (!summary) return;
    
    const newSummary = {
      id: Date.now(),
      title: summaryTitle || `Summary ${summaryHistory.length + 1}`,
      content: summary,
      originalText: inputText || selectedFile?.name || "File upload",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      wordCount: summary.split(' ').length,
      source: selectedFile ? 'file' : 'text'
    };
    
    const updatedHistory = [newSummary, ...summaryHistory.slice(0, 19)]; // Keep last 20
    setSummaryHistory(updatedHistory);
    localStorage.setItem('summaryHistory', JSON.stringify(updatedHistory));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setSummaryTitle("");
  };

  const copySummary = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadSummary = () => {
    if (!summary) return;
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${summaryTitle || 'summary'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // New: app file storage for downloads (stored in localStorage)
  const APP_DOWNLOADS_KEY = 'app_downloads_summaries';
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [downloadName, setDownloadName] = React.useState(() => summaryTitle || `summary-${Date.now()}`);
  const [appSaveSuccess, setAppSaveSuccess] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [viewItem, setViewItem] = React.useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const { user } = useAuth();
  const token = (() => { try { return localStorage.getItem('token') || (user && user._id) || null } catch(e){ return null } })();
  const [showLibrarySavedToast, setShowLibrarySavedToast] = React.useState(false);

  const openDownloadModal = () => {
    setDownloadName(summaryTitle || `summary-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}`);
    setShowDownloadModal(true);
  };

  const handleDownloadToDevice = () => {
    downloadSummary();
    setShowDownloadModal(false);
  };

  const handleSaveToAppFiles = () => {
    if (!summary) return;
    // If user is logged in, attempt to upload to backend library
    if (user && token) {
      (async () => {
        try {
          // Ensure a folder named 'Summaries' exists for this user
          const ensureSummariesFolder = async () => {
            try {
              // Try to fetch library structure to find existing folder
              const libRes = await axios.get(`${API_BASE}/api/library/${user._id}`);
              if (libRes && libRes.data) {
                const findFolder = (folders) => {
                  for (const f of folders || []) {
                    if (f.name === 'Summaries') return f;
                    const sub = findFolder(f.folders || []);
                    if (sub) return sub;
                  }
                  return null;
                };
                const found = findFolder(libRes.data.folders || []);
                if (found) return found.id || found._id || found.id === undefined ? (found.id || found._id) : null;
              }
            } catch (e) {
              // ignore and attempt folder creation
            }

            // Create folder via API (requires auth)
            try {
              const createRes = await axios.post(`${API_BASE}/api/library/folders`, { name: 'Summaries', parentFolderId: null }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (createRes && createRes.data) return createRes.data.folder?.id || createRes.data._id || createRes.data.id || (createRes.data.id ?? null);
            } catch (err) {
              console.error('Failed to create Summaries folder:', err);
            }
            return null;
          };

          const folderId = await ensureSummariesFolder();
          const form = new FormData();
          const blob = new Blob([summary], { type: 'text/plain' });
          const filename = (downloadName && downloadName.trim()) ? downloadName.trim() : `summary-${Date.now()}.txt`;
          form.append('file', blob, filename);
          if (folderId) form.append('folderId', folderId);

          const res = await axios.post(`${API_BASE}/api/library/upload`, form, {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

          if (res && res.data && (res.status === 201 || res.status === 200)) {
            setAppSaveSuccess(true);
            setShowLibrarySavedToast(true);
            setTimeout(() => setAppSaveSuccess(false), 2000);
            setTimeout(() => setShowLibrarySavedToast(false), 2000);
            setShowDownloadModal(false);
            return;
          }
        } catch (err) {
          console.error('Upload to library failed, falling back to localStorage:', err);
        }
      })();
      // also return to avoid running localStorage fallback immediately; the async block will close modal on success
      return;
    }

    // Fallback: save locally in browser storage when no authenticated user or upload failed
    try {
      const raw = localStorage.getItem(APP_DOWNLOADS_KEY);
      let arr = raw ? JSON.parse(raw) : [];
      // create folder entry 'Summaries' if not present - we'll store flat list with folder property
      const fileObj = {
        id: Date.now(),
        name: downloadName || (`summary-${Date.now()}.txt`),
        content: summary,
        date: new Date().toISOString(),
        folder: 'Summaries'
      };
      arr.push(fileObj);
      localStorage.setItem(APP_DOWNLOADS_KEY, JSON.stringify(arr));
      setAppSaveSuccess(true);
      setShowLibrarySavedToast(true);
      setTimeout(() => setAppSaveSuccess(false), 2000);
      setTimeout(() => setShowLibrarySavedToast(false), 2000);
      setShowDownloadModal(false);
    } catch (e) {
      console.error('Failed to save to app files:', e);
      alert('Failed to save to app files. See console for details.');
    }
  };

  const openAppFilesFolder = () => {
    // For now, open a simple view: load files and set summary to last saved file
    const raw = localStorage.getItem(APP_DOWNLOADS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.length === 0) {
      alert('No files saved in app files yet. Save one using "Save to App Files".');
      return;
    }
    // show the most recent saved file in the summary view
    const last = arr[arr.length - 1];
    setSummary(last.content || '');
    setSummaryTitle(last.name || 'Saved Summary');
    setShowDownloadModal(false);
  };

  const loadSavedSummary = (savedSummary) => {
    // Directly load into the summary view
    setSummary(savedSummary.content);
    setSummaryTitle(savedSummary.title || 'Saved Summary');
    setShowHistory(false);
  };

  const deleteSummary = (id) => {
    const updatedHistory = summaryHistory.filter(item => item.id !== id);
    setSummaryHistory(updatedHistory);
    localStorage.setItem('summaryHistory', JSON.stringify(updatedHistory));
  };

  return (
    <div className={`flex min-h-screen`} style={{ background: 'var(--bg)' }}>
      {/* Toast: Text saved to library */}
      {showLibrarySavedToast && (
        <div className="fixed top-6 right-6 z-60">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg">Text saved to library</div>
        </div>
      )}
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 ml-20 md:ml-28">
        {/* Page Title */}
        <div className="mb-8 page-header-group">
          <h1 className={`text-5xl font-bold page-title`}>
            AI Content Summarizer
          </h1>
          <p className={`mt-2 text-lg page-subtitle`} style={{ color: 'var(--muted)' }}>
            Transform any content into intelligent, concise summaries with advanced AI
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          {/* Input Section (smaller) */}
          <div className={`xl:col-span-1 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col xl:h-[720px]`} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <svg className="w-5 h-5 mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3H9a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" />
                </svg>
                Input Content
              </h2>
              <div className="flex items-center space-x-2">
                {summaryHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-3 py-1 text-xs ${themeColors.light} ${themeColors.text} rounded-full hover:${themeColors.hover} transition-all duration-200`}
                  >
                    {showHistory ? 'Hide' : 'Show'} History ({summaryHistory.length})
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Tab Buttons */}
            <div className={`flex gap-1 mb-6 p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <button
                className={`flex-1 px-4 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                  activeTab === "text"
                    ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-md transform scale-105`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-white'} hover:shadow-sm`
                }`}
                onClick={() => setActiveTab("text")}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a1.75 1.75 0 012.475 2.475l-9.9 9.9a2 2 0 01-.879.53l-4 1a1 1 0 01-1.213-1.213l1-4a2 2 0 01.53-.879l9.9-9.9z" />
                </svg>
                Text Input
              </button>
              <button
                className={`flex-1 px-4 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                  activeTab === "file"
                    ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-md transform scale-105`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-white'} hover:shadow-sm`
                }`}
                onClick={() => setActiveTab("file")}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                File Upload
              </button>
            </div>

            {/* Enhanced Text Input Tab */}
            {activeTab === "text" && (
              <>
                <div className="relative flex-1 min-h-0">
                  <textarea
                    className={`w-full flex-1 p-4 border-2 rounded-xl text-base outline-none transition-all duration-200 resize-none min-h-[260px] md:min-h-[320px] lg:min-h-[420px]`}
                    placeholder="Paste your text, article, document, or any content here to get an intelligent AI summary..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={selectedFile}
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      borderColor: 'var(--glass-border)'
                    }}
                  />
                  {selectedFile && (
                    <div className={`absolute inset-0 ${themeColors.light} bg-opacity-90 rounded-xl flex items-center justify-center`}>
                      <div className="text-center p-4">
                        <div className={`${themeColors.text} text-lg mb-2`}>
                          <svg className="w-6 h-6 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          </svg>
                        </div>
                        <p className={`${themeColors.textDark} font-medium`}>File selected: {selectedFile.name}</p>
                        <p className={`${themeColors.text} text-sm`}>Text input is disabled</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex justify-between items-center text-sm mt-3`} style={{ color: 'var(--muted)' }}>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-1`} style={{ background: 'var(--color-primary)' }}></span>
                      {inputText.length} Characters
                    </span>
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-1`} style={{ background: 'var(--color-primary)' }}></span>
                      ~{Math.ceil(inputText.length / 5)} Words
                    </span>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-600 transition-colors duration-200 font-medium"
                    onClick={() => setInputText("")}
                  >
                    Clear Text ✕
                  </button>
                </div>
              </>
            )}

            {/* Enhanced File Upload Tab */}
      {activeTab === "file" && (
              <div className="space-y-4">
                  {!selectedFile ? (
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300`} style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)' }}>
                    <div className="space-y-4">
                        <div className={`mx-auto w-16 h-16 bg-gradient-to-r ${themeColors.gradient} rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-200`}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v7m0 0l3-3m-3 3l-3-3" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-lg font-semibold mb-1`} style={{ color: 'var(--text)' }}>Upload Any Document</p>
                        <p className={`text-base mb-2`} style={{ color: 'var(--muted)' }}>Drag & drop or click to browse</p>
                        <div className="flex flex-wrap justify-center gap-1 text-sm text-gray-500 mb-3">
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>PDF</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>DOC</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>TXT</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>CSV</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>JSON</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>MD</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>HTML</span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Maximum file size: 20MB</p>
                      </div>
                        <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,.csv,.json,.md,.html,.htm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span className={`cursor-pointer inline-flex items-center px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`} style={{ background: 'var(--gradient)', color: 'white' }}>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16M4 12h16" />
                          </svg>
                          Choose File
                        </span>
                      </label>
                    </div>
                  </div>
                  ) : (
                  <div className={`flex items-center justify-between p-6 rounded-xl shadow-sm`} style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${themeColors.gradientMid} rounded-xl flex items-center justify-center`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10H7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h6l4 4v10" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-lg font-semibold`} style={{ color: 'var(--text)' }}>
                          {selectedFile.name}
                        </p>
                        <p className={`text-sm`} style={{ color: 'var(--muted)' }}>
                          ✅ Ready to summarize • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className={`${themeColors.text} hover:${themeColors.textDark} transition-colors duration-200 p-2 hover:${themeColors.light} rounded-lg`}
                      title="Remove file"
                    >
                      <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleSummarize}
                disabled={loading || (!inputText.trim() && !selectedFile)}
                className={`flex-1 flex items-center justify-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform ${
                  loading || (!inputText.trim() && !selectedFile)
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : `bg-gradient-to-r ${themeColors.gradient} hover:${themeColors.gradientHover} text-white hover:scale-105 shadow-lg hover:shadow-xl`
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing & Summarizing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate AI Summary
                  </>
                )}
              </button>
              <button
                onClick={clearAll}
                className={`px-6 py-3 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'} rounded-xl font-medium transition-all duration-200 transform hover:scale-105`}
              >
                <svg className="w-5 h-5 mr-2 inline" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          {/* Enhanced Summary Results Section (expanded) */}
          <div className="xl:col-span-2 space-y-6">
            <div className={`shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                  <svg className="w-5 h-5 mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    <circle cx="12" cy="12" r="6" strokeWidth={2} />
                  </svg>
                  AI Summary
                </h2>
                {summary && (
                  <div className={`flex items-center space-x-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 bg-${themeColors.primary}-400 rounded-full`}></span>
                    <span>{summary.split(' ').length} words</span>
                  </div>
                )}
              </div>

              {summary ? (
                  <div className="space-y-4">
                  {/* Summary Title Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Enter title to save summary..."
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      className={`w-full p-2 text-base border rounded-lg outline-none`}
                      style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--glass-border)' }}
                    />
                  </div>

                  <div className={`p-5 rounded-xl text-base leading-relaxed whitespace-pre-line shadow-inner max-h-[520px] overflow-y-auto`} style={{ background: 'var(--surface)', color: 'var(--text)', borderLeft: '4px solid var(--color-primary)' }}>
                    {summary}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={copySummary}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        copySuccess 
                          ? `bg-${themeColors.primary}-500 text-white` 
                          : `bg-${themeColors.primary}-500 hover:bg-${themeColors.primary}-600 text-white`
                      }`}
                    >
                      {copySuccess ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <rect x="9" y="9" width="10" height="10" rx="2" strokeWidth={2} />
                            <rect x="5" y="5" width="10" height="10" rx="2" strokeWidth={2} />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <rect x="9" y="9" width="10" height="10" rx="2" strokeWidth={2} />
                            <rect x="5" y="5" width="10" height="10" rx="2" strokeWidth={2} />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowSaveConfirm(true)}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        saveSuccess 
                          ? `bg-${themeColors.primary}-500 text-white` 
                          : `bg-${themeColors.primary}-500 hover:bg-${themeColors.primary}-600 text-white`
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8v4h8V3z" />
                          </svg>
                          Save
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openDownloadModal()}
                      className={`flex items-center justify-center px-4 py-2 bg-${themeColors.primary}-600 hover:bg-${themeColors.primary}-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21H3" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                  <div className={`flex flex-col items-center justify-center h-64 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className={`w-16 h-16 bg-gradient-to-r ${themeColors.gradient} rounded-2xl mb-4 flex items-center justify-center transform hover:scale-110 transition-transform duration-200`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-base">
                    Your intelligent AI summary will appear here
                    <br />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add content and generate summary to get started</span>
                  </p>
                </div>
              )}
            </div>

            {/* History Section */}
            {showHistory && summaryHistory.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                  <svg className="w-5 h-5 mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v12" />
                  </svg>
                  Summary History
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {summaryHistory.map((item) => (
                    <div key={item.id} className={`p-4 border ${darkMode ? 'border-gray-600 hover:border-' + themeColors.primary + '-400 hover:bg-gray-700' : 'border-gray-200 hover:border-' + themeColors.primary + '-300 hover:' + themeColors.light} rounded-lg transition-all duration-200`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} text-sm mb-1`}>{item.title}</h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                            {item.date} • {item.time} • {item.wordCount} words • {item.source === 'file' ? (
                              <svg className="w-4 h-4 inline ml-1" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 inline ml-1" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a1.75 1.75 0 012.475 2.475l-9.9 9.9a2 2 0 01-.879.53l-4 1a1 1 0 01-1.213-1.213l1-4a2 2 0 01.53-.879l9.9-9.9z" />
                              </svg>
                            )}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>{item.content.substring(0, 100)}...</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => { setViewItem(item); setShowViewModal(true); }}
                            className={`p-1 ${themeColors.text} hover:${themeColors.textDark} transition-colors`}
                            title="View summary"
                          >
                            <svg className="w-4 h-4" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(item.id); setShowDeleteConfirmModal(true); }}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862A2 2 0 015.867 19.142L5 7m5 4v6m4-6v6" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 3h4l1 3H9l1-3z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save confirmation modal */}
            {showSaveConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowSaveConfirm(false)} />
                <div className="relative z-50 w-full max-w-md mx-4">
                  <div className="rounded-lg shadow-xl p-6" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                    <h3 className="text-xl font-semibold mb-3">Save Summary</h3>
                    <p className="text-base mb-4" style={{ color: 'var(--text)' }}>Save this summary to your summaries library.</p>
                    <div className="mb-4">
                      <label className="block text-sm mb-1" style={{ color: 'var(--text)' }}>Filename</label>
                      <input
                        value={summaryTitle}
                        onChange={(e) => setSummaryTitle(e.target.value)}
                        className="w-full p-3 border rounded-lg text-base outline-none"
                        placeholder="Enter filename"
                        style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--glass-border)' }}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowSaveConfirm(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
                        style={{ color: 'var(--text)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { saveSummary(); setShowSaveConfirm(false); }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Download / Save Modal */}
            {showDownloadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowDownloadModal(false)} />
                <div className="relative z-50 w-full max-w-lg mx-4">
                  <div className="rounded-lg shadow-xl p-6" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold">Download Summary</h3>
                      <button onClick={() => setShowDownloadModal(false)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 text-sm">Close</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Filename</label>
                        <input
                          value={downloadName}
                          onChange={(e) => setDownloadName(e.target.value)}
                          className="w-full p-3 border rounded-lg text-base outline-none"
                          style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--glass-border)' }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button onClick={handleDownloadToDevice} className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium">Download to device</button>
                        <button onClick={handleSaveToAppFiles} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">Save to App Files</button>
                      </div>

                      <div className="text-base" style={{ color: 'var(--text)' }}>
                        <p>If you choose "Save to App Files", the app will create a folder named <strong>Summaries</strong> the first time and store your file there. Files are stored locally in your browser (localStorage).</p>
                        {appSaveSuccess && <div className="mt-2 text-sm text-green-600">Saved to App Files.</div>}
                      </div>

                      <div className="pt-3 border-t">
                        <button onClick={openAppFilesFolder} className="text-base hover:underline" style={{ color: 'var(--text)' }}>Open App Files (last saved)</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Saved Summary Modal */}
            {showViewModal && viewItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowViewModal(false)} />
                <div className="relative z-50 w-full max-w-2xl mx-4">
                  <div className="rounded-lg shadow-xl p-6" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{viewItem.title || 'Saved Summary'}</h3>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{viewItem.date} • {viewItem.time} • {viewItem.wordCount} words</p>
                      </div>
                      <button onClick={() => setShowViewModal(false)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 text-sm">Close</button>
                    </div>

                    <div className="p-4 rounded-lg shadow-inner max-h-[600px] overflow-y-auto text-base" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                      {viewItem.content}
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => { loadSavedSummary(viewItem); setShowViewModal(false); }} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium">Load into Editor</button>
                      <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg" style={{ color: 'var(--text)' }}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowDeleteConfirmModal(false)} />
                <div className="relative z-50 w-full max-w-md mx-4">
                  <div className="rounded-lg shadow-xl p-6" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                    <h3 className="text-xl font-semibold mb-2">Delete Saved Summary</h3>
                    <p className="text-base mb-4" style={{ color: 'var(--muted)' }}>Are you sure you want to delete this saved summary? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowDeleteConfirmModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg" style={{ color: 'var(--text)' }}>Cancel</button>
                      <button onClick={() => { deleteSummary(deleteTarget); setShowDeleteConfirmModal(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Summaries (always visible) */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 mt-6`}> 
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                <svg
                  className={`w-5 h-5 mr-2 ${themeColors.primary ? 'text-' + themeColors.primary + '-500' : 'text-teal-500'}`}
                  style={{ color: themeColors.primaryHex || undefined }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v12" />
                </svg>
                Saved Summaries
              </h3>
              {summaryHistory.length === 0 ? (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No saved summaries yet. Save a summary to see it here.</div>
              ) : (
                <div className="space-y-3">
                  {summaryHistory.map((item) => (
                    <div key={`saved-${item.id}`} className={`p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg flex items-start justify-between`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} text-sm truncate`}>{item.title}</h4>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>{item.date} {item.time}</span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 line-clamp-2`}>{item.content.substring(0, 120)}{item.content.length > 120 ? '...' : ''}</p>
                      </div>
                      <div className="flex flex-col items-end ml-4 space-y-2">
                        <button
                          onClick={() => { setViewItem(item); setShowViewModal(true); }}
                          className={`px-3 py-1 text-xs rounded-md ${themeColors.primary ? 'bg-' + themeColors.primary + '-500 text-white' : 'bg-blue-500 text-white'} hover:opacity-90 transition-opacity`}
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(item.id); setShowDeleteConfirmModal(true); }}
                          className="px-3 py-1 text-xs rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}