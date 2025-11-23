import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useSettings } from "../context/SettingsContext";

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

  const loadSavedSummary = (savedSummary) => {
    setSummary(savedSummary.content);
    setShowHistory(false);
  };

  const deleteSummary = (id) => {
    const updatedHistory = summaryHistory.filter(item => item.id !== id);
    setSummaryHistory(updatedHistory);
    localStorage.setItem('summaryHistory', JSON.stringify(updatedHistory));
  };

  return (
    <div className={`flex min-h-screen`} style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 ml-20 md:ml-28">
        {/* Page Title */}
        <div className="mb-8 page-header-group">
          <h1 className={`text-5xl font-bold page-title`}>
            🤖 AI Content Summarizer
          </h1>
          <p className={`mt-2 text-lg page-subtitle`} style={{ color: 'var(--muted)' }}>
            Transform any content into intelligent, concise summaries with advanced AI
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          {/* Input Section */}
          <div className={`xl:col-span-2 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <span className="mr-2">📝</span>
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
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "text"
                    ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-md transform scale-105`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-white'} hover:shadow-sm`
                }`}
                onClick={() => setActiveTab("text")}
              >
                <span className="mr-2">✍️</span>
                Text Input
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "file"
                    ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-md transform scale-105`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-white'} hover:shadow-sm`
                }`}
                onClick={() => setActiveTab("file")}
              >
                <span className="mr-2">📁</span>
                File Upload
              </button>
            </div>

            {/* Enhanced Text Input Tab */}
            {activeTab === "text" && (
              <>
                <div className="relative">
                  <textarea
                    className={`w-full h-48 p-4 border-2 rounded-xl text-sm outline-none transition-all duration-200 resize-none`}
                    placeholder="✨ Paste your text, article, document, or any content here to get an intelligent AI summary..."
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
                        <div className={`${themeColors.text} text-lg mb-2`}>📁</div>
                        <p className={`${themeColors.textDark} font-medium`}>File selected: {selectedFile.name}</p>
                        <p className={`${themeColors.text} text-sm`}>Text input is disabled</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex justify-between items-center text-xs mt-3`} style={{ color: 'var(--muted)' }}>
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
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-lg font-semibold mb-1`} style={{ color: 'var(--text)' }}>Upload Any Document</p>
                        <p className={`text-sm mb-2`} style={{ color: 'var(--muted)' }}>Drag & drop or click to browse</p>
                        <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-500 mb-3">
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>PDF</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>DOC</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>TXT</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>CSV</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>JSON</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>MD</span>
                          <span className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded`}>HTML</span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Maximum file size: 20MB</p>
                      </div>
                        <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,.csv,.json,.md,.html,.htm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span className={`cursor-pointer inline-flex items-center px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`} style={{ background: 'var(--gradient)', color: 'white' }}>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
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
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          {/* Enhanced Summary Results Section */}
          <div className="xl:col-span-1 space-y-6">
            <div className={`shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                  <span className="mr-2">🎯</span>
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
                      placeholder="💾 Enter title to save summary..."
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      className={`w-full p-2 text-sm border rounded-lg outline-none`}
                      style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--glass-border)' }}
                    />
                  </div>

                  <div className={`p-5 rounded-xl text-sm leading-relaxed whitespace-pre-line shadow-inner`} style={{ background: 'var(--surface)', color: 'var(--text)', borderLeft: '4px solid var(--color-primary)' }}>
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
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>

                    <button
                      onClick={saveSummary}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        saveSuccess 
                          ? `bg-${themeColors.primary}-500 text-white` 
                          : `bg-${themeColors.primary}-500 hover:bg-${themeColors.primary}-600 text-white`
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Save
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadSummary}
                      className={`flex items-center justify-center px-4 py-2 bg-${themeColors.primary}-600 hover:bg-${themeColors.primary}-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-48 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`w-16 h-16 bg-gradient-to-r ${themeColors.gradient} rounded-2xl mb-4 flex items-center justify-center transform hover:scale-110 transition-transform duration-200`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">
                    ✨ Your intelligent AI summary will appear here
                    <br />
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Add content and generate summary to get started</span>
                  </p>
                </div>
              )}
            </div>

            {/* History Section */}
            {showHistory && summaryHistory.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                  <span className="mr-2">📚</span>
                  Summary History
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {summaryHistory.map((item) => (
                    <div key={item.id} className={`p-4 border ${darkMode ? 'border-gray-600 hover:border-' + themeColors.primary + '-400 hover:bg-gray-700' : 'border-gray-200 hover:border-' + themeColors.primary + '-300 hover:' + themeColors.light} rounded-lg transition-all duration-200`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} text-sm mb-1`}>{item.title}</h4>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                            {item.date} • {item.time} • {item.wordCount} words • {item.source === 'file' ? '📁' : '✍️'}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>{item.content.substring(0, 100)}...</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => loadSavedSummary(item)}
                            className={`p-1 ${themeColors.text} hover:${themeColors.textDark} transition-colors`}
                            title="Load summary"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteSummary(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Summaries (always visible) */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 mt-6`}> 
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                <span className="mr-2">💾</span>
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
                          onClick={() => loadSavedSummary(item)}
                          className={`px-3 py-1 text-xs rounded-md ${themeColors.primary ? 'bg-' + themeColors.primary + '-500 text-white' : 'bg-blue-500 text-white'} hover:opacity-90 transition-opacity`}
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteSummary(item.id)}
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