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

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 md:p-12 ml-20 md:ml-28">
        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold mt-6">AI Summarizer</h1>
        <p className="mt-2 text-gray-600">
          Transform lengthy content into concise, digestible summaries
        </p>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Input Section */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Input Content</h2>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 text-sm rounded-md transition ${
                  activeTab === "text"
                    ? "bg-teal-100 text-teal-700"
                    : "border text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("text")}
              >
                Text Input
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md transition ${
                  activeTab === "file"
                    ? "bg-teal-100 text-teal-700"
                    : "border text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("file")}
              >
                PDF Upload
              </button>
            </div>

            {/* Text Input Tab */}
            {activeTab === "text" && (
              <>
                <textarea
                  className="w-full h-40 p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-400 outline-none"
                  placeholder="Paste your text here to summarize..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={selectedFile} // Disable if file is selected
                />

                {selectedFile && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    File selected: {selectedFile.name}. Text input is disabled.
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                  <span>{inputText.length} Characters</span>
                  <button
                    className="hover:text-red-500 transition"
                    onClick={() => setInputText("")}
                  >
                    Clear Text
                  </button>
                </div>
              </>
            )}

            {/* File Upload Tab */}
            {activeTab === "file" && (
              <div className="space-y-4">
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Upload your PDF file</p>
                        <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
                      </div>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 transition">
                          Choose PDF File
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          Ready to summarize • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-green-600 hover:text-green-800 transition"
                      title="Remove file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSummarize}
                disabled={loading || (!inputText.trim() && !selectedFile)}
                className={`flex-1 text-white py-2 rounded-lg transition ${
                  loading || (!inputText.trim() && !selectedFile)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {loading ? "Summarizing..." : "Generate Summary"}
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Summary Results Section */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Summary Results</h2>

            {summary ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-line">
                  {summary}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => navigator.clipboard.writeText(summary)}
                    className="text-xs text-teal-600 hover:text-teal-700 transition"
                  >
                    Copy Summary
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400 text-sm">
                <div className="w-12 h-12 bg-teal-600 rounded-lg mb-2 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p>
                  Your AI-generated summary will appear here.
                  <br />
                  Add some content and click "Generate Summary" to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}