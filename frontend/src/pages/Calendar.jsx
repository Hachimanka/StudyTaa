import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import axios from 'axios'
import { useReminders } from '../context/ReminderContext'

// Debug toggle: set true to log extraction details
const DEBUG_EXTRACTION = false;

// =============================================================================
// AI INSTRUCTIONS FOR IMAGE SCANNING & CALENDAR EXTRACTION
// =============================================================================

const ENHANCED_OCR_PROMPT = `
CRITICAL: Extract EVERY SINGLE DATE from this academic calendar. Be extremely thorough.

IMPORTANT: You MUST find ALL these date formats:
1. Day-only numbers: "02", "06", "12" (use month context)
2. Date ranges: "01 - 06", "03-05", "24-26" (expand to individual days)
3. Full dates: "November 20, 2025", "Dec 8, 2025"
4. Month headers: "December 2025" (use as context for day-only dates)
5. Bullet lists with dates
6. Any number that could be a day of month (1-31)

SPECIFIC INSTRUCTIONS:
- If you see "December 2025" and then "02" below it, that's 2025-12-02
- If you see "01 - 06", create events for Dec 1, 2, 3, 4, 5, 6
- Extract ALL numbers that could be days, don't miss any
- For bullet lists, match dates with their corresponding events
- Look for event names in nearby lines and previous lines
- Don't filter out potential dates - be inclusive

COMMON EVENT TYPES IN THESE IMAGES:
- Examinations: Prelim, Midterm, Pre-Final, Final
- Deadlines: Grade submissions, project deadlines  
- Holidays: Christmas, Rizal Day, Founder's Day, Immaculate Conception
- Academic: End Classes, Commencement, Special Days
- Events: World Children's Day, Founder's Day

OUTPUT FORMAT:
Return ONLY valid JSON array. Include ALL dates you find:
[
  {
    "date": "YYYY-MM-DD",
    "title": "ACTUAL_EVENT_NAME_FROM_CONTEXT",
    "description": "Source context"
  }
]

CALENDAR TEXT:
{{OCR_TEXT}}
`;

