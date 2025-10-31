import React, { useState, useEffect, useCallback, memo } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWidget from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';

// File Modal Component
const FileModal = memo(function FileModal({ file, isOpen, onClose, onDownload }) {
  if (!isOpen || !file) return null;

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-red-600">
            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
            <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 1.51c-.29.35-.608.655-.926.787a.793.793 0 0 1-.58.029z"/>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-green-600">
            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-blue-600">
            <path d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM1.6 11.85H0v3.999h.791v-1.342h.803c.287 0 .531-.057.732-.172.203-.118.358-.276.463-.474a1.42 1.42 0 0 0 .161-.677c0-.25-.053-.476-.158-.677a1.176 1.176 0 0 0-.46-.477c-.2-.12-.443-.179-.732-.179Zm.545 1.333a.795.795 0 0 1-.085.38.574.574 0 0 1-.238.241.794.794 0 0 1-.375.082H.788V12.48h.66c.218 0 .389.06.512.181.123.122.185.296.185.522Z"/>
          </svg>
        );
      case 'txt':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
          </svg>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canPreview = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'txt', 'pdf', 'md', 'json', 'js', 'css', 'html', 'xml', 'csv'].includes(extension);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {getFileIcon(file.name)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{file.name}</h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">File Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900">{file.type || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 text-gray-900">{formatFileSize(file.size)}</span>
              </div>
              <div>
                <span className="text-gray-500">Extension:</span>
                <span className="ml-2 text-gray-900">{file.name.split('.').pop()?.toUpperCase() || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <span className="ml-2 text-gray-900">{formatDate(file.uploadDate)}</span>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {canPreview(file.name) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {file.name.match(/\.(jpg|jpeg|png|gif)$/i) && file.dataUrl && (
                  <div className="text-center">
                    <img 
                      src={file.dataUrl} 
                      alt={file.name}
                      className="max-w-full h-auto max-h-64 mx-auto rounded mb-4"
                    />
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          const url = file.viewUrl || file.dataUrl || file.downloadUrl;
                          window.open(url, '_blank');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                          <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>
                        Open Image
                      </button>
                      <button
                        onClick={() => {
                          if (file.downloadUrl) {
                            const a = document.createElement('a');
                            a.href = file.downloadUrl;
                            a.download = file.name;
                            a.click();
                          } else if (file.dataUrl) {
                            const a = document.createElement('a');
                            a.href = file.dataUrl;
                            a.download = file.name;
                            a.click();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                        Download Image
                      </button>
                    </div>
                  </div>
                )}
                {file.name.match(/\.(txt|md|json|js|css|html|xml|csv)$/i) && (file.content || file.textContent) && (
                  <div className="bg-gray-100 rounded p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                      {(file.content || file.textContent).substring(0, 2000)}
                      {(file.content || file.textContent).length > 2000 && '\n\n... (content truncated - download to view full file)'}
                    </pre>
                  </div>
                )}
                {file.name.match(/\.(pdf)$/i) && (
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-lg border-2 border-red-200">
                      <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" className="mx-auto mb-4 text-red-600">
                        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                        <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 1.51c-.29.35-.608.655-.926.787a.793.793 0 0 1-.58.029z"/>
                      </svg>
                      <h4 className="text-lg font-semibold text-red-800 mb-2">PDF Document</h4>
                      <p className="text-red-700 mb-4">
                        {file.name}
                      </p>
                      <p className="text-sm text-red-600 mb-4">
                        For security reasons, PDF preview is not available in the browser.
                        Use the buttons below to view or download the document.
                      </p>
                      <div className="flex gap-3 justify-center">
                        {(file.viewUrl || file.dataUrl || file.downloadUrl) && (
                          <button
                            onClick={() => {
                              const url = file.viewUrl || file.dataUrl || file.downloadUrl;
                              window.open(url, '_blank');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                            </svg>
                            Open PDF
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (file.downloadUrl) {
                              // Force download
                              const a = document.createElement('a');
                              a.href = file.downloadUrl;
                              a.download = file.name;
                              a.click();
                            } else if (file.dataUrl) {
                              const a = document.createElement('a');
                              a.href = file.dataUrl;
                              a.download = file.name;
                              a.click();
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer with Actions */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            {(file.name.match(/\.(pdf)$/i) || file.name.match(/\.(jpg|jpeg|png|gif)$/i)) && (file.viewUrl || file.dataUrl || file.downloadUrl) && (
              <button
                onClick={() => {
                  const url = file.viewUrl || file.dataUrl || file.downloadUrl;
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                  <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                </svg>
                Open in New Tab
              </button>
            )}
            <button
              onClick={() => onDownload(file)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const Folder = memo(function Folder({ folder, onAddFile, onAddFolder, onDeleteFile, onDeleteFolder, onViewFile, level = 0 }) {
  const [expanded, setExpanded] = useState(folder.expanded !== undefined ? folder.expanded : level === 0);
  const [showFileInput, setShowFileInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const indentPx = level * 20;

  return (
    <div className="mb-3" style={{ marginLeft: indentPx }}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <button 
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            onClick={() => setExpanded(e => !e)}
          >
            <div className="p-1 text-blue-600">
              {expanded ? (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v9A1.5 1.5 0 0 0 1.5 12h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 0h-13zm1 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
                </svg>
              )}
            </div>
            <span className="font-medium">{folder.name}</span>
            {expanded ? (
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            ) : (
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            )}
          </button>
          
          <div className="flex gap-2">
            <button 
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick={() => setShowFileInput(true)}
            >
              Upload File
            </button>
            <button 
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              onClick={() => setShowFolderInput(true)}
            >
              New Folder
            </button>
            {level > 0 && (
              <button 
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete the folder "${folder.name}" and all its contents? This action cannot be undone.`)) {
                    onDeleteFolder(folder.id);
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {showFileInput && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload File</h3>
            <form onSubmit={e => { 
              e.preventDefault(); 
              if (selectedFile) {
                onAddFile(folder.id, selectedFile); 
                setShowFileInput(false); 
                setSelectedFile(null); 
              }
            }}>
              <div className="mb-4">
                <input 
                  type="file" 
                  name="file"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedFile}
                >
                  Upload
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => { setShowFileInput(false); setSelectedFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showFolderInput && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Create New Folder</h3>
            <form onSubmit={e => { 
              e.preventDefault(); 
              if (newFolderName.trim()) {
                onAddFolder(folder.id, newFolderName.trim()); 
                setNewFolderName(''); 
                setShowFolderInput(false); 
              }
            }}>
              <div className="mb-4">
                <input 
                  type="text" 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newFolderName.trim()}
                >
                  Create
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => { setShowFolderInput(false); setNewFolderName(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {expanded && (
          <div className="mt-4">
            {(folder.files.length > 0 || folder.folders.length > 0) ? (
              <div className="space-y-2">
                {folder.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer"
                    onClick={() => onViewFile(file)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 text-gray-600">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 block">{file.name}</span>
                        {file.size && (
                          <span className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                        {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button 
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewFile(file);
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
                            onDeleteFile(folder.id, idx);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {folder.folders.map(sub => (
                  <Folder 
                    key={sub.id} 
                    folder={sub} 
                    onAddFile={onAddFile} 
                    onAddFolder={onAddFolder} 
                    onDeleteFile={onDeleteFile}
                    onDeleteFolder={onDeleteFolder}
                    onViewFile={onViewFile}
                    level={level + 1} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm">This folder is empty</p>
                <p className="text-xs mt-1">Upload files or create subfolders to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default function Library() {
  const { user } = useAuth();
  const [root, setRoot] = useState({
    id: 'root',
    name: 'My Library',
    files: [],
    folders: [],
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [quickUploadFile, setQuickUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's files and folders from backend
  useEffect(() => {
    if (user) {
      fetchUserLibrary();
    }
  }, [user]);

  const fetchUserLibrary = async () => {
    try {
      setLoading(true);
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/library/files`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`http://localhost:5000/api/library/folders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (filesResponse.ok && foldersResponse.ok) {
        const files = await filesResponse.json();
        const folders = await foldersResponse.json();

        console.log('Successfully fetched library data:', { files: files.length, folders: folders.length });
        
        // Build folder structure with files
        const folderMap = new Map();
        const rootFolder = {
          id: 'root',
          name: 'My Library',
          files: [],
          folders: [],
          expanded: true
        };
        folderMap.set('root', rootFolder);

        // Create folder structure
        folders.forEach(folder => {
          folderMap.set(folder._id, {
            id: folder._id,
            name: folder.name,
            files: [],
            folders: [],
            expanded: folder.expanded || false
          });
        });

        // Assign folders to their parents
        folders.forEach(folder => {
          const parentId = folder.parentFolderId || 'root';
          const parent = folderMap.get(parentId);
          if (parent) {
            parent.folders.push(folderMap.get(folder._id));
          }
        });

        // Assign files to their folders
        files.forEach(file => {
          const folderId = file.folderId || 'root';
          const folder = folderMap.get(folderId);
          if (folder) {
            // Create proper data URL for different file types
            let dataUrl = null;
            if (file.fileData) {
              if (file.fileType === 'application/pdf') {
                // For PDFs, create a proper data URL that browsers can display
                dataUrl = `data:application/pdf;base64,${file.fileData}`;
              } else if (file.fileType.startsWith('image/')) {
                dataUrl = `data:${file.fileType};base64,${file.fileData}`;
              } else {
                dataUrl = `data:${file.fileType};base64,${file.fileData}`;
              }
            }

            folder.files.push({
              id: file._id,
              name: file.originalName || file.fileName,
              size: file.fileSize,
              type: file.fileType,
              uploadDate: file.createdAt || new Date().toISOString(),
              dataUrl: dataUrl,
              content: file.textContent || null,
              textContent: file.textContent || null,
              downloadUrl: file.filePath ? `http://localhost:5000/api/library/download/${file._id}` : null,
              viewUrl: `http://localhost:5000/api/library/view/${file._id}` // For viewing PDFs and other files
            });
          }
        });

        setRoot(rootFolder);
      } else {
        console.error('API responses not ok:', {
          filesStatus: filesResponse.status,
          foldersStatus: foldersResponse.status
        });
        throw new Error(`Failed to fetch library data: Files(${filesResponse.status}), Folders(${foldersResponse.status})`);
      }
    } catch (error) {
      console.error('Error fetching library:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(`Failed to load your library: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Count total files recursively
  const countFiles = useCallback((folder) => {
    let count = folder.files.length;
    folder.folders.forEach(subFolder => {
      count += countFiles(subFolder);
    });
    return count;
  }, []);

  // Count total folders recursively (excluding root)
  const countFolders = useCallback((folder) => {
    let count = folder.folders.length;
    folder.folders.forEach(subFolder => {
      count += countFolders(subFolder);
    });
    return count;
  }, []);

  // Add file to folder
  const handleAddFile = useCallback(async (folderId, file) => {
    if (!file || !user) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId !== 'root') {
        formData.append('folderId', folderId);
      }

      const response = await fetch('http://localhost:5000/api/library/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh the library to show the new file
        await fetchUserLibrary();
      } else {
        throw new Error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    }
  }, [user]);

  // Add folder to folder
  const handleAddFolder = useCallback(async (folderId, name) => {
    if (!name || !user) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/library/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          parentFolderId: folderId === 'root' ? undefined : folderId
        })
      });

      if (response.ok) {
        // Refresh the library to show the new folder
        await fetchUserLibrary();
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder. Please try again.');
    }
  }, [user]);

  // Delete file from folder
  const handleDeleteFile = useCallback(async (folderId, fileIndex) => {
    if (!user) return;
    
    // Find the file to delete from current state
    const findFile = (folder) => {
      if (folder.id === folderId) {
        return folder.files[fileIndex];
      }
      for (const subFolder of folder.folders) {
        const found = findFile(subFolder);
        if (found) return found;
      }
      return null;
    };
    
    const fileToDelete = findFile(root);
    if (!fileToDelete) return;
    
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/library/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh the library to remove the deleted file
        await fetchUserLibrary();
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again.');
    }
  }, [user, root]);

  // Delete folder
  const handleDeleteFolder = useCallback(async (folderId) => {
    if (!user || folderId === 'root') return;
    
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/library/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh the library to remove the deleted folder
        await fetchUserLibrary();
      } else {
        throw new Error('Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Failed to delete folder. Please try again.');
    }
  }, [user]);

  // View file
  const handleViewFile = useCallback((file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  }, []);

  // Download file
  const handleDownloadFile = useCallback(async (file) => {
    try {
      if (file.downloadUrl) {
        // File is stored on server
        const response = await fetch(file.downloadUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          throw new Error('Failed to download file from server');
        }
      } else if (file.content) {
        // File content is stored as base64 or data URL
        const a = document.createElement('a');
        a.href = file.content;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error('No download method available for this file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedFile(null);
  }, []);

  // Search functionality
  const searchInFolder = useCallback((folder, term) => {
    if (!term.trim()) return folder;
    
    const filteredFiles = folder.files.filter(file => 
      file.name.toLowerCase().includes(term.toLowerCase())
    );
    
    const filteredFolders = folder.folders
      .map(subFolder => searchInFolder(subFolder, term))
      .filter(subFolder => 
        subFolder.name.toLowerCase().includes(term.toLowerCase()) ||
        subFolder.files.length > 0 ||
        subFolder.folders.length > 0
      );
    
    return {
      ...folder,
      files: filteredFiles,
      folders: filteredFolders,
      expanded: term.trim() ? true : folder.expanded // Auto-expand when searching
    };
  }, []);

  // Quick upload functionality
  const handleQuickUpload = useCallback(() => {
    setShowQuickUpload(true);
  }, []);

  const handleQuickUploadSubmit = useCallback(async () => {
    if (quickUploadFile) {
      await handleAddFile('root', quickUploadFile);
      setQuickUploadFile(null);
      setShowQuickUpload(false);
    }
  }, [quickUploadFile, handleAddFile]);

  // Import from Drive functionality (placeholder)
  const handleImportFromDrive = useCallback(() => {
    alert('Import from Drive functionality would connect to Google Drive API. This is a placeholder for demonstration.');
    // In a real implementation, this would:
    // 1. Open Google Drive picker
    // 2. Allow user to select files
    // 3. Download selected files
    // 4. Add them to the library
  }, []);

  const totalFiles = countFiles(root);
  const totalFolders = countFolders(root);

  // Debug: Log the current state
  console.log('Root folder:', root);
  console.log('Total files:', totalFiles);
  console.log('Total folders:', totalFolders);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-12 ml-20 md:ml-30">
          <ChatWidget />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your library...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
        <ChatWidget />
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold page-title">Library</h1>
          <p className="mt-2 text-gray-600">Manage your documents and study materials</p>
        </div>


        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-blue-600">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{totalFiles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-green-600">
                  <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v9A1.5 1.5 0 0 0 1.5 12h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 0h-13zm1 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Folders</p>
                <p className="text-2xl font-bold text-gray-900">{totalFolders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-purple-600">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totalFiles === 0 ? 'Empty' : 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg 
              width="20" 
              height="20" 
              fill="currentColor" 
              viewBox="0 0 16 16" 
              className="absolute left-3 top-2.5 text-gray-400"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleQuickUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              Quick Upload
            </button>
            <button 
              onClick={handleImportFromDrive}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2.134 5.453 4.906.48-.3 1.072-.19 1.538.278.217.217.377.51.394.824.016.312-.086.614-.274.83l-7.73 8.856c-.214.245-.52.379-.84.379-.317 0-.616-.134-.83-.379L.711 10.394c-.188-.216-.29-.518-.274-.83.017-.315.177-.607.394-.824.466-.468 1.058-.578 1.538-.278z"/>
              </svg>
              Import from Drive
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Searching for:</strong> "{searchTerm}"
              {(() => {
                const searchResults = searchInFolder(root, searchTerm);
                const resultFiles = countFiles(searchResults);
                const resultFolders = countFolders(searchResults);
                if (resultFiles === 0 && resultFolders === 0) {
                  return <span className="text-red-600 ml-2">No results found</span>;
                } else {
                  return <span className="text-green-600 ml-2">Found {resultFiles} files in {resultFolders + (searchResults.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0)} folders</span>;
                }
              })()}
            </p>
          </div>
        )}

        {/* Library Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Folder 
            folder={searchInFolder(root, searchTerm)} 
            onAddFile={handleAddFile} 
            onAddFolder={handleAddFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onViewFile={handleViewFile}
            level={0} 
          />
        </div>

        {/* Quick Upload Modal */}
        {showQuickUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Upload</h2>
                  <button
                    onClick={() => {
                      setShowQuickUpload(false);
                      setQuickUploadFile(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">Upload a file directly to your main library</p>
                <div className="mb-4">
                  <input
                    type="file"
                    onChange={(e) => setQuickUploadFile(e.target.files[0])}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors focus:outline-none focus:border-blue-500"
                    accept="*/*"
                  />
                </div>
                {quickUploadFile && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Selected:</strong> {quickUploadFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {(quickUploadFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowQuickUpload(false);
                      setQuickUploadFile(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickUploadSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!quickUploadFile}
                  >
                    Upload to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Modal */}
        <FileModal
          file={selectedFile}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onDownload={handleDownloadFile}
        />
      </main>
    </div>
  );
}