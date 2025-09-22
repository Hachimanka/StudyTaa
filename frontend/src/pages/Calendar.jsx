import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import axios from 'axios'

export default function Calendar(){
  // Calendar state
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);

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

  // Handle manual event add
  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title) return;
    setEvents([...events, {
      date: new Date(viewYear, viewMonth, selectedDate),
      title: newEvent.title,
      description: newEvent.description
    }]);
    setNewEvent({ title: '', description: '' });
    setSelectedDate(null);
  };

  // Handle school calendar upload and AI extraction
  const handleCalendarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      let fileText = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Backend PDF extraction
        const formData = new FormData();
        formData.append('pdf', file);
        const pdfRes = await axios.post('/api/pdf/extract-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileText = pdfRes.data.text;
      } else if (file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg)$/i)) {
        // Image file: send to backend for OCR
        const formData = new FormData();
        formData.append('image', file);
        const imgRes = await axios.post('/api/image/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileText = imgRes.data.text;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.match(/\.docx?$/i)) {
        // Word file: send to backend for extraction
        const formData = new FormData();
        formData.append('word', file);
        const wordRes = await axios.post('/api/word/extract-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileText = wordRes.data.text;
      } else {
        // Text file
        fileText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = () => reject('Read error');
          reader.readAsText(file);
        });
      }
      // Send to AI backend for event extraction
      const prompt = `Extract all important school calendar events from the following text. For each event, return date, title, and description. Format: [{date: "YYYY-MM-DD", title: "Midterm", description: "Midterm exam"}, ...]\nText:\n${fileText}`;
      const aiRes = await axios.post('/api/ai', { prompt });
      let aiEvents = [];
      try {
        aiEvents = JSON.parse(aiRes.data.reply);
      } catch (e) {
        console.error('AI calendar parse error:', e, aiRes.data.reply);
        alert('AI did not return valid events. Raw reply: ' + aiRes.data.reply);
        aiEvents = [];
      }
      // Convert date strings to Date objects
      setEvents([
        ...events,
        ...aiEvents.map(ev => ({
          ...ev,
          date: new Date(ev.date)
        }))
      ]);
    } catch (err) {
      console.error('Calendar file upload error:', err);
      alert('Failed to process calendar file. See console for details.');
    }
    setUploading(false);
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(ev => {
      const d = ev.date;
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-12 ml-20 md:ml-30">
        <ChatWidget />
        <h1 className="text-4xl font-bold mt-6">Calendar</h1>
        <p className="mt-2 text-gray-600">Manage study schedule and import school events</p>

        {/* Upload button */}
        <div className="mb-6 flex items-center gap-4">
          <label className="block text-sm font-medium text-gray-700">Upload School Calendar</label>
          <input type="file" accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,image/*" onChange={handleCalendarUpload} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
          {uploading && <span className="text-teal-600">Processing...</span>}
        </div>

        {/* Calendar grid with year/month selectors */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1)} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">&#8592;</button>
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} className="p-1 rounded border">
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i}>{new Date(viewYear, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} className="p-1 rounded border">
                {[...Array(11)].map((_, i) => {
                  const y = new Date().getFullYear() - 5 + i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
              <button onClick={() => setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1)} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">&#8594;</button>
            </div>
            <span className="text-xl font-semibold text-teal-700">{new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })} {viewYear}</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-center font-medium text-gray-500">{d}</div>
            ))}
            {weeks.map((week, wi) => week.map((d, di) => (
              <div key={wi + '-' + di} className={`h-16 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-all ${d ? 'hover:bg-teal-50' : 'bg-gray-50'} ${selectedDate === d ? 'border-teal-500 bg-teal-100' : 'border-gray-200'}`} onClick={() => d && setSelectedDate(d)}>
                <span className={`text-lg font-bold ${d ? 'text-gray-800' : 'text-gray-300'}`}>{d || ''}</span>
                {/* Show events for this day */}
                {d && getEventsForDay(d).map((ev, i) => (
                  <span key={i} className="mt-1 px-2 py-1 rounded bg-teal-200 text-teal-900 text-xs font-semibold">{ev.title}</span>
                ))}
              </div>
            )))}
          </div>
        </div>

        {/* Add event form */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Add Event for {new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })} {selectedDate}, {viewYear}</h2>
            <input type="text" placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full mb-2 p-2 border rounded" />
            <input type="text" placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full mb-2 p-2 border rounded" />
            <button onClick={handleAddEvent} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">Add Event</button>
          </div>
        )}

        {/* List of all events */}
        {events.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">All Events</h2>
            <ul className="space-y-2">
              {events.map((ev, i) => (
                <li key={i} className="border-b pb-2">
                  <span className="font-bold text-teal-700">{ev.title}</span> <span className="text-gray-500">({ev.date.toLocaleDateString()})</span>
                  <div className="text-gray-700 text-sm">{ev.description}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