// Event Modal Component
function EventModal({ isOpen, onClose, event, onSave, onDelete, date, darkMode, themeColors, onRequestNew }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    priority: 'medium',
    category: 'general',
    reminder: false,
    reminderOffsetMinutes: 15
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
        reminder: event.reminder || false,
        reminderOffsetMinutes: event.reminderOffsetMinutes != null ? event.reminderOffsetMinutes : 15
      });
      setFormDate(toInputDate(event.date || date));
    } else {
      setFormData({
        title: '',
        description: '',
        time: '',
        priority: 'medium',
        category: 'general',
        reminder: false,
        reminderOffsetMinutes: 15
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={formData.reminder}
                  onChange={(e) => setFormData({
                    ...formData,
                    reminder: e.target.checked,
                    reminderOffsetMinutes: e.target.checked ? formData.reminderOffsetMinutes ?? 15 : formData.reminderOffsetMinutes
                  })}
                  className={`mr-2 h-4 w-4 rounded`}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="reminder" className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Set reminder</label>
              </div>
              {formData.reminder && (
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className={`block text-xs font-medium mb-1`} style={{ color: 'var(--text)' }}>Notify Minutes Before</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reminderOffsetMinutes}
                      onChange={(e) => setFormData({ ...formData, reminderOffsetMinutes: Math.max(0, Number(e.target.value)) })}
                      className={`w-full p-2 border rounded-lg`}
                      style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                    />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text)' }}>
                    {formData.reminderOffsetMinutes > 0 ? `You will be notified ${formData.reminderOffsetMinutes} minute${formData.reminderOffsetMinutes===1?'':'s'} before.` : 'Notification at event time.'}
                  </div>
                </div>
              )}
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
function EventListModal({ isOpen, onClose, events, date, onSelect, onAddNew, darkMode, themeColors, onRequestBulkDelete }) {
  const [multiSelect, setMultiSelect] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  React.useEffect(() => {
    if (!isOpen) {
      setMultiSelect(false);
      setSelectedIds(new Set());
    } else {
      // Reset when opening
      setSelectedIds(new Set());
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const dayLabel = date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allSelected = selectedIds.size === events.length && events.length > 0;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(events.map(e => e.id)));
  };
  const initiateDelete = () => {
    if (!selectedIds.size) return;
    onRequestBulkDelete && onRequestBulkDelete(Array.from(selectedIds));
  };
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
            <div className="flex items-center gap-2">
              {events.length > 1 && (
                <button
                  onClick={() => setMultiSelect(!multiSelect)}
                  className={`px-2 py-1 rounded text-xs font-medium ${multiSelect ? 'bg-yellow-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} hover:opacity-90`}
                >
                  {multiSelect ? 'Cancel' : 'Select'}
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: 'transparent' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
              </button>
            </div>
          </div>
          {multiSelect && events.length > 0 && (
            <div className="flex items-center justify-between mb-3 text-xs">
              <button
                onClick={toggleAll}
                className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} hover:opacity-90`}
              >
                {allSelected ? 'Unselect All' : 'Select All'}
              </button>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedIds.size} selected</span>
            </div>
          )}
          <div className="space-y-2">
            {events.map(ev => (
              <div
                key={ev.id}
                className={`w-full p-3 rounded-lg border transition-colors ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${multiSelect ? (selectedIds.has(ev.id) ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : '') : (darkMode ? 'hover:bg-gray-700 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer')}`}
                onClick={() => { if (!multiSelect) onSelect(ev); else toggleId(ev.id); }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {multiSelect && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ev.id)}
                        onChange={(e) => { e.stopPropagation(); toggleId(ev.id); }}
                        className="h-4 w-4"
                      />
                    )}
                    <span>{ev.priority === 'high' ? '🔴' : ev.priority === 'medium' ? '🟡' : '🟢'}</span>
                    <span className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ev.title}</span>
                    {ev.time && <span className="text-xs opacity-70 whitespace-nowrap">{ev.time}</span>}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${ev.category === 'exam' ? 'bg-red-200 text-red-800' : ev.category === 'assignment' ? 'bg-yellow-200 text-yellow-800' : ev.category === 'meeting' ? 'bg-purple-200 text-purple-800' : ev.category === 'personal' ? 'bg-green-200 text-green-800' : ev.category === 'study' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{ev.category}</span>
                </div>
                {ev.description && <p className={`mt-1 text-xs line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{ev.description}</p>}
              </div>
            ))}
            {events.length === 0 && (
              <div className={`text-center py-12 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No events</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={onAddNew}
              className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium`}
              style={{ background: 'var(--color-primary)' }}
            >
              Add New Event
            </button>
            {multiSelect && selectedIds.size > 0 && (
              <button
                onClick={initiateDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
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

// Preview modal for extracted events before saving
function EventPreviewModal({ isOpen, events = [], fileName = '', onClose, onConfirm, darkMode }) {
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  React.useEffect(() => {
    if (isOpen) {
      const all = new Set((events || []).map((e, i) => i));
      setSelectedIds(all);
    } else {
      setSelectedIds(new Set());
    }
  }, [isOpen, events]);

  if (!isOpen) return null;

  const toggle = (idx) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const confirm = () => {
    const sel = (events || []).filter((_, i) => selectedIds.has(i));
    onConfirm && onConfirm(sel);
  };

  const allSelected = selectedIds.size === (events || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl rounded-xl shadow-xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-6`} onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Preview Extracted Events</h3>
          <div className="text-sm text-gray-400">{fileName}</div>
        </div>
        <div className="mb-3">
          <button
            onClick={() => {
              if (allSelected) setSelectedIds(new Set());
              else setSelectedIds(new Set((events || []).map((_, i) => i)));
            }}
            className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
          >
            {allSelected ? 'Unselect All' : 'Select All'}
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto space-y-2 mb-4 border rounded p-2" style={{ background: darkMode ? '#081124' : '#fafafa' }}>
          {(events || []).map((ev, i) => (
            <label key={i} className={`flex items-start gap-3 p-2 rounded hover:bg-opacity-5 cursor-pointer ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/2'}`}>
              <input type="checkbox" checked={selectedIds.has(i)} onChange={() => toggle(i)} className="mt-1" />
              <div className="flex-1">
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-gray-400">{ev.date} • {ev.description || ''}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={`px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>Cancel</button>
          <button onClick={confirm} className={`px-3 py-2 rounded text-white bg-blue-600 hover:bg-blue-700`}>Add {selectedIds.size} Event{selectedIds.size !== 1 ? 's' : ''}</button>
        </div>
      </div>
    </div>
  );
}

// Utility: clean noisy labels and normalize titles for display/dedup
const cleanLabelTokens = (text) => {
  let t = (text || '');
  t = t.replace(/Extracted from\s+[^\n\r"]+?\s+-\s*"?/gi, '');
  t = t.replace(/\bDate\s*Entry\s*\d+\s*:/gi, ' ');
  t = t.replace(/\bLine\s*:\s*/gi, ' ');
  t = t.replace(/EVENT[\s_\-]*CONTEXT\s*:\s*/gi, ' ');
  t = t.replace(/DATE[\s_\-]*CONTENT\s*:\s*/gi, ' ');
  t = t.replace(/TABLE[\s_\-]*ROW\s*:\s*/gi, ' ');
  t = t.replace(/TIME[\s_\-]*INFO\s*:\s*/gi, ' ');
  t = t.replace(/\bTEXT\s*:\s*/gi, ' ');
  t = t.replace(/^["'""]+/g, '');
  t = t.replace(/["'""]+$/g, '');
  t = t.replace(/[\u2010-\u2015\u2212]/g, ' ');
  t = t.replace(/[\u2500-\u257F]/g, ' ');
  t = t.replace(/[|]+/g, ' ');
  t = t.replace(/[\-_]{2,}/g, ' ');
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

// Parse ISO YYYY-MM-DD to a local Date to avoid UTC shift issues
const parseISODateLocal = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
};

// Enhanced OCR text formatting for complex academic calendars
const formatOCRText = (rawText) => {
  if (!rawText) return '';
  
  console.log('[OCR] Raw text received:', rawText.substring(0, 500));
  
  let formattedText = rawText
    .replace(/[|┃│]/g, ' | ')
    .replace(/[─┬┼┴┌┐└┘├┤┼═║╔╗╚╝╠╣╦╩╬]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();

  const lines = formattedText.split('\n');
  const processedLines = [];
  
  let currentMonth = null;
  let currentYear = new Date().getFullYear();

  lines.forEach(line => {
    const monthYearMatch = line.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if (monthYearMatch) {
      currentMonth = monthYearMatch[1].toLowerCase();
      currentYear = parseInt(monthYearMatch[2], 10);
      processedLines.push(`MONTH_CONTEXT: ${currentMonth} ${currentYear}`);
    }
  });

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    processedLines.push(`LINE_${index}: ${trimmedLine}`);
    
    if (currentMonth && currentYear) {
      processedLines.push(`CONTEXT: Current context is ${currentMonth} ${currentYear}`);
    }

    const dateIndicators = [
      /\b(\d{1,2})\b/,
      /\b(\d{1,2})\s*[\-–]\s*(\d{1,2})\b/,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i,
      /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i
    ];

    const hasDateIndicator = dateIndicators.some(pattern => pattern.test(trimmedLine));
    
    if (hasDateIndicator) {
      processedLines.push(`POTENTIAL_DATE: ${trimmedLine}`);
      
      for (let i = Math.max(0, index - 2); i <= Math.min(lines.length - 1, index + 2); i++) {
        if (i !== index && lines[i].trim()) {
          processedLines.push(`NEARBY_${i - index}: ${lines[i].trim()}`);
        }
      }
    }
  });

  return processedLines.join('\n');
};

// Additional image-specific OCR cleanup to fix common OCR artifacts
const enhanceImageOCRText = (text) => {
  if (!text) return '';
  let t = String(text);
  // Common OCR misreads: I,l -> 1 when adjacent to digits; O -> 0 in numeric contexts
  t = t.replace(/(?<=\d)[Il](?=\d)/g, '1');
  t = t.replace(/(?<=\b)O(?=\d)/g, '0');
  t = t.replace(/(?<=\d)O(?=\b)/g, '0');

  // Fix broken month tokens split by pipes or spaced letters: e.g. "N o v" or "N|ov"
  t = t.replace(/\b([A-Za-z])\s+([A-Za-z])\s+([A-Za-z])\b/g, (m, a, b, c) => `${a}${b}${c}`);
  t = t.replace(/\b([A-Za-z])\|([A-Za-z]{2,})\b/g, (m, a, rest) => `${a}${rest}`);

  // Collapse sequences of single letters separated by spaces (e.g. "D e c e m b e r")
  t = t.replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (m) => m.replace(/\s+/g, ''));

  // Replace multiple pipe separators with single pipe and normalize separators around dates
  t = t.replace(/[|]{2,}/g, '|');
  t = t.replace(/\s*\|\s*/g, ' | ');

  // Normalize various dash characters to simple hyphen for date parsing
  t = t.replace(/[–—−]/g, '-');

  // Remove stray non-printables that break regexes
  t = t.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Collapse excessive whitespace but keep line breaks, then normalize each line
  t = t.split('\n').map(l => l.replace(/\s{2,}/g, ' ').trim()).filter(Boolean).join('\n');

  return t;
};

// Client-side image enhancement: draw to canvas, apply grayscale + contrast
const enhanceImageBlobViaCanvas = async (file) => {
  if (!file) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Downscale large images for faster processing but keep good resolution
        const maxWidth = 1600;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // Basic image processing: increase contrast and convert to grayscale
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const contrast = 1.35; // slight boost
        const brightness = 0; // no change
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // convert to luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // apply contrast/brightness
          gray = (gray - 128) * contrast + 128 + brightness;
          gray = Math.max(0, Math.min(255, gray));
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);

        // Optional: apply a slight unsharp mask via blur+blend could be added here

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.9);
      } catch (err) {
        console.warn('Canvas enhancement failed', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
};

// Dynamic load tesseract.js from CDN and run client-side OCR as a last-resort fallback
const loadTesseract = async () => {
  if (window.Tesseract) return window.Tesseract;
  return new Promise((resolve, reject) => {
    try {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/tesseract.js@2.1.5/dist/tesseract.min.js';
      s.async = true;
      s.onload = () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error('Tesseract failed to load'));
      };
      s.onerror = (e) => reject(new Error('Failed to load tesseract.js'));
      document.head.appendChild(s);
    } catch (e) {
      reject(e);
    }
  });
};

const runClientOCR = async (file) => {
  try {
    const T = await loadTesseract();
    // prefer a PNG blob for consistent input
    let input = file;
    if (!(file.type && file.type.startsWith('image/'))) {
      input = file;
    }
    const worker = T.createWorker({
      logger: (m) => { if (DEBUG_EXTRACTION) console.log('[TESSERACT]', m); }
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(input);
    await worker.terminate();
    return data?.text || '';
  } catch (e) {
    if (DEBUG_EXTRACTION) console.warn('Client OCR failed', e);
    return '';
  }
};

// Extract lines like "06 End Classes" or "6 | End Classes" using a month/year header
const extractDayEventPairs = (text, fileName) => {
  if (!text) return [];
  const monthMap = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let contextMonth = null;
  let contextYear = new Date().getFullYear();
  const events = [];

  // find header like "December 2025" or "December, 2025"
  for (const ln of lines.slice(0, 6)) {
    const m = ln.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s*,?\s*(\d{4})?/i);
    if (m) {
      contextMonth = monthMap[m[1].toLowerCase()];
      if (m[2]) contextYear = parseInt(m[2], 10);
      break;
    }
  }

  // parse each line for day + title
  // parse each line for day + title using column-splitting heuristics to catch picture layouts
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // normalize separators and collapse long whitespace into column markers
    line = line.replace(/[\t]+/g, ' ');
    // Some OCR outputs duplicate day tokens (e.g. "06 06"), collapse obvious duplicates
    line = line.replace(/^(\s*)(\d{1,2})\s+\2(\s+|$)/, (m, a, b, c) => `${a}${b} `);
    // replace runs of 3+ spaces with a column marker to detect two-column layouts
    const colLine = line.replace(/ {3,}/g, ' || ');

    // If the line has a column marker, split into columns
    if (colLine.includes('||')) {
      const cols = colLine.split('||').map(c => c.trim()).filter(Boolean);
      // typical: [day, title] or [day, empty, title]
      if (cols.length >= 2) {
        // try to find a day token in first column
        const first = cols[0];
        const dayMatch = first.match(/^(\d{1,2})$/) || first.match(/^(\d{1,2})\b/);
        if (dayMatch) {
          const day = Number(dayMatch[1]);
          if (day >=1 && day <=31) {
            // title may be in next non-empty column
            let titleRaw = cols.slice(1).find(Boolean) || '';
            titleRaw = titleRaw.replace(/^\s*[\-–:]+\s*/, '').trim();
            const title = cleanTitle(titleRaw || 'Extracted Event');
            const desc = cleanLabelTokens(titleRaw || line);
            const month = contextMonth || (function(){
              // search nearby for header
              for (let j = Math.max(0, i-4); j <= Math.min(lines.length-1, i+4); j++){
                const mh = lines[j].match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s*,?\s*(\d{4})?/i);
                if (mh) return monthMap[mh[1].toLowerCase()];
              }
              return String(new Date().getMonth()+1).padStart(2,'0');
            })();
            const year = (function(){
              for (let j = Math.max(0, i-4); j <= Math.min(lines.length-1, i+4); j++){
                const mh = lines[j].match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s*,?\s*(\d{4})?/i);
                if (mh && mh[2]) return parseInt(mh[2],10);
              }
              return contextYear || new Date().getFullYear();
            })();
            const iso = `${year}-${month}-${String(day).padStart(2,'0')}`;
            events.push({ date: iso, title: title.substring(0,120), description: desc });
            continue;
          }
        }
      }
    }

    // Try patterns on the raw line: '06 | Title', '06. Title', '06 Title'
    const p1 = line.match(/^\s*(\d{1,2})\s*[\.|\-|:]?\s+(.+)$/);
    const p2 = line.match(/^\s*(\d{1,2})\s*\|\s*(.+)$/);
    const p3 = line.match(/^\s*(\d{1,2})\s+(.+)$/);
    let matched = false;
    const pickMatch = (m) => {
      if (!m) return false;
      const day = Number(m[1]);
      if (Number.isNaN(day) || day < 1 || day > 31) return false;
      let titleRaw = (m[2] || '').replace(/^[\-–:]+/, '').trim();
      if (!titleRaw) return false;
      const title = cleanTitle(titleRaw);
      const desc = cleanLabelTokens(line.replace(m[0],'').trim() || titleRaw);
      let month = contextMonth;
      let year = contextYear || new Date().getFullYear();
      if (!month) {
        for (let j = Math.max(0, i - 6); j <= Math.min(lines.length -1, i + 6); j++) {
          const mh = lines[j].match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s*,?\s*(\d{4})?/i);
          if (mh) { month = monthMap[mh[1].toLowerCase()]; if (mh[2]) year = parseInt(mh[2],10); break; }
        }
      }
      if (!month) month = String(new Date().getMonth() + 1).padStart(2,'0');
      const iso = `${year}-${month}-${String(day).padStart(2,'0')}`;
      events.push({ date: iso, title: title.substring(0,120), description: desc });
      return true;
    };
    if (pickMatch(p1) || pickMatch(p2) || pickMatch(p3)) matched = true;

    // If not matched and line is a single day number, pair with next non-empty line (title)
    if (!matched && /^\d{1,2}$/.test(line)) {
      const day = Number(line);
      let nextIdx = i+1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
      const next = lines[nextIdx] || '';
      if (next && !/^\d{1,2}$/.test(next)) {
        const title = cleanTitle(next);
        let month = contextMonth || String(new Date().getMonth() + 1).padStart(2, '0');
        let year = contextYear || new Date().getFullYear();
        const iso = `${year}-${month}-${String(day).padStart(2,'0')}`;
        events.push({ date: iso, title: title.substring(0,120), description: cleanLabelTokens(next) });
      }
    }
  }

  // dedupe by date+title
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
// Comprehensive AI text preprocessing to capture ALL dates
const preprocessTextForAI = (text) => {
  if (!text) return '';
  // formatOCRText creates useful labels (LINE_x, NEARBY_, POTENTIAL_DATE:, etc.).
  // Instead of discarding those lines, extract the human-readable content after the label.
  let formatted = formatOCRText(text || '');

  // Remove wrapper tags that may have been introduced when we compose multi-part prompts
  formatted = formatted.replace(/(^|\n)\s*(MAIN_PROCESSED_TEXT|ENHANCED_OCR_TEXT|RAW_OCR_TEXT)\s*:?\s*(?=\n|$)/gi, '\n');
  // Remove lone label lines like "MAIN_PROCESSED_TEXT:" or "LINE_0:" with no trailing content
  formatted = formatted.replace(/^\s*LINE_\d+\s*:\s*$/gim, '\n');
  formatted = formatted.replace(/^\s*[A-Z0-9_]{6,}\s*:?\s*$/gm, '\n');

  const rawLines = (formatted || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const monthHeaderRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s*,?\s*(\d{4})?/i;

  const unique = [];
  const seen = new Set();

  // Helper to normalize individual extracted content
  const normalizeLine = (ln) => {
    if (!ln) return '';
    let s = ln;
    // Remove common developer narrative lead-ins
    s = s.replace(/^here (are|is)[:\s\-]+/i, '');
    s = s.replace(/^events? (and )?their dates (from the image)?:?/i, '');
    // Strip leading decorative characters like « and bullets
    s = s.replace(/^[«•\-*\u2022\u00BB\u00AB\s]+/, '');
    // Normalize em/en dashes to simple hyphen and collapse multiple spaces
    s = s.replace(/[–—]/g, '-').replace(/\s{2,}/g, ' ').trim();
    // Remove stray repeated punctuation
    s = s.replace(/\s*[-:—]\s*$/, '').trim();
    return s;
  };

  // First, if there's a direct readable list present (lines that start with a month or a day token), prefer those
  const listLike = rawLines.filter(ln => /^(?:[«\d]{1,3}|(?:January|February|March|April|May|June|July|August|September|October|November|December))/i.test(ln));

  for (const ln of rawLines) {
    if (!ln) continue;

    // If line is a labeled debug line (e.g., LINE_0: content), capture the trailing content
    let m;
    let content = '';
    if ((m = ln.match(/^MONTH_CONTEXT:\s*(.+)$/i))) {
      content = m[1];
    } else if ((m = ln.match(/^LINE_\d+:\s*(.+)$/i))) {
      content = m[1];
    } else if ((m = ln.match(/^POTENTIAL_DATE:\s*(.+)$/i))) {
      content = m[1];
    } else if ((m = ln.match(/^NEARBY_[\-\d]+:\s*(.+)$/i))) {
      content = m[1];
    } else if ((m = ln.match(/^CONTEXT:\s*(.+)$/i))) {
      content = m[1];
    } else {
      content = ln;
    }

    const normalized = normalizeLine(content);
    if (!normalized) continue;

    // If it's just a month header and we already have that header, skip duplicates
    const headerMatch = normalized.match(monthHeaderRegex);
    if (headerMatch) {
      const canonical = `${headerMatch[1]}${headerMatch[2] ? ' ' + headerMatch[2] : ''}`.replace(/\s{2,}/g,' ').trim();
      const key = canonical.toLowerCase();
      if (!seen.has(key)) {
        unique.push(canonical);
        seen.add(key);
      }
      continue;
    }

    // Drop generic narrative lines like "Here are the events..."
    if (/^here\s+(are|is)\b/i.test(normalized)) continue;

    // Avoid very short junk
    if (normalized.length <= 2) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    unique.push(normalized);
    seen.add(key);
  }

  // If formatted output was mostly debug labels and we didn't collect useful lines, fallback to using
  // the raw original text (strip obvious lead-ins) so we don't lose data
  if (unique.length === 0 && text && typeof text === 'string') {
    const fallbackLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const ln of fallbackLines) {
      const normalized = normalizeLine(ln);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      unique.push(normalized);
      seen.add(key);
    }
  }

  const result = unique.join('\n');
  console.log('[OCR] Processed text for AI (cleaned):', result.substring(0, 1000));
  return result;
};

// Comprehensive fallback extraction that catches ALL dates
const comprehensiveDateExtraction = (text, fileName) => {
  if (!text) return [];
  
  console.log('[Extraction] Starting comprehensive extraction for:', fileName);
  
  const lines = text.split('\n');
  const events = [];
  const monthMap = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
  };

  let currentMonth = null;
  let currentYear = new Date().getFullYear();
  const foundDates = new Set();

  lines.forEach(line => {
    const monthYearMatch = line.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+('?\d{4})\b/i);
    if (monthYearMatch) {
      const monthName = monthYearMatch[1].toLowerCase();
      currentMonth = monthMap[monthName];
      currentYear = parseInt(monthYearMatch[2].replace("'", ""), 10);
      console.log('[Extraction] Found context:', currentMonth, currentYear);
    }
  });

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    console.log('[Extraction] Processing line:', trimmedLine);

    // Pattern 1: Full dates
    const fullDatePatterns = [
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})\b/gi,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})\b/gi
    ];

    fullDatePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(trimmedLine)) !== null) {
        const monthName = match[1].toLowerCase();
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const month = monthMap[monthName];
        
        if (month && day && year) {
          const date = new Date(year, month - 1, day);
          const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          if (!foundDates.has(isoDate)) {
            foundDates.add(isoDate);
            
            let title = trimmedLine.replace(match[0], '').trim();
            if (!title || title.length < 3) {
              for (let i = Math.max(0, index - 2); i <= Math.min(lines.length - 1, index + 2); i++) {
                if (i !== index && lines[i].trim() && !lines[i].match(/\b\d{1,2}[\-–]\d{1,2}\b/)) {
                  title = cleanTitle(lines[i].trim());
                  if (title && title.length > 3) break;
                }
              }
            }
            
            events.push({
              date: isoDate,
              title: title || 'Calendar Event',
              description: `Extracted from: ${trimmedLine}`
            });
            console.log('[Extraction] Found full date:', isoDate, title);
          }
        }
      }
    });

    // Pattern 2: Day-only entries
    const dayOnlyPattern = /^\s*(\d{1,2})\s*$/;
    const dayOnlyMatch = trimmedLine.match(dayOnlyPattern);
    if (dayOnlyMatch && currentMonth) {
      const day = parseInt(dayOnlyMatch[1], 10);
      const isoDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (!foundDates.has(isoDate)) {
        foundDates.add(isoDate);
        
        let bestTitle = 'Academic Event';
        let bestScore = 0;
        
        for (let i = Math.max(0, index - 3); i <= Math.min(lines.length - 1, index + 3); i++) {
          if (i !== index) {
            const contextLine = lines[i].trim();
            if (contextLine && !contextLine.match(/^\s*\d{1,2}\s*$/) && 
                !contextLine.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}\b/i)) {
              
              const cleanContext = cleanLabelTokens(contextLine);
              if (cleanContext.length > 3) {
                let score = cleanContext.length;
                if (cleanContext.match(/deadline|exam|final|grade|submission|holiday|feast|day|classes|commencement/gi)) {
                  score += 100;
                }
                if (cleanContext.match(/^[A-Z]/)) {
                  score += 50;
                }
                
                if (score > bestScore) {
                  bestScore = score;
                  bestTitle = cleanTitle(cleanContext);
                }
              }
            }
          }
        }
        
        events.push({
          date: isoDate,
          title: bestTitle,
          description: `Extracted from ${fileName}: Day ${day} of ${currentMonth}/${currentYear}`
        });
        console.log('[Extraction] Found day-only date:', isoDate, bestTitle);
      }
    }

    // Pattern 3: Date ranges
    const rangePattern = /\b(\d{1,2})\s*[\-–]\s*(\d{1,2})\b/g;
    let rangeMatch;
    while ((rangeMatch = rangePattern.exec(trimmedLine)) !== null) {
      const startDay = parseInt(rangeMatch[1], 10);
      const endDay = parseInt(rangeMatch[2], 10);
      
      if (currentMonth && startDay && endDay && startDay <= endDay) {
        let rangeTitle = 'Event Period';
        for (let i = Math.max(0, index - 2); i <= Math.min(lines.length - 1, index + 2); i++) {
          const contextLine = lines[i].trim();
          if (contextLine && contextLine.length > 10 && 
              !contextLine.match(/\b\d{1,2}[\-–]\d{1,2}\b/) &&
              !contextLine.match(/^\s*\d{1,2}\s*$/)) {
            rangeTitle = cleanTitle(contextLine);
            break;
          }
        }
        
        for (let day = startDay; day <= endDay; day++) {
          const isoDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          if (!foundDates.has(isoDate)) {
            foundDates.add(isoDate);
            events.push({
              date: isoDate,
              title: rangeTitle,
              description: `Extracted from ${fileName}: ${trimmedLine} (Day ${day})`
            });
            console.log('[Extraction] Found range date:', isoDate, rangeTitle);
          }
        }
      }
    }

    // Pattern 4: Bullet lists with dates
    const bulletWithDate = /^[\s]*[-•*]\s+(\d{1,2})\s*$/;
    const bulletMatch = trimmedLine.match(bulletWithDate);
    if (bulletMatch && currentMonth) {
      const day = parseInt(bulletMatch[1], 10);
      const isoDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (!foundDates.has(isoDate)) {
        foundDates.add(isoDate);
        
        let bulletTitle = 'Listed Event';
        for (let i = index - 1; i >= Math.max(0, index - 5); i--) {
          const prevLine = lines[i].trim();
          if (prevLine.match(/^[\s]*[-•*]\s+[^\d]/)) {
            bulletTitle = cleanTitle(prevLine.replace(/^[\s]*[-•*]\s+/, ''));
            break;
          }
        }
        
        events.push({
          date: isoDate,
          title: bulletTitle,
          description: `Extracted from ${fileName}: ${trimmedLine}`
        });
        console.log('[Extraction] Found bullet date:', isoDate, bulletTitle);
      }
    }
  });

  console.log('[Extraction] Total events found:', events.length);
  return events;
};

