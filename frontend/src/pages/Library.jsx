import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
// import TopNav from '../components/TopNav';
import ChatWidget from '../components/ChatWidget';

function Folder({ folder, onAddFile, onAddFolder, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const [showFileInput, setShowFileInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const indentPx = level * 16;

  // Enhanced gradient colors for different levels
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-green-600',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
  ];
  const currentGradient = gradients[level % gradients.length];

  return (
    <div className="mb-4 transition-all duration-300 ease-in-out" style={{ marginLeft: indentPx }}>
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <button 
            className="flex items-center gap-3 font-semibold text-gray-800 hover:opacity-80 transition-all duration-200"
            onClick={() => setExpanded(e => !e)}
          >
            <div className={`bg-gradient-to-r ${currentGradient} p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
              {expanded ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="white" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="white" />
                </svg>
              )}
            </div>
            <span className="text-lg font-medium text-gray-800">{folder.name}</span>
            {expanded ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200">
                <path d="M4.5 6l3.5 3.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200">
                <path d="M6 4.5l3.5 3.5L6 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:bg-white hover:scale-105 transition-all duration-200 text-blue-600 font-medium text-sm"
              onClick={() => setShowFileInput(true)}
            >
              Upload
            </button>
            <button 
              className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:bg-white hover:scale-105 transition-all duration-200 text-green-600"
              onClick={() => setShowFolderInput(true)}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {showFileInput && (
          <div className="mt-5 p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-top duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload File</h3>
            <form onSubmit={e => { 
              e.preventDefault(); 
              onAddFile(folder.id, selectedFile); 
              setShowFileInput(false); 
              setSelectedFile(null); 
            }}>
              <div className="mb-5">
                <input 
                  type="file" 
                  name="file"
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors duration-200 focus:outline-none focus:border-blue-500 bg-gray-50"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`bg-gradient-to-r ${currentGradient} text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                  style={{
                    opacity: !selectedFile ? 0.5 : 1,
                    cursor: !selectedFile ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!selectedFile}
                >
                  Add
                </button>
                <button 
                  type="button"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => { setShowFileInput(false); setSelectedFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showFolderInput && (
          <div className="mt-5 p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-top duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Folder</h3>
            <form onSubmit={e => { 
              e.preventDefault(); 
              onAddFolder(folder.id, newFolderName); 
              setNewFolderName(''); 
              setShowFolderInput(false); 
            }}>
              <div className="mb-5">
                <input 
                  type="text" 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name" 
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`bg-gradient-to-r ${currentGradient} text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                  style={{
                    cursor: newFolderName ? 'pointer' : 'not-allowed',
                    opacity: newFolderName ? 1 : 0.5,
                  }}
                  disabled={!newFolderName}
                >
                  Create
                </button>
                <button 
                  type="button"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => setShowFolderInput(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {expanded && (
          <div className="mt-6 transition-all duration-300">
            {(folder.files.length > 0 || folder.folders.length > 0) && (
              <div style={{ marginLeft: (level + 1) * 16, paddingLeft: 0, boxSizing: 'border-box' }}>
                <ul className="space-y-3" style={{ paddingLeft: 0, marginLeft: 0 }}>
                  {folder.files.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-gray-700 rounded-xl py-3 px-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200 group cursor-pointer border border-gray-100"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        marginLeft: 0,
                        paddingLeft: 16,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                        <span className="text-sm">📄</span>
                      </div>
                      <span className="font-medium flex-1">{file.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-lg font-medium">
                          {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    </li>
                  ))}
                  {folder.folders.map(sub => (
                    <li key={sub.id} style={{ listStyle: 'none', marginLeft: 0, paddingLeft: 0 }}>
                      <Folder folder={sub} onAddFile={onAddFile} onAddFolder={onAddFolder} level={level + 1} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Library() {
  const [root, setRoot] = useState({
    id: 'root',
    name: 'Library',
    files: [],
    folders: [],
  });

  // Add file to folder
  const handleAddFile = (folderId, file) => {
    if (!file) return;
    const addFileRecursive = folder => {
      if (folder.id === folderId) {
        return { ...folder, files: [...folder.files, { name: file.name }] };
      }
      return { ...folder, folders: folder.folders.map(addFileRecursive) };
    };
    setRoot(addFileRecursive);
  };

  // Add folder to folder
  const handleAddFolder = (folderId, name) => {
    if (!name) return;
    const newId = Math.random().toString(36).slice(2);
    const addFolderRecursive = folder => {
      if (folder.id === folderId) {
        return { ...folder, folders: [...folder.folders, { id: newId, name, files: [], folders: [] }] };
      }
      return { ...folder, folders: folder.folders.map(addFolderRecursive) };
    };
    setRoot(addFolderRecursive);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 md:p-12 ml-8 md:ml-16 max-w-4xl mx-auto w-full">
          <ChatWidget />
          
          {/* Enhanced Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Digital Library
            </h1>
            <p className="text-xl text-gray-600">Your saved documents and resources</p>
          </div>

          {/* Stats Card */}
          <div className="mb-8 p-6 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Files</p>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-md">
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Folders</p>
                    <p className="text-2xl font-bold text-gray-800">1</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Ready to organize</p>
                <p className="text-lg font-semibold text-gray-700">Start uploading!</p>
              </div>
            </div>
          </div>

          {/* Library Content */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-3xl p-8 shadow-xl">
            <Folder folder={root} onAddFile={handleAddFile} onAddFolder={handleAddFolder} level={0} />
          </div>
        </main>
      </div>
    </div>
  );
}