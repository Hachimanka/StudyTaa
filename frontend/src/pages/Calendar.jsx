import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import axios from 'axios'

// Debug toggle: set true to log extraction details
const DEBUG_EXTRACTION = false;

// Event Modal Component
function EventModal({ isOpen, onClose, event, onSave, onDelete, date, darkMode, themeColors, onRequestNew }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    priority: 'medium',
    category: 'general',
    reminder: false
  });
  const [formDate, setFormDate] = useState('');

  const toInputDate = (d) => {
    if (!d) return '';
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        time: event.time || '',
        priority: event.priority || 'medium',
        category: event.category || 'general',
        reminder: event.reminder || false
      });
      setFormDate(toInputDate(event.date || date));
    } else {
      setFormData({
        title: '',
        description: '',
        time: '',
        priority: 'medium',
        category: 'general',
        reminder: false
      });
      setFormDate(toInputDate(date));
    }
  }, [event, isOpen]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    const selected = formDate ? parseISODateLocal(formDate) : date;
    onSave({
      ...formData,
      title: cleanTitle(formData.title),
      description: cleanLabelTokens(formData.description),
      id: event?.id || Date.now(),
      date: selected
    });
    onClose();
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id); // parent opens confirm modal
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md backdrop-brightness-75 flex items-center justify-center z-50 p-4">
      <div style={{ background: 'var(--surface)' }} className={`rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto`}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold`} style={{ color: 'var(--text)' }}>
              {event ? 'Edit Event' : 'Add Event'}
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors`}
              style={{ background: 'transparent' }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`w-full p-2.5 border rounded-lg`}
                style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                placeholder="Event title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className={`w-full p-2.5 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className={`w-full p-2.5 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`w-full p-2.5 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                >
                  <option value="general">General</option>
                  <option value="study">Study</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="meeting">Meeting</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={`w-full p-2.5 border rounded-lg`}
                style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                placeholder="Event description"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminder"
                checked={formData.reminder}
                onChange={(e) => setFormData({...formData, reminder: e.target.checked})}
                className={`mr-2 h-4 w-4 rounded`}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="reminder" className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Set reminder</label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={handleSave}
              className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium`}
              style={{ background: 'var(--color-primary)' }}
            >
              {event ? 'Update' : 'Add'} Event
            </button>
            {event && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            )}
            {event && (
              <button
                onClick={() => { onRequestNew && onRequestNew(); }}
                className={`px-3 py-2 ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'} rounded-lg transition-colors text-sm font-medium`}
              >
                Add Event
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-3 py-2 ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition-colors text-sm font-medium`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic notification modal
function NotificationModal({ open, onClose, message, type = 'info', darkMode }) {
  const ref = useRef(null);
  useEffect(() => { if (open && ref.current) ref.current.focus(); }, [open]);
  if (!open) return null;
  // Unified accent color logic: red when no events found, blue otherwise, override for errors
  const accent = type === 'error' ? 'bg-red-600' : type === 'nonevents' ? 'bg-red-600' : type === 'eventsfound' ? 'bg-blue-600' : 'bg-blue-600';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 backdrop-blur-sm backdrop-brightness-75" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-xl shadow-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6`} ref={ref} tabIndex={-1}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${accent} text-white rounded-xl flex items-center justify-center text-xl font-bold shrink-0 select-none`}>!
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500' : 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-400'}`}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Confirmation modal
function ConfirmModal({ open, onCancel, onConfirm, title = 'Confirm', description = 'Are you sure?', confirmLabel = 'Confirm', darkMode }) {
  const ref = useRef(null);
  useEffect(() => { if (open && ref.current) ref.current.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 backdrop-blur-sm backdrop-brightness-75" onClick={onCancel} />
      <div className={`relative w-full max-w-md rounded-xl shadow-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6`} ref={ref} tabIndex={-1}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shrink-0">!</div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold mb-1">{title}</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500' : 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-400'}`}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// Modal to choose one of multiple events on a date
function EventListModal({ isOpen, onClose, events, date, onSelect, onAddNew, darkMode, themeColors }) {
  if (!isOpen) return null;
  const dayLabel = date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  return (
    <div className="fixed inset-0 backdrop-blur-md backdrop-brightness-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface)' }}
        className={`rounded-xl shadow-xl max-w-xl w-full max-h-[80vh] overflow-y-auto`}
      >
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {dayLabel}: {events.length} Events
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'transparent' }}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {events.map(ev => (
              <button
                key={ev.id}
                onClick={() => onSelect(ev)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{ev.priority === 'high' ? '🔴' : ev.priority === 'medium' ? '🟡' : '🟢'}</span>
                    <span className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ev.title}</span>
                    {ev.time && <span className="text-xs opacity-70 whitespace-nowrap">{ev.time}</span>}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${ev.category === 'exam' ? 'bg-red-200 text-red-800' : ev.category === 'assignment' ? 'bg-yellow-200 text-yellow-800' : ev.category === 'meeting' ? 'bg-purple-200 text-purple-800' : ev.category === 'personal' ? 'bg-green-200 text-green-800' : ev.category === 'study' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{ev.category}</span>
                </div>
                {ev.description && <p className={`mt-1 text-xs line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{ev.description}</p>}
              </button>
            ))}
            {events.length === 0 && (
              <div className={`text-center py-12 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No events</div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={onAddNew}
              className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium`}
              style={{ background: 'var(--color-primary)' }}
            >
              Add New Event
            </button>
            <button
              onClick={onClose}
              className={`px-3 py-2 ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition-colors text-sm font-medium`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for file reading
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file as text'));
    reader.readAsText(file, 'UTF-8');
  });
};

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file as base64'));
    reader.readAsDataURL(file);
  });
};

const readExcelFile = async (file) => {
  try {
    const text = await readFileAsText(file);
    return text;
  } catch (error) {
    return `[Excel file: ${file.name} - Spreadsheet content requires special processing]`;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility: clean noisy labels and normalize titles for display/dedup
const cleanLabelTokens = (text) => {
  let t = (text || '');
  // Remove "Extracted from <filename> - " and optional leading quote
  t = t.replace(/Extracted from\s+[^\n\r"]+?\s+-\s*"?/gi, '');
  // Remove common label prefixes anywhere (more permissive)
  t = t.replace(/\bDate\s*Entry\s*\d+\s*:/gi, ' ');
  t = t.replace(/\bLine\s*:\s*/gi, ' ');
  t = t.replace(/EVENT[\s_\-]*CONTEXT\s*:\s*/gi, ' ');
  t = t.replace(/DATE[\s_\-]*CONTENT\s*:\s*/gi, ' ');
  t = t.replace(/TABLE[\s_\-]*ROW\s*:\s*/gi, ' ');
  t = t.replace(/TIME[\s_\-]*INFO\s*:\s*/gi, ' ');
  t = t.replace(/\bTEXT\s*:\s*/gi, ' ');
  // Remove remaining leading/trailing quotes
  t = t.replace(/^["'“”]+/g, '');
  t = t.replace(/["'“”]+$/g, '');
  // Replace various dash/minus types and box drawing
  t = t.replace(/[\u2010-\u2015\u2212]/g, ' '); // hyphen to horizontal bar and minus
  t = t.replace(/[\u2500-\u257F]/g, ' '); // box-drawing
  // Replace bars and collapse punctuation runs
  t = t.replace(/[|]+/g, ' ');
  t = t.replace(/[\-_]{2,}/g, ' ');
  // Collapse whitespace
  t = t.replace(/\s{2,}/g, ' ');
  return t.trim();
};

const cleanTitle = (raw) => {
  let t = cleanLabelTokens(raw)
    .replace(/^[\s\-—_•|]+/, '')
    .replace(/[\s\-—_•|]+$/, '')
    .trim();
  if (!t) t = 'Extracted Event';
  return t;
};

const normalizeTitleKey = (title) => cleanLabelTokens(title)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

// Choose one best event per unique date
const collapseEventsByDate = (list) => {
  const byDate = new Map();
  list.forEach(ev => {
    if (!ev?.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) return;
    const cleanedTitle = cleanTitle(ev.title || '');
    const cleanedDesc = cleanLabelTokens(ev.description || '');
    const hasMeaning = cleanedTitle && cleanedTitle.toLowerCase() !== 'extracted event';
    const score = (hasMeaning ? 1000 : 0) + (cleanedTitle ? cleanedTitle.length : 0) + (cleanedDesc ? Math.min(cleanedDesc.length, 50) : 0);
    const prev = byDate.get(ev.date);
    if (!prev || score > prev._score) {
      byDate.set(ev.date, { ...ev, title: cleanedTitle, description: cleanedDesc, _score: score });
    }
  });
  return Array.from(byDate.values()).map(({ _score, ...rest }) => rest);
};

// Parse ISO YYYY-MM-DD to a local Date to avoid UTC shift issues
const parseISODateLocal = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
};

// Enhanced OCR text formatting for comprehensive date extraction
const formatOCRText = (rawText) => {
  if (!rawText) return '';
  
  let formattedText = rawText;
  
  // Step 1: Preserve all potential date information
  formattedText = formattedText
    .replace(/[|┃│]/g, ' | ')  // Replace table borders with pipe separators
    .replace(/[─┬┼┴┌┐└┘├┤]/g, ' ')  // Replace table lines with spaces (don't break lines)
    .replace(/\s{2,}/g, ' | ')  // Replace multiple spaces with pipe separator
    .replace(/^\s+|\s+$/gm, '')  // Trim whitespace from each line
    .trim();
  
  // Step 2: Enhanced pattern detection with better context preservation
  const lines = formattedText.split('\n');
  const processedLines = [];
  const allDatePatterns = [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,  // MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
    /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,    // YYYY/MM/DD, YYYY-MM-DD
    /\b\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/gi, // 1st January 2024
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\s*,?\s*\d{2,4}\b/gi, // January 1st, 2024
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/gi, // Aug 19, Sep 2
    /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/gi, // 25 December
    /\b\d{1,2}-[A-Z][a-z]{2}-\d{2}\b/gi, // 14-Jun-25
  ];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let hasDate = false;
    
    // Check for any date pattern
    for (let pattern of allDatePatterns) {
      if (pattern.test(line)) {
        hasDate = true;
        break;
      }
    }
    
    if (hasDate) {
      // Preserve the entire line context for better event name extraction
      processedLines.push('DATE_CONTENT: ' + line);
      
      // Also capture surrounding context for event names
      if (i > 0 && lines[i-1].trim() && !lines[i-1].match(/\d{1,2}[\/\-\.]\d{1,2}/)) {
        processedLines.push('EVENT_CONTEXT: ' + lines[i-1]);
      }
      if (i < lines.length - 1 && lines[i+1].trim() && !lines[i+1].match(/\d{1,2}[\/\-\.]\d{1,2}/)) {
        processedLines.push('EVENT_CONTEXT: ' + lines[i+1]);
      }
    } else if (line.includes('|') || /\w+\s*\|\s*\w+/.test(line)) {
      processedLines.push('TABLE_ROW: ' + line);
    } else if (/\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\b/.test(line)) {
      processedLines.push('TIME_INFO: ' + line);
    } else if (line.trim()) {
      processedLines.push('TEXT: ' + line);
    }
  }
  
  return processedLines.join('\n');
};

// Comprehensive AI text preprocessing to capture ALL dates
const preprocessTextForAI = (text) => {
  if (!text) return '';
  
  // Extract ALL structured information
  const lines = text.split('\n');
  const structuredData = {
    dateContent: [],
    tableRows: [],
    timeInfo: [],
    textLines: []
  };
  
  lines.forEach(line => {
    if (line.startsWith('DATE_CONTENT:')) {
      structuredData.dateContent.push(line.substring(13).trim());
    } else if (line.startsWith('TABLE_ROW:')) {
      structuredData.tableRows.push(line.substring(10).trim());
    } else if (line.startsWith('TIME_INFO:')) {
      structuredData.timeInfo.push(line.substring(10).trim());
    } else if (line.startsWith('TEXT:')) {
      structuredData.textLines.push(line.substring(5).trim());
    } else if (line.trim()) {
      structuredData.textLines.push(line.trim());
    }
  });
  
  // Build comprehensive text for AI with emphasis on ALL dates
  let processedText = 'COMPREHENSIVE CALENDAR DATA EXTRACTION:\n\n';
  
  if (structuredData.dateContent.length > 0) {
    processedText += 'ALL DATE CONTENT (EXTRACT EVERY SINGLE DATE):\n';
    structuredData.dateContent.forEach((content, i) => {
      processedText += `Date Entry ${i + 1}: ${content}\n`;
    });
    processedText += '\n';
  }
  
  if (structuredData.tableRows.length > 0) {
    processedText += 'TABLE DATA (CHECK EACH ROW FOR DATES/EVENTS):\n';
    structuredData.tableRows.forEach((row, i) => {
      processedText += `Table Row ${i + 1}: ${row}\n`;
    });
    processedText += '\n';
  }
  
  if (structuredData.timeInfo.length > 0) {
    processedText += 'TIME INFORMATION:\n';
    structuredData.timeInfo.forEach((time, i) => {
      processedText += `Time ${i + 1}: ${time}\n`;
    });
    processedText += '\n';
  }
  
  if (structuredData.textLines.length > 0) {
    processedText += 'ADDITIONAL TEXT (SCAN FOR MISSED DATES):\n';
    processedText += structuredData.textLines.join(' ') + '\n\n';
  }
  
  // Add raw text as backup
  processedText += 'RAW TEXT BACKUP:\n' + text;
  
  return processedText;
};

// Extract date ranges like "November 6–9" or "10th–15th of December" and expand
const extractDateRangesFromText = (text, fileName) => {
  if (!text) return [];
  const lines = text.split('\n');
  const monthMap = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  const currentYear = new Date().getFullYear();
  const events = [];
  // Track contextual month/year from headers like "November 2025" or "DATE_CONTENT: November 2025"
  let contextMonth = null; // 1-12
  let contextYear = null;

  const patterns = [
    // November 6–9, 2025 or November 6-9
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*[\-–]\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/gi,
    // 10th–15th of December 2025
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*[\-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s*,?\s*(\d{4}))?\b/gi,
    // Nov 28 – Dec 2, 2025
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})\s*[\-–]\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/gi,
    // 11/6–9 or 11-06 – 09 (assume same month)
    /\b(\d{1,2})[\/\.\-](\d{1,2})\s*[\-–]\s*(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/g,
    // 11/28–12/2 or 11-28 - 12-02 (optionally with /2025 at end)
    /\b(\d{1,2})[\/\.\-](\d{1,2})\s*[\-–]\s*(\d{1,2})[\/\.\-](\d{1,2})(?:[\/\.\-](\d{2,4}))?\b/g,
    // 11/28/2025–12/02/2025 (year on both sides)
    /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\s*[\-–]\s*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/g,
    // 6–9 Nov 2025 or 6-9 Nov (day-before-month range)
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*[\-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*(\d{4}))?\b/gi
  ];

  const monthShortToLong = (m) => {
    const lower = m.toLowerCase();
    if (lower.length <= 3) {
      for (const full in monthMap) {
        if (full.startsWith(lower)) return full;
      }
    }
    return lower;
  };

  const pushRange = (startY, startM, startD, endY, endM, endD, contextLine) => {
    const startDate = new Date(startY, startM - 1, startD);
    const endDate = new Date(endY, endM - 1, endD);
    if (endDate < startDate) return;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${da}`;
      // Extract a cleaner title from the context line excluding dates and labels
      let title = (contextLine || '')
        .replace(/\b\d{1,2}(?:st|nd|rd|th)?\b/g, ' ')
        .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\b/gi, ' ');
      title = cleanTitle(title);
      const desc = contextLine ? cleanLabelTokens(contextLine).trim() : '';
      events.push({
        date: iso,
        title: title.substring(0, 60),
        description: desc
      });
    }
  };

  lines.forEach((line) => {
    // Update month/year context headers
    const headerMatch = line.match(/(?:DATE_CONTENT:\s*)?\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if (headerMatch) {
      contextMonth = monthMap[headerMatch[1].toLowerCase()];
      contextYear = parseInt(headerMatch[2], 10);
    }
    let matched = false;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(line)) !== null) {
        matched = true;
        if (pattern === patterns[0]) {
          const month = monthMap[m[1].toLowerCase()];
          const d1 = parseInt(m[2], 10);
          const d2 = parseInt(m[3], 10);
          const y = m[4] ? parseInt(m[4], 10) : currentYear;
          pushRange(y, month, d1, y, month, d2, line);
        } else if (pattern === patterns[1]) {
          const d1 = parseInt(m[1], 10);
          const d2 = parseInt(m[2], 10);
          const month = monthMap[m[3].toLowerCase()];
          const y = m[4] ? parseInt(m[4], 10) : currentYear;
          pushRange(y, month, d1, y, month, d2, line);
        } else if (pattern === patterns[2]) {
          const m1 = monthMap[monthShortToLong(m[1])];
          const d1 = parseInt(m[2], 10);
          const m2 = monthMap[monthShortToLong(m[3])];
          const d2 = parseInt(m[4], 10);
          const y = m[5] ? parseInt(m[5], 10) : currentYear;
          // Handle potential year rollover if Dec -> Jan and no explicit year
          let startY = y;
          let endY = y;
          if (!m[5] && m1 === 12 && m2 === 1) {
            endY = y + 1;
          }
          pushRange(startY, m1, d1, endY, m2, d2, line);
        } else if (pattern === patterns[3]) {
          // Numeric month/day start to day end (same month)
          const month = parseInt(m[1], 10);
          const d1 = parseInt(m[2], 10);
          const d2 = parseInt(m[3], 10);
          const y = m[4] ? parseInt(m[4], 10) : currentYear;
          pushRange(y, month, d1, y, month, d2, line);
        } else if (pattern === patterns[4]) {
          // Numeric cross-month: mm/dd – mm/dd (optional year at end)
          const m1 = parseInt(m[1], 10);
          const d1 = parseInt(m[2], 10);
          const m2 = parseInt(m[3], 10);
          const d2 = parseInt(m[4], 10);
          let y = m[5] ? parseInt(m[5].length === 2 ? '20' + m[5] : m[5], 10) : currentYear;
          let startY = y;
          let endY = y;
          if (!m[5] && m1 === 12 && m2 === 1) {
            endY = y + 1;
          }
          pushRange(startY, m1, d1, endY, m2, d2, line);
        } else if (pattern === patterns[5]) {
          // Numeric with year on both sides: mm/dd/yyyy – mm/dd/yyyy
          const m1 = parseInt(m[1], 10);
          const d1 = parseInt(m[2], 10);
          const y1 = parseInt(m[3].length === 2 ? '20' + m[3] : m[3], 10);
          const m2 = parseInt(m[4], 10);
          const d2 = parseInt(m[5], 10);
          const y2 = parseInt(m[6].length === 2 ? '20' + m[6] : m[6], 10);
          pushRange(y1, m1, d1, y2, m2, d2, line);
        } else if (pattern === patterns[6]) {
          // Day-before-month range e.g., 6–9 Nov 2025
          const d1 = parseInt(m[1], 10);
          const d2 = parseInt(m[2], 10);
          const month = monthMap[monthShortToLong(m[3])];
          const y = m[4] ? parseInt(m[4], 10) : currentYear;
          pushRange(y, month, d1, y, month, d2, line);
        }
      }
    }

    // Single day-before-month like "6 Nov 2025" or "6 Nov"
    if (!matched) {
      const singleDayBeforeMonth = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*(\d{4}))?\b/i;
      const sm = singleDayBeforeMonth.exec(line);
      if (sm) {
        matched = true;
        const dNum = parseInt(sm[1], 10);
        const month = monthMap[monthShortToLong(sm[2])];
        const year = sm[3] ? parseInt(sm[3], 10) : (contextYear || currentYear);
        const dt = new Date(year, month - 1, dNum);
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        let title = (line || '')
          .replace(singleDayBeforeMonth, ' ')
          .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\b/gi, ' ');
        title = cleanTitle(title);
        const desc = cleanLabelTokens(line).trim();
        events.push({ date: iso, title: title.substring(0, 60), description: desc });
        if (DEBUG_EXTRACTION) {
          console.log('[Calendar] Single day-before-month matched:', { line, dNum, month, year });
        }
      }
    }

    // Month followed by comma/and-separated day list, e.g., "November 17, 18, 19, 2025"
    if (!matched) {
      // Ensure the day-list stops before the 4-digit year using a lookahead
      const dayListRe = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+((?:\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:,|and)\s*)?)+?)(?=\s*,?\s*\d{4}\b|$)(?:\s*,?\s*(\d{4}))?\b/i;
      const m = dayListRe.exec(line);
      if (m) {
        matched = true;
        const month = monthMap[m[1].toLowerCase()];
        const year = m[3] ? parseInt(m[3], 10) : (contextYear || currentYear);
        const daysStr = m[2];
        // Extract day numbers not part of a larger number (avoid picking 20 and 25 from 2025)
        const dayMatches = [];
        const re2 = /\d{1,2}/g;
        let mm2;
        while ((mm2 = re2.exec(daysStr)) !== null) {
          const start = mm2.index;
          const end = start + mm2[0].length;
          const prev = start > 0 ? daysStr[start - 1] : '';
          const next = end < daysStr.length ? daysStr[end] : '';
          if (!/[0-9]/.test(prev) && !/[0-9]/.test(next)) {
            dayMatches.push(mm2[0]);
          }
        }
        // Build a clean title without the date pieces
        let title = (line || '')
          .replace(dayListRe, ' ')
          .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\b/gi, ' ');
        title = cleanTitle(title);
        const desc = cleanLabelTokens(line).trim();
        for (const dStr of dayMatches) {
          const dNum = parseInt(dStr, 10);
          const dt = new Date(year, month - 1, dNum);
          const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          events.push({ date: iso, title: title.substring(0, 60), description: desc });
        }
        if (DEBUG_EXTRACTION) {
          console.log('[Calendar] Day-list matched:', { line, month, year, days: dayMatches });
        }
      }
    }
    // Day-only range with month/year context: support lines with/without text and with bullets
    if (!matched && contextMonth) {
      let m;
      const dayRange = /^\s*[-•*]?\s*(\d{1,2})(?:st|nd|rd|th)?\s*[\-–]\s*(\d{1,2})(?:st|nd|rd|th)?\b/;
      if ((m = dayRange.exec(line)) !== null) {
        const d1 = parseInt(m[1], 10);
        const d2 = parseInt(m[2], 10);
        const y = contextYear || currentYear;
        pushRange(y, contextMonth, d1, y, contextMonth, d2, line);
        matched = true;
      }

      // Single day like "12 Deadline: ..." with context month/year
      if (!matched) {
        // Only match if line starts with optional bullet then the day (ignoring whitespace)
        const dayOnly = /^\s*[-•*]?\s*(\d{1,2})(?:st|nd|rd|th)?\b/;
        if ((m = dayOnly.exec(line)) !== null) {
          const d1 = parseInt(m[1], 10);
          const y = contextYear || currentYear;
          const dt = new Date(y, contextMonth - 1, d1);
          const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          let title = line
            .replace(/^\s*[-•*]?\s*\d{1,2}(?:st|nd|rd|th)?\s*[:\-–]?\s*/, '');
          title = cleanTitle(title);
          const desc = line ? cleanLabelTokens(line).trim() : '';
          events.push({
            date: iso,
            title: title.substring(0, 60),
            description: desc
          });
        }
      }
    }
    return matched;
  });

  // Normalize to unique entries
  const unique = [];
  const seen = new Set();
  for (const ev of events) {
    const key = `${ev.date}-${normalizeTitleKey(ev.title || '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ev);
    }
  }
  return unique;
};

export default function Calendar(){
  const { 
    darkMode, 
    getThemeColors 
  } = useSettings();
  
  const themeColors = getThemeColors();
  
  // Calendar state
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Add/Edit modal
  const [isListModalOpen, setIsListModalOpen] = useState(false); // Multiple events list
  const [notification, setNotification] = useState(null); // {message,type}
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const anyOpen = isModalOpen || isListModalOpen;
    if (anyOpen) {
      // store previous overflow to restore accurately
      if (!document.body.dataset.prevOverflow) {
        document.body.dataset.prevOverflow = document.body.style.overflow || '';
      }
      document.body.style.overflow = 'hidden';
    } else {
      if (document.body.dataset.prevOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.prevOverflow;
        delete document.body.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      // cleanup in case component unmounts while modal open
      if (document.body.dataset.prevOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.prevOverflow;
        delete document.body.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    };
  }, [isModalOpen, isListModalOpen]);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState('month'); // month, week, day
  const [searchTerm, setSearchTerm] = useState('');

  // Helper: auth header for backend persistence
  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (_) { return {}; }
  };

  // Load events from backend if authenticated
  useEffect(() => {
    const load = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get('/api/events', { headers });
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list.map(doc => ({
          id: doc._id,
          title: doc.title || 'Event',
          description: doc.description || '',
          date: new Date(doc.date),
          time: doc.time || '',
          priority: doc.priority || 'medium',
          category: doc.category || 'general',
          reminder: !!doc.reminder
        }));
        setEvents(mapped);
      } catch (err) {
        console.warn('Failed to load events', err?.message || err);
      }
    };
    load();
    const onAuthChanged = () => load();
    window.addEventListener('authChanged', onAuthChanged);
    return () => window.removeEventListener('authChanged', onAuthChanged);
  }, []);

  // Calendar navigation state
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  // Calendar grid for selected year/month
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const weeks = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++, day++) {
      if (day > 0 && day <= daysInMonth) {
        week.push(day);
      } else {
        week.push(null);
      }
    }
    weeks.push(week);
  }

  // Event management functions
  const handleSaveEvent = (eventData) => {
    const persist = async () => {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      const hasServerId = typeof eventData.id === 'string' && eventData.id.length === 24;
      try {
        if (hasServerId) {
          const payload = { ...eventData, date: eventData.date.toISOString() };
          const res = await axios.put(`/api/events/${eventData.id}`, payload, { headers });
          const saved = res.data;
          const mapped = {
            id: saved._id,
            title: saved.title,
            description: saved.description,
            date: new Date(saved.date),
            time: saved.time,
            priority: saved.priority,
            category: saved.category,
            reminder: !!saved.reminder
          };
          setEvents(events.map(e => e.id === eventData.id ? mapped : e));
          setNotification({ message: 'Event updated successfully.', type: 'eventsfound' });
        } else {
          const payload = { ...eventData, date: eventData.date.toISOString() };
          const res = await axios.post('/api/events', payload, { headers });
          const saved = res.data;
          const mapped = {
            id: saved._id,
            title: saved.title,
            description: saved.description,
            date: new Date(saved.date),
            time: saved.time,
            priority: saved.priority,
            category: saved.category,
            reminder: !!saved.reminder
          };
          setEvents([...events, mapped]);
          setNotification({ message: 'Event added successfully.', type: 'eventsfound' });
        }
      } catch (err) {
        console.warn('Persist event failed, applying local update only:', err?.message || err);
        // Local fallback
        if (eventData.id && events.find(e => e.id === eventData.id)) {
          setEvents(events.map(e => e.id === eventData.id ? eventData : e));
          setNotification({ message: 'Event updated locally (save failed).', type: 'eventsfound' });
        } else {
          setEvents([...events, eventData]);
          setNotification({ message: 'Event added locally (save failed).', type: 'eventsfound' });
        }
      }
    };
    persist();
  };

  const performDeleteEvent = async (eventId) => {
    const headers = getAuthHeaders();
    const isServerId = typeof eventId === 'string' && eventId.length === 24;
    try {
      if (isServerId && headers.Authorization) {
        await axios.delete(`/api/events/${eventId}`, { headers });
      }
    } catch (err) {
      console.warn('Delete event API failed, removing locally:', err?.message || err);
    } finally {
      setEvents(events.filter(e => e.id !== eventId));
      setNotification({ message: 'Event deleted.', type: 'info' });
    }
  };

  const handleDeleteEvent = (eventId) => {
    setConfirmDeleteId(eventId);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(viewYear, viewMonth, day);
    const dayEvents = getEventsForDay(day);
    setSelectedDate(clickedDate);
    if (dayEvents.length === 0) {
      // No events -> open add modal
      setSelectedEvent(null);
      setIsModalOpen(true);
    } else if (dayEvents.length === 1) {
      // Single event -> open detail/edit directly
      setSelectedEvent(dayEvents[0]);
      setIsModalOpen(true);
    } else {
      // Multiple events -> show list first
      setSelectedEvent(null);
      setIsListModalOpen(true);
    }
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsModalOpen(true);
    setIsListModalOpen(false); // ensure list closes if coming from it
  };

  // Handle school calendar upload and AI extraction
  const handleCalendarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    try {
      let fileText = '';
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // PDF Files
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const formData = new FormData();
        formData.append('pdf', file);
        try {
          const pdfRes = await axios.post('/api/pdf/extract-text', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          fileText = pdfRes.data.text;
        } catch (error) {
          console.warn('PDF extraction failed, trying fallback method');
          // Fallback: try to read as binary and extract basic text
          fileText = await readFileAsBase64(file);
        }
      }
      
      // Image Files (PNG, JPG, JPEG, GIF, BMP, TIFF, WebP)
      else if (fileType.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg|gif|bmp|tiff|tif|webp|svg)$/i)) {
        const formData = new FormData();
        formData.append('image', file);
        try {
          const imgRes = await axios.post('/api/image/ocr', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          let rawText = imgRes.data.text;
          
          // Improve OCR text formatting for table/structured data
          fileText = formatOCRText(rawText);
        } catch (error) {
          console.warn('OCR extraction failed');
          fileText = `[Image file: ${file.name} - Text extraction not available]`;
        }
      }
      
      // Microsoft Word Documents
      else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword' || 
               fileName.match(/\.docx?$/i)) {
        const formData = new FormData();
        formData.append('word', file);
        try {
          const wordRes = await axios.post('/api/word/extract-text', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          fileText = wordRes.data.text;
        } catch (error) {
          console.warn('Word extraction failed');
          fileText = await readFileAsText(file);
        }
      }
      
      // Excel Files
      else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               fileType === 'application/vnd.ms-excel' ||
               fileName.match(/\.xlsx?$/i)) {
        fileText = await readExcelFile(file);
      }
      
      // PowerPoint Files
      else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
               fileType === 'application/vnd.ms-powerpoint' ||
               fileName.match(/\.pptx?$/i)) {
        fileText = `[PowerPoint file: ${file.name} - Content: Presentation slides]`;
      }
      
      // Text-based files
      else if (fileType.startsWith('text/') || 
               fileName.match(/\.(txt|md|csv|json|xml|html|css|js|ts|py|java|cpp|c|h|php|rb|go|rs|swift|kt|scala|sh|bat|yaml|yml|ini|cfg|conf|log)$/i)) {
        fileText = await readFileAsText(file);
      }
      
      // Archive files
      else if (fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) {
        fileText = `[Archive file: ${file.name} - Extract contents manually to process individual files]`;
      }
      
      // Audio/Video files
      else if (fileType.startsWith('audio/') || fileType.startsWith('video/') || 
               fileName.match(/\.(mp3|mp4|avi|mov|wmv|flv|wav|aac|ogg|webm|mkv)$/i)) {
        fileText = `[Media file: ${file.name} - Audio/Video content cannot be processed for calendar events]`;
      }
      
      // Binary/Unknown files
      else {
        try {
          // Try to read as text first
          fileText = await readFileAsText(file);
        } catch (error) {
          // If text reading fails, provide file info
          fileText = `[Binary file: ${file.name} (${formatFileSize(file.size)}) - Type: ${fileType || 'Unknown'}]`;
        }
      }
      // Check if we have meaningful text content
      if (!fileText || fileText.trim().length < 10) {
        setNotification({ message: `File uploaded but no readable text found in ${file.name}`, type: 'error' });
        setUploading(false);
        return;
      }

      if (DEBUG_EXTRACTION) {
        const preview = fileText.split('\n').slice(0, 12);
        console.log('[Calendar] File text preview', { name: file.name, type: fileType, size: file.size, lines: fileText.split('\n').length, preview });
      }

      // Comprehensive text preprocessing for AI
      const processedText = preprocessTextForAI(fileText);
      const fullText = processedText.substring(0, 8000); // Significantly increased limit to capture ALL dates
      if (DEBUG_EXTRACTION) {
        console.log('[Calendar] Processed text length', { length: fullText.length });
      }
      
      const dateKeywords = ['date', 'due', 'deadline', 'exam', 'test', 'meeting', 'event', 'schedule', 'assignment', 'project', 'class', 'lecture', 'quiz', 'homework', 'calendar'];
      const hasDateKeywords = dateKeywords.some(keyword => 
        fullText.toLowerCase().includes(keyword)
      );

      // Enhanced date pattern detection
      const comprehensiveDatePatterns = [
        /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,
        /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
        /DATE_CONTENT|TABLE_ROW|TIME_INFO/
      ];
      
      const hasDatePatterns = comprehensiveDatePatterns.some(pattern => pattern.test(fullText));

      if (!hasDateKeywords && !hasDatePatterns) {
        setNotification({ message: `No calendar content detected in ${file.name}`, type: 'info' });
        setUploading(false);
        return;
      }

      // Comprehensive AI prompt for ALL date extraction with proper event names
      const prompt = `CRITICAL: Extract EVERY SINGLE DATE with PROPER EVENT NAMES from this calendar text.

EXACT INSTRUCTIONS:
1. Find ALL dates in ANY format (MM/DD/YYYY, Aug 19, 14-Jun-25, etc.)
2. For EACH date, extract the ACTUAL EVENT NAME from the same line or nearby context
3. Look for course names, event titles, holidays, exam names, assignment titles
4. For academic calendars: extract course codes, exam names, specific events
5. For schedules: extract course titles, instructor names, topics
6. Use the REAL event names, not generic titles
7. Include times when available (1:00 pm - 5:00 pm)

EXAMPLES of what to extract:
- "Aug 19 Classes Begin" → title: "Classes Begin"
- "14-Jun-25 Sat Cost & Variance Measures" → title: "Cost & Variance Measures"  
- "Sep 2 Labor Day (Holiday)" → title: "Labor Day (Holiday)"
- "Dec 16-20 Final Examinations" → title: "Final Examinations"

FORMAT: {"date": "YYYY-MM-DD", "title": "ACTUAL_EVENT_NAME", "description": "Additional context"}

CALENDAR TEXT TO PROCESS:
${fullText}

RETURN JSON ARRAY WITH ALL DATES AND THEIR REAL EVENT NAMES:`;
      
      // Call AI; if it fails (e.g., 429 quota), proceed with fallback extraction
      let aiRes;
      try {
        aiRes = await axios.post('/api/ai', { prompt });
      } catch (err) {
        console.warn('AI request failed, falling back to local extraction:', err?.response?.status || err?.message);
        aiRes = { data: { reply: '' } };
      }
      let aiEvents = [];
      
      try {
        const aiResponse = (aiRes?.data?.reply || '').trim();
        
        // Enhanced JSON extraction
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          aiEvents = JSON.parse(jsonMatch[0]);
        } else {
          aiEvents = [];
        }
        
        // Enhanced validation and date normalization
        aiEvents = aiEvents.filter(event => {
          if (!event || !event.date || !event.title) return false;
          
          // Normalize date format
          let normalizedDate = event.date;
          if (!normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Try to convert various date formats
            const dateFormats = [
              /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // MM/DD/YYYY or MM-DD-YYYY
              /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
              /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/   // MM/DD/YY
            ];
            
            for (let format of dateFormats) {
              const match = normalizedDate.match(format);
              if (match) {
                let [, part1, part2, part3] = match;
                if (part3.length === 2) part3 = '20' + part3; // Convert YY to YYYY
                
                if (format === dateFormats[1]) { // YYYY/MM/DD
                  normalizedDate = `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
                } else { // MM/DD/YYYY
                  normalizedDate = `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
                }
                break;
              }
            }
          }
          
          event.date = normalizedDate;
          return normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/);
        }).slice(0, 10);
        
      } catch (e) {
        console.log('AI parsing failed, using comprehensive fallback extraction');
        
        // Comprehensive fallback extraction for ALL dates
        aiEvents = [];
        const lines = fullText.split('\n');
        
        // Multiple date pattern matching for comprehensive extraction
        const allDatePatterns = [
          /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g,  // MM/DD/YYYY
          /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g,    // YYYY/MM/DD
          /\b(\d{1,2})(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/gi,
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(st|nd|rd|th)?\s*,?\s*(\d{2,4})\b/gi,
          // 6–9 Nov 2025 or 6-9 Nov (day-before-month range)
          /\b(\d{1,2})(?:st|nd|rd|th)?\s*[\-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})?\b/gi,
          // 6 Nov 2025 or 6 Nov (single day before month)
          /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})?\b/gi
        ];
        
        const monthMap = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        lines.forEach((line, index) => {
          // Extract ALL dates from each line
          // Guard: if the line is a month with a list of days followed by a 4-digit year,
          // skip the Month Day, Year pattern to avoid misreading "2" as year.
          const looksLikeMonthDayList = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{1,2}(?:st|nd|rd|th)?){1,}\s*,?\s*\d{4}\b/i.test(line);

          allDatePatterns.forEach((pattern, idx) => {
            if (looksLikeMonthDayList && idx === 3) {
              return; // skip Month Day, Year on day-list lines
            }
            let match;
            while ((match = pattern.exec(line)) !== null) {
              let dateStr = '';
              let title = '';
              
              if (pattern === allDatePatterns[0]) { // MM/DD/YYYY
                const [, month, day, year] = match;
                const fullYear = year.length === 2 ? `20${year}` : year;
                dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[1]) { // YYYY/MM/DD
                const [, year, month, day] = match;
                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[2]) { // 1st January 2024
                const [, day, , month, year] = match;
                const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
                dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[3]) { // January 1st, 2024
                const [, month, day, , year] = match;
                const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
                dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[4]) { // 6–9 Nov [2025]
                const [, dStart, dEnd, mon, yr] = match;
                const monthNum = monthMap[mon.toLowerCase().substring(0, 3)];
                const fullYear = yr ? (yr.length === 2 ? `20${yr}` : yr) : String(new Date().getFullYear());
                // Build title text once from the line
                let rawLine = line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim();
                let titleParts = cleanLabelTokens(rawLine.replace(match[0], ''))
                  .replace(/^\s*[-|•]\s*/, '')
                  .replace(/\s*[-|•]\s*$/, '')
                  .replace(/^\d+\s*/, '')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
                if (titleParts && titleParts.length > 2) {
                  const eventPatterns = [
                    /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
                    /([A-Z\s]{3,})/g,
                    /([\w\s]{5,})/g
                  ];
                  let bestTitle = '';
                  eventPatterns.forEach(p => {
                    const matches = titleParts.match(p);
                    if (matches && matches[0] && matches[0].length > bestTitle.length) bestTitle = matches[0].trim();
                  });
                  title = bestTitle || titleParts;
                }
                const tMatch = line.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/);
                const time = tMatch ? tMatch[1] : '';
                const start = parseInt(dStart, 10);
                const end = parseInt(dEnd, 10);
                for (let d = start; d <= end; d++) {
                  const dd = String(d).padStart(2, '0');
                  const iso = `${fullYear}-${monthNum}-${dd}`;
                  aiEvents.push({
                    date: iso,
                    title: cleanTitle((title || '').substring(0, 60) || 'Extracted Event'),
                    description: `${time ? 'Time: ' + time + '. ' : ''}${cleanLabelTokens(line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim())}`
                  });
                }
                continue; // handled expansion; proceed to next match
              } else if (pattern === allDatePatterns[5]) { // 6 Nov [2025]
                const [, d, mon, yr] = match;
                const monthNum = monthMap[mon.toLowerCase().substring(0, 3)];
                const fullYear = yr ? (yr.length === 2 ? `20${yr}` : yr) : String(new Date().getFullYear());
                dateStr = `${fullYear}-${monthNum}-${String(d).padStart(2, '0')}`;
              }
              
              // Smart title extraction from calendar context
              let rawLine = line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim();
              let titleParts = cleanLabelTokens(rawLine.replace(match[0], ''));
              
              // Clean up common calendar artifacts
              titleParts = titleParts
                .replace(/^\s*[-|•]\s*/, '') // Remove leading dashes or bullets
                .replace(/\s*[-|•]\s*$/, '') // Remove trailing dashes or bullets
                .replace(/^\d+\s*/, '') // Remove leading numbers
                .replace(/\s{2,}/g, ' ') // Normalize spaces
                .trim();
              
              // Extract meaningful title from the content
              if (titleParts && titleParts.length > 2) {
                // Look for actual event names in the line
                const eventPatterns = [
                  /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // Title Case events
                  /([A-Z\s]{3,})/g, // ALL CAPS events
                  /([\w\s]{5,})/g // General text patterns
                ];
                
                let bestTitle = '';
                eventPatterns.forEach(pattern => {
                  const matches = titleParts.match(pattern);
                  if (matches && matches[0] && matches[0].length > bestTitle.length) {
                    bestTitle = matches[0].trim();
                  }
                });
                
                title = bestTitle || titleParts;
              } else {
                // Look for context in surrounding lines with better parsing
                const contextLines = [
                  lines[index - 2]?.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim(),
                  lines[index - 1]?.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim(),
                  lines[index + 1]?.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim(),
                  lines[index + 2]?.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim()
                ].filter(Boolean);
                
                // Find the most descriptive context line
                for (const contextLine of contextLines) {
                  if (contextLine && contextLine.length > 5 && !contextLine.match(/^\d+[\/-]\d+/)) {
                    // Extract meaningful text from context
                    const cleanContext = cleanTitle(contextLine);
                    
                    if (cleanContext.length > title.length) {
                      title = cleanContext;
                      break;
                    }
                  }
                }
                
                // Fallback to a descriptive name
                if (!title || title.length < 3) {
                  title = `Calendar Event - ${match[0]}`;
                }
              }
              
              // Extract time if present
              const timeMatch = line.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/);
              const time = timeMatch ? timeMatch[1] : '';
              
              // Validate date format
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                aiEvents.push({
                  date: dateStr,
                  title: cleanTitle(title.substring(0, 60) || 'Extracted Event'),
                  description: `${time ? 'Time: ' + time + '. ' : ''}${cleanLabelTokens(line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim())}`
                });
              }
            }
          });
        });
        if (DEBUG_EXTRACTION) {
          console.log('[Calendar] Fallback patterns pass extracted', aiEvents.length);
        }
        
        // Remove duplicates by date
        const uniqueEvents = [];
        const seenDates = new Set();
        aiEvents.forEach(event => {
          const key = `${event.date}-${event.title}`;
          if (!seenDates.has(key)) {
            seenDates.add(key);
            uniqueEvents.push(event);
          }
        });
        
        aiEvents = uniqueEvents.slice(0, 25); // Increased limit to capture more events
      }

      // Always supplement with explicit range extraction to ensure coverage
      try {
        const rangeEvents = extractDateRangesFromText(fullText, file.name);
        if (Array.isArray(rangeEvents) && rangeEvents.length) {
          aiEvents = [...aiEvents, ...rangeEvents];
        }
      } catch (_) {}

      // Do not collapse to one event per date; allow multiple events with different titles on the same date
      // Quick event creation with dedup against existing dates
      if (aiEvents.length > 0) {
        // Build existing date set
        const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const existingKeys = new Set(
          events.map(ev => `${toISO(ev.date)}|${normalizeTitleKey(ev.title || '')}`)
        );

        // Dedup within new list as well and persist to backend
        const newKeys = new Set();
        const createPayload = [];
        aiEvents.forEach((ev) => {
          const key = `${ev.date}|${normalizeTitleKey(ev.title || '')}`;
          if (!newKeys.has(key) && !existingKeys.has(key)) {
            newKeys.add(key);
            createPayload.push({
              title: cleanTitle(ev.title || 'Extracted Event'),
              description: cleanLabelTokens(ev.description || ''),
              date: parseISODateLocal(ev.date).toISOString(),
              category: ev.category || 'study',
              priority: ev.priority || 'medium',
              time: ev.time || '',
              reminder: !!ev.reminder
            });
          }
        });

        let savedDocs = [];
        try {
          const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
          if (createPayload.length > 0 && headers.Authorization) {
            const res = await axios.post('/api/events', createPayload, { headers });
            savedDocs = Array.isArray(res.data) ? res.data : [];
          }
        } catch (err) {
          console.warn('Bulk save failed; falling back to local-only add:', err?.message || err);
        }

        if (savedDocs.length > 0) {
          const mapped = savedDocs.map(d => ({
            id: d._id,
            title: d.title,
            description: d.description,
            date: new Date(d.date),
            time: d.time,
            priority: d.priority,
            category: d.category,
            reminder: !!d.reminder
          }));
          setEvents([...events, ...mapped]);
          setNotification({ message: `Added ${mapped.length} event${mapped.length !== 1 ? 's' : ''} from ${file.name}`, type: 'eventsfound' });
        } else {
          // Fallback: add locally if not saved (e.g., unauthenticated)
          const localEvents = createPayload.map((p, i) => ({
            id: Date.now() + i,
            title: p.title,
            description: p.description,
            date: new Date(p.date),
            time: p.time,
            priority: p.priority,
            category: p.category,
            reminder: p.reminder
          }));
          if (localEvents.length > 0) {
            setEvents([...events, ...localEvents]);
            setNotification({ message: `Added ${localEvents.length} event${localEvents.length !== 1 ? 's' : ''} from ${file.name}`, type: 'eventsfound' });
          } else {
            setNotification({ message: 'No new events added — possible duplicates detected.', type: 'nonevents' });
          }
        }
      } else {
        setNotification({ message: `No events found in ${file.name}`, type: 'nonevents' });
      }
      
    } catch (err) {
      console.error('Calendar file upload error:', err);
      setNotification({ message: `Failed to process file: ${file.name}\nError: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(ev => {
      const d = ev.date;
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-200 text-gray-800',
      study: 'bg-blue-200 text-blue-800',
      exam: 'bg-red-200 text-red-800',
      assignment: 'bg-yellow-200 text-yellow-800',
      meeting: 'bg-purple-200 text-purple-800',
      personal: 'bg-green-200 text-green-800'
    };
    return colors[category] || colors.general;
  };

  // Get priority indicator
  const getPriorityIndicator = (priority) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  // Filter events based on search
  const filteredEvents = events.filter(event => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return event.title.toLowerCase().includes(searchLower) ||
           event.description?.toLowerCase().includes(searchLower) ||
           event.category?.toLowerCase().includes(searchLower);
  });

  // Get filtered events for a specific day (for calendar display)
  const getFilteredEventsForDay = (day) => {
    const dayEvents = getEventsForDay(day);
    if (!searchTerm.trim()) return dayEvents;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return dayEvents.filter(event => 
      event.title.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.category?.toLowerCase().includes(searchLower)
    );
  };

  // Get today's date for highlighting
  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === viewYear && 
           today.getMonth() === viewMonth && 
           today.getDate() === day;
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : ''}`}>
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
        <ChatWidget />
        <div className="flex justify-between items-start mb-6">
          <div className="page-header-group">
            <h1 className={`text-5xl font-bold page-title mt-6`}>Smart Calendar</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} page-subtitle`}>Manage your study schedule with intelligent event organization</p>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {setSelectedDate(new Date()); setSelectedEvent(null); setIsModalOpen(true); setIsListModalOpen(false);}}
              className={`px-4 py-2 ${themeColors.bg} ${themeColors.hoverBg} text-white rounded-lg transition-colors flex items-center gap-2`}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Quick Add
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className={`mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-4`}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search events by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-transparent`}
              />
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className={`absolute left-3 top-2.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-2.5 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                  title="Clear search"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Any File:</label>
              <input 
                type="file" 
                accept="*/*" 
                onChange={handleCalendarUpload} 
                className={`file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:${themeColors.light} file:${themeColors.text} hover:file:${themeColors.hover} file:cursor-pointer cursor-pointer text-sm`} 
                title="Upload any file type - PDF, Word, Excel, images, text files, etc."
              />
              {uploading && (
                <div className={`flex items-center gap-2 ${themeColors.text}`}>
                  <div className={`w-4 h-4 border-2 border-${themeColors.primary}-600 border-t-transparent rounded-full animate-spin`}></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Results Indicator */}
        {searchTerm.trim() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-yellow-600">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                <span className="text-sm text-yellow-800">
                  <strong>Search active:</strong> "{searchTerm}" - Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Calendar grid with year/month selectors */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear(viewYear - 1);
                  } else {
                    setViewMonth(viewMonth - 1);
                  }
                }} 
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:' + themeColors.light} hover:${themeColors.text} transition-all duration-200 flex items-center justify-center group`}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:scale-110 transition-transform">
                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              
              <div className="relative">
                <select 
                  value={viewMonth} 
                  onChange={e => setViewMonth(Number(e.target.value))} 
                  className={`appearance-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-transparent hover:border-${themeColors.primary}-300 transition-colors cursor-pointer`}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>{new Date(viewYear, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-gray-400">
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select 
                  value={viewYear} 
                  onChange={e => setViewYear(Number(e.target.value))} 
                  className={`appearance-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-${themeColors.primary}-500 focus:border-transparent hover:border-${themeColors.primary}-300 transition-colors cursor-pointer`}
                >
                  {[...Array(11)].map((_, i) => {
                    const y = new Date().getFullYear() - 5 + i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear(viewYear + 1);
                  } else {
                    setViewMonth(viewMonth + 1);
                  }
                }} 
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:' + themeColors.light} hover:${themeColors.text} transition-all duration-200 flex items-center justify-center group`}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="group-hover:scale-110 transition-transform">
                  <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <span className={`text-xl font-semibold ${themeColors.textDark}`}>{new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })} {viewYear}</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className={`text-center font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{d}</div>
            ))}
            {weeks.map((week, wi) => week.map((d, di) => {
              const dayEvents = d ? getFilteredEventsForDay(d) : [];
              const allDayEvents = d ? getEventsForDay(d) : [];
              const hasHiddenEvents = searchTerm.trim() && allDayEvents.length > dayEvents.length;
              
              return (
                <div 
                  key={wi + '-' + di} 
                  className={`h-20 flex flex-col border rounded-lg cursor-pointer transition-all p-1 ${
                    d ? `hover:${themeColors.light} hover:shadow-md` : `${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                  } ${
                    isToday(d) ? `ring-2 ring-${themeColors.primary}-500 ${themeColors.light}` : `${darkMode ? 'border-gray-600' : 'border-gray-200'}`
                  } ${
                    searchTerm.trim() && dayEvents.length === 0 && allDayEvents.length > 0 ? 'opacity-50' : ''
                  }`} 
                  onClick={() => d && handleDateClick(d)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      d ? (isToday(d) ? themeColors.textDark : `${darkMode ? 'text-white' : 'text-gray-800'}`) : `${darkMode ? 'text-gray-600' : 'text-gray-300'}`
                    }`}>
                      {d || ''}
                    </span>
                    {d && dayEvents.length > 0 && (
                      <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                        searchTerm.trim() ? 'bg-yellow-500 text-white' : 'bg-teal-600 text-white'
                      }`}>
                        {dayEvents.length}
                      </span>
                    )}
                    {d && hasHiddenEvents && (
                      <span className="text-xs bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center" title="Some events hidden by search">
                        !
                      </span>
                    )}
                  </div>
                  
                  {/* Show up to 2 events */}
                  <div className="flex-1 overflow-hidden">
                    {d && dayEvents.slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        onClick={(e) => handleEventClick(ev, e)}
                        className={`mb-1 px-1 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(ev.category)} ${
                          searchTerm.trim() ? 'ring-1 ring-yellow-400' : ''
                        }`}
                        title={`${ev.title}${ev.time ? ` at ${ev.time}` : ''}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs">{getPriorityIndicator(ev.priority)}</span>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      </div>
                    ))}
                    {d && dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Upcoming Events and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className={`${themeColors.text}`}>
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
              Upcoming Events
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredEvents
                .filter(ev => ev.date >= today)
                .sort((a, b) => a.date - b.date)
                .slice(0, 10)
                .map((ev, i) => (
                  <div
                    key={i}
                    onClick={() => handleEventClick(ev, { stopPropagation: () => {} })}
                    className={`p-3 border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg cursor-pointer transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getPriorityIndicator(ev.priority)}</span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ev.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(ev.category)}`}>
                          {ev.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{ev.date.toLocaleDateString()}</div>
                        {ev.time && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ev.time}</div>}
                      </div>
                    </div>
                    {ev.description && (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 truncate`}>{ev.description}</p>
                    )}
                  </div>
                ))}
              {filteredEvents.filter(ev => ev.date >= today).length === 0 && (
                <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* Calendar Statistics */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className={`${themeColors.text}`}>
                <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zM1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
              </svg>
              Calendar Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`text-center p-3 ${themeColors.light} rounded-lg`}>
                <div className={`text-2xl font-bold ${themeColors.textDark}`}>{events.length}</div>
                <div className={`text-sm ${themeColors.text}`}>Total Events</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {events.filter(ev => ev.date >= today).length}
                </div>
                <div className="text-sm text-blue-600">Upcoming</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {events.filter(ev => ev.priority === 'high').length}
                </div>
                <div className="text-sm text-red-600">High Priority</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {events.filter(ev => ev.category === 'study').length}
                </div>
                <div className="text-sm text-green-600">Study Events</div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="mt-4">
              <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Categories</h3>
              {['study', 'exam', 'assignment', 'meeting', 'personal', 'general'].map(cat => {
                const count = events.filter(ev => ev.category === cat).length;
                if (count === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between py-1">
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(cat)} capitalize`}>
                      {cat}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event List Modal (multiple events selection) */}
        <EventListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          events={selectedDate ? events.filter(ev => ev.date.getFullYear() === selectedDate.getFullYear() && ev.date.getMonth() === selectedDate.getMonth() && ev.date.getDate() === selectedDate.getDate()) : []}
          date={selectedDate}
          onSelect={(ev) => { setSelectedEvent(ev); setIsModalOpen(true); setIsListModalOpen(false); }}
          onAddNew={() => { setSelectedEvent(null); setIsModalOpen(true); setIsListModalOpen(false); }}
          darkMode={darkMode}
          themeColors={themeColors}
        />
        {/* Event Modal (add/edit) */}
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          date={selectedDate}
          darkMode={darkMode}
          themeColors={themeColors}
          onRequestNew={() => { setSelectedEvent(null); }}
        />
        <NotificationModal
          open={!!notification}
          message={notification?.message}
          type={notification?.type}
          onClose={() => setNotification(null)}
          darkMode={darkMode}
        />
        <ConfirmModal
          open={!!confirmDeleteId}
          title="Delete Event"
          description="This action cannot be undone. Delete this event?"
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => { performDeleteEvent(confirmDeleteId); setConfirmDeleteId(null); setIsModalOpen(false); setSelectedEvent(null); }}
          darkMode={darkMode}
        />
      </main>
    </div>
  );
}
