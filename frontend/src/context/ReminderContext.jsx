import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSettings } from './SettingsContext';

// Global reminder modal & scheduler using new fields (reminderOffsetMinutes, reminderAt)
const ReminderContext = createContext({ refresh: () => {} });

export function ReminderProvider({ children }) {
  const { darkMode } = useSettings();
  const [events, setEvents] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null); // { id, title, description, time, date }
  const timersRef = useRef([]);

  const getAuthHeaders = () => {
    try { const token = localStorage.getItem('token'); return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
  };

  const loadEvents = async () => {
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
        reminder: !!doc.reminder,
        reminderOffsetMinutes: doc.reminderOffsetMinutes != null ? doc.reminderOffsetMinutes : null,
        reminderAt: doc.reminderAt ? new Date(doc.reminderAt) : null
      }));
      setEvents(mapped);
    } catch (_) { /* silent */ }
  };

  useEffect(() => {
    loadEvents();
    const onAuthChanged = () => loadEvents();
    const onEventsChanged = () => loadEvents();
    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('eventsChanged', onEventsChanged);
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('eventsChanged', onEventsChanged);
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const computeEventDateTime = (ev) => {
    const dt = new Date(ev.date);
    if (ev.time && /^(\d{2}):(\d{2})$/.test(ev.time)) {
      const [hh, mm] = ev.time.split(':').map(Number);
      dt.setHours(hh, mm, 0, 0);
    }
    return dt;
  };

  const scheduleAll = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    const now = Date.now();
    events.forEach(ev => {
      if (!ev.reminder) return;
      const eventDT = computeEventDateTime(ev);
      let fireMs;
      if (ev.reminderOffsetMinutes != null) {
        fireMs = eventDT.getTime() - ev.reminderOffsetMinutes * 60000;
      } else if (ev.reminderAt) {
        fireMs = ev.reminderAt.getTime();
      } else {
        fireMs = eventDT.getTime();
      }
      const delay = fireMs - now;
      if (delay <= 0) return; // past
      const timer = setTimeout(() => {
        setActiveReminder({ id: ev.id, title: ev.title, description: ev.description, time: ev.time, date: eventDT });
      }, delay);
      timersRef.current.push(timer);
    });
  };

  useEffect(() => { scheduleAll(); }, [events]);

  const dismissReminder = () => setActiveReminder(null);

  return (
    <ReminderContext.Provider value={{ refresh: loadEvents }}>
      {children}
      {activeReminder && (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="absolute inset-0 backdrop-blur-sm backdrop-brightness-75" onClick={dismissReminder} />
        <div className={`relative w-full max-w-md rounded-xl shadow-xl p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                className="text-white"
              >
                <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
                <circle cx="12" cy="13" r="8" />
                <path d="M12 8.5v5l3 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl py-2 font-bold mb-1">Upcoming Event</h2>
              <p className="text-xl font-medium whitespace-normal break-words overflow-hidden py-2">{activeReminder.title}</p>
              {activeReminder.time && <p className="text-lg mt-1 opacity-80">Starts at {activeReminder.time}</p>}
              <p className="text-lg mt-1 opacity-70">{activeReminder.date.toLocaleDateString()} {activeReminder.time || ''}</p>
              {activeReminder.description && (
                <p className="text-xs mt-2 leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto">{activeReminder.description}</p>
              )}
            </div>
          </div>
          <div className="mt-6 text-right gap-2">
            <button onClick={dismissReminder} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>Dismiss</button>
          </div>
        </div>
      </div>
      )}
    </ReminderContext.Provider>
  );
}

export const useReminders = () => useContext(ReminderContext);