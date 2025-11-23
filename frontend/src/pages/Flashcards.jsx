import React, { useState, useEffect, useRef } from 'react';
import FlashCardMode from '../components/studyModes/FlashCardMode';
import QuizMode from '../components/studyModes/QuizMode';
import TrueFalseMode from '../components/studyModes/TrueFalseMode';
import WheelMode from '../components/studyModes/WheelMode';
import MatchingMode from '../components/studyModes/MatchingMode';
import FillBlanksMode from '../components/studyModes/FillBlanksMode';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
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
const generateContentFromFile = async (mode, fileContent) => {
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
    const prompt = `You are an assistant that produces structured study material.
Produce ${modeInfo.label} from the following source material. ${modeInfo.instructions}
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
      alert('AI did not return valid JSON. Raw reply logged to console.');
      aiData = [];
    }
    return aiData;
  } catch (err) {
    console.error('AI generation error:', err);
    return [];
  }
};

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
  const [viewedQuestions, setViewedQuestions] = useState(new Set());
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  
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
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [recentLoadedSet, setRecentLoadedSet] = useState(null);
  const [pendingLoadSet, setPendingLoadSet] = useState(null);
  const [showConfirmLoad, setShowConfirmLoad] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const aiRequestTimer = useRef(null);

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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'quiz', 
      name: 'Quiz', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'trueFalse', 
      name: 'True or False', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'wheel', 
      name: 'Spin the Wheel', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    },
    { 
      id: 'matching', 
      name: 'Matching Pairs', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    { 
      id: 'fillBlanks', 
      name: 'Fill in the Blanks', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.click();
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
      alert('Error processing file. Please try again.');
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
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const loadContentFromFile = async (mode, content = fileContent) => {
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
    
    try {
      const data = await generateContentFromFile(mode, content);
      console.log('Loaded AI data for mode', mode, ':', data);
      setContent(data);
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
    
    setLoading(false);
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
    if (activeMode === 'flashcards') return;
    const now = Date.now();
    setSessionStats(prev => {
      const reviewed = prev.reviewedCount + 1;
      const correctCount = prev.correctCount + (correct ? 1 : 0);
      const incorrectCount = prev.incorrectCount + (correct ? 0 : 1);
      const timeElapsed = prev.timeStarted ? now - prev.timeStarted : prev.timeElapsed;
      const avgTimePerCard = reviewed > 0 ? Math.round(timeElapsed / reviewed) : 0;
      const currentStreak = correct ? prev.currentStreak + 1 : 0;
      const longestStreak = Math.max(prev.longestStreak, currentStreak);
      const accuracy = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 0;
      return {
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
    });
    setLastActionTime(now);
    // Schedule AI tips update after answer (debounced)
    scheduleAiTips(activeMode);
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
  const buildImprovementPrompt = (mode) => {
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

    return `You are an expert study coach. A user just completed a study session with the following summary:\n\nMode: ${modeNames[mode] || mode}\nItems reviewed: ${sessionStats.reviewedCount}\nCorrect: ${sessionStats.correctCount}\nIncorrect: ${sessionStats.incorrectCount}\nAccuracy: ${sessionStats.accuracy}%\nTime elapsed: ${formatTime(sessionStats.timeElapsed)}\nAverage time per item: ${Math.round(sessionStats.avgTimePerCard/1000)}s\nCurrent streak: ${sessionStats.currentStreak}\nBest streak: ${sessionStats.longestStreak}\n\nSample items (first up to 6):\n${sampleItems}\n\nBased on this information, provide a short, actionable improvement plan for the user: 5 concise recommendations the user should do next to improve retention and understanding (e.g., what to review, what mode to practice next, suggested spacing and number of repetitions, how to break down difficult items). Keep the advice practical and prioritized. Use plain text, short bullets.`;
  };

  const requestImprovementSuggestions = async (mode = activeMode) => {
    // Avoid duplicate concurrent calls
    if (aiLoading) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const prompt = buildImprovementPrompt(mode);
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

  // Save current study content to history
  const saveCurrentStudySet = () => {
    if (content.length === 0 || !activeMode) {
      alert('No study content to save!');
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
    alert(`Saved ${content.length} ${modeNames[activeMode].toLowerCase()} items to history!`);
  };

  // Load saved study content
  const loadSavedStudySet = (savedSet) => {
    setContent(savedSet.content || savedSet.cards); // Handle both old and new format
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
    setRecentLoadedSet({
      title: savedSet.title,
      count: savedSet.itemCount || savedSet.content?.length || savedSet.cards?.length || 0,
      mode: modeNames[savedSet.studyMode] || 'items'
    });
    setShowLoadModal(true);
  };

  // Delete saved study sets
  const deleteSavedStudySet = (id) => {
    const updatedSaved = savedStudySets.filter(set => set.id !== id);
    setSavedStudySets(updatedSaved);
    localStorage.setItem('savedStudySets', JSON.stringify(updatedSaved));
  };

  const confirmLoad = (savedSet) => {
    setPendingLoadSet(savedSet);
    setShowConfirmLoad(true);
  };

  const handleConfirmLoad = () => {
    if (pendingLoadSet) {
      loadSavedStudySet(pendingLoadSet);
    }
    setShowConfirmLoad(false);
    setPendingLoadSet(null);
  };

  const cancelConfirmLoad = () => {
    setShowConfirmLoad(false);
    setPendingLoadSet(null);
  };

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId !== null) {
      deleteSavedStudySet(pendingDeleteId);
    }
    setShowConfirmDelete(false);
    setPendingDeleteId(null);
  };

  const cancelConfirmDelete = () => {
    setShowConfirmDelete(false);
    setPendingDeleteId(null);
  };

  // Request a mode change, prompting to save current generated content if present
  const performModeSwitch = (modeId) => {
    setActiveMode(modeId);
    setIsCompleted(false);
    setCurrentIndex(0);
    // Reset wheel mode state when switching modes
    setViewedQuestions(new Set());
    // Reset fill-in-the-blanks state when switching modes
    setAnsweredQuestions([]);
  };

  const requestModeChange = (modeId) => {
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
    // Otherwise just switch
    performModeSwitch(modeId);
  };

  const handleSaveAndSwitch = () => {
    try {
      saveCurrentStudySet();
    } catch (e) {
      console.error('Save before switch failed:', e);
    }
    setShowSavePrompt(false);
    if (pendingMode) performModeSwitch(pendingMode);
    setPendingMode(null);
  };

  const handleDiscardAndSwitch = () => {
    setShowSavePrompt(false);
    if (pendingMode) performModeSwitch(pendingMode);
    setPendingMode(null);
  };

  const handleCancelSwitch = () => {
    setShowSavePrompt(false);
    setPendingMode(null);
  };

  useEffect(() => {
    // Only load content if file is uploaded AND user selects a mode (not on upload)
    if (fileContent && activeMode && uploadedFile) {
      loadContentFromFile(activeMode);
    }
  }, [activeMode]);

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
      setUserAnswer('');
      setProgress(((currentIndex - 1) / content.length) * 100);
    }
  };

  const handleAnswerSelect = (answerIndex, correct = false) => {
    // Start stats and record this answer
    startStatsIfNeeded();
    updateStatsOnAnswer(!!correct);
    setSelectedAnswer(answerIndex);
    if (correct) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      handleNext();
    }, 1500);
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
    // Stats: record this checked answer
    startStatsIfNeeded();
    updateStatsOnAnswer(isCorrect);
    
    // Check if this is the last question (completion)
    if (currentIndex === content.length - 1) {
      setIsCompleted(true);
    }
  };

  const spinWheel = () => {
    if (wheelSpinning || content.length === 0) return;

    setWheelSpinning(true);
    const spins = Math.floor(Math.random() * 5) + 5;
    // Pick a random slice to land on
    const sliceAngle = 360 / content.length;
    const targetIndex = Math.floor(Math.random() * content.length);
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
                <button onClick={() => loadContentFromFile('flashcards')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
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
          onClick={() => setShowAnswer(!showAnswer)}
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
    if (content.length === 0 || !content[currentIndex]) {
      if (fileContent) {
        return (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate Quiz Questions</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create multiple-choice questions from your file content.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => loadContentFromFile('quiz')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.quiz); setActiveMode('quiz'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
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
    console.log('Quiz options:', options);
    const correctIndex = typeof question.correct !== 'undefined' ? question.correct : question.answer;
    console.log('Quiz correctIndex:', correctIndex);
    if (!qText || options.length === 0) {
      // Fallback to template if missing fields
      console.log('Quiz fallback: missing qText or options');
      return (
        <div className="space-y-6">
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
        <div className={`${cardBg} rounded-xl p-6 shadow`}>
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>{qText}</h3>
          <div className="space-y-3">
            {options.map((option, index) => {
              let buttonClass = 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
              
              if (selectedAnswer !== null) {
                // First check if this is the correct answer
                if (index === correctIndex) {
                  // Always highlight the correct answer in green when an answer is selected
                  buttonClass = 'border-green-500 bg-green-50 text-green-800';
                }
                // Then check if this is the selected wrong answer (this can override correct answer styling)
                else if (selectedAnswer === index && index !== correctIndex) {
                  // Highlight the selected wrong answer in red
                  buttonClass = 'border-red-500 bg-red-50 text-red-800';
                }
                // Other unselected options
                else if (selectedAnswer !== index && index !== correctIndex) {
                  // Other options remain neutral
                  buttonClass = 'border-gray-200 bg-gray-50 text-gray-500';
                }
              }

              return (
                <button
                  key={index}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${buttonClass}`}
                  onClick={() => handleAnswerSelect(index, index === correctIndex)}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </button>
              );
            })}
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
            <div className={`${cardBg} rounded-xl p-6 shadow min-h-[12rem]`}>
              <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Generate True/False Questions</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create true/false statements from your file.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => loadContentFromFile('trueFalse')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
                <button onClick={() => { setContent(sampleSets.trueFalse); setActiveMode('trueFalse'); }} className="px-4 py-2 border rounded-lg">Preview Sample</button>
                <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg">Change Mode</button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-6">
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
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <button onClick={() => loadContentFromFile('wheel')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
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
              <svg className="w-16 h-16 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <button onClick={() => loadContentFromFile('matching')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
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
                <button onClick={() => loadContentFromFile('fillBlanks')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Generate Now</button>
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
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className={`${cardBg} rounded-xl p-4 shadow-sm animate-fade-up`}>
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
          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto flex flex-col justify-between overflow-auto animate-fade-up animate-fade-up-slow animate-fade-up-delay-1`}>
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

          <div className={`${cardBg} rounded-xl p-6 shadow min-h-[16rem] h-auto overflow-auto animate-fade-up animate-fade-up-slow animate-fade-up-delay-2`}> 
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
          <div className={`${cardBg} rounded-xl p-6 shadow col-span-2 animate-fade-up`}> 
            <h3 className={`text-xl font-semibold mb-2 ${cardText}`}>Your file is ready</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{uploadedFile ? uploadedFile.name : 'Using sample content'}</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Choose a study mode to generate AI content and start practicing. Click any card to begin.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studyModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => requestModeChange(m.id)}
                  className={`w-full p-4 rounded-lg text-left border ${activeMode === m.id ? 'scale-105 shadow-lg' : ''} ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'} transition-all`}
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

          <div className={`${cardBg} rounded-xl p-6 shadow animate-fade-up`}> 
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
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4 animate-fade-up`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save Flashcard Set ({content.length} cards)</span>
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
              <div className={`${cardBg} shadow rounded-xl p-4 animate-fade-up`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save Quiz Set ({content.length} questions)</span>
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
              <div className={`${cardBg} shadow rounded-xl p-4 animate-fade-up`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save True/False Set ({content.length} questions)</span>
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
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4 animate-fade-up`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save Wheel Set ({content.length} questions)</span>
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
              <div className={`${cardBg} shadow rounded-xl p-4 animate-fade-up`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save Matching Set ({content.length} pairs)</span>
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
              answeredQuestions={answeredQuestions}
            />
            {content.length > 0 && (
              <div className={`${cardBg} shadow rounded-xl p-4`}>
                <button
                  onClick={saveCurrentStudySet}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-emerald-700 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Save Fill-in-Blanks Set ({content.length} questions)</span>
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
        {/* Header */}
        <div className="mb-8 transform transition-all duration-500 hover:scale-105">
          <h1 className={`text-5xl font-bold page-title`}>
            AI Study Mode - File Based
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>Upload your study material and practice with AI-generated content</p>
        </div>

        {/* File Upload */}
        <div className={`mb-6 ${cardBg} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-up`}>
          <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>
            📄 Upload Study Material
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className={`block w-full text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}
                file:mr-4 file:py-3 file:px-6
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:${themeColors.light} file:${themeColors.text}
                hover:file:${themeColors.hover} file:transition-all file:duration-300
                file:hover:scale-105 file:shadow-sm hover:file:shadow-md`}
            />
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
            {/* Confirmation Modals */}
            {showSavePrompt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-lg p-6 rounded-xl ${cardBg} ${cardText} shadow-lg animate-fade-up`}>
                  <h3 className="text-lg font-semibold mb-2">Save current study set?</h3>
                  <p className="text-sm mb-4">You have generated content for the current study mode. Would you like to save it before switching to a different mode?</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={handleCancelSwitch} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleDiscardAndSwitch} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Don't Save</button>
                    <button onClick={handleSaveAndSwitch} className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}>Save & Switch</button>
                  </div>
                </div>
              </div>
            )}
            {showConfirmLoad && pendingLoadSet && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-sm p-6 rounded-xl ${cardBg} ${cardText} shadow-lg animate-fade-up`}>
                  <h3 className="text-lg font-semibold mb-2">Load Study Set?</h3>
                  <p className="text-sm mb-4">
                    Load <span className="font-semibold">{pendingLoadSet.itemCount || pendingLoadSet.content?.length || pendingLoadSet.cards?.length || 0}</span> items from
                    <span className="font-medium"> "{pendingLoadSet.title}"</span>?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={cancelConfirmLoad} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirmLoad} className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}>Load Set</button>
                  </div>
                </div>
              </div>
            )}
            {showConfirmDelete && pendingDeleteId !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-sm p-6 rounded-xl ${cardBg} ${cardText} shadow-lg animate-fade-up`}>
                  <h3 className="text-lg font-semibold mb-2">Delete Study Set?</h3>
                  <p className="text-sm mb-4">This action will permanently remove the saved set. Continue?</p>
                  <div className="flex justify-end gap-3">
                    <button onClick={cancelConfirmDelete} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                  </div>
                </div>
              </div>
            )}
            {showLoadModal && recentLoadedSet && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className={`w-full max-w-sm p-6 rounded-xl ${cardBg} ${cardText} shadow-lg animate-fade-up`}>
                  <h3 className="text-lg font-semibold mb-2">Study Set Loaded</h3>
                  <p className="text-sm mb-4">
                    Loaded <span className="font-semibold">{recentLoadedSet.count}</span> {recentLoadedSet.mode} from
                    <span className="font-medium"> "{recentLoadedSet.title}"</span>.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setShowLoadModal(false); setRecentLoadedSet(null); }}
                      className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >Close</button>
                    <button
                      onClick={() => { setShowLoadModal(false); }}
                      className={`px-4 py-2 rounded-lg ${themeColors.light} ${themeColors.text} hover:${themeColors.hover}`}
                    >Start Studying →</button>
                  </div>
                </div>
              </div>
            )}
          {/* Mode Selection */}
          <div className="xl:col-span-1 lg:col-span-1">
            <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-up animate-fade-up-slow animate-fade-up-delay-3`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🎯 Study Methods</h2>
              <div className="space-y-3">
                {studyModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => requestModeChange(mode.id)}
                    disabled={!fileContent}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-all duration-300 text-left transform ${
                      !fileContent
                        ? `${darkMode ? 'border-gray-700 bg-gray-700 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'} cursor-not-allowed`
                        : activeMode === mode.id
                        ? `border-${themeColors.primary}-400 ${themeColors.light} ${themeColors.text} scale-105 shadow-lg`
                        : `${darkMode ? 'border-gray-600 hover:border-' + themeColors.primary + '-400 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:border-' + themeColors.primary + '-300 hover:' + themeColors.light + ' text-gray-600'} hover:scale-105 hover:shadow-md hover:translate-x-1`
                    }`}
                  >
                    <div className={`transition-transform duration-300 ${
                      !fileContent ? '' : 'group-hover:scale-110'
                    }`}>
                      {mode.icon}
                    </div>
                    <span className="ml-3 font-medium">{mode.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="xl:col-span-2 lg:col-span-2">
            {/* Progress Bar */}
            {content.length > 0 && activeMode !== 'wheel' && activeMode !== 'matching' && (
              <div className={`${cardBg} shadow rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-up`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Progress</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold`}>
                    {currentIndex + 1} / {content.length}
                  </span>
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
              <div className={`bg-gradient-to-r ${themeColors.light} ${themeColors.light} shadow rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-${themeColors.primary}-100 animate-fade-up`}>
                <div className="flex items-center justify-between">
                  <span className={`${themeColors.textDark} font-semibold`}>Current Score</span>
                  <span className={`${themeColors.textDark} text-2xl font-bold ${darkMode ? 'bg-gray-700' : ''} px-3 py-1 rounded-lg shadow-sm`}>
                    {score} / {Math.max(currentIndex + (showAnswer && activeMode !== 'fillBlanks' ? 1 : 0), 1)}
                  </span>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="mb-6 animate-fade-up">
              {renderContent()}
            </div>

            {/* Stats Panel */}
            {content.length > 0 && (
              <div className="mb-6 animate-fade-up">
                {renderStatsPanel()}
              </div>
            )}

            {/* Navigation Buttons */}
            {content.length > 0 && activeMode !== 'wheel' && activeMode !== 'matching' && (
              <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-up`}>
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={`px-8 py-3 rounded-lg transition-all duration-300 transform font-semibold ${
                      currentIndex === 0
                        ? `${darkMode ? 'bg-gray-700 text-gray-600' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                        : `${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'} hover:scale-105 hover:shadow-lg hover:-translate-x-1 active:scale-95`
                    }`}
                  >
                    ← Previous
                  </button>

                  <span className={`text-sm ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'} font-medium px-3 py-1 rounded-full`}>
                    {currentIndex + 1} of {content.length}
                  </span>

                  <button
                    onClick={handleNext}
                    disabled={
                      currentIndex === content.length - 1 || 
                      (activeMode === 'fillBlanks' && !showAnswer)
                    }
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
                        : undefined
                    }
                  >
                    {(activeMode === 'fillBlanks' && !showAnswer) ? 'Check Answer First' : 'Next →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Study Sets History */}
          <div className="xl:col-span-1 lg:col-span-3 xl:col-start-4">
            <div className={`${cardBg} shadow rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-up animate-fade-up-slow animate-fade-up-delay-3`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>💾 Saved Study Sets</h2>
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
                      // Get appropriate icon for study mode
                      const modeIcons = {
                        flashcards: '🃏',
                        quiz: '❓',
                        trueFalse: '✅',
                        wheel: '🎯',
                        matching: '🔗',
                        fillBlanks: '📝'
                      };
                      const icon = modeIcons[savedSet.studyMode] || '📚';
                      
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
                                📄 {savedSet.fileName}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => confirmLoad(savedSet)}
                                className={`px-2 py-1 text-xs ${themeColors.light} ${themeColors.text} rounded hover:${themeColors.hover} transition-colors`}
                                title="Load study set"
                              >
                                📖 Load
                              </button>
                              <button
                                onClick={() => confirmDelete(savedSet.id)}
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