import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'
import ChatWidget from '../components/ChatWidget'
import { useSettings } from '../context/SettingsContext'
import axios from 'axios'

// Event Modal Component
function EventModal({ isOpen, onClose, event, onSave, onDelete, date, darkMode, themeColors }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    priority: 'medium',
    category: 'general',
    reminder: false
  });

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
    } else {
      setFormData({
        title: '',
        description: '',
        time: '',
        priority: 'medium',
        category: 'general',
        reminder: false
      });
    }
  }, [event, isOpen]);

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave({
      ...formData,
      id: event?.id || Date.now(),
      date: date
    });
    onClose();
  };

  const handleDelete = () => {
    if (event && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
      onClose();
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
                <label className={`block text-sm font-medium mb-1`} style={{ color: 'var(--text)' }}>Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className={`w-full p-2.5 border rounded-lg`}
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'rgba(0,0,0,0.06)' }}
                />
              </div>

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

          <div className="flex gap-2 mt-5">
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState('month'); // month, week, day
  const [searchTerm, setSearchTerm] = useState('');

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
    if (eventData.id && events.find(e => e.id === eventData.id)) {
      // Update existing event
      setEvents(events.map(e => e.id === eventData.id ? eventData : e));
    } else {
      // Add new event
      setEvents([...events, eventData]);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(clickedDate);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsModalOpen(true);
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
        alert(`File uploaded but no readable text found in ${file.name}`);
        setUploading(false);
        return;
      }

      // Comprehensive text preprocessing for AI
      const processedText = preprocessTextForAI(fileText);
      const fullText = processedText.substring(0, 8000); // Significantly increased limit to capture ALL dates
      
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
        alert(`No calendar content detected in ${file.name}`);
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
      
      const aiRes = await axios.post('/api/ai', { prompt });
      let aiEvents = [];
      
      try {
        const aiResponse = aiRes.data.reply.trim();
        
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
          /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(st|nd|rd|th)?\s*,?\s*(\d{2,4})\b/gi
        ];
        
        const monthMap = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        lines.forEach((line, index) => {
          // Extract ALL dates from each line
          allDatePatterns.forEach(pattern => {
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
              } else if (pattern === allDatePatterns[4]) { // Aug 19, Sep 2
                const [, month, day] = match;
                const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
                const currentYear = new Date().getFullYear();
                dateStr = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[5]) { // 25 Dec
                const [, day, month] = match;
                const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
                const currentYear = new Date().getFullYear();
                dateStr = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
              } else if (pattern === allDatePatterns[6]) { // 14-Jun-25
                const parts = match[0].split('-');
                const day = parts[0];
                const month = monthMap[parts[1].toLowerCase()];
                const year = `20${parts[2]}`;
                dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
              }
              
              // Smart title extraction from calendar context
              let rawLine = line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim();
              let titleParts = rawLine.replace(match[0], '').replace(/\|/g, ' ').trim();
              
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
                    const cleanContext = contextLine
                      .replace(/\|/g, ' ')
                      .replace(/^\s*[-|•]\s*/, '')
                      .replace(/\s*[-|•]\s*$/, '')
                      .replace(/\s{2,}/g, ' ')
                      .trim();
                    
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
                  title: title.substring(0, 60) || 'Extracted Event',
                  description: `${time ? 'Time: ' + time + '. ' : ''}Extracted from ${file.name} - Line: "${line.replace(/DATE_CONTENT:|TABLE_ROW:|TIME_INFO:|TEXT:/, '').trim()}"`
                });
              }
            }
          });
        });
        
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
      // Quick event creation
      if (aiEvents.length > 0) {
        const newEvents = aiEvents.map((ev, index) => ({
          ...ev,
          id: Date.now() + index,
          date: new Date(ev.date),
          category: 'study',
          priority: 'medium',
          time: '',
          reminder: false
        }));

        setEvents([...events, ...newEvents]);
        alert(`✅ Added ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from ${file.name}`);
      } else {
        alert(`📄 File processed - no events found in ${file.name}`);
      }
      
    } catch (err) {
      console.error('Calendar file upload error:', err);
      alert(`Failed to process file: ${file.name}\n\nError: ${err.message || 'Unknown error'}\n\nPlease try a different file or check the file format.`);
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
          <div>
            <h1 className={`text-4xl font-bold mt-6 bg-gradient-to-r ${themeColors.gradient} bg-clip-text text-transparent`}>Smart Calendar</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your study schedule with intelligent event organization</p>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {setSelectedDate(new Date()); setSelectedEvent(null); setIsModalOpen(true);}}
              className={`px-4 py-2 bg-${themeColors.primary}-600 text-white rounded-lg hover:bg-${themeColors.primary}-700 transition-colors flex items-center gap-2`}
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
                onClick={() => setViewMonth(viewMonth === 0 ? 11 : viewMonth - 1)} 
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
                onClick={() => setViewMonth(viewMonth === 11 ? 0 : viewMonth + 1)} 
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

        {/* Event Modal */}
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          date={selectedDate}
          darkMode={darkMode}
          themeColors={themeColors}
        />
      </main>
    </div>
  );
}