export default function Calendar(){
  const { 
    darkMode, 
    getThemeColors 
  } = useSettings();
  
  const themeColors = getThemeColors();

  const upcomingRef = useRef(null);
  const statsRef = useRef(null);
  const [upcomingVisible, setUpcomingVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  
  const [events, setEvents] = useState([]);
  // Debugging states to inspect OCR/preprocessing/extraction
  const [showOcrDebug, setShowOcrDebug] = useState(false);
  const [lastFileText, setLastFileText] = useState('');
  const [lastProcessedText, setLastProcessedText] = useState('');
  const [lastEarlyEvents, setLastEarlyEvents] = useState([]);
  const [lastAIEvents, setLastAIEvents] = useState([]);
  const { refresh: refreshGlobalReminders } = useReminders();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmModalEventIds, setConfirmModalEventIds] = useState(null); // for list modal selection
  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState(() => new Set()); // stores ISO yyyy-mm-dd
  const [selectedEventIds, setSelectedEventIds] = useState(() => new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Preview modal state for extracted events
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState([]);
  const [previewFileName, setPreviewFileName] = useState('');
  useEffect(() => {
    const anyOpen = isModalOpen || isListModalOpen;
    if (anyOpen) {
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
      if (document.body.dataset.prevOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.prevOverflow;
        delete document.body.dataset.prevOverflow;
      } else {
        document.body.style.overflow = '';
      }
    };
  }, [isModalOpen, isListModalOpen]);
  
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  // Ref for improved upload box (choose file)
  const uploadInputRef = useRef(null);

  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (_) { return {}; }
  };

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
          reminder: !!doc.reminder,
          reminderOffsetMinutes: doc.reminderOffsetMinutes != null ? doc.reminderOffsetMinutes : null,
          reminderAt: doc.reminderAt ? new Date(doc.reminderAt) : null
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

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
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
            reminder: !!saved.reminder,
            reminderOffsetMinutes: saved.reminderOffsetMinutes != null ? saved.reminderOffsetMinutes : null,
            reminderAt: saved.reminderAt ? new Date(saved.reminderAt) : null
          };
          setEvents(events.map(e => e.id === eventData.id ? mapped : e));
          setNotification({ message: 'Event updated successfully.', type: 'eventsfound' });
          window.dispatchEvent(new Event('eventsChanged'));
          refreshGlobalReminders();
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
            reminder: !!saved.reminder,
            reminderOffsetMinutes: saved.reminderOffsetMinutes != null ? saved.reminderOffsetMinutes : null,
            reminderAt: saved.reminderAt ? new Date(saved.reminderAt) : null
          };
          setEvents([...events, mapped]);
          setNotification({ message: 'Event added successfully.', type: 'eventsfound' });
          window.dispatchEvent(new Event('eventsChanged'));
          refreshGlobalReminders();
        }
      } catch (err) {
        console.warn('Persist event failed, applying local update only:', err?.message || err);
        if (eventData.id && events.find(e => e.id === eventData.id)) {
          setEvents(events.map(e => e.id === eventData.id ? eventData : e));
          setNotification({ message: 'Event updated locally (save failed).', type: 'eventsfound' });
        } else {
          setEvents([...events, eventData]);
          setNotification({ message: 'Event added locally (save failed).', type: 'eventsfound' });
        }
        window.dispatchEvent(new Event('eventsChanged'));
        refreshGlobalReminders();
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
      window.dispatchEvent(new Event('eventsChanged'));
      refreshGlobalReminders();
    }
  };

  // Helpers for bulk selection
  const dateToISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode clears selections
      setSelectedDates(new Set());
      setSelectedEventIds(new Set());
    }
    setSelectionMode(!selectionMode);
  };
  const toggleDateSelected = (dateObj) => {
    const iso = dateToISO(dateObj);
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  };
  const toggleEventSelected = (eventId) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
      return next;
    });
  };
  const effectiveBulkEventIds = () => {
    const ids = new Set(selectedEventIds);
    if (selectedDates.size) {
      events.forEach(ev => {
        const iso = dateToISO(ev.date);
        if (selectedDates.has(iso)) ids.add(ev.id);
      });
    }
    return Array.from(ids);
  };
  const bulkSelectedCounts = () => {
    const dateCount = selectedDates.size;
    const explicitEventCount = selectedEventIds.size;
    const totalEventIds = effectiveBulkEventIds().length;
    return { dateCount, explicitEventCount, totalEventIds };
  };
  const initiateBulkDelete = () => {
    const { totalEventIds } = bulkSelectedCounts();
    if (!totalEventIds) return;
    setConfirmBulkDelete(true);
  };
  const performBulkDelete = async () => {
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    const datesArr = Array.from(selectedDates);
    const eventIdsArr = effectiveBulkEventIds();
    try {
      if ((datesArr.length || eventIdsArr.length) && headers.Authorization) {
        await axios.post('/api/events/bulk-delete', { dates: datesArr, eventIds: eventIdsArr }, { headers });
      }
    } catch (err) {
      console.warn('Bulk delete API failed, applying local filter only:', err?.message || err);
    } finally {
      const dateSet = new Set(datesArr);
      const eventIdSet = new Set(eventIdsArr);
      setEvents(events.filter(ev => !eventIdSet.has(ev.id) && !dateSet.has(dateToISO(ev.date))));
      setNotification({ message: `Deleted ${eventIdsArr.length} event(s).`, type: 'info' });
      setConfirmBulkDelete(false);
      setSelectionMode(false);
      setSelectedDates(new Set());
      setSelectedEventIds(new Set());
      window.dispatchEvent(new Event('eventsChanged'));
      refreshGlobalReminders();
    }
  };

  // Bulk delete specifically from EventListModal selection
  const bulkDeleteSpecific = async (ids) => {
    if (!Array.isArray(ids) || !ids.length) return;
    setConfirmModalEventIds(ids);
  };
  const confirmBulkDeleteSpecific = async () => {
    const ids = confirmModalEventIds || [];
    const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    try {
      if (ids.length && headers.Authorization) {
        await axios.post('/api/events/bulk-delete', { eventIds: ids }, { headers });
      }
    } catch (err) {
      console.warn('Modal bulk delete API failed, removing locally only:', err?.message || err);
    } finally {
      const idSet = new Set(ids);
      setEvents(events.filter(ev => !idSet.has(ev.id)));
      setNotification({ message: `Deleted ${ids.length} event(s).`, type: 'info' });
      setConfirmModalEventIds(null);
      setIsListModalOpen(false);
      window.dispatchEvent(new Event('eventsChanged'));
      refreshGlobalReminders();
    }
  };

  // Confirmed save from preview modal: selected extracted events -> persist
  const handleConfirmPreviewSave = async (selected) => {
    setPreviewModalOpen(false);
    if (!Array.isArray(selected) || selected.length === 0) {
      setNotification({ message: 'No events selected to add.', type: 'info' });
      return;
    }
    // Normalize and dedupe against existing events
    const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const existingKeys = new Set(events.map(ev => `${toISO(ev.date)}-${normalizeTitleKey(ev.title || '')}`));
    const newKeys = new Set();
    const createPayload = [];
    selected.forEach(ev => {
      const normalizedTitle = normalizeTitleKey(ev.title || '');
      const key = `${ev.date}-${normalizedTitle}`;
      if (!newKeys.has(key) && !existingKeys.has(key)) {
        newKeys.add(key);
        createPayload.push({
          title: cleanTitle(ev.title || 'Extracted Event'),
          description: cleanLabelTokens(ev.description || ''),
          date: parseISODateLocal(ev.date).toISOString(),
          category: 'study',
          priority: 'medium',
          time: '',
          reminder: false
        });
      }
    });

    if (createPayload.length === 0) {
      setNotification({ message: 'No new events to add (duplicates removed).', type: 'nonevents' });
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      let savedDocs = [];
      if (headers.Authorization) {
        const res = await axios.post('/api/events', createPayload, { headers });
        savedDocs = Array.isArray(res.data) ? res.data : [];
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
          reminder: !!d.reminder,
          reminderOffsetMinutes: d.reminderOffsetMinutes != null ? d.reminderOffsetMinutes : null,
          reminderAt: d.reminderAt ? new Date(d.reminderAt) : null
        }));
        setEvents([...events, ...mapped]);
        setNotification({ message: `Added ${mapped.length} event${mapped.length !== 1 ? 's' : ''} from ${previewFileName}`, type: 'eventsfound' });
        window.dispatchEvent(new Event('eventsChanged'));
        refreshGlobalReminders();
      } else {
        // fallback local add
        const localEvents = createPayload.map((p, i) => ({
          id: Date.now() + i,
          title: p.title,
          description: p.description,
          date: new Date(p.date),
          time: p.time,
          priority: p.priority,
          category: p.category,
          reminder: p.reminder,
          reminderOffsetMinutes: p.reminderOffsetMinutes != null ? p.reminderOffsetMinutes : null,
          reminderAt: null
        }));
        setEvents([...events, ...localEvents]);
        setNotification({ message: `Added ${localEvents.length} event${localEvents.length !== 1 ? 's' : ''} from ${previewFileName}`, type: 'eventsfound' });
        window.dispatchEvent(new Event('eventsChanged'));
        refreshGlobalReminders();
      }
    } catch (err) {
      console.warn('Failed to save preview events, adding locally', err?.message || err);
      const localEvents = createPayload.map((p, i) => ({
        id: Date.now() + i,
        title: p.title,
        description: p.description,
        date: new Date(p.date),
        time: p.time,
        priority: p.priority,
        category: p.category,
        reminder: p.reminder,
        reminderOffsetMinutes: p.reminderOffsetMinutes != null ? p.reminderOffsetMinutes : null,
        reminderAt: null
      }));
      setEvents([...events, ...localEvents]);
      setNotification({ message: `Added ${localEvents.length} event${localEvents.length !== 1 ? 's' : ''} locally from ${previewFileName}`, type: 'eventsfound' });
      window.dispatchEvent(new Event('eventsChanged'));
      refreshGlobalReminders();
    }
  };

  const handleDeleteEvent = (eventId) => {
    setConfirmDeleteId(eventId);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(viewYear, viewMonth, day);
    // In selection mode: just toggle date selection, never open any modals
    if (selectionMode) {
      toggleDateSelected(clickedDate);
      return;
    }
    const dayEvents = getEventsForDay(day);
    setSelectedDate(clickedDate);
    if (dayEvents.length === 0) {
      setSelectedEvent(null);
      setIsModalOpen(true);
    } else if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
      setIsModalOpen(true);
    } else {
      setSelectedEvent(null);
      setIsListModalOpen(true);
    }
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    // Prevent opening event modal while in selection mode
    if (selectionMode) return;
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsModalOpen(true);
    setIsListModalOpen(false);
  };

  // IMAGE-ONLY UPLOAD HANDLER
  const handleCalendarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Accept only images (keep UX-friendly message)
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    if (!fileType.startsWith('image/') && !fileName.match(/\.(png|jpg|jpeg|gif|bmp|tiff|tif|webp)$/i)) {
      setNotification({ message: 'Please upload only image files (PNG, JPG, JPEG, GIF, BMP, TIFF, WebP)', type: 'error' });
      e.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setNotification({ message: 'Image too large. Please use images under 15MB.', type: 'error' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      // Upload image to server OCR endpoint (server handles enhancement and tesseract)
      const formData = new FormData();
      formData.append('image', file);
      const imgRes = await axios.post('/api/image/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const rawText = (imgRes?.data?.text || '').trim();
      if (!rawText) {
        setNotification({ message: `No readable text found in ${file.name}`, type: 'error' });
        return;
      }

      // Send OCR text to AI service for structured extraction
      const safeText = rawText.length > 14000 ? rawText.substring(0, 14000) : rawText;
      const prompt = `You are given OCR text extracted from a calendar image. Extract every date and its related event title and a short description (if available). Return ONLY a JSON array like this:\n[ { "date": "YYYY-MM-DD", "title": "Event title", "description": "context or notes" } ]\nIf a date is a range (e.g. Dec 1-3), expand it to individual dates. Use ISO dates (YYYY-MM-DD).\n\nOCR_TEXT:\n${safeText}`;

      let aiRes = { data: { reply: '' } };
      try {
        aiRes = await axios.post('/api/ai', { prompt });
      } catch (err) {
        console.warn('AI request failed:', err?.message || err);
      }

      const aiReply = (aiRes?.data?.reply || '').trim();
      let eventsFromAi = [];
      try {
        const jsonMatch = aiReply.match(/\[[\s\S]*?\]/);
        if (jsonMatch) eventsFromAi = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.warn('Failed to parse AI response as JSON', err);
      }

      if (Array.isArray(eventsFromAi) && eventsFromAi.length) {
        setPreviewEvents(eventsFromAi);
        setPreviewFileName(file.name);
        setPreviewModalOpen(true);
      } else {
        setNotification({ message: `No events could be extracted from ${file.name}`, type: 'nonevents' });
      }
    } catch (err) {
      console.error('Calendar image upload error:', err);
      setNotification({ message: `Failed to process image: ${file.name}\nError: ${err?.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
      window.dispatchEvent(new Event('eventsChanged'));
      refreshGlobalReminders();
    }
  };

  const getEventsForDay = (day) => {
    return events.filter(ev => {
      const d = ev.date;
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  };

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

  const getPriorityIndicator = (priority) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return event.title.toLowerCase().includes(searchLower) ||
           event.description?.toLowerCase().includes(searchLower) ||
           event.category?.toLowerCase().includes(searchLower);
  });

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

  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === viewYear && 
           today.getMonth() === viewMonth && 
           today.getDate() === day;
  };

  useEffect(() => {
    const options = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === upcomingRef.current) setUpcomingVisible(true);
          if (entry.target === statsRef.current) setStatsVisible(true);
        }
      });
    }, options);
    if (upcomingRef.current) observer.observe(upcomingRef.current);
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

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
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 ${selectionMode ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} rounded-lg transition-colors text-sm font-medium`}
            >
              {selectionMode ? 'Exit Select Mode' : 'Select Mode'}
            </button>
            {selectionMode && (bulkSelectedCounts().totalEventIds > 0) && (
              <button
                onClick={initiateBulkDelete}
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium`}
              >
                {selectedEventIds.size === 0 && selectedDates.size > 0
                  ? `Delete Selected Dates (${bulkSelectedCounts().totalEventIds} events)`
                  : `Delete Selected (${bulkSelectedCounts().totalEventIds})`}
              </button>
            )}
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
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Calendar Image:</label>
              <input 
                type="file" 
                accept=".png,.jpg,.jpeg,.gif,.bmp,.tiff,.tif,.webp,image/*" 
                onChange={handleCalendarUpload} 
                className={`file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:${themeColors.light} file:${themeColors.text} hover:file:${themeColors.hover} file:cursor-pointer cursor-pointer text-sm`} 
                title="Upload calendar images only (PNG, JPG, JPEG, GIF, BMP, TIFF, WebP)"
              />
              <button
                onClick={() => setShowOcrDebug(!showOcrDebug)}
                className={`ml-2 px-3 py-1 rounded-lg text-xs ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                title="Toggle OCR debug view"
              >
                {showOcrDebug ? 'Hide OCR Debug' : 'Show OCR Debug'}
              </button>
              {uploading && (
                <div className={`flex items-center gap-2 ${themeColors.text}`}>
                  <div className={`w-4 h-4 border-2 border-${themeColors.primary}-600 border-t-transparent rounded-full animate-spin`}></div>
                  <span className="text-sm">Processing Image...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OCR Debug Panel */}
        {showOcrDebug && (
          <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow`}>
            <h3 className="font-medium mb-2">OCR Debug</h3>
            <div className="mb-2">
              <strong>Raw / Preprocessed OCR:</strong>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-1" style={{whiteSpace: 'pre-wrap'}}>{lastFileText || '(empty)'}</pre>
            </div>
            <div className="mb-2">
              <strong>Processed Text for AI:</strong>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-1" style={{whiteSpace: 'pre-wrap'}}>{lastProcessedText || '(empty)'}</pre>
            </div>
            <div className="mb-2">
              <strong>Early Extracted Events (ranges / day pairs):</strong>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-1">{JSON.stringify(lastEarlyEvents || [], null, 2)}</pre>
            </div>
            <div>
              <strong>AI / Final Extracted Events:</strong>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-1">{JSON.stringify(lastAIEvents || [], null, 2)}</pre>
            </div>
          </div>
        )}

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

        {/* Preview modal for extracted events */}
        <EventPreviewModal
          isOpen={previewModalOpen}
          events={previewEvents}
          fileName={previewFileName}
          darkMode={darkMode}
          onClose={() => { setPreviewModalOpen(false); setPreviewEvents([]); setPreviewFileName(''); }}
          onConfirm={handleConfirmPreviewSave}
        />

        {/* Calendar grid with year/month selectors */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 mb-8 animate-fade-up`}>
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
                  className={`relative h-20 flex flex-col border rounded-lg cursor-pointer transition-all p-1 ${
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
                  {selectionMode && d && (
                    <div className="absolute top-1 left-1">
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        checked={selectedDates.has(dateToISO(new Date(viewYear, viewMonth, d)))}
                        onChange={(e) => { e.stopPropagation(); toggleDateSelected(new Date(viewYear, viewMonth, d)); }}
                        className="h-4 w-4"
                      />
                    </div>
                  )}
                  
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
                          {/* Event-level selection checkboxes hidden per requirement; selection limited to dates */}
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
          <div ref={upcomingRef} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 ${upcomingVisible ? 'animate-fade-up duration-1500' : 'opacity-0 translate-y-4'}`}>
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

          <div ref={statsRef} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow p-6 ${statsVisible ? 'animate-fade-up duration-1500' : 'opacity-0 translate-y-4'}`}>
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

        <EventListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          events={selectedDate ? events.filter(ev => ev.date.getFullYear() === selectedDate.getFullYear() && ev.date.getMonth() === selectedDate.getMonth() && ev.date.getDate() === selectedDate.getDate()) : []}
          date={selectedDate}
          onSelect={(ev) => { setSelectedEvent(ev); setIsModalOpen(true); setIsListModalOpen(false); }}
          onAddNew={() => { setSelectedEvent(null); setIsModalOpen(true); setIsListModalOpen(false); }}
          onDeleteAll={(date) => setConfirmDeleteDate(date)}
          darkMode={darkMode}
          themeColors={themeColors}
          onRequestBulkDelete={(ids) => bulkDeleteSpecific(ids)}
        />
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
        <ConfirmModal
          open={Array.isArray(confirmModalEventIds) && confirmModalEventIds.length > 0}
          title="Delete Selected Events"
          description={`Delete ${confirmModalEventIds?.length || 0} event(s) from this date? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmModalEventIds(null)}
          onConfirm={confirmBulkDeleteSpecific}
          darkMode={darkMode}
        />
        <ConfirmModal
          open={confirmBulkDelete}
          title="Delete Selected Events"
          description={() => {
            const { dateCount, explicitEventCount, totalEventIds } = bulkSelectedCounts();
            return `You are about to delete ${totalEventIds} event(s) from ${dateCount} date(s) and ${explicitEventCount} individually selected event(s). This cannot be undone.`;
          }}
          confirmLabel="Delete"
          onCancel={() => setConfirmBulkDelete(false)}
          onConfirm={() => performBulkDelete()}
          darkMode={darkMode}
        />
      </main>
    </div>
  );
}