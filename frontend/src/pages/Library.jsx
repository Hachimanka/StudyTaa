import React, { useState, useEffect, useCallback, memo } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWidget from '../components/ChatWidget';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { createPortal } from 'react-dom';

// File Modal Component
const FileModal = memo(function FileModal({ file, isOpen, onClose, onDownload }) {
  if (!isOpen || !file) return null;
  const { getThemeColors } = useSettings();
  const theme = getThemeColors();
  const [showFileInput, setShowFileInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [folderUploadLoading, setFolderUploadLoading] = useState(false);
  const [folderCreateLoading, setFolderCreateLoading] = useState(false);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ color: theme.primaryHex }}>
            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
            <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 1.51c-.29.35-.608.655-.926.787a.793.793 0 0 1-.58.029z"/>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ color: theme.primaryHex }}>
            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ color: theme.primaryHex }}>
            <path d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM1.6 11.85H0v3.999h.791v-1.342h.803c.287 0 .531-.057.732-.172.203-.118.358-.276.463-.474a1.42 1.42 0 0 0 .161-.677c0-.25-.053-.476-.158-.677a1.176 1.176 0 0 0-.46-.477c-.2-.12-.443-.179-.732-.179Zm.545 1.333a.795.795 0 0 1-.085.38.574.574 0 0 1-.238.241.794.794 0 0 1-.375.082H.788V12.48h.66c.218 0 .389.06.512.181.123.122.185.296.185.522Z"/>
          </svg>
        );
      case 'txt':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ color: theme.primaryHex }}>
            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style={{ color: theme.primaryHex }}>
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
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" style={{ color: theme.primaryHex }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {getFileIcon(file.name)}
            <div>
              <h2 className="text-xl font-semibold" style={{ color: theme.primaryHex }}>{file.name}</h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            style={{ color: theme.primaryHex }}
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
                        className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        style={{ background: theme.gradientCss, color: '#fff' }}
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
                        className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        style={{ background: theme.gradientCss, color: '#fff' }}
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
                      <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" className="mx-auto mb-4" style={{ color: theme.primaryHex }}>
                        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                        <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 1.51c-.29.35-.608.655-.926.787a.793.793 0 0 1-.58.029z"/>
                      </svg>
                      <h4 className="text-lg font-semibold mb-2" style={{ color: theme.primaryHex }}>PDF Document</h4>
                      <p className="mb-4" style={{ color: theme.primaryHex }}>
                        {file.name}
                      </p>
                      <p className="text-sm mb-4" style={{ color: theme.primaryHex }}>
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
                            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            style={{ background: theme.gradientCss, color: '#fff' }}
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
                          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          style={{ background: theme.gradientCss, color: '#fff' }}
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
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
            >
              Close
            </button>
            {(file.name.match(/\.(pdf)$/i) || file.name.match(/\.(jpg|jpeg|png|gif)$/i)) && (file.viewUrl || file.dataUrl || file.downloadUrl) && (
              <button
                onClick={() => {
                  const url = file.viewUrl || file.dataUrl || file.downloadUrl;
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ background: theme.gradientCss, color: '#fff' }}
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
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              style={{ background: theme.gradientCss, color: '#fff' }}
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

// Reusable confirmation modal with a tiny open animation
const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  loadingText = 'Processing...',
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(t);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const { getThemeColors } = useSettings();
  const theme = getThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-transparent transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      />
      <div
        className={`relative bg-white w-full max-w-md rounded-lg shadow-xl border border-gray-200 transition-all duration-200 ${
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        }`}
      >
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-5 text-sm text-gray-700 whitespace-pre-line">{message}</div>
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: theme.gradientCss, color: '#fff' }}
            disabled={loading}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});

const Folder = memo(function Folder({ folder, onAddFile, onAddFolder, onDeleteFile, onDeleteFolder, onViewFile, onRename, onDownload, onOpenFolder, level = 0, hideHeader = false }) {
  const [expanded, setExpanded] = useState(folder.expanded !== undefined ? folder.expanded : level === 0);
  const [showFileInput, setShowFileInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, payload: null });

  // Local delete confirmation modal state
  const [confirmState, setConfirmState] = useState({ open: false, message: '', action: null });
  const openConfirm = (message, action) => setConfirmState({ open: true, message, action });
  const closeConfirm = () => setConfirmState({ open: false, message: '', action: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const onAnyClick = () => setContextMenu({ visible: false, x: 0, y: 0, type: null, payload: null });
    window.addEventListener('click', onAnyClick);
    return () => window.removeEventListener('click', onAnyClick);
  }, [contextMenu.visible]);

  // Listen for global close event to ensure only one context menu open
  useEffect(() => {
    const handler = () => setContextMenu({ visible: false, x: 0, y: 0, type: null, payload: null });
    window.addEventListener('closeAllContextMenus', handler);
    return () => window.removeEventListener('closeAllContextMenus', handler);
  }, []);

  // Keep folder rows aligned with file rows (no extra indent)
  const indentPx = 0;

  const { getThemeColors } = useSettings();
  const theme = getThemeColors();

  return (
    <div className={hideHeader ? "mb-3" : ""} style={{ marginLeft: indentPx }}>
      <div className={hideHeader
        ? "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow animate-fade-left"
        : "bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 hover:bg-gray-100 transition-colors animate-fade-left"}>
        {!hideHeader && (
        <div
          className="flex items-center justify-between"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new Event('closeAllContextMenus'));
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'folder', payload: folder });
          }}
        >
          <button 
            className="flex items-center gap-2"
            onClick={(e) => { e.preventDefault(); if (onOpenFolder) onOpenFolder(folder.id); }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.dispatchEvent(new Event('closeAllContextMenus'));
              setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'folder', payload: folder });
            }}
          >
            <div className="p-1" style={{ color: theme.primaryHex }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span className="font-medium">{folder.name}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              title="Upload File"
              onClick={() => setShowFileInput(true)}
              className="p-1.5 rounded bg-white border border-transparent hover:border-slate-100"
              style={{ color: theme.primaryHex }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 5 17 10"></polyline>
                <line x1="12" y1="5" x2="12" y2="19"></line>
              </svg>
            </button>

            <button
              title="New Folder"
              onClick={() => setShowFolderInput(true)}
              className="p-1.5 rounded bg-white border border-transparent hover:border-slate-100"
              style={{ color: theme.primaryHex }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 4H4a2 2 0 0 0-2 2v2"></path>
                <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"></path>
                <path d="M16 11v6"></path>
                <path d="M13 14h6"></path>
              </svg>
            </button>

            {level > 0 && (
              <button
                title="Delete Folder"
                onClick={() => {
                  openConfirm(
                    `Are you sure you want to delete the folder "${folder.name}" and all its contents? This action cannot be undone.`,
                    () => onDeleteFolder(folder.id)
                  );
                }}
                className="p-1.5 rounded bg-white border border-transparent hover:border-red-100"
                style={{ color: theme.primaryHex }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
        )}

        {showFileInput && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload File</h3>
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              if (!selectedFile) return;
              try {
                setFolderUploadLoading(true);
                await onAddFile(folder.id, selectedFile);
                setShowFileInput(false);
                setSelectedFile(null);
              } finally {
                setFolderUploadLoading(false);
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
                  className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedFile || folderUploadLoading}
                  style={{ background: theme.gradientCss, color: '#fff' }}
                >
                  {folderUploadLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => { setShowFileInput(false); setSelectedFile(null); }}
                  disabled={folderUploadLoading}
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
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              if (!newFolderName.trim()) return;
              try {
                setFolderCreateLoading(true);
                await onAddFolder(folder.id, newFolderName.trim());
                setNewFolderName(''); 
                setShowFolderInput(false);
              } finally {
                setFolderCreateLoading(false);
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
                  className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newFolderName.trim() || folderCreateLoading}
                  style={{ background: theme.gradientCss, color: '#fff' }}
                >
                  {folderCreateLoading ? 'Creating...' : 'Create'}
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => { setShowFolderInput(false); setNewFolderName(''); }}
                  disabled={folderCreateLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {(hideHeader || expanded) && (
          <div className="mt-4">
            {(folder.files.length > 0 || folder.folders.length > 0) ? (
              <div className="space-y-2">
                {folder.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer animate-fade-left"
                    onClick={() => onViewFile(file)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'file', payload: { file, folderId: folder.id, fileIndex: idx } }); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1" style={{ color: theme.primaryHex }}>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewFile(file); }}
                        title="View"
                        className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); if (onRename) onRename(file, 'file'); }}
                        title="Rename"
                        className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a1 1 0 0 0-1 1v7"></path>
                          <path d="M21 7a2.8 2.8 0 0 0-3.95 0L7 17l-4 1 1-4 10.05-10.05A2.8 2.8 0 0 1 18.05 2L21 4.95z"></path>
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirm(
                            `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
                            () => onDeleteFile(folder.id, idx)
                          );
                        }}
                        title="Delete"
                        className="p-1.5 text-red-500 hover:text-red-700 rounded"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
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
                    onRename={onRename}
                    onDownload={onDownload}
                    onOpenFolder={onOpenFolder}
                    level={level + 1} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg animate-fade-left">
                <p className="text-sm">This folder is empty</p>
                <p className="text-xs mt-1">Upload files or create subfolders to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
      {contextMenu.visible && createPortal(
        <div
          className="z-50 bg-white border rounded shadow-lg text-sm"
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, minWidth: 160, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'file' && (
            <div>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { onViewFile(contextMenu.payload.file); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>View</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { if (onRename) onRename(contextMenu.payload.file, 'file'); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>Rename</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { if (onDownload) onDownload(contextMenu.payload.file); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>Download</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" style={{ color: theme.primaryHex }} onClick={() => { setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); openConfirm(`Delete "${contextMenu.payload.file.name}"? This cannot be undone.`, () => onDeleteFile(contextMenu.payload.folderId, contextMenu.payload.fileIndex)); }}>Delete</button>
            </div>
          )}
          {contextMenu.type === 'folder' && (
            <div>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setShowFileInput(true); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>Upload File</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setShowFolderInput(true); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>New Folder</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { if (onRename) onRename(contextMenu.payload, 'folder'); setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); }}>Rename Folder</button>
              {level > 0 && (
                <button className="w-full text-left px-3 py-2 hover:bg-gray-100" style={{ color: theme.primaryHex }} onClick={() => { setContextMenu({ visible: false, x:0,y:0,type:null,payload:null }); openConfirm(`Delete folder "${folder.name}" and all contents?`, () => onDeleteFolder(folder.id)); }}>Delete Folder</button>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
      <ConfirmModal
        isOpen={confirmState.open}
        title="Confirm Delete"
        message={confirmState.message}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => { if (confirmLoading) return; closeConfirm(); }}
        onConfirm={async () => {
          if (!confirmState.action) return;
          try {
            setConfirmLoading(true);
            await confirmState.action();
            closeConfirm();
          } catch (err) {
            console.error('Error executing confirmed action:', err);
          } finally {
            setConfirmLoading(false);
          }
        }}
        loading={confirmLoading}
        loadingText="Deleting..."
      />
    </div>
  );
});

export default function Library() {
  const { user } = useAuth();
  const { getThemeColors } = useSettings();
  const theme = getThemeColors();
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const [createLoading, setCreateLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [quickUploadLoading, setQuickUploadLoading] = useState(false);
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
  // Breadcrumb / navigation state
  const [currentFolderId, setCurrentFolderId] = useState('root');
  // New folder modal state (library-level)
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderName, setCreateFolderName] = useState('');
  // Root/library context menu for quick actions
  const [libraryMenu, setLibraryMenu] = useState({ visible: false, x: 0, y: 0 });

  // Listen for global context menu close to hide library menu
  useEffect(() => {
    const handler = () => setLibraryMenu({ visible: false, x: 0, y: 0 });
    window.addEventListener('closeAllContextMenus', handler);
    return () => window.removeEventListener('closeAllContextMenus', handler);
  }, []);

  // Fetch user's files and folders from backend
  useEffect(() => {
    if (user) {
      fetchUserLibrary(true);
    }
  }, [user]);
  const fetchUserLibrary = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(`${API_BASE}/api/library/files`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`${API_BASE}/api/library/folders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (filesResponse.ok && foldersResponse.ok) {
        console.time('fetchUserLibrary.jsonParse');
        const files = await filesResponse.json();
        const folders = await foldersResponse.json();
        console.timeEnd('fetchUserLibrary.jsonParse');

        // Log approximate payload sizes to help diagnose slow loads
        try {
          const filesStr = JSON.stringify(files);
          const foldersStr = JSON.stringify(folders);
          const filesBytes = filesStr.length;
          const foldersBytes = foldersStr.length;
          const totalKb = ((filesBytes + foldersBytes) / 1024).toFixed(1);
          const inlineDataCount = files.filter(f => f.fileData || f.textContent).length;
          console.log('Successfully fetched library data:', { files: files.length, folders: folders.length, approxPayloadKB: totalKb, inlineDataCount });
        } catch (e) {
          console.log('Successfully fetched library data:', { files: files.length, folders: folders.length });
        }
        
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
              downloadUrl: file.filePath ? `${API_BASE}/api/library/download/${file._id}` : null,
              viewUrl: `${API_BASE}/api/library/view/${file._id}` // For viewing PDFs and other files
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
      if (showSpinner) setLoading(false);
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

      const response = await fetch(`${API_BASE}/api/library/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh the library to show the new file
        await fetchUserLibrary(false);
        navigateToFolder(currentFolderId);
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
      const response = await fetch(`${API_BASE}/api/library/folders`, {
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
        await fetchUserLibrary(false);
        navigateToFolder(currentFolderId);
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
    
    try {
      const response = await fetch(`${API_BASE}/api/library/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh the library to remove the deleted file
        await fetchUserLibrary(false);
        navigateToFolder(currentFolderId);
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
    
    
    try {
      const response = await fetch(`${API_BASE}/api/library/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh the library to remove the deleted folder
        await fetchUserLibrary(false);
        navigateToFolder('root');
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

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameTargetType, setRenameTargetType] = useState('file'); // 'file' | 'folder'

  const openRenameModal = (target, type = 'file') => {
    setRenameTarget(target);
    setRenameTargetType(type);
    setRenameValue(target?.name || '');
    setRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    setRenameModalOpen(false);
    setRenameTarget(null);
    setRenameValue('');
    setRenameTargetType('file');
  };

  const submitRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const endpoint = renameTargetType === 'file'
      ? `${API_BASE}/api/library/files/${renameTarget.id}`
      : `${API_BASE}/api/library/folders/${renameTarget.id}`;

    try {
      setRenameLoading(true);
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newName: renameValue.trim() })
      });
      if (response.ok) {
        await fetchUserLibrary(false);
        // If renaming a folder that is currently open, stay there
        navigateToFolder(currentFolderId);
        closeRenameModal();
      } else {
        let bodyText = null;
        try {
          const json = await response.json();
          bodyText = json?.error || JSON.stringify(json);
        } catch (e) {
          try { bodyText = await response.text(); } catch (e2) { bodyText = String(e2); }
        }
        console.error('Rename failed', { status: response.status, body: bodyText });
        throw new Error(bodyText || `Rename request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Rename error:', err);
      setError(err.message || 'Failed to rename item. Please try again.');
    } finally {
      setRenameLoading(false);
    }
  };

  // Breadcrumb helpers
  const findPath = (folder, targetId, acc = []) => {
    if (!folder) return null;
    if (folder.id === targetId) return [...acc, folder];
    for (const sub of folder.folders) {
      const res = findPath(sub, targetId, [...acc, folder]);
      if (res) return res;
    }
    return null;
  };

  const findFolderById = (folder, targetId) => {
    if (!folder) return null;
    if (folder.id === targetId) return folder;
    for (const sub of folder.folders) {
      const res = findFolderById(sub, targetId);
      if (res) return res;
    }
    return null;
  };

  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId || 'root');
  };

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
      try {
        setQuickUploadLoading(true);
        await handleAddFile(currentFolderId || 'root', quickUploadFile);
        setQuickUploadFile(null);
        setShowQuickUpload(false);
      } finally {
        setQuickUploadLoading(false);
      }
    }
  }, [quickUploadFile, handleAddFile, currentFolderId]);

  const handleCreateFolderSubmit = useCallback(async () => {
    const name = createFolderName.trim();
    if (!name) return;
    try {
      setCreateLoading(true);
      await handleAddFolder(currentFolderId || 'root', name);
      setCreateFolderName('');
      setCreateFolderOpen(false);
    } finally {
      setCreateLoading(false);
    }
  }, [createFolderName, handleAddFolder, currentFolderId]);

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
    // Skeleton loading state: show cards, toolbar, and list placeholders
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-12 ml-20 md:ml-30 animate-fade-left">
          <ChatWidget />
          {/* Header (visible immediately while cards load) */}
          <div className="mb-8 page-header-group">
            <h1 className="text-5xl font-bold page-title">Library</h1>
            <p className="mt-2 text-gray-600 page-subtitle">Manage your documents and study materials</p>
          </div>

          {/* Stats skeleton */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm animate-fade-left">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Actions (visible while loading) */}
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
                className="absolute left-3 top-2.5 text-gray-400"
                viewBox="0 0 16 16" fill="currentColor"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowQuickUpload(true)}
                className="px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0a.5.5 0 0 1 .5.5V7h6.5a.5.5 0 0 1 0 1H8.5v6.5a.5.5 0 0 1-1 0V8H1a.5.5 0 0 1 0-1h6.5V.5A.5.5 0 0 1 8 0z"/>
                </svg>
                Upload
              </button>
              <button
                onClick={() => setCreateFolderOpen(true)}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2 2h4l2 2h6v8a2 2 0 0 1-2 2H2V2z"/>
                </svg>
                New Folder
              </button>
            </div>
          </div>

          {/* Library Content skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fade-left">
            {/* Breadcrumbs skeleton */}
            <div className="mb-4 flex items-center gap-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* List skeleton: mix of file/folder rows */}
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-64 bg-gray-200 rounded mb-1 animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-5 w-14 bg-gray-200 rounded border animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2 pl-3">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
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
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded animate-fade-left">
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
        <div className="mb-8 page-header-group">
          <h1 className="text-5xl font-bold page-title">Library</h1>
          <p className="mt-2 text-gray-600 page-subtitle">Manage your documents and study materials</p>
        </div>


        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm transform transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg animate-fade-left">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-50 rounded-full">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5" style={{ color: theme.primaryHex }}>
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 uppercase tracking-wide">Total Files</p>
                <p className="text-2xl font-semibold text-gray-900">{totalFiles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm transform transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg animate-fade-left">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-emerald-50 rounded-full">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-emerald-600 w-5 h-5">
                    <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v9A1.5 1.5 0 0 0 1.5 12h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 0h-13zm1 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 uppercase tracking-wide">Folders</p>
                <p className="text-2xl font-semibold text-gray-900">{totalFolders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm transform transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg animate-fade-left">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-50 rounded-full">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="text-purple-600 w-5 h-5">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 uppercase tracking-wide">Status</p>
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
              onClick={() => setShowQuickUpload(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              title="Upload file to current folder"
              style={{ background: theme.gradientCss, color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 5 17 10" />
                <line x1="12" y1="5" x2="12" y2="19" />
              </svg>
              Upload
            </button>
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              title="Create folder in current folder"
              style={{ background: theme.gradientCss, color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 4H4a2 2 0 0 0-2 2v2" />
                <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
                <path d="M16 11v6" />
                <path d="M13 14h6" />
              </svg>
              New Folder
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-left">
            <p className="text-blue-800 text-sm">
              <strong>Searching for:</strong> "{searchTerm}"
              {(() => {
                const searchResults = searchInFolder(root, searchTerm);
                const resultFiles = countFiles(searchResults);
                const resultFolders = countFolders(searchResults);
                if (resultFiles === 0 && resultFolders === 0) {
                  return <span className="ml-2" style={{ color: theme.primaryHex }}>No results found</span>;
                } else {
                  return <span className="ml-2" style={{ color: theme.primaryHex }}>Found {resultFiles} files in {resultFolders + (searchResults.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0)} folders</span>;
                }
              })()}
            </p>
          </div>
        )}

        {/* Library Content */}
        <div
          className="bg-white border border-gray-200 rounded-lg p-6 animate-fade-left"
          onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new Event('closeAllContextMenus'));
            setLibraryMenu({ visible: true, x: e.clientX, y: e.clientY });
          }}
        >
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-600">
            {(() => {
              const filteredRoot = searchInFolder(root, searchTerm);
              const path = findPath(filteredRoot, currentFolderId) || [filteredRoot];
              return (
                <nav className="flex items-center gap-2">
                  {path.map((seg, idx) => (
                    <span key={seg.id} className="flex items-center">
                      <button
                        onClick={() => navigateToFolder(seg.id)}
                        className="hover:underline"
                        style={{ color: theme.primaryHex }}
                      >
                        {idx === 0 ? 'My Library' : seg.name}
                      </button>
                      {idx < path.length - 1 && <span className="mx-2 text-gray-400">/</span>}
                    </span>
                  ))}
                </nav>
              );
            })()}
          </div>

          {(() => {
            const filteredRoot = searchInFolder(root, searchTerm);
            const displayedFolder = findFolderById(filteredRoot, currentFolderId) || filteredRoot;
            return (
              <Folder 
                folder={displayedFolder} 
                onAddFile={handleAddFile} 
                onAddFolder={handleAddFolder}
                onDeleteFile={handleDeleteFile}
                onDeleteFolder={handleDeleteFolder}
                onViewFile={handleViewFile}
                onRename={openRenameModal}
                onDownload={handleDownloadFile}
                onOpenFolder={navigateToFolder}
                hideHeader={displayedFolder.id === 'root'}
                level={0} 
              />
            );
          })()}
        </div>

        {/* Library panel context menu */}
        {libraryMenu.visible && (
          <div
            className="z-50 bg-white border rounded shadow-lg text-sm"
            style={{ position: 'fixed', left: libraryMenu.x, top: libraryMenu.y, minWidth: 180 }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setLibraryMenu({ visible: false, x: 0, y: 0 })}
          >
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setLibraryMenu({ visible: false, x:0,y:0 }); setShowQuickUpload(true); }}>Upload File</button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setLibraryMenu({ visible: false, x:0,y:0 }); setCreateFolderOpen(true); }}>New Folder</button>
          </div>
        )}

        {/* Quick Upload Modal */}
        {showQuickUpload && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-left">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
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
                <p className="text-gray-600 mb-4">Upload to: <span className="font-medium">{(findPath(root, currentFolderId) || [{ name: 'My Library'}]).slice(-1)[0].name}</span></p>
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
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
                    disabled={quickUploadLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickUploadSubmit}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.gradientCss, color: '#fff' }}
                    disabled={!quickUploadFile || quickUploadLoading}
                  >
                    {quickUploadLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Modal */}
        {createFolderOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-left">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">New Folder</h2>
                <button
                  onClick={() => { setCreateFolderOpen(false); setCreateFolderName(''); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <label className="text-sm text-gray-600">Folder name</label>
                <input
                  type="text"
                  value={createFolderName}
                  onChange={(e) => setCreateFolderName(e.target.value)}
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter folder name"
                  autoFocus
                />
                <div className="flex gap-3 justify-end mt-4">
                  <button
                    onClick={() => { setCreateFolderOpen(false); setCreateFolderName(''); }}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolderSubmit}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.gradientCss, color: '#fff' }}
                    disabled={!createFolderName.trim() || createLoading}
                  >
                    {createLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {renameModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-left">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Rename File</h2>
                <button
                  onClick={closeRenameModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <label className="text-sm text-gray-600">New file name (include extension)</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3 justify-end mt-4">
                  <button
                    onClick={closeRenameModal}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ background: 'transparent', color: theme.primaryHex, border: `1px solid ${theme.primaryHex}` }}
                    disabled={renameLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRename}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ background: theme.gradientCss, color: '#fff' }}
                    disabled={renameLoading}
                  >
                    {renameLoading ? 'Renaming...' : 'Rename'}
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