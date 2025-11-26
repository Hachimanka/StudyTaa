import React, { useState, useEffect, useRef } from 'react';
import FlashCardMode from '../components/studyModes/FlashCardMode';
import QuizMode from '../components/studyModes/QuizMode';
import TrueFalseMode from '../components/studyModes/TrueFalseMode';
import WheelMode from '../components/studyModes/WheelMode';
import MatchingMode from '../components/studyModes/MatchingMode';
import FillBlanksMode from '../components/studyModes/FillBlanksMode';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import GameModal from '../components/GameModal';
import { useSettings } from '../context/SettingsContext';

// File processing function
const processUploadedFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        resolve(content);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

// AI content generation using backend Gemini API
const generateContentFromFile = async (mode, fileContent, itemCount = null) => {
  try {
    // Map internal mode ids to human-friendly descriptions and JSON schemas
    const modeMap = {
      flashcards: {
        label: 'Flashcards',
        instructions: `Return ONLY a JSON array of objects with {"front": "Question or term", "back": "Short concise answer"}. Answers should be short (1-8 words).`
      },
      quiz: {
        label: 'Multiple-choice quiz questions',
        instructions: `Return ONLY a JSON array of objects with {"question": "...", "options": ["opt1","opt2","opt3","opt4"], "correct": <index_of_correct_option>}. Provide 3-4 options per question.`
      },
      trueFalse: {
        label: 'True/False statements',
        instructions: `Return ONLY a JSON array of objects with {"statement": "...", "answer": true|false, "explanation": "optional short explanation"}.`
      },
      wheel: {
        label: 'Randomized wheel questions',
        instructions: `Return ONLY a JSON array of objects with {"label": "Slice label", "front": "Question text", "back": "Short answer"}. Keep slices short.`
      },
      matching: {
        label: 'Matching pairs',
        instructions: `Return ONLY a JSON array of objects with {"left": "term", "right": "definition"}.`
      },
      fillBlanks: {
        label: 'Fill-in-the-blank prompts',
        instructions: `Return ONLY a JSON array of objects with {"sentence": "Text with a blank indicated by _____", "answer": "correct text"}.`
      }
    };

    const modeInfo = modeMap[mode] || { label: mode, instructions: `Return a JSON array appropriate for ${mode}.` };
    const countDirective = itemCount ? `Return exactly ${itemCount} ${modeInfo.label.toLowerCase()}. ` : '';
    const prompt = `You are an assistant that produces structured study material.
  ${countDirective}Produce ${modeInfo.label} from the following source material. ${modeInfo.instructions}
  Material:\n${fileContent}`;

    console.log('Requesting AI generation for mode:', mode, 'label:', modeInfo.label);
    const response = await axios.post('/api/ai', { prompt });
    // Debug: log the raw AI reply
    console.log('AI raw reply:', response.data.reply || response.data);
    let aiData = [];
    // Ensure we handle replies that include markdown/code fences
    const rawReply = typeof response.data.reply === 'string' ? response.data.reply : (typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    const cleaned = rawReply.replace(/```json|```/g, '').trim();
    try {
      // Try to parse cleaned reply
      aiData = JSON.parse(cleaned);
      // Debug: log parsed AI data
      console.log('AI parsed data:', aiData);
      // If it's an object with a 'questions', 'flashcards', etc. property, use that
      if (aiData && typeof aiData === 'object' && !Array.isArray(aiData)) {
        if (aiData.questions) aiData = aiData.questions;
        if (aiData.flashcards) aiData = aiData.flashcards;
        if (aiData.quiz) aiData = aiData.quiz;
        if (aiData.trueFalse) aiData = aiData.trueFalse;
        if (aiData.matching) aiData = aiData.matching;
        if (aiData.fillBlanks) aiData = aiData.fillBlanks;
        // Fallbacks for fillBlanks: check for alternate keys
        if (!Array.isArray(aiData) && aiData.fillBlanksQuestions) aiData = aiData.fillBlanksQuestions;
        if (!Array.isArray(aiData) && aiData.blanks) aiData = aiData.blanks;
        if (!Array.isArray(aiData) && aiData.sentences) aiData = aiData.sentences;
        // Fallbacks for wheel mode
        if (!Array.isArray(aiData) && aiData.wheel) aiData = aiData.wheel;
        if (!Array.isArray(aiData) && aiData.wheelQuestions) aiData = aiData.wheelQuestions;
        if (!Array.isArray(aiData) && aiData.randomQuestions) aiData = aiData.randomQuestions;
        // Fallback for quiz mode: check for array of objects with 'question' and 'answer'
        if (!Array.isArray(aiData)) {
          // If object has keys that are arrays of quiz questions
          for (const key in aiData) {
            if (Array.isArray(aiData[key]) && aiData[key][0]?.question && aiData[key][0]?.answer) {
              aiData = aiData[key];
              break;
            }
          }
        }
      }
      // If still not array, try to extract array from nested object for fillBlanks
      if (!Array.isArray(aiData) && typeof aiData === 'object') {
        // Look for first array property
        for (const key in aiData) {
          if (Array.isArray(aiData[key])) {
            aiData = aiData[key];
            console.log('AI fillBlanks fallback array:', aiData);
            break;
          }
        }
      }
      // If still not array, fallback
      if (!Array.isArray(aiData)) aiData = [];
    } catch (e) {
      // If parsing fails, show error and fallback to empty array
      console.error('AI JSON parse error:', e, 'raw reply:', rawReply);
      showModal('AI did not return valid JSON. Raw reply logged to console.', 'AI Error');
      aiData = [];
    }
    return aiData;
  } catch (err) {
    console.error('AI generation error:', err);
    return [];
  }
};

// Maximum items we allow the AI to generate in a single request to avoid prompt and runtime errors
const MAX_GENERATED_ITEMS = 50;

export default function FileBasedStudyApp() {
  const { 
    darkMode, 
    defaultStudyMode, 
    showProgress, 
    autoSave, 
    soundEffects,
    getThemeColors, 
    playSound, 
    incrementStudySession 
  } = useSettings();
  
  const themeColors = getThemeColors();
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardText = darkMode ? 'text-gray-200' : 'text-gray-800';
  const subtleBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  
  // All state declarations first
  const [activeMode, setActiveMode] = useState(defaultStudyMode);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  // Quiz-specific setting: whether to auto-advance after answering
  const [quizAutoNext, setQuizAutoNext] = useState(true);
  // True/False-specific setting: whether to auto-advance after answering
  const [trueFalseAutoNext, setTrueFalseAutoNext] = useState(true);
  const [savedStudySets, setSavedStudySets] = useState(() => {
    try {
      // Try new key first, fallback to old key for backwards compatibility
      return JSON.parse(localStorage.getItem('savedStudySets')) || 
             JSON.parse(localStorage.getItem('savedFlashcards')) || [];
    } catch (e) {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedSessionRecorded, setSavedSessionRecorded] = useState(false);
  const [viewedQuestions, setViewedQuestions] = useState(new Set());
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  // Track which wheel indices have been answered so they can be removed/disabled
  const [wheelAnsweredSet, setWheelAnsweredSet] = useState(new Set());
  // Track which indices in the current session have been answered (quiz/trueFalse/fillBlanks)
  const [answeredSet, setAnsweredSet] = useState(new Set());
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [isGameOpen, setIsGameOpen] = useState(false);
  // Count prompt state: ask user how many items to generate for a selected mode
  const [showCountPrompt, setShowCountPrompt] = useState(false);
  const [countPromptMode, setCountPromptMode] = useState(null);
  const [countInput, setCountInput] = useState('');
  // When true, prevent the useEffect auto-load from firing (we'll load explicitly)
  const [suppressAutoLoad, setSuppressAutoLoad] = useState(false);
  // Modal state to replace browser alerts
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmAction, setModalConfirmAction] = useState(null);
  const [modalCancelAction, setModalCancelAction] = useState(null);
  const [modalConfirmLabel, setModalConfirmLabel] = useState('OK');
  const [modalCancelLabel, setModalCancelLabel] = useState('Cancel');
  const closeModal = () => {
    setModalOpen(false);
    setModalConfirmAction(null);
    setModalCancelAction(null);
    setModalConfirmLabel('OK');
    setModalCancelLabel('Cancel');
  };

  const showModal = (message, title = '') => { setModalTitle(title); setModalMessage(message); setModalOpen(true); };

  const showConfirm = (message, title, onConfirm, onCancel = null, confirmLabel = 'OK', cancelLabel = 'Cancel') => {
    setModalTitle(title || 'Confirm');
    setModalMessage(message);
    setModalConfirmAction(() => () => { if (onConfirm) onConfirm(); closeModal(); });
    setModalCancelAction(() => () => { if (onCancel) onCancel(); closeModal(); });
    setModalConfirmLabel(confirmLabel || 'OK');
    setModalCancelLabel(cancelLabel || 'Cancel');
    setModalOpen(true);
  };

  // Determine whether the current generated `content` has already been saved
  const isCurrentContentSaved = React.useMemo(() => {
    try {
      if (!content || content.length === 0) return false;
      const contentStr = JSON.stringify(content);
      return savedStudySets.some(s => {
        try {
          return JSON.stringify(s.content) === contentStr;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      return false;
    }
  }, [content, savedStudySets]);
  
  // Matching game state
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [matchingScore, setMatchingScore] = useState(0);
  // Session statistics
  const [sessionStats, setSessionStats] = useState({
    reviewedCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    accuracy: 0,
    timeStarted: null,
    timeElapsed: 0,
    avgTimePerCard: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [lastActionTime, setLastActionTime] = useState(null);
  // AI improvement suggestions state
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const aiRequestTimer = useRef(null);
  const fileInputRef = useRef(null);

  // Auto match when both selected
  useEffect(() => {
    if (selectedTerm !== null && selectedDef !== null) {
      // Check if correct match
      const wasCorrect = selectedTerm === selectedDef;
      if (wasCorrect) {
        setMatchingScore(ms => ms + 1);
      }
      const newMatchedPairs = [...matchedPairs, { termIdx: selectedTerm, defIdx: selectedDef }];
      setMatchedPairs(newMatchedPairs);
      // Update session stats for the attempted match
      startStatsIfNeeded();
      updateStatsOnAnswer(wasCorrect);
      setSelectedTerm(null);
      setSelectedDef(null);
      
      // Let the MatchingMode component handle completion detection
      // to show its own results display
    }
  }, [selectedTerm, selectedDef, matchedPairs, matchingScore]);

  const studyModes = [
    { 
      id: 'flashcards', 
      name: 'Flash Cards', 
      icon: (
        <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'quiz', 
      name: 'Quiz', 
      icon: (
        <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'trueFalse', 
      name: 'True or False', 
      icon: (
        <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'matching', 
      name: 'Matching Pairs', 
      icon: (
        <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    { 
      id: 'fillBlanks', 
      name: 'Fill in the Blanks', 
      icon: (
        <svg className="w-6 h-6" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
  ];

  // Sample/demo content for quick preview (client-side only)
  const sampleSets = {
    flashcards: [
      { front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
      { front: 'Capital of France?', back: 'Paris' },
      { front: '2 + 2 = ?', back: '4' }
    ],
    quiz: [
      { question: 'Which language runs in a web browser?', options: ['Python','Java','C++','JavaScript'], correct: 3 },
      { question: 'What does HTML stand for?', options: ['Hyperlinks and Text Markup','HyperText Markup Language','Home Tool Markup Language','Hyperlinking Text Markup Language'], correct: 1 }
    ],
    trueFalse: [
      { statement: 'The earth revolves around the sun.', answer: true, explanation: 'Heliocentric model.' },
      { statement: 'Water boils at 50°C at sea level.', answer: false, explanation: 'Boiling point is 100°C at 1 atm.' }
    ],
    wheel: [
      { label: 'Easy Question', front: 'What color is the sky?', back: 'Blue' },
      { label: 'Math', front: '5 * 6 = ?', back: '30' },
      { label: 'Geography', front: 'Which continent is Brazil in?', back: 'South America' }
    ],
    matching: [
      { left: 'Dog', right: 'Animal' },
      { left: 'Apple', right: 'Fruit' },
      { left: 'Blue', right: 'Color' }
    ],
    fillBlanks: [
      { sentence: 'The capital of Japan is _____.', answer: 'Tokyo' },
      { sentence: 'Water freezes at _____ °C.', answer: '0' }
    ]
  };

  const triggerFileInput = () => {
    // Instead of directly opening the file picker, show the source modal
    // so users can choose between local file or app library.
    setShowSourceModal(true);
  };

  // Modal flow: choose local file or pick from app library
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  const openLocalFilePicker = () => {
    setShowSourceModal(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const openAppLibrary = async () => {
    setShowSourceModal(false);
    setLibraryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/library/files`, { headers: { Authorization: `Bearer ${token}` } });
      // backend returns an array of files; store for selection
      setLibraryFiles(Array.isArray(res.data) ? res.data : []);
      setShowLibraryModal(true);
    } catch (e) {
      console.error('Failed to fetch library files', e);
      showModal('Failed to load your library. Please try again.', 'Library');
    }
    setLibraryLoading(false);
  };

  const selectLibraryFile = (file) => {
    try {
      // Prefer server-provided text content if available
      const text = file.textContent || file.content || file.text || file.body || '';
      setUploadedFile({ name: file.originalName || file.name || file._id });
      setFileContent(text || '');
      // Reset generated content so user must select a study mode
      setActiveMode(null);
      setContent([]);
      setCurrentIndex(0);
      setProgress(0);
      setShowLibraryModal(false);
      // If file has no text content, notify user that some file types may not load text
      if (!text) {
        showModal('Selected file has no extracted text content available. You can still preview or try generating, but some file types may not be supported for automatic extraction.', 'Note');
      }
    } catch (e) {
      console.error('Error selecting library file', e);
      showModal('Unable to open selected file.', 'Error');
    }
  };

  const applySample = (modeId) => {
    // Apply an in-memory sample set and switch to the chosen mode for preview
    const set = sampleSets[modeId] || [];
    setUploadedFile(null);
    setFileContent('Sample content');
    setContent(set);
    setActiveMode(modeId);
    setCurrentIndex(0);
    setProgress(0);
    setIsCompleted(false);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);

    try {
      let content = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Extract text from PDF using backend
        const formData = new FormData();
        formData.append('pdf', file);
        const pdfRes = await axios.post('/api/pdf/extract-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        content = pdfRes.data.text;
      } else {
        // Process as text
        content = await processUploadedFile(file);
      }
      setFileContent(content);
      // Do NOT auto-load content for any mode
      // User must select a study mode after upload
      // Ensure the UI reflects that we have an uploaded file but
      // no generated study content yet. Reset active mode/content
      // so users must explicitly choose a mode to generate.
      setActiveMode(null);
      setContent([]);
      setCurrentIndex(0);
      setProgress(0);
    } catch (error) {
      console.error('Error processing file:', error);
      showModal('Error processing file. Please try again.', 'File Error');
    }

    setLoading(false);
  };

  // Remove current uploaded file
  const removeCurrentFile = () => {
    setUploadedFile(null);
    setFileContent('');
    setContent([]);
    setActiveMode(null);
    setCurrentIndex(0);
    setScore(0);
    setProgress(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
    setUserAnswer('');
    // Reset matching game state
    setSelectedTerm(null);
    setSelectedDef(null);
    setMatchedPairs([]);
    setMatchingScore(0);
    setViewedQuestions(new Set());
    setAnsweredQuestions([]);
    setWheelAnsweredSet(new Set());
    setAnsweredSet(new Set());
    // Reset file input
    if (fileInputRef.current) {
      try { fileInputRef.current.value = ''; } catch (e) {}
    }
    setRevealedCorrectIndex(undefined);
  };

  // Validate wheel items: ensure they have a visible label/question before placing on the wheel
  const isValidWheelItem = (it) => {
    if (!it) return false;
    return Boolean(it.label || it.front || it.question || it.statement || it.content || it.title || it.topic);
  };

  const loadContentFromFile = async (mode, content = fileContent, itemCount = null) => {
    // Prevent starting another generation while one is already running
    if (loading) {
      console.warn('Generation already in progress — ignoring duplicate request.');
      return;
    }

    if (!content) return;

    setLoading(true);
    setCurrentIndex(0);
    setScore(0);
    setProgress(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
    setUserAnswer('');
    setIsCompleted(false);
    setViewedQuestions(new Set());
    setAnsweredQuestions([]);
    setWheelAnsweredSet(new Set());
    
    try {
      let data = await generateContentFromFile(mode, content, itemCount);
      console.log('Loaded AI data for mode', mode, ':', data);
      // If wheel mode, filter out invalid/empty slices so the wheel count matches real items
      if (mode === 'wheel' && Array.isArray(data)) {
        data = data.filter(isValidWheelItem);
        console.log('Filtered wheel data (valid slices):', data.length);
      }
      setContent(data);
      // reset answered set for new content
      setAnsweredSet(new Set());
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
    
    setLoading(false);
    setRevealedCorrectIndex(undefined);
    setAnsweredSet(new Set());
  };

  // --- Session stats helpers ---
  const startStatsIfNeeded = () => {
    // Do not track stats for Flashcards mode
    if (activeMode === 'flashcards') return;
    if (!sessionStats.timeStarted) {
      const now = Date.now();
      setSessionStats(s => ({ ...s, timeStarted: now }));
      setLastActionTime(now);
    }
  };

  const updateStatsOnAnswer = (correct) => {
    // Do not record stats for Flashcards
    if (activeMode === 'flashcards') return null;
    const now = Date.now();
    let newStats = null;
    setSessionStats(prev => {
      const reviewed = prev.reviewedCount + 1;
      const correctCount = prev.correctCount + (correct ? 1 : 0);
      const incorrectCount = prev.incorrectCount + (correct ? 0 : 1);
      const timeElapsed = prev.timeStarted ? now - prev.timeStarted : prev.timeElapsed;
      const avgTimePerCard = reviewed > 0 ? Math.round(timeElapsed / reviewed) : 0;
      const currentStreak = correct ? prev.currentStreak + 1 : 0;
      const longestStreak = Math.max(prev.longestStreak, currentStreak);
      const accuracy = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 0;
      newStats = {
        ...prev,
        reviewedCount: reviewed,
        correctCount,
        incorrectCount,
        accuracy,
        timeElapsed,
        avgTimePerCard,
        currentStreak,
        longestStreak
      };
      return newStats;
    });
    setLastActionTime(now);
    // Schedule AI tips update after answer (debounced)
    scheduleAiTips(activeMode);
    return newStats;
  };

  const updateStatsOnView = () => {
    // Do not record stats for Flashcards
    if (activeMode === 'flashcards') return;
    const now = Date.now();
    setSessionStats(prev => {
      const reviewed = prev.reviewedCount + 1;
      const timeElapsed = prev.timeStarted ? now - prev.timeStarted : prev.timeElapsed;
      const avgTimePerCard = reviewed > 0 ? Math.round(timeElapsed / reviewed) : 0;
      const accuracy = reviewed > 0 ? Math.round((prev.correctCount / reviewed) * 100) : prev.accuracy;
      return { ...prev, reviewedCount: reviewed, timeElapsed, avgTimePerCard, accuracy };
    });
    setLastActionTime(now);
    // Schedule AI tips update after view (debounced)
    scheduleAiTips(activeMode);
  };

  const resetStats = () => {
    setSessionStats({
      reviewedCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracy: 0,
      timeStarted: null,
      timeElapsed: 0,
      avgTimePerCard: 0,
      currentStreak: 0,
      longestStreak: 0
    });
    setLastActionTime(null);
  };

  const scheduleAiTips = (mode) => {
    if (!mode || mode === 'flashcards') return;
    // debounce requests to avoid rate limits
    if (aiRequestTimer.current) {
      clearTimeout(aiRequestTimer.current);
    }
    aiRequestTimer.current = setTimeout(() => {
      requestImprovementSuggestions(mode);
      aiRequestTimer.current = null;
    }, 1000);
  };

  // Helper to get readable option text for objects (used across modes)
  const getOptionText = (opt) => {
    if (typeof opt === 'string') return opt;
    if (!opt) return '';
    return opt.text || opt.option || opt.label || opt.value || JSON.stringify(opt);
  };

  // Resolve correct index/text for a question object in a consistent way
  const resolveCorrectIndex = (question) => {
    if (!question) return { numericCorrectIndex: undefined, correctAnswerTextFallback: null, optionTexts: [] };
    let options = question.options || question.choices || [];
    if (typeof options === 'string') options = options.split(/\n|,/).map(o => o.trim()).filter(Boolean);
    const optionTexts = Array.isArray(options) ? options.map(getOptionText) : [];
    const correctIndexRaw = typeof question.correct !== 'undefined' ? question.correct : question.answer;
    let numericCorrectIndex;
    let correctTextFromRaw = null;
    if (typeof correctIndexRaw !== 'undefined' && correctIndexRaw !== null) {
      const asNumber = Number(correctIndexRaw);
      if (!isNaN(asNumber)) {
        if (Number.isInteger(asNumber)) {
          if (asNumber >= 0 && asNumber < optionTexts.length) numericCorrectIndex = asNumber;
          else if (asNumber >= 1 && asNumber <= optionTexts.length) numericCorrectIndex = asNumber - 1;
        }
      }
      if (typeof correctIndexRaw === 'object' && correctIndexRaw !== null) {
        correctTextFromRaw = getOptionText(correctIndexRaw);
      }
      if (typeof correctIndexRaw === 'string') {
        const trimmed = correctIndexRaw.trim();
        if (/^[A-Z]$/i.test(trimmed)) {
          const idx = trimmed.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
          if (idx >= 0 && idx < optionTexts.length) numericCorrectIndex = idx;
        }
        if (typeof numericCorrectIndex === 'undefined') {
          const lower = trimmed.toLowerCase();
          const found = optionTexts.findIndex(t => t && t.toLowerCase().trim() === lower);
          if (found !== -1) numericCorrectIndex = found;
          else {
            const contains = optionTexts.findIndex(t => t && t.toLowerCase().includes(lower));
            if (contains !== -1) numericCorrectIndex = contains;
          }
        }
      }
      if (typeof numericCorrectIndex === 'undefined' && correctTextFromRaw) {
        const lower = correctTextFromRaw.toLowerCase().trim();
        const found = optionTexts.findIndex(t => t && t.toLowerCase().trim() === lower);
        if (found !== -1) numericCorrectIndex = found;
        else {
          const contains = optionTexts.findIndex(t => t && t.toLowerCase().includes(lower));
          if (contains !== -1) numericCorrectIndex = contains;
        }
      }
    }
    const correctAnswerTextFallback = (typeof correctIndexRaw === 'string' || typeof correctIndexRaw === 'number') ? String(correctIndexRaw) : (correctTextFromRaw || null);
    return { numericCorrectIndex, correctAnswerTextFallback, optionTexts };
  };

  // State for the revealed correct index after answering (so UI highlights reliably)
  const [revealedCorrectIndex, setRevealedCorrectIndex] = useState(undefined);

  useEffect(() => {
    return () => {
      if (aiRequestTimer.current) clearTimeout(aiRequestTimer.current);
    };
  }, []);

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // --- AI-driven improvement suggestions ---
  const buildImprovementPrompt = (mode, stats = null) => {
    const modeNames = {
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      trueFalse: 'True/False',
      wheel: 'Spin the Wheel',
      matching: 'Matching Pairs',
      fillBlanks: 'Fill in the Blanks'
    };

    const sampleItems = (content || []).slice(0, 6).map((it, i) => {
      // create a friendly one-line representation
      if (it.front || it.back) return `${i+1}. ${it.front || ''} -> ${it.back || ''}`;
      if (it.question || it.options) return `${i+1}. ${it.question || ''}`;
      if (it.statement) return `${i+1}. ${it.statement} [${String(it.answer)}]`;
      if (it.sentence) return `${i+1}. ${it.sentence}`;
      return `${i+1}. ${JSON.stringify(it).slice(0,80)}`;
    }).join('\n');

    const s = stats || sessionStats;
    return `You are an expert study coach. A user just completed a study session with the following summary:\n\nMode: ${modeNames[mode] || mode}\nItems reviewed: ${s.reviewedCount}\nCorrect: ${s.correctCount}\nIncorrect: ${s.incorrectCount}\nAccuracy: ${s.accuracy}%\nTime elapsed: ${formatTime(s.timeElapsed)}\nAverage time per item: ${Math.round(s.avgTimePerCard/1000)}s\nCurrent streak: ${s.currentStreak}\nBest streak: ${s.longestStreak}\n\nSample items (first up to 6):\n${sampleItems}\n\nBased on this information, provide a short, actionable improvement plan for the user: 5 concise recommendations the user should do next to improve retention and understanding (e.g., what to review, what mode to practice next, suggested spacing and number of repetitions, how to break down difficult items). Keep the advice practical and prioritized. Use plain text, short bullets.`;
  };

  const requestImprovementSuggestions = async (mode = activeMode, stats = null) => {
    // Avoid duplicate concurrent calls
    if (aiLoading) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const prompt = buildImprovementPrompt(mode, stats);
      const res = await axios.post('/api/ai', { prompt });
      const reply = res?.data?.reply || res?.data || '';
      // store raw reply
      setAiSuggestions(typeof reply === 'string' ? reply : JSON.stringify(reply));
    } catch (e) {
      console.error('AI suggestions error:', e);
      setAiError('Failed to generate improvement suggestions. Try again.');
      setAiSuggestions('');
    }
    setAiLoading(false);
  };

  // Auto-request AI tips when session completes (once)
  useEffect(() => {
    if (isCompleted && content && content.length > 0 && !aiSuggestions && !aiLoading) {
      requestImprovementSuggestions(activeMode);
    }
  }, [isCompleted]);

  // Persist completed study session summaries so Dashboard can evaluate mode-specific badges
  useEffect(() => {
    if (!isCompleted) return;
    if (savedSessionRecorded) return;
    // Only persist when there was meaningful activity
    if (!sessionStats || sessionStats.reviewedCount <= 0) return;

    try {
      const key = 'studyModeSessions';
      const raw = localStorage.getItem(key) || '[]';
      const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const entry = {
        mode: activeMode,
        reviewedCount: sessionStats.reviewedCount || 0,
        correctCount: sessionStats.correctCount || 0,
        accuracy: sessionStats.accuracy || 0,
        timeElapsed: sessionStats.timeElapsed || 0,
        longestStreak: sessionStats.longestStreak || 0,
        timestamp: Date.now()
      };
      arr.unshift(entry);
      // keep a reasonable history
      const next = arr.slice(0, 500);
      localStorage.setItem(key, JSON.stringify(next));
      // also increment the global session tracker (minutes)
      try {
        const minutes = Math.round((sessionStats.timeElapsed || 0) / 60000);
        if (typeof incrementStudySession === 'function') incrementStudySession(minutes);
      } catch (e) {}
      setSavedSessionRecorded(true);
    } catch (e) {
      console.warn('Failed to persist studyModeSessions', e);
    }
  }, [isCompleted]);

  // Save current study content to history
  const saveCurrentStudySet = () => {
    if (content.length === 0 || !activeMode) {
      showModal('No study content to save!', 'Save');
      return;
    }

    const modeNames = {
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      trueFalse: 'True/False Quiz',
      wheel: 'Spin the Wheel',
      matching: 'Matching Game',
      fillBlanks: 'Fill in the Blanks'
    };

    const savedSet = {
      id: Date.now(),
      title: uploadedFile ? `${uploadedFile.name} - ${modeNames[activeMode]}` : `Generated ${modeNames[activeMode]}`,
      content: content,
      studyMode: activeMode,
      createdAt: new Date().toLocaleString(),
      fileName: uploadedFile?.name || 'Unknown File',
      itemCount: content.length
    };

    const updatedSaved = [savedSet, ...savedStudySets];
    setSavedStudySets(updatedSaved);
    localStorage.setItem('savedStudySets', JSON.stringify(updatedSaved));
    showModal(`Saved ${content.length} ${modeNames[activeMode].toLowerCase()} items to history!`, 'Saved');
  };

  // Load saved study content
  const loadSavedStudySet = (savedSet) => {
    let loaded = savedSet.content || savedSet.cards || [];
    if (savedSet.studyMode === 'wheel' && Array.isArray(loaded)) {
      loaded = loaded.filter(item => item && (item.label || item.front || item.question || item.statement || item.content || item.title || item.topic));
    }
    setContent(loaded);
    setAnsweredSet(new Set());
    setActiveMode(savedSet.studyMode || 'flashcards'); // Default to flashcards for old saves
    setCurrentIndex(0);
    setShowAnswer(false);
    setProgress(0);
    setScore(0);
    setSelectedAnswer(null);
    setUserAnswer('');
    // Reset matching game state
    setSelectedTerm(null);
    setSelectedDef(null);
    setMatchedPairs([]);
    setMatchingScore(0);
    
    const modeNames = {
      flashcards: 'flashcards',
      quiz: 'quiz questions',
      trueFalse: 'true/false questions',
      wheel: 'wheel questions',
      matching: 'matching pairs',
      fillBlanks: 'fill-in-the-blanks'
    };
    
    showModal(`Loaded ${savedSet.itemCount || savedSet.content?.length || savedSet.cards?.length} ${modeNames[savedSet.studyMode] || 'items'} from "${savedSet.title}"`, 'Loaded');
  };

  // Delete saved study sets
  const deleteSavedStudySet = (id) => {
    const updatedSaved = savedStudySets.filter(set => set.id !== id);
    setSavedStudySets(updatedSaved);
    localStorage.setItem('savedStudySets', JSON.stringify(updatedSaved));
  };

  // Request a mode change, prompting to save current generated content if present
  const performModeSwitch = (modeId) => {
    setActiveMode(modeId);
    setIsCompleted(false);
    setCurrentIndex(0);
    // Reset wheel mode state when switching modes
    setViewedQuestions(new Set());
    setWheelAnsweredSet(new Set());
    // Reset fill-in-the-blanks state when switching modes
    setAnsweredQuestions([]);
  };

  const requestModeChange = (modeId) => {
    // Prevent switching while AI is generating content
    if (loading) {
      showModal('AI generation in progress — please wait.', 'AI');
      return;
    }
    // If no uploaded file, don't allow switching
    if (!fileContent) return;
    // If switching to the same mode, do nothing
    if (modeId === activeMode) return;
    // If there is generated content, prompt user to save/discard/cancel
    if (content && content.length > 0) {
      setPendingMode(modeId);
      setShowSavePrompt(true);
      return;
    }
    // Otherwise ask how many items to generate and then generate
    openCountPrompt(modeId);
  };

  const handleSaveAndSwitch = () => {
    try {
      saveCurrentStudySet();
    } catch (e) {
      console.error('Save before switch failed:', e);
    }
    setShowSavePrompt(false);
    if (pendingMode) {
      // Prevent useEffect from auto-loading; we'll load explicitly after asking for count
      setSuppressAutoLoad(true);
      performModeSwitch(pendingMode);
      openCountPrompt(pendingMode);
    }
    setPendingMode(null);
  };

  const handleDiscardAndSwitch = () => {
    setShowSavePrompt(false);
    if (pendingMode) {
      setSuppressAutoLoad(true);
      performModeSwitch(pendingMode);
      openCountPrompt(pendingMode);
    }
    setPendingMode(null);
  };

  const handleCancelSwitch = () => {
    setShowSavePrompt(false);
    setPendingMode(null);
  };

  const openCountPrompt = (modeId) => {
    setCountPromptMode(modeId);
    setCountInput('');
    setShowCountPrompt(true);
  };

  const handleGenerateWithCount = async () => {
    const mode = countPromptMode;
    let count = parseInt(countInput, 10);
    setShowCountPrompt(false);
    setSuppressAutoLoad(false);
    if (!mode) return;
    // Validate count
    if (isNaN(count)) {
      count = null;
    } else {
      if (count < 1) {
        showModal('Please enter a number greater than 0.', 'Invalid Count');
        setCountPromptMode(null);
        setCountInput('');
        return;
      }
      if (count > MAX_GENERATED_ITEMS) {
        showModal(`Requested count exceeds the maximum allowed (${MAX_GENERATED_ITEMS}). Please enter a smaller number.`, 'Count Too Large');
        // Do not proceed when requested count is too large
        setCountPromptMode(null);
        setCountInput('');
        return;
      }
    }
    // Ensure we set the active mode and explicitly load content with the desired count
    setActiveMode(mode);
    await loadContentFromFile(mode, fileContent, isNaN(count) ? null : count);
    // reset the prompt mode
    setCountPromptMode(null);
    setCountInput('');
  };

  useEffect(() => {
    // Only load content if file is uploaded AND user selects a mode (not on upload)
    // If `suppressAutoLoad` is true we will skip this automatic behavior because
    // the flow will explicitly call `loadContentFromFile` with an item count.
    if (suppressAutoLoad) return;
    if (fileContent && activeMode && uploadedFile) {
      loadContentFromFile(activeMode);
    }
  }, [activeMode, suppressAutoLoad]);

  const handleNext = () => {
    // For fill-in-the-blanks, only proceed if answer has been checked
    if (activeMode === 'fillBlanks' && !showAnswer) {
      return; // Don't allow navigation without checking answer first
    }
    
    // Save the answer for fill-in-the-blanks mode
    if (activeMode === 'fillBlanks' && showAnswer) {
      const answerRecord = {
        questionIndex: currentIndex,
        userAnswer: userAnswer,
        wasCorrect: userAnswer.toLowerCase().trim() === ((content[currentIndex].content || content[currentIndex].answer || '').split(' ').slice(0, 2).join(' ')).toLowerCase().trim()
      };
      
      // Add to answered questions if not already recorded
      if (!answeredQuestions.some(q => q.questionIndex === currentIndex)) {
        setAnsweredQuestions([...answeredQuestions, answerRecord]);
      }
    }
    
    if (currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setRevealedCorrectIndex(undefined);
      setUserAnswer('');
      setProgress(((currentIndex + 1) / content.length) * 100);
    } else {
      // Reached the end
      setProgress(100);
      // For fillBlanks mode, let the component handle completion detection
      // to show its own results display
      if (activeMode !== 'fillBlanks') {
        setIsCompleted(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setRevealedCorrectIndex(undefined);
      setUserAnswer('');
      setProgress(((currentIndex - 1) / content.length) * 100);
    }
  };

  const handleAnswerSelect = (answerIndex, correct = false) => {
    // Start stats and record this answer
    startStatsIfNeeded();
    // Recompute correctness for quiz mode using the resolver so we reliably
    // highlight the correct option even when AI returns different shapes.
    let isCorrect = !!correct;
    let updatedStats = null;
    if (activeMode === 'quiz') {
      const q = content[currentIndex];
      const resolved = resolveCorrectIndex(q);
      // reveal the resolved index so UI can use it
      setRevealedCorrectIndex(typeof resolved.numericCorrectIndex !== 'undefined' ? resolved.numericCorrectIndex : undefined);
      if (typeof resolved.numericCorrectIndex !== 'undefined') {
        isCorrect = (answerIndex === resolved.numericCorrectIndex);
      } else if (resolved.correctAnswerTextFallback) {
        // compare by text
        const optText = getOptionText((q.options || q.choices || [])[answerIndex]);
        isCorrect = optText && String(optText).trim() === String(resolved.correctAnswerTextFallback).trim();
      }
    }
    // Update stats and capture the returned fresh stats object
    updatedStats = updateStatsOnAnswer(!!isCorrect);
    // Normalize numeric index answers to numbers (keep booleans as-is)
    const normalizedAnswer = (typeof answerIndex === 'number' || (!isNaN(Number(answerIndex)) && typeof answerIndex !== 'boolean')) ? Number(answerIndex) : answerIndex;
    setSelectedAnswer(normalizedAnswer);
    if (isCorrect) {
      setScore(s => s + 1);
    }
    // Mark this index as answered so navigation rules can use it
    setAnsweredSet(prev => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    // Auto-advance behavior: respect the user's toggle per mode
    let shouldAutoNext = true;
    if (activeMode === 'quiz') shouldAutoNext = !!quizAutoNext;
    else if (activeMode === 'trueFalse') shouldAutoNext = !!trueFalseAutoNext;

    // If auto-next is enabled, advance after a short delay
    if (shouldAutoNext) {
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      // If this was the last question and the user did NOT allow auto-next,
      // we still need to mark completion and request AI tips immediately so
      // the session summary and tips show without requiring the user to click Next.
      if (currentIndex === content.length - 1) {
        setIsCompleted(true);
        try {
          // cancel any pending debounced AI request and call immediately with fresh stats
          if (aiRequestTimer.current) {
            clearTimeout(aiRequestTimer.current);
            aiRequestTimer.current = null;
          }
          requestImprovementSuggestions(activeMode, updatedStats);
        } catch (e) {
          console.error('Failed to request AI tips after final answer:', e);
        }
      }
    }
  };

  // Handler called by WheelMode when a wheel question is answered
  const handleWheelAnswered = (idx, wasCorrect) => {
    if (typeof idx !== 'number') return;
    setWheelAnsweredSet(prev => {
      const next = new Set(prev);
      next.add(idx);
      // If all slices answered, mark completion
      if (next.size === content.length && content.length > 0) setIsCompleted(true);
      return next;
    });
    // also mark in the generic answered set
    setAnsweredSet(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // Update stats and score
    startStatsIfNeeded();
    updateStatsOnAnswer(!!wasCorrect);
    if (wasCorrect) setScore(s => s + 1);
  };

  const checkFillBlankAnswer = () => {
    const item = content[currentIndex];
    const correctAnswer = (item.answer || item.content || item.title || '').toString();
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setShowAnswer(true);
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(s => s + 1);
    }
    // Stats: record this checked answer and get updated stats
    startStatsIfNeeded();
    const updatedStats = updateStatsOnAnswer(isCorrect);
    // mark this index answered
    setAnsweredSet(prev => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    // Immediately request AI improvement suggestions for this session after scoring,
    // passing the freshly computed stats so the AI sees accurate numbers.
    try {
      requestImprovementSuggestions(activeMode, updatedStats);
    } catch (e) {
      console.error('Failed to request AI tips after checking fill-blank answer:', e);
    }
    
    // Check if this is the last question (completion)
    if (currentIndex === content.length - 1) {
      setIsCompleted(true);
    }
  };

  const spinWheel = () => {
    if (wheelSpinning || content.length === 0) return;

    setWheelSpinning(true);
    const spins = Math.floor(Math.random() * 5) + 5;
    // Pick a random slice to land on that has NOT been answered yet
    const available = [];
    for (let i = 0; i < content.length; i++) {
      if (!wheelAnsweredSet.has(i)) available.push(i);
    }
    if (available.length === 0) {
      // All answered
      setWheelSpinning(false);
      setIsCompleted(true);
      return;
    }
    const targetIndex = available[Math.floor(Math.random() * available.length)];
    const sliceAngle = 360 / content.length;
    // Calculate the rotation so the targetIndex lands at 0deg (top)
    const finalRotation = wheelRotation + (spins * 360) + (360 - targetIndex * sliceAngle);
    setWheelRotation(finalRotation);

    setTimeout(() => {
      setWheelSpinning(false);
      setCurrentIndex(targetIndex);
      
      // Add this question to viewed questions
      const newViewedQuestions = new Set(viewedQuestions);
      const alreadyViewed = newViewedQuestions.has(targetIndex);
      newViewedQuestions.add(targetIndex);
      setViewedQuestions(newViewedQuestions);
      // Update stats only if this was not viewed before
      if (!alreadyViewed) {
        startStatsIfNeeded();
        updateStatsOnView();
      }
      
      // Check if all questions have been viewed (completion)
      if (newViewedQuestions.size === content.length && content.length > 0) {
        setIsCompleted(true);
      }
    }, 2000);
  };

  const renderFlashCards = () => {
    if (content.length === 0) {
      // If there's file content available, offer generate/preview actions
      if (fileContent) {
        return (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Flashcards</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create concise question/answer flashcards from your uploaded file.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openCountPrompt('flashcards')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.flashcards); setActiveMode('flashcards'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div className="relative min-h-[16rem] h-auto overflow-auto">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">Flashcard Template</h3>
                <p className="mt-2 text-white">Front: [Question or term]</p>
                <p className="mt-1 text-white">Back: [Definition or answer]</p>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600">Upload a file to generate flashcards</p>
        </div>
      );
    }
    
    const card = content[currentIndex];
    // Support both {front, back} and {question, answer} formats
    const front = card.front || card.question || '';
    const back = card.back || card.answer || '';
    return (
      <div className="space-y-6">
        <div 
          className="relative min-h-[16rem] h-auto overflow-auto cursor-pointer"
          onClick={() => {
            const willShow = !showAnswer;
            setShowAnswer(willShow);
            if (willShow) {
              setAnsweredSet(prev => {
                const next = new Set(prev);
                next.add(currentIndex);
                return next;
              });
            }
          }}
        >
          <div className={`absolute inset-0 w-full h-full transition-all duration-500 transform ${showAnswer ? 'scale-95' : ''}`}>
            {!showAnswer ? (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center p-6">
                <h3 className="text-xl font-semibold text-white text-center">{front}</h3>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg flex items-center justify-center p-6">
                <p className="text-lg text-white text-center">{back}</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-gray-600">Click the card to flip it</p>
      </div>
    );
  };

  const renderQuiz = () => {
    // Auto-Next toggle is rendered in the progress bar area for visibility
    if (content.length === 0 || !content[currentIndex]) {
      if (fileContent) {
        return (
          <div className="space-y-6">
            {/* Auto-Next toggle is now shown in the progress bar area */}
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Quiz Questions</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create multiple-choice questions from your file content.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openCountPrompt('quiz')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.quiz); setActiveMode('quiz'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          {/* Auto-Next toggle moved to progress bar for better visibility */}
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto flex flex-col justify-center items-center`}>
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Quiz Template</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Question: [Multiple choice question]</p>
            <div className="mt-2 w-full">
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>A. [Option 1]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>B. [Option 2]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>C. [Option 3]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>D. [Option 4]</div>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate quiz questions</p>
          </div>
        </div>
      );
    }

    const question = content[currentIndex];
    // Log the raw question object for debugging
    console.log('Quiz question object:', question);
    // Support both {question, options, correct} and {question, choices, answer} formats
    const qText = question.question || '';
    let options = question.options || question.choices || [];
    // Fallback: if options is a string, split by newlines or commas
    if (typeof options === 'string') {
      options = options.split(/\n|,/).map(o => o.trim()).filter(Boolean);
    }
    // Helper to get readable option text for objects
    const getOptionText = (opt) => {
      if (typeof opt === 'string') return opt;
      if (!opt) return '';
      return opt.text || opt.option || opt.label || opt.value || JSON.stringify(opt);
    };

    console.log('Quiz options:', options);
    const correctIndexRaw = typeof question.correct !== 'undefined' ? question.correct : question.answer;
    console.log('Quiz correctIndex (raw):', correctIndexRaw);
    // Resolve correct index to a numeric position in the options array.
    // Support these common shapes returned from AI/backends:
    // - numeric index (0-based or 1-based)
    // - letter index like 'A'..'D'
    // - option text (string) that matches one of the option texts
    // - option object equal or with a .text/.label/.option/.value property
    let numericCorrectIndex;
    const optionTexts = Array.isArray(options) ? options.map(getOptionText) : [];
    let correctTextFromRaw = null;
    if (typeof correctIndexRaw !== 'undefined' && correctIndexRaw !== null) {
      // If it's a plain number (or numeric string), try to use it (support 0-based and 1-based)
      const asNumber = Number(correctIndexRaw);
      if (!isNaN(asNumber)) {
        if (Number.isInteger(asNumber)) {
          // prefer 0-based, but accept 1-based if value is between 1 and len
          if (asNumber >= 0 && asNumber < optionTexts.length) {
            numericCorrectIndex = asNumber;
          } else if (asNumber >= 1 && asNumber <= optionTexts.length) {
            numericCorrectIndex = asNumber - 1;
          }
        }
      }

      // If not resolved yet and the raw is an object with text-like fields, extract text
      if (typeof correctIndexRaw === 'object' && correctIndexRaw !== null) {
        correctTextFromRaw = getOptionText(correctIndexRaw);
      }

      // If still unresolved and raw is a string, check for letter mapping (A,B,C..) and exact/text match
      if (typeof correctIndexRaw === 'string') {
        const trimmed = correctIndexRaw.trim();
        // Single-letter like 'A' maps to index 0
        if (/^[A-Z]$/i.test(trimmed)) {
          const idx = trimmed.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
          if (idx >= 0 && idx < optionTexts.length) numericCorrectIndex = idx;
        }
        // exact text match (case-insensitive)
        if (typeof numericCorrectIndex === 'undefined') {
          const lower = trimmed.toLowerCase();
          const found = optionTexts.findIndex(t => t && t.toLowerCase().trim() === lower);
          if (found !== -1) numericCorrectIndex = found;
          else {
            // try contains-match as a fallback
            const contains = optionTexts.findIndex(t => t && t.toLowerCase().includes(lower));
            if (contains !== -1) numericCorrectIndex = contains;
          }
        }
      }

      // If we have text from an object, try to match it against options
      if (typeof numericCorrectIndex === 'undefined' && correctTextFromRaw) {
        const lower = correctTextFromRaw.toLowerCase().trim();
        const found = optionTexts.findIndex(t => t && t.toLowerCase().trim() === lower);
        if (found !== -1) numericCorrectIndex = found;
        else {
          const contains = optionTexts.findIndex(t => t && t.toLowerCase().includes(lower));
          if (contains !== -1) numericCorrectIndex = contains;
        }
      }
    }

    // Prepare a displayable correct answer text when index resolution fails
    const correctAnswerTextFallback = (typeof correctIndexRaw === 'string' || typeof correctIndexRaw === 'number')
      ? String(correctIndexRaw)
      : (correctTextFromRaw || null);
    console.log('Resolved numericCorrectIndex:', numericCorrectIndex, 'correctAnswerTextFallback:', correctAnswerTextFallback);
    console.log('Option texts:', optionTexts);
    // If a revealed index was set when the user answered, prefer that for UI highlighting
    if (typeof revealedCorrectIndex !== 'undefined') {
      numericCorrectIndex = revealedCorrectIndex;
    }
    if (!qText || options.length === 0) {
      // Fallback to template if missing fields
      console.log('Quiz fallback: missing qText or options');
      return (
        <div className="space-y-6">
          {/* Auto-Next toggle moved to progress bar for better visibility */}
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto flex flex-col justify-center items-center`}> 
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Quiz Template</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Question: [Multiple choice question]</p>
            <div className="mt-2 w-full">
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>A. [Option 1]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>B. [Option 2]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>C. [Option 3]</div>
              <div className={`p-2 rounded border mb-1 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>D. [Option 4]</div>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate quiz questions</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {/* Auto-Next toggle is now shown in the progress bar area */}
        <div className={`${cardBg} rounded-xl p-6 shadow`}> 
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>{qText}</h3>
          <div className="space-y-3">
            {options.map((option, index) => {
              let buttonClass = 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
              const optText = getOptionText(option);

              if (selectedAnswer !== null) {
                const isCorrect = (typeof numericCorrectIndex !== 'undefined') ? (index === numericCorrectIndex) : (optText && correctAnswerTextFallback && String(optText).trim() === String(correctAnswerTextFallback).trim());
                const isSelected = selectedAnswer === index;
                if (isCorrect) {
                  buttonClass = 'border-green-500 bg-green-50 text-green-800';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'border-red-500 bg-red-50 text-red-800';
                } else {
                  buttonClass = 'border-gray-200 bg-gray-50 text-gray-500';
                }
              }

              return (
                <button
                  key={index}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${buttonClass}`}
                  onClick={() => handleAnswerSelect(index, (typeof numericCorrectIndex !== 'undefined') ? index === numericCorrectIndex : (optText && correctAnswerTextFallback && String(optText).trim() === String(correctAnswerTextFallback).trim()))}
                  disabled={selectedAnswer !== null}
                >
                  {getOptionText(option)}
                </button>
              );
            })}
            {selectedAnswer !== null && (
              <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-teal-800">
                  <strong>Correct answer:</strong> {typeof numericCorrectIndex !== 'undefined' ? getOptionText(options[numericCorrectIndex]) : (correctAnswerTextFallback || 'N/A')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => {
    if (content.length === 0) {
      if (fileContent) {
        return (
          <div className="space-y-6">
            {/* Auto-Next toggle is now shown in the progress bar area */}
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}> 
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate True/False Questions</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create true/false statements from your file.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openCountPrompt('trueFalse')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.trueFalse); setActiveMode('trueFalse'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
            {/* Auto-Next toggle is now shown in the progress bar area */}
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto flex flex-col justify-center items-center`}> 
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>True/False Template</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statement: [Fact or claim]</p>
            <div className="flex gap-4 mt-4">
              <button className={`flex-1 p-4 rounded-lg border-2 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>True</button>
              <button className={`flex-1 p-4 rounded-lg border-2 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>False</button>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate true/false questions</p>
          </div>
        </div>
      );
    }
    
    const item = content[currentIndex];
    // Support both {statement, answer, explanation} and {question, correct, explanation} formats
    const statement = item.statement || item.question || '';
    const answer = typeof item.answer !== 'undefined' ? item.answer : item.correct;
    const explanation = item.explanation || '';
    // If last question and answered, show total score
    const isLastQuestion = currentIndex === content.length - 1 && selectedAnswer !== null;
    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow`}>
          <h3 className={`text-xl font-semibold mb-6 ${cardText}`}>{statement}</h3>
          <div className="flex gap-4">
            <button
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === true
                  ? answer === true
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
              onClick={() => handleAnswerSelect(true, answer === true)}
              disabled={selectedAnswer !== null}
            >
              <svg className="w-8 h-8 mx-auto mb-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              True
            </button>
            <button
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === false
                  ? answer === false
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
              }`}
              onClick={() => handleAnswerSelect(false, answer === false)}
              disabled={selectedAnswer !== null}
            >
              <svg className="w-8 h-8 mx-auto mb-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              False
            </button>
          </div>
          {selectedAnswer !== null && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-teal-800">{explanation}</p>
            </div>
          )}
          {isLastQuestion && (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
              <span className="text-green-800 font-bold text-lg">Total Score: {score} / {content.length}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSpinWheel = () => {
    if (content.length === 0) {
      if (fileContent) {
        return (
          <div className="space-y-6 text-center">
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Wheel Questions</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create randomized wheel slices from your content.</p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                <button onClick={() => openCountPrompt('wheel')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.wheel); setActiveMode('wheel'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6 text-center">
          <div className="relative inline-block">
            <div className="w-64 h-64 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 shadow-lg flex items-center justify-center">
              <div className="text-white text-xl font-semibold">Spin the Wheel Template</div>
            </div>
          </div>
          <button className={`px-8 py-3 rounded-lg font-semibold ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-white'} cursor-not-allowed mt-4`}>Spin the Wheel</button>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate wheel questions</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 text-center">
        <div className="relative inline-block">
          <div 
            className={`w-64 h-64 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 shadow-lg flex items-center justify-center`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            <div className={`absolute inset-2 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-full flex items-center justify-center`}>
              <svg className="w-16 h-16" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l2 2" />
              </svg>
            </div>
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-800"></div>
          </div>
        </div>
        
        <button
          onClick={spinWheel}
          disabled={wheelSpinning || content.length === 0}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            wheelSpinning || content.length === 0
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          {wheelSpinning ? 'Spinning...' : 'Spin the Wheel'}
        </button>

        {content.length > 0 && currentIndex < content.length && (
          <div className={`${cardBg} rounded-xl p-6 shadow`}>
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Random Question:</h3>
            <p className={`${darkMode ? 'text-gray-200' : 'text-lg'}`}>{content[currentIndex]?.front || content[currentIndex]?.question || content[currentIndex]?.statement}</p>
            {showAnswer && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-teal-800">{content[currentIndex]?.back || 'Answer revealed!'}</p>
              </div>
            )}
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMatching = () => {
    if (content.length === 0) {
      if (fileContent) {
        return (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Matching Pairs</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create term-definition pairs from your file for matching practice.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openCountPrompt('matching')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.matching); setActiveMode('matching'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto flex flex-col justify-center items-center`}>
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Matching Template</h3>
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <div className={`p-3 rounded-lg border-2 ${darkMode ? 'bg-teal-900 border-teal-700 text-gray-200' : 'bg-teal-50 border-teal-200 text-gray-600'}`}>Term 1</div>
              <div className={`p-3 rounded-lg border-2 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Definition 1</div>
              <div className={`p-3 rounded-lg border-2 ${darkMode ? 'bg-teal-900 border-teal-700 text-gray-200' : 'bg-teal-50 border-teal-200 text-gray-600'}`}>Term 2</div>
              <div className={`p-3 rounded-lg border-2 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Definition 2</div>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate matching pairs</p>
          </div>
        </div>
      );
    }
    
    if (content.length === 0) return null;
    // Support both {left, right} and {term, definition} formats
    // Prepare terms and definitions arrays
    const terms = content.map((pair, idx) => ({
      value: pair.left || pair.term || pair.question || '',
      idx
    }));
    const defs = content.map((pair, idx) => ({
      value: pair.right || pair.definition || pair.answer || '',
      idx
    }));

    // Remove already matched pairs
    const unmatchedTerms = terms.filter(t => !matchedPairs.some(mp => mp.termIdx === t.idx));
    const unmatchedDefs = defs.filter(d => !matchedPairs.some(mp => mp.defIdx === d.idx));

    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow`}>
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Match the pairs:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Terms</h4>
              {unmatchedTerms.map((term) => (
                <button
                  key={term.idx}
                  className={`w-full p-3 rounded-lg border-2 ${selectedTerm === term.idx ? (darkMode ? 'border-teal-500 bg-teal-800 text-gray-200' : 'border-teal-600 bg-teal-100') : (darkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-teal-200 bg-teal-50')} transition-all`}
                  onClick={() => setSelectedTerm(term.idx)}
                  disabled={selectedTerm === term.idx}
                >
                  {term.value}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Definitions</h4>
              {unmatchedDefs.map((def) => (
                <button
                  key={def.idx}
                  className={`w-full p-3 rounded-lg border-2 ${selectedDef === def.idx ? (darkMode ? 'border-gray-500 bg-gray-700 text-gray-200' : 'border-gray-600 bg-gray-100') : (darkMode ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-200 bg-gray-50')} transition-all`}
                  onClick={() => setSelectedDef(def.idx)}
                  disabled={selectedDef === def.idx}
                >
                  {def.value}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <span className={`font-medium ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>Score: {matchingScore} / {content.length}</span>
          </div>
          {matchedPairs.length === content.length && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold text-center">
              All pairs matched!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFillBlanks = () => {
    if (content.length === 0) {
      if (fileContent) {
        return (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Fill-in-the-Blanks</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create fill-in-the-blank prompts from your text.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => openCountPrompt('fillBlanks')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.fillBlanks); setActiveMode('fillBlanks'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto flex flex-col justify-center items-center`}>
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Fill in the Blank</h3>
            {fileContent ? (
              <>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No fill-in-the-blank questions were generated from your file.</p>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Try uploading a different file or check the file content.</p>
              </>
            ) : (
              <>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sentence: The mitochondria is the _____ of the cell.</p>
                <input
                  type="text"
                  className={`w-full p-3 border-2 border-gray-300 rounded-lg mt-4 ${subtleBg} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  placeholder="Type your answer here..."
                  disabled
                />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate fill-in-the-blank questions</p>
              </>
            )}
          </div>
        </div>
      );
    }
    
    const item = content[currentIndex];
  // Fallback mapping for question and answer
  const blankText = item.sentence || item.text || item.question || item.statement || item.title || '';
  const answerText = item.answer || item.content || '';
  console.log('FillBlanks question:', blankText);
    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow`}>
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Fill in the blank:</h3>
          <div className={`text-lg mb-2 ${cardText}`}>
            <span className="font-semibold">Question:</span> {blankText ? blankText : <span className="text-gray-400">No question text found in AI response.</span>}
          </div>
          <div className="space-y-4 mb-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-400 focus:outline-none ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'}`}
              placeholder="Type your answer here..."
              disabled={showAnswer}
            />
            <button
              onClick={checkFillBlankAnswer}
              disabled={!userAnswer.trim() || showAnswer}
              className={`px-6 py-2 rounded-lg transition-all duration-300 transform ${
                !userAnswer.trim() || showAnswer
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 hover:shadow-lg'
              }`}
            >
              Check Answer
            </button>
          </div>
          <div className="text-lg mb-2">
            <span className="font-semibold">Answer:</span> {answerText ? answerText : <span className="text-gray-400">No answer found in AI response.</span>}
          </div>
          {showAnswer && (
            <div className={`mt-4 p-3 rounded-lg ${
              userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}>
                {userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim() 
                  ? 'Correct!' 
                  : `Incorrect. The correct answer is: ${answerText || 'N/A'}`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render completion results
  const renderCompletionResults = () => {
    const modeNames = {
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      trueFalse: 'True/False Quiz',
      wheel: 'Spin the Wheel',
      matching: 'Matching Game',
      fillBlanks: 'Fill in the Blanks'
    };

    const modeName = modeNames[activeMode] || 'Study Session';
    const hasScore = ['quiz', 'trueFalse', 'fillBlanks'].includes(activeMode);
    const percentage = hasScore ? Math.round((score / content.length) * 100) : 100;
    
    let performanceMessage = '';
    let performanceColor = '';
    
    if (hasScore) {
      if (percentage >= 90) {
        performanceMessage = 'Excellent work! 🎉';
        performanceColor = 'text-green-600';
      } else if (percentage >= 70) {
        performanceMessage = 'Good job! 👍';
        performanceColor = 'text-blue-600';
      } else if (percentage >= 50) {
        performanceMessage = 'Not bad, keep practicing! 📚';
        performanceColor = 'text-yellow-600';
      } else {
        performanceMessage = 'Keep studying, you can do better! 💪';
        performanceColor = 'text-orange-600';
      }
    } else {
      performanceMessage = 'Great job completing all cards! 🎉';
      performanceColor = 'text-green-600';
    }

    return (
      <div className={`${cardBg} rounded-xl p-8 shadow-lg border-2 border-teal-200`}>
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className={`${cardText} text-2xl font-bold mb-2`}>
              {modeName} Completed!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You have answered all {content.length} questions
            </p>
          </div>

          {hasScore && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-teal-700 mb-2">
                {score} / {content.length}
              </div>
              <div className="text-xl font-semibold text-teal-600 mb-1">
                {percentage}% Correct
              </div>
              <div className={`text-lg font-medium ${performanceColor}`}>
                {performanceMessage}
              </div>
            </div>
          )}

          {!hasScore && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 mb-6">
              <div className="text-2xl font-bold text-teal-700 mb-2">
                {content.length} Cards Reviewed
              </div>
              <div className={`text-lg font-medium ${performanceColor}`}>
                {performanceMessage}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setProgress(0);
                setShowAnswer(false);
                setSelectedAnswer(null);
                setUserAnswer('');
                setIsCompleted(false);
                // Reset matching state
                setSelectedTerm(null);
                setSelectedDef(null);
                setMatchedPairs([]);
                setMatchingScore(0);
                // Reset wheel mode state
                setViewedQuestions(new Set());
                setWheelAnsweredSet(new Set());
                // Reset fill-in-the-blanks state
                setAnsweredQuestions([]);
              }}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-teal-700 hover:shadow-lg"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => {
                setActiveMode(null);
                setContent([]);
                setCurrentIndex(0);
                setScore(0);
                setProgress(0);
                setIsCompleted(false);
                // Reset wheel mode state
                setViewedQuestions(new Set());
                setWheelAnsweredSet(new Set());
                // Reset fill-in-the-blanks state
                setAnsweredQuestions([]);
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-gray-600 hover:shadow-lg"
            >
              📚 Choose New Mode
            </button>
          </div>

          {/* AI improvement suggestions */}
          <div className="mt-6">
            {aiLoading ? (
              <div className={`${cardBg} rounded-xl p-4`}>Generating improvement tips...</div>
            ) : aiSuggestions ? (
              <div className={`${cardBg} rounded-xl p-4 text-left`}> 
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">AI Improvement Suggestions</div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => requestImprovementSuggestions(activeMode)} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Regenerate</button>
                    <button onClick={() => { navigator.clipboard?.writeText(aiSuggestions); }} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Copy</button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{aiSuggestions}</div>
              </div>
            ) : (
              <div className={`${cardBg} rounded-xl p-4`}> 
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Want tips to improve retention?</div>
                  <button onClick={() => requestImprovementSuggestions(activeMode)} className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">Get AI Tips</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStatsPanel = () => {
    return (
      <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Session Statistics</div>
          <div className="text-xs text-gray-500">{sessionStats.reviewedCount} items</div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Reviewed</div>
            <div className="font-semibold">{sessionStats.reviewedCount}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Correct</div>
            <div className="font-semibold text-green-600">{sessionStats.correctCount}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Incorrect</div>
            <div className="font-semibold text-red-600">{sessionStats.incorrectCount}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Accuracy</div>
            <div className="font-semibold">{sessionStats.accuracy}%</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Time Elapsed</div>
            <div className="font-semibold">{formatTime(sessionStats.timeElapsed)}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Avg / Item</div>
            <div className="font-semibold">{Math.round(sessionStats.avgTimePerCard / 1000)}s</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Streak</div>
            <div className="font-semibold">{sessionStats.currentStreak}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Best Streak</div>
            <div className="font-semibold">{sessionStats.longestStreak}</div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <div className="flex items-center space-x-2">
            <button onClick={resetStats} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Reset Stats</button>
            <button onClick={() => requestImprovementSuggestions(activeMode)} className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">Get AI Tips</button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={`flex flex-col items-center justify-center min-h-[16rem] h-auto ${cardBg} rounded-xl shadow-lg overflow-auto`}>
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent absolute top-0"></div>
          </div>
          <span className={`mt-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'} animate-pulse`}>Processing your file and generating AI content...</span>
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      );
    }

    // Only show content if a mode is selected
    // If there's no uploaded file and no fileContent AND there is no loaded content,
    // show the initial empty state regardless of any default `activeMode` (so users see the "Ready to Study?" UI).
    // This allows loading saved study sets (which populate `content`) to display immediately
    // even when no file is present.
    if (!fileContent && !uploadedFile && content.length === 0) {
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch ${darkMode ? '' : ''}`}>
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto flex flex-col justify-between overflow-auto animate-fade-in`}>
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Ready to Study?</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>Upload your file to generate AI-powered study materials, or try a sample to preview study modes.</p>

              <div className="space-y-3">
                <button
                  onClick={triggerFileInput}
                  className={`w-full px-4 py-3 rounded-lg font-semibold ${themeColors.light} ${themeColors.text} hover:${themeColors.hover} transition-colors`}
                >
                  📤 Upload File
                </button>

                <div className="mt-2">
                  <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Or try a sample:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {studyModes.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => applySample(m.id)}
                        className={`px-3 py-2 rounded-lg text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:scale-105 transition-transform ${darkMode ? 'bg-gray-700 text-gray-200' : ''}`}
                        title={`Preview ${m.name}`}
                      >
                        {m.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Tip: Use the sample to quickly preview how a study mode looks before uploading your own material.</div>
          </div>

          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto animate-fade-in`}> 
            <h3 className={`text-lg font-semibold mb-3 ${cardText}`}>Study Modes</h3>
            <div className="grid grid-cols-2 gap-3">
              {studyModes.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'bg-gray-700' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">{m.icon}</div>
                    <div>
                      <div className={`font-medium ${cardText}`}>{m.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Requires a file or sample</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // If we have file content (or an uploaded file) but no activeMode selected, show the quick mode chooser
    if (!activeMode) {
      return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}> 
          <div className={`${cardBg} rounded-xl p-6 shadow col-span-2`}> 
            <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Your file is ready</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Choose a study mode to generate AI content and start practicing. Click any card to begin.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studyModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => requestModeChange(m.id)}
                  disabled={loading || !fileContent}
                  className={`w-full p-4 rounded-lg text-left border ${activeMode === m.id ? 'scale-105 shadow-lg' : ''} ${(loading || !fileContent) ? (darkMode ? 'border-gray-700 bg-gray-700 text-gray-500 cursor-not-allowed' : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed') : (darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white')} transition-all`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8">{m.icon}</div>
                    <div>
                      <div className={`font-medium ${cardText}`}>{m.name}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Preview or generate {m.name.toLowerCase()}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-6 shadow`}> 
            <h3 className={`text-lg font-semibold mb-3 ${cardText}`}>Quick Actions</h3>
              <div className="space-y-3">
              <button onClick={() => { setContent([]); setActiveMode(null); setFileContent(''); setUploadedFile(null); resetStats(); }} className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>Reset</button>
              <button onClick={() => applySample('flashcards')} className={`w-full px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text}`}>Try Flashcards Sample</button>
              <button onClick={() => applySample('quiz')} className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>Try Quiz Sample</button>
            </div>
          </div>
        </div>
      );
    }

    // Show completion results if completed (except for matching and fillBlanks which have their own)
    if (isCompleted && !['matching', 'fillBlanks'].includes(activeMode)) {
      return renderCompletionResults();
    }

    switch (activeMode) {
      case 'flashcards':
        return (
          <div className="space-y-4">
            <FlashCardMode
              content={content}
              currentIndex={currentIndex}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save Flashcard Set (${content.length} cards)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      case 'quiz':
        return (
          <div className="space-y-4">
            <QuizMode
              content={content}
              currentIndex={currentIndex}
              selectedAnswer={selectedAnswer}
              handleAnswerSelect={handleAnswerSelect}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save Quiz Set (${content.length} questions)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      case 'trueFalse':
        return (
          <div className="space-y-4">
            <TrueFalseMode
              content={content}
              currentIndex={currentIndex}
              selectedAnswer={selectedAnswer}
              handleAnswerSelect={handleAnswerSelect}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save True/False Set (${content.length} questions)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      case 'wheel':
        return (
          <div className="space-y-4">
            <WheelMode
              content={content}
              currentIndex={currentIndex}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              wheelSpinning={wheelSpinning}
              spinWheel={spinWheel}
              wheelRotation={wheelRotation}
              onComplete={(completed) => setIsCompleted(completed)}
              viewedQuestions={viewedQuestions}
              score={score}
              setScore={setScore}
              disabledIndices={Array.from(wheelAnsweredSet)}
              onAnswered={handleWheelAnswered}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save Wheel Set (${content.length} questions)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      case 'matching':
        return (
          <div className="space-y-4">
            <MatchingMode
              content={content}
              matchedPairs={matchedPairs}
              selectedTerm={selectedTerm}
              setSelectedTerm={setSelectedTerm}
              selectedDef={selectedDef}
              setSelectedDef={setSelectedDef}
              matchingScore={matchingScore}
              onComplete={(completed) => setIsCompleted(completed)}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save Matching Set (${content.length} pairs)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      case 'fillBlanks':
        return (
          <div className="space-y-4">
            <FillBlanksMode
              content={content}
              currentIndex={currentIndex}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
              score={score}
              setScore={setScore}
              onComplete={(completed) => setIsCompleted(completed)}
              checkAnswer={checkFillBlankAnswer}
              answeredQuestions={answeredQuestions}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  disabled={isCurrentContentSaved}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                  style={isCurrentContentSaved ? { background: (darkMode ? '#374151' : '#9CA3AF'), color: 'white', cursor: 'not-allowed' } : { background: themeColors.gradientCss, color: 'white' }}
                >
                  <svg className="w-5 h-5" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{isCurrentContentSaved ? 'Saved' : `Save Fill-in-Blanks Set (${content.length} questions)`}</span>
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 ml-20 md:ml-28">
        {/* Global modal for alerts with blurred backdrop */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative z-10 w-full max-w-lg mx-4">
              <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6`}> 
                {modalTitle && <div className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{modalTitle}</div>}
                <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{modalMessage}</div>
                <div className="mt-4 flex justify-end space-x-2">
                  {modalConfirmAction ? (
                    <>
                      <button onClick={() => { if (modalCancelAction) modalCancelAction(); else closeModal(); }} className="px-4 py-2 bg-gray-100 rounded">{modalCancelLabel}</button>
                      <button onClick={() => { if (modalConfirmAction) modalConfirmAction(); else closeModal(); }} className="px-4 py-2 bg-red-600 text-white rounded">{modalConfirmLabel}</button>
                    </>
                  ) : (
                    <button onClick={closeModal} className="px-4 py-2 bg-teal-600 text-white rounded">OK</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8 page-header-group">
          <h1 className={`text-5xl font-bold page-title`}>
            AI Study Mode - File Based
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg page-subtitle`}>Upload your study material and practice with AI-generated content</p>
        </div>

        {/* File Upload */}
        <div className={`mb-6 ${cardBg} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-up`}>
          <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>
            <svg className="w-5 h-5 inline mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2h6l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 2v6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Upload Study Material
          </label>
          <div className="flex items-center space-x-4">
            {/* Hidden native file input; used for actual local file selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Visible button that shows chosen filename (or 'No file chosen')
                and opens the Source modal when clicked. */}
            <button
              onClick={() => setShowSourceModal(true)}
              className={`w-full text-left px-4 py-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              {uploadedFile ? uploadedFile.name : 'No file chosen'}
            </button>
            {uploadedFile && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200 animate-pulse">
                  ✓ {uploadedFile.name}
                </span>
                <button
                  onClick={removeCurrentFile}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-all duration-300 transform hover:scale-105"
                  title="Remove file"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
            {/* Save prompt modal */}
            {showSavePrompt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-lg p-6 rounded-xl ${cardBg} ${cardText} shadow-lg`}>
                  {isCurrentContentSaved ? (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Switch study mode?</h3>
                      <p className="text-sm mb-4">This study set is already saved. Do you want to switch modes without saving?</p>
                      <div className="flex justify-end gap-3">
                        <button onClick={handleCancelSwitch} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                        <button onClick={handleDiscardAndSwitch} className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}>Switch</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Save current study set?</h3>
                      <p className="text-sm mb-4">You have generated content for the current study mode. Would you like to save it before switching to a different mode?</p>
                      <div className="flex justify-end gap-3">
                        <button onClick={handleCancelSwitch} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                        <button onClick={handleDiscardAndSwitch} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Don't Save</button>
                        <button onClick={handleSaveAndSwitch} className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}>Save & Switch</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Mini-game modal moved: trigger is displayed in the content column below */}
            {/* Count prompt modal: ask how many items to generate for the selected mode */}
            {showCountPrompt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-md p-6 rounded-xl ${cardBg} ${cardText} shadow-lg`}> 
                  <h3 className="text-lg font-semibold mb-2">How many items to generate?</h3>
                  <p className="text-sm mb-4">Enter the number of items you want the AI to produce for this study mode.</p>
                    <div className="mb-4">
                    <input
                      type="number"
                      min="1"
                      max={MAX_GENERATED_ITEMS}
                      value={countInput}
                      onChange={(e) => setCountInput(e.target.value)}
                      className={`w-full p-3 border-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'}`}
                      placeholder="e.g. 10"
                    />
                    <p className="text-xs mt-2 text-gray-500">Maximum allowed: {MAX_GENERATED_ITEMS} items.</p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setShowCountPrompt(false); setCountPromptMode(null); setSuppressAutoLoad(false); }} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleGenerateWithCount} className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}>Generate</button>
                  </div>
                </div>
              </div>
            )}
            {/* Source chooser modal: Local or App Library */}
            {showSourceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`relative z-20 w-full max-w-md p-6 rounded-xl bg-white text-gray-900 shadow-lg`}>
                  <h3 className="text-lg font-semibold mb-2">Open File From</h3>
                  <p className="text-sm mb-4">Choose where to open your study material from.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={openLocalFilePicker} className={`w-full px-4 py-3 rounded-lg ${themeColors.light} ${themeColors.text} font-medium`}>📁 Local Computer</button>
                    <button onClick={openAppLibrary} className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${themeColors.text} font-medium`}>📚 My Library (App Files)</button>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setShowSourceModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Library picker modal: lists user's files for selection */}
            {showLibraryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className={`relative z-20 bg-white text-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto`}>
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Choose a file from your Library</h3>
                      <p className="text-sm text-gray-500">Select a file to load into this study session.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setShowLibraryModal(false); }} className="px-3 py-1 rounded bg-gray-100">Close</button>
                    </div>
                  </div>
                  <div className="p-4">
                    {libraryLoading ? (
                      <div className="text-center p-6">Loading files...</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {(!libraryFiles || libraryFiles.length === 0) && <div className="text-sm text-gray-500">No files found in your library.</div>}
                        {libraryFiles.map((f) => (
                          <div key={f._id || f.id || f.name} className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}> 
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{f.originalName || f.name}</div>
                              <div className="text-xs text-gray-500">{new Date(f.createdAt || f.uploadDate || f.uploadedAt || Date.now()).toLocaleString()} • {f.fileSize ? (Math.round(f.fileSize/1024) + ' KB') : ''}</div>
                              {f.textContent || f.content ? (
                                <div className="text-xs text-gray-400 mt-1 truncate">Has extracted text content</div>
                              ) : null}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button onClick={() => selectLibraryFile(f)} className={`px-3 py-1 rounded ${themeColors.light} ${themeColors.text}`}>Use this file</button>
                              <a href={`${API_BASE}/api/library/download/${f._id || f.id}?userId=${f.userId || ''}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-gray-50 border text-sm">Download</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          {/* Mode Selection */}
          <div className="xl:col-span-1 lg:col-span-1">
            <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-right`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <svg className="w-6 h-6 inline mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 19v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Study Methods
              </h2>
              <div className="space-y-3">
                {studyModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => requestModeChange(mode.id)}
                    disabled={loading || !fileContent}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-all duration-300 text-left transform ${
                      (loading || !fileContent)
                        ? `${darkMode ? 'border-gray-700 bg-gray-700 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'} cursor-not-allowed`
                        : activeMode === mode.id
                        ? `border-${themeColors.primary}-400 ${themeColors.light} ${themeColors.text} scale-105 shadow-lg`
                        : `${darkMode ? 'border-gray-600 hover:border-' + themeColors.primary + '-400 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:border-' + themeColors.primary + '-300 hover:' + themeColors.light + ' text-gray-600'} hover:scale-105 hover:shadow-md hover:translate-x-1`
                    }`}
                  >
                    <div className={`transition-transform duration-300 ${
                      (loading || !fileContent) ? '' : 'group-hover:scale-110'
                    }`}>
                      {mode.icon}
                    </div>
                    <span className="ml-3 font-medium">{mode.name}</span>
                  </button>
                ))}
                {/* Removed Play Mini Game button from Study Methods - mini-game is available in the main content area */}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="xl:col-span-2 lg:col-span-2">
            {/* Progress Bar */}
            {content.length > 0 && activeMode !== 'wheel' && activeMode !== 'matching' && (
              <div className={`${cardBg} shadow rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Progress</span>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold`}>
                      {currentIndex + 1} / {content.length}
                    </span>
                    {(activeMode === 'quiz' || activeMode === 'trueFalse') && (
                      <label className="inline-flex items-center space-x-2 text-sm">
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto-Next</span>
                        <button
                          onClick={() => {
                            if (activeMode === 'quiz') setQuizAutoNext(q => !q);
                            else if (activeMode === 'trueFalse') setTrueFalseAutoNext(v => !v);
                          }}
                          className={`ml-2 px-3 py-1 rounded-full border transition-colors ${
                            (activeMode === 'quiz' ? quizAutoNext : trueFalseAutoNext) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          {(activeMode === 'quiz' ? quizAutoNext : trueFalseAutoNext) ? 'On' : 'Off'}
                        </button>
                      </label>
                    )}
                  </div>
                </div>
                <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                  <div 
                    className={`bg-gradient-to-r ${themeColors.gradient} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Score Display */}
            {(activeMode === 'quiz' || activeMode === 'trueFalse' || activeMode === 'fillBlanks') && content.length > 0 && (
              <div className={`bg-gradient-to-r ${themeColors.light} ${themeColors.light} shadow rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-${themeColors.primary}-100`}>
                <div className="flex items-center justify-between">
                  <span className={`${themeColors.textDark} font-semibold`}>Current Score</span>
                  <span className={`${themeColors.textDark} text-2xl font-bold ${darkMode ? 'bg-gray-700' : ''} px-3 py-1 rounded-lg shadow-sm`}>
                    {score} / {Math.max(currentIndex + (showAnswer && activeMode !== 'fillBlanks' ? 1 : 0), 1)}
                  </span>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="mb-6">
              {renderContent()}
            </div>

            {/* Navigation Buttons */}
            {content.length > 0 && activeMode !== 'wheel' && activeMode !== 'matching' && (
              <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300`}>
                <div className="flex justify-between items-center">
                  {/* Determine whether current question is answered based on mode */}
                  {(() => {
                    // Determine answered status using the central answeredSet which is updated
                    // whenever a question is answered (quiz/trueFalse/fillBlanks/wheel).
                    const prevIdx = currentIndex - 1;
                    // For flashcards we allow free navigation (no answer gating).
                    const prevDisabled = currentIndex === 0 || (activeMode !== 'flashcards' && answeredSet.has(prevIdx));
                    const currentAnswered = (activeMode === 'flashcards') ? true : answeredSet.has(currentIndex);
                    const nextDisabled = (activeMode === 'flashcards') ? (currentIndex === content.length - 1) : (!currentAnswered || currentIndex === content.length - 1);

                    return (
                      <>
                        <button
                          onClick={handlePrevious}
                          disabled={prevDisabled}
                          className={`px-8 py-3 rounded-lg transition-all duration-300 transform font-semibold ${
                            prevDisabled
                              ? `${darkMode ? 'bg-gray-700 text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                              : `${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'} hover:scale-105 hover:shadow-lg hover:-translate-x-1 active:scale-95`
                          }`}
                          title={prevDisabled ? 'Cannot go back to already-answered questions' : undefined}
                        >
                          ← Previous
                        </button>

                        <span className={`text-sm ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'} font-medium px-3 py-1 rounded-full`}>
                          {currentIndex + 1} of {content.length}
                        </span>

                        <button
                          onClick={handleNext}
                          disabled={nextDisabled}
                          className={`px-8 py-3 rounded-lg transition-all duration-300 transform font-semibold ${
                            currentIndex === content.length - 1
                              ? `${darkMode ? 'bg-gray-700 text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                              : (activeMode === 'fillBlanks' && !showAnswer)
                              ? 'bg-orange-400 text-white cursor-not-allowed'
                              : `bg-${themeColors.primary}-600 text-white hover:bg-${themeColors.primary}-700 hover:scale-105 hover:shadow-lg hover:translate-x-1 active:scale-95`
                          }`}
                          title={
                            (activeMode === 'fillBlanks' && !showAnswer)
                              ? 'Check your answer first before moving to the next question'
                              : (nextDisabled ? 'Answer the current question before navigating' : undefined)
                          }
                        >
                          {(activeMode === 'fillBlanks' && !showAnswer) ? 'Check Answer First' : 'Next →'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Stats Panel (hidden for Flashcards mode) */}
            {content.length > 0 && activeMode !== 'flashcards' && (
              <div className="mb-6">
                {renderStatsPanel()}
              </div>
            )}

            {/* Mini-game card (separate from mode selector) - show only when a file is uploaded or fileContent exists */}
            {(uploadedFile || fileContent) && (
              <div className={`${cardBg} shadow rounded-xl p-6 mt-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${cardText}`}>Mini-game</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Play the Flappy mini-game</p>
                  </div>
                  <div>
                    <button
                      onClick={() => setIsGameOpen(true)}
                      disabled={loading || (!uploadedFile && !fileContent)}
                      className={`px-4 py-2 rounded-lg font-semibold ${loading || (!uploadedFile && !fileContent) ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-teal-600 text-white'} hover:bg-teal-700`}
                    >
                      Play Mini-game
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mount GameModal here so it appears separate from the study mode selector */}
            {isGameOpen && (
              <GameModal isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} content={content} fileContent={fileContent} />
            )}
          </div>

          {/* Saved Study Sets History */}
          <div className="xl:col-span-1 lg:col-span-3 xl:col-start-4">
            <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-left`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <svg className="w-5 h-5 inline mr-2" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3h14v7H5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10v9a1 1 0 001 1h8a1 1 0 001-1v-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 7h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Saved Study Sets
                </h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`${themeColors.text} hover:${themeColors.textDark} font-medium text-sm transition-colors`}
                >
                  {showHistory ? 'Hide' : 'Show'} ({savedStudySets.length})
                </button>
              </div>
              
              {showHistory && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedStudySets.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No saved study sets yet</p>
                  ) : (
                    savedStudySets.map((savedSet) => {
                      // Get appropriate icon for study mode (SVGs use theme color)
                      const modeIcons = {
                        flashcards: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM13 7h6" />
                          </svg>
                        ),
                        quiz: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ),
                        trueFalse: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ),
                        wheel: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 2v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 19v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ),
                        matching: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14a3 3 0 104.24 4.24l3-3a3 3 0 00-4.24-4.24l-1.06 1.06" />
                          </svg>
                        ),
                        fillBlanks: (
                          <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16 3l4 4" />
                          </svg>
                        )
                      };
                      const icon = modeIcons[savedSet.studyMode] || (
                        <svg className="w-5 h-5" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      );
                      
                      return (
                        <div key={savedSet.id} className={`border ${darkMode ? 'border-gray-600 hover:border-' + themeColors.primary + '-400' : 'border-gray-200 hover:border-' + themeColors.primary + '-300'} rounded-lg p-3 transition-colors`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate flex items-center`}>
                                <span className="mr-2">{icon}</span>
                                {savedSet.title}
                              </h3>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                {savedSet.itemCount || savedSet.content?.length || savedSet.cards?.length || 0} items • {savedSet.createdAt}
                              </p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                                <svg className="w-4 h-4 inline mr-1" style={{ color: themeColors.primaryHex || undefined }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M7 2h6l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {savedSet.fileName}
                              </p>
                            </div>
                              <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => showConfirm(
                                  `Load ${savedSet.itemCount || savedSet.content?.length || savedSet.cards?.length || 0} items from \"${savedSet.title}\"?`,
                                  'Load Study Set',
                                  () => loadSavedStudySet(savedSet),
                                  null,
                                  'Load',
                                  'Cancel'
                                )}
                                className={`px-2 py-1 text-xs ${themeColors.light} ${themeColors.text} rounded hover:${themeColors.hover} transition-colors`}
                                title="Load study set"
                              >
                                📖 Load
                              </button>
                              <button
                                onClick={() => showConfirm(
                                  `Delete "${savedSet.title}"? This cannot be undone.`,
                                  'Delete Study Set',
                                  () => deleteSavedStudySet(savedSet.id),
                                  null,
                                  'Delete',
                                  'Cancel'
                                )}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                title="Delete study set"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {!showHistory && savedStudySets.length > 0 && (
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>You have {savedStudySets.length} saved study sets</p>
                  <button
                    onClick={() => setShowHistory(true)}
                    className={`text-xs px-3 py-1 ${themeColors.light} ${themeColors.text} rounded-full hover:${themeColors.hover} transition-colors`}
                  >
                    View History
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}