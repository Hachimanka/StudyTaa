import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";

export default function Summarize() {
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
          "http://localhost:5000/api/pdf/extract-text",
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
      const res = await axios.post("http://localhost:5000/api/ai/summarize", {
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 ml-20 md:ml-28">
        {/* Page Title */}
        <div className="mb-8 transform transition-all duration-500 hover:scale-105">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            🤖 AI Content Summarizer
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Transform any content into intelligent, concise summaries with advanced AI
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          {/* Input Section */}
          <div className="xl:col-span-2 bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📝</span>
                Input Content
              </h2>
              <div className="flex items-center space-x-2">
                {summaryHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-all duration-200"
                  >
                    {showHistory ? 'Hide' : 'Show'} History ({summaryHistory.length})
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Tab Buttons */}
            <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "text"
                    ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md transform scale-105"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`}
                onClick={() => setActiveTab("text")}
              >
                <span className="mr-2">✍️</span>
                Text Input
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "file"
                    ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md transform scale-105"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
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
                    className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all duration-200 resize-none bg-gradient-to-br from-gray-50 to-white"
                    placeholder="✨ Paste your text, article, document, or any content here to get an intelligent AI summary..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={selectedFile}
                  />
                  {selectedFile && (
                    <div className="absolute inset-0 bg-teal-50 bg-opacity-90 rounded-xl flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-teal-600 text-lg mb-2">📁</div>
                        <p className="text-teal-700 font-medium">File selected: {selectedFile.name}</p>
                        <p className="text-teal-600 text-sm">Text input is disabled</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-teal-400 rounded-full mr-1"></span>
                      {inputText.length} Characters
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-teal-400 rounded-full mr-1"></span>
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
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center hover:border-teal-400 hover:bg-teal-50 transition-all duration-300 bg-gradient-to-br from-teal-25 to-teal-25">
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">Upload Any Document</p>
                        <p className="text-sm text-gray-600 mb-2">Drag & drop or click to browse</p>
                        <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-500 mb-3">
                          <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">DOC</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">TXT</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">CSV</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">JSON</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">MD</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">HTML</span>
                        </div>
                        <p className="text-xs text-gray-400">Maximum file size: 20MB</p>
                      </div>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,.csv,.json,.md,.html,.htm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Choose File
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-teal-50 to-teal-50 border-2 border-teal-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-teal-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-teal-600">
                          ✅ Ready to summarize • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-teal-500 hover:text-teal-700 transition-colors duration-200 p-2 hover:bg-teal-100 rounded-lg"
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
                    : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:scale-105 shadow-lg hover:shadow-xl"
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
                className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
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
            <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🎯</span>
                  AI Summary
                </h2>
                {summary && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
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
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                    />
                  </div>

                  <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-sm leading-relaxed whitespace-pre-line border-l-4 border-teal-400 shadow-inner">
                    {summary}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={copySummary}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        copySuccess 
                          ? 'bg-teal-500 text-white' 
                          : 'bg-teal-500 hover:bg-teal-600 text-white'
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
                          ? 'bg-teal-500 text-white' 
                          : 'bg-teal-500 hover:bg-teal-600 text-white'
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
                      className="flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl mb-4 flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">
                    ✨ Your intelligent AI summary will appear here
                    <br />
                    <span className="text-xs text-gray-400">Add content and generate summary to get started</span>
                  </p>
                </div>
              )}
            </div>

            {/* History Section */}
            {showHistory && summaryHistory.length > 0 && (
              <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📚</span>
                  Summary History
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {summaryHistory.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-25 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">
                            {item.date} • {item.time} • {item.wordCount} words • {item.source === 'file' ? '📁' : '✍️'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">{item.content.substring(0, 100)}...</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => loadSavedSummary(item)}
                            className="p-1 text-teal-500 hover:text-teal-700 transition-colors"
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
          </div>
        </div>
      </main>
    </div>
  );
}