import React, { useRef, useEffect, useState } from 'react';
import QuizMode from './studyModes/QuizMode';
import { parseMCQFromContent, synthesizeMCQFromContent } from '../utils/studyUtils';

export default function GameModal({ isOpen, onClose, content = [], fileContent = '' }) {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highestScore, setHighestScore] = useState(() => {
    try {
      const v = localStorage.getItem('game_highest_score');
      return v ? Number(v) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [showQuestion, setShowQuestion] = useState(null);
  const [selectedQ, setSelectedQ] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef(null);
  const [lastParseResult, setLastParseResult] = useState(null);
  const [lastSynthesizeResult, setLastSynthesizeResult] = useState(null);
  const [lastAIResult, setLastAIResult] = useState(null);
  const [awaitingContinue, setAwaitingContinue] = useState(false);


  const birdRef = useRef({ x: 80, y: 160, r: 14, vel: 0 });
  const pipesRef = useRef([]);
  const frameRef = useRef(0);
  const gameOverRef = useRef(false);

  // Tuned physics for playable feel
  const gravity = 0.12;        // gentler pull down
  const jump = -4.5;          // smaller upward impulse
  const maxFallSpeed = 3.2;   // cap falling speed
  const maxUpSpeed = -7;      // cap upward speed
  const pipeWidth = 48;
  const gap = 140;            // larger gap for easier navigation
  const pipeSpeed = 1.1;      // slower pipes

  const initGameState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 480;
    canvas.height = 320;
    birdRef.current = { x: 80, y: canvas.height / 2, r: 14, vel: 0 };
    pipesRef.current = [];
    frameRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setShowQuestion(null);
    setSelectedQ(null);
    setSelectedAnswer(null);
  };

  // parseMCQFromContent is provided by shared utils

  const spawnPipe = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = canvas.height;
    const top = Math.random() * (height - gap - 60) + 20;
    pipesRef.current.push({ x: canvas.width + 20, top, scored: false });
  };

  const endGame = () => {
    gameOverRef.current = true;
    setIsRunning(false);
    setGameOver(true);
    // pick a random question to show
    let q = null;
    if (Array.isArray(content) && content.length > 0) {
      const idx = Math.floor(Math.random() * content.length);
      const item = content[idx];
      q = item.front || item.question || item.statement || item.sentence || item.left || item.label || JSON.stringify(item).slice(0, 200);
    } else if (fileContent && fileContent.trim()) {
      const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) q = lines[Math.floor(Math.random() * lines.length)].slice(0, 300);
      else q = fileContent.slice(0, 300);
    } else {
      q = 'No questions available. Upload a file or generate study content first.';
    }
    // Build a quiz-style question object if possible
    let qObj = null;
    if (Array.isArray(content) && content.length > 0) {
      const idx = Math.floor(Math.random() * content.length);
      const item = content[idx];
      // Try to detect quiz-like structure
      const qText = item.question || item.front || item.statement || item.sentence || item.title || item.label || '';
      let options = item.options || item.choices || null;
      let correctIndex = null;
      if (Array.isArray(options) && options.length > 0) {
        // Determine correct index if possible
        if (typeof item.correct === 'number') correctIndex = item.correct;
        else if (typeof item.answer === 'number') correctIndex = item.answer;
        else if (typeof item.correct === 'string') correctIndex = options.findIndex(o => o.toLowerCase().trim() === item.correct.toLowerCase().trim());
        else if (typeof item.answer === 'string') correctIndex = options.findIndex(o => o.toLowerCase().trim() === item.answer.toLowerCase().trim());
      } else if (item.answer || item.back) {
        // Build options by sampling other answers in content
        const correct = item.answer || item.back || '';
        const allAnswers = content.map(c => c.answer || c.back).filter(a => a && a !== correct);
        const distractors = [];
        const used = new Set();
        while (distractors.length < 3 && allAnswers.length > 0) {
          const i = Math.floor(Math.random() * allAnswers.length);
          if (!used.has(allAnswers[i])) {
            distractors.push(allAnswers[i]);
            used.add(allAnswers[i]);
          }
        }
        while (distractors.length < 3) distractors.push('N/A');
        options = [correct, ...distractors];
        // shuffle
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        correctIndex = options.findIndex(o => (o || '').toString() === (correct || '').toString());
      }

      if (qText || options) {
        qObj = { question: qText || 'Question', options: options || [], correctIndex };
      }
    }

    if (qObj) {
      // Normalize options to exactly 4 choices
      let opts = Array.isArray(qObj.options) ? qObj.options.slice() : [];
      const correctVal = typeof qObj.correctIndex === 'number' ? opts[qObj.correctIndex] : null;
      // Build pool of distractors from content answers/back values
      const pool = (Array.isArray(content) ? content.map(c => c.answer || c.back).filter(Boolean) : []).filter(a => a !== correctVal);
      const used = new Set(opts.map(o => o));
      // If too many options, trim but keep correct
      if (opts.length > 4) {
        // ensure correct stays
        const correct = correctVal;
        opts = opts.filter(o => o === correct).concat(opts.filter(o => o !== correct).slice(0, 3));
      }
      // Add distractors until 4
      while (opts.length < 4) {
        let added = false;
        if (pool.length > 0) {
          const i = Math.floor(Math.random() * pool.length);
          const val = pool.splice(i, 1)[0];
          if (!used.has(val)) {
            opts.push(val);
            used.add(val);
            added = true;
          }
        }
        if (!added) {
          opts.push('N/A');
        }
      }
      // If correctIndex wasn't set, try to find it
      let correctIndex = -1;
      if (correctVal) correctIndex = opts.findIndex(o => (o || '').toString() === (correctVal || '').toString());
      if (correctIndex === -1 && qObj.correctIndex != null) correctIndex = qObj.correctIndex;
      qObj.options = opts;
      qObj.correctIndex = correctIndex >= 0 ? correctIndex : 0;
      setSelectedQ(qObj);
      setShowQuizModal(true);
    } else {
      // Try additional fallbacks before giving up
      console.debug('GameModal.endGame: no qObj generated from content. Attempting fallbacks...');

      // 1) Try to parse an explicit MCQ block from the raw file content
      try {
        const parsedFromFile = parseMCQFromContent(fileContent);
        if (parsedFromFile) {
          console.debug('GameModal.endGame: parsed MCQ from fileContent', parsedFromFile);
          setLastParseResult(parsedFromFile);
          setSelectedQ({ question: parsedFromFile.question, options: parsedFromFile.options, correctIndex: parsedFromFile.correctIndex ?? 0 });
          setShowQuizModal(true);
          cancelAnimationFrame(animationRef.current);
          return;
        }
      } catch (e) {
        console.debug('GameModal.endGame: parseMCQFromContent threw', e);
      }

      // 2) Synthesize a multiple-choice question from existing `content` items if possible
      try {
        const synthesized = synthesizeMCQFromContent(Array.isArray(content) ? content : []);
        if (synthesized) {
          console.debug('GameModal.endGame: synthesized MCQ from content (shared util)', synthesized);
          setLastSynthesizeResult(synthesized);
          setSelectedQ(synthesized);
          setShowQuizModal(true);
          cancelAnimationFrame(animationRef.current);
          return;
        }
      } catch (e) {
        console.debug('GameModal.endGame: synthesis from content threw', e);
      }

      // Prefer attempting to generate an MCQ from the uploaded file before falling back to True/False
      try {
        const autoGen = generateQuizFromFile();
        if (autoGen) {
          console.debug('GameModal.endGame: auto-generated MCQ from file');
          cancelAnimationFrame(animationRef.current);
          return;
        }
      } catch (e) {
        console.debug('GameModal.endGame: automatic generateQuizFromFile threw', e);
      }

      // 3) Fallback: let the UI offer generation options and show a helpful message
      console.debug('GameModal.endGame: no MCQ found after fallbacks. Trying True/False fallback. content length:', Array.isArray(content) ? content.length : 0, 'fileContent length:', fileContent ? fileContent.length : 0);

      // Try True/False fallback: prefer structured TF items in content
      try {
        if (Array.isArray(content) && content.length > 0) {
          const tfItem = content.find(it => typeof it.answer === 'boolean' && (it.statement || it.question || it.title));
          if (tfItem) {
            const stmt = tfItem.statement || tfItem.question || tfItem.title || '';
            const tfQ = { statement: stmt, answer: !!tfItem.answer, explanation: tfItem.explanation || '', isTrueFalse: true };
            console.debug('GameModal.endGame: found TF item in content', tfQ);
            setLastSynthesizeResult(null);
            setLastParseResult(null);
            setSelectedQ(tfQ);
            setShowQuizModal(true);
            cancelAnimationFrame(animationRef.current);
            return;
          }
        }
      } catch (e) {
        console.debug('GameModal.endGame: TF fallback from content threw', e);
      }

      // Try to extract a sentence from fileContent as TF statement
      try {
        if (fileContent) {
          const sentences = fileContent.split(/(?<=[.!?])\s+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
          if (sentences.length > 0) {
            const stmt = sentences[Math.floor(Math.random() * sentences.length)];
            const tfQ = { statement: stmt, answer: null, explanation: null, isTrueFalse: true };
            console.debug('GameModal.endGame: synthesized TF from fileContent', tfQ);
            setSelectedQ(tfQ);
            setShowQuizModal(true);
            cancelAnimationFrame(animationRef.current);
            return;
          }
        }
      } catch (e) {
        console.debug('GameModal.endGame: TF fallback from fileContent threw', e);
      }

      console.debug('GameModal.endGame: no MCQ or TF found after fallbacks. presenting generation options.');
      setShowQuestion('No multiple-choice question found automatically. Use "Generate Quiz from File", "Generate True/False from File", or "Generate with AI" below.');
    }
    cancelAnimationFrame(animationRef.current);
  };

  // Move generateQuizFromFile above endGame so endGame can call it automatically
  

  const generateQuizFromFile = () => {
    if (!fileContent) return;
    // First try to parse an explicit MCQ from the file content
    const parsed = parseMCQFromContent(fileContent);
    setLastParseResult(parsed);
    if (parsed) {
      setSelectedQ(parsed);
      setShowQuizModal(true);
      setShowQuestion(null);
      return true;
    }
    // Prefer extracting concise sentences instead of whole paragraphs
    const sentences = fileContent
      .split(/(?<=[.!?])\s+/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (sentences.length === 0) return;

    // Choose question candidate: prefer sentences that end with '?' or start with interrogatives
    const interrogatives = sentences.filter(s => /\?$/.test(s) || /^(What|Which|How|Why|When|Who)\b/i.test(s));
    let qText = null;
    if (interrogatives.length > 0) qText = interrogatives[Math.floor(Math.random() * interrogatives.length)];
    else {
      // fallback: pick a reasonably short informative sentence
      const good = sentences.filter(s => s.length > 30 && s.length < 140);
      qText = good.length > 0 ? good[Math.floor(Math.random() * good.length)] : sentences[Math.floor(Math.random() * sentences.length)];
    }

    // Build options from other short sentences (truncate to keep options concise)
    const pool = sentences.filter(s => s !== qText).map(s => s.length > 140 ? s.slice(0, 137) + '...' : s);
    const opts = [qText.length > 140 ? qText.slice(0, 137) + '...' : qText];
    const used = new Set([opts[0]]);
    let attempts = 0;
    while (opts.length < 4 && attempts < 50) {
      attempts++;
      if (pool.length > 0) {
        const i = Math.floor(Math.random() * pool.length);
        const val = pool.splice(i, 1)[0];
        if (!used.has(val) && val.length > 10) { opts.push(val); used.add(val); }
      } else {
        opts.push('N/A');
      }
    }
    // If we still lack options, fill with 'N/A'
    while (opts.length < 4) opts.push('N/A');
    // shuffle but keep track of correct index
    const correctText = opts[0];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    const correctIndex = opts.findIndex(o => o === correctText);
    const qObjFromFile = { question: qText.length > 140 ? qText.slice(0, 137) + '...' : qText, options: opts, correctIndex };
    setSelectedQ(qObjFromFile);
    setShowQuizModal(true);
    setShowQuestion(null);
    return true;
  };

  // Use backend AI to convert extracted text into a quiz JSON template
  const generateQuizWithAI = async () => {
    if (!fileContent) return setShowQuestion('No file content available for AI generation.');
    setIsGeneratingAI(true);
    try {
      // Prepare a concise excerpt to send to the AI
      const excerpt = fileContent.slice(0, 4000);
      const systemPrompt = `Convert the following text into a single multiple-choice question. Return ONLY valid JSON with the shape: {"question": "...", "choices": ["opt1","opt2","opt3","opt4"], "answer": <index 0-3>}. Make choices concise (max 120 chars each). If you cannot make four distinct choices, fill with 'N/A'.`;
      const body = JSON.stringify({ prompt: systemPrompt + "\n\nText:\n" + excerpt });
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) {
        const txt = await res.text();
        setShowQuestion('AI generation failed: ' + (txt || res.statusText));
        setIsGeneratingAI(false);
        return;
      }
      const data = await res.json();
      let reply = data?.reply || '';
      // Try to extract JSON substring from the reply
      let jsonText = '';
      try {
        jsonText = reply.trim();
        // if reply contains other text, try to find JSON array or object
        if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
          const mArr = reply.match(/\[[\s\S]*\]/);
          const mObj = reply.match(/\{[\s\S]*\}/);
          if (mArr) jsonText = mArr[0];
          else if (mObj) jsonText = mObj[0];
        }
        const parsed = JSON.parse(jsonText);
        // Accept either an array of questions or a single question
        if (Array.isArray(parsed)) {
          const normalizedArr = parsed.map((it) => {
            const q = it.question || it.q || '';
            const choices = it.options || it.choices || it.answers || [];
            const ans = it.correct != null ? Number(it.correct) : (it.answer != null ? Number(it.answer) : (it.correctIndex != null ? Number(it.correctIndex) : 0));
            return { question: q, options: (Array.isArray(choices) ? choices.slice(0,4) : []).map(o => String(o)), correctIndex: Math.max(0, Math.min(3, ans || 0)) };
          }).filter(q => q.question && Array.isArray(q.options) && q.options.length >= 1);
          if (normalizedArr.length === 0) throw new Error('No valid questions in AI response');
          setLastAIResult(normalizedArr);
          setQuizQuestions(normalizedArr);
          setCurrentQuizIndex(0);
          setSelectedQ(normalizedArr[0]);
          setShowQuizModal(true);
          setShowQuestion(null);
        } else {
          const q = parsed.question || parsed.q || parsed.prompt || '';
          const choices = parsed.choices || parsed.options || parsed.answers || [];
          const ans = parsed.answer != null ? Number(parsed.answer) : (parsed.correctIndex != null ? Number(parsed.correctIndex) : 0);
          if (!q || !Array.isArray(choices) || choices.length === 0) throw new Error('Invalid AI response');
          const normalized = { question: q, options: choices.slice(0,4), correctIndex: Math.max(0, Math.min(3, ans)) };
          setSelectedQ(normalized);
          setLastAIResult(normalized);
          setQuizQuestions([]);
          setShowQuizModal(true);
          setShowQuestion(null);
        }
      } catch (e) {
        setShowQuestion('AI returned unexpected format. Fallback will be used.');
        // fallback to local generation
        generateQuizFromFile();
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setShowQuestion('AI generation failed: ' + (err.message || String(err)));
      setLastAIResult({ error: String(err) });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateTrueFalseFromContent = () => {
    // Prefer structured true/false items from generated `content`
    if (Array.isArray(content) && content.length > 0) {
      const tfItem = content.find(it => typeof it.answer === 'boolean' && (it.statement || it.question || it.title));
      if (tfItem) {
        const stmt = tfItem.statement || tfItem.question || tfItem.title || '';
        setSelectedQ({ statement: stmt, answer: !!tfItem.answer, explanation: tfItem.explanation || '' , isTrueFalse: true });
        setShowQuizModal(true);
        return;
      }
    }
    // Fallback: extract a sentence from fileContent and present it as TF (unknown truth)
    if (fileContent) {
      const sentences = fileContent.split(/(?<=[.!?])\s+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (sentences.length > 0) {
        const stmt = sentences[Math.floor(Math.random() * sentences.length)];
        setSelectedQ({ statement: stmt, answer: null, explanation: null, isTrueFalse: true });
        setShowQuizModal(true);
        return;
      }
    }
    // Nothing available
    setShowQuestion('No statements found to form a True/False question. Try generating with AI.');
  };

  const generateTrueFalseWithAI = async () => {
    if (!fileContent) return setShowQuestion('No file content available for AI generation.');
    setIsGeneratingAI(true);
    try {
      const excerpt = fileContent.slice(0, 4000);
      const prompt = `Convert the following text into an array of True/False statements. Return ONLY valid JSON array of objects like: [{"statement":"...","answer":true|false,"explanation":"optional short explanation"}, ...]. Make statements concise.`;
      const body = JSON.stringify({ prompt: prompt + '\n\nText:\n' + excerpt });
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) {
        const txt = await res.text();
        setShowQuestion('AI generation failed: ' + (txt || res.statusText));
        setIsGeneratingAI(false);
        return;
      }
      const data = await res.json();
      let reply = data?.reply || '';
      // extract JSON
      let jsonText = reply.trim();
      if (!jsonText.startsWith('[')) {
        const m = reply.match(/\[[\s\S]*\]/);
        if (m) jsonText = m[0];
      }
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLastAIResult(parsed);
        // pick the first statement
        const first = parsed[0];
        const stmt = first.statement || first.sentence || first.question || '';
        const ans = typeof first.answer === 'boolean' ? first.answer : (first.answer === 'true' || first.answer === 'True');
        setSelectedQ({ statement: stmt, answer: ans, explanation: first.explanation || '', isTrueFalse: true });
        setShowQuizModal(true);
        setShowQuestion(null);
      } else {
        setShowQuestion('AI returned no valid True/False statements');
      }
    } catch (err) {
      console.error('AI TF generation error:', err);
      setShowQuestion('AI generation failed: ' + (err.message || String(err)));
      setLastAIResult({ error: String(err) });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSelectAnswer = (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
  };

  // When the quiz modal receives an answer
  const handleQuizAnswerSelect = (idx, correct) => {
    if (selectedAnswer !== null) return;
    console.debug('handleQuizAnswerSelect called:', idx, correct);
    setSelectedAnswer(idx);
    // Show the feedback and wait for user to continue (so they can read the explanation)
    setAwaitingContinue(true);
  };

  const renderSelectedQContent = () => {
    if (!selectedQ) return null;
    // True/False rendering
    if (selectedQ.isTrueFalse || selectedQ.statement) {
      return (
        <div className="space-y-4">
          <div className="text-lg font-medium">{selectedQ.statement || selectedQ.question}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {['True','False'].map((opt, idx) => {
              // Normalize answer representations: accept boolean or 'true'/'false' strings (trim + case-insensitive)
              const rawAns = selectedQ.answer;
              const rawStr = typeof rawAns === 'string' ? rawAns.trim().toLowerCase() : null;
              const hasAnswer = rawAns === true || rawAns === false || (rawStr === 'true' || rawStr === 'false');
              const normalizedAns = rawAns === true || rawStr === 'true';
              const correctIdx = hasAnswer ? (normalizedAns ? 0 : 1) : null;
              let btnCls = 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
              if (selectedAnswer !== null) {
                if (hasAnswer && idx === correctIdx) btnCls = 'border-green-500 bg-green-50 text-green-800';
                else if (idx === selectedAnswer && (!hasAnswer || idx !== correctIdx)) btnCls = 'border-red-500 bg-red-50 text-red-800';
                else btnCls = 'border-gray-200 bg-gray-50 text-gray-500';
              }
              return (
                <button
                  key={idx}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${btnCls}`}
                  onClick={() => {
                    if (selectedAnswer === null) {
                      const correct = hasAnswer ? ((normalizedAns && idx === 0) || (!normalizedAns && idx === 1)) : null;
                      handleQuizAnswerSelect(idx, !!correct);
                    }
                  }}
                  disabled={selectedAnswer !== null}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Fallback: plain multiple-choice rendering from selectedQ.options
    const options = selectedQ.options || [];
    const correctIdx = selectedQ.correctIndex ?? 0;
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium">{selectedQ.question}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {options.map((opt, idx) => {
            let btnCls = 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
            if (selectedAnswer !== null) {
              if (idx === correctIdx) btnCls = 'border-green-500 bg-green-50 text-green-800';
              else if (idx === selectedAnswer && idx !== correctIdx) btnCls = 'border-red-500 bg-red-50 text-red-800';
              else btnCls = 'border-gray-200 bg-gray-50 text-gray-500';
            }
            return (
              <button
                key={idx}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${btnCls}`}
                onClick={() => { if (selectedAnswer === null) handleQuizAnswerSelect(idx, idx === correctIdx); }}
                disabled={selectedAnswer !== null}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Persist highest score when current score exceeds it
  useEffect(() => {
    if (score > highestScore) {
      setHighestScore(score);
      try {
        localStorage.setItem('game_highest_score', String(score));
      } catch (e) {
        // ignore
      }
    }
  }, [score, highestScore]);

  const onJump = () => {
    if (gameOverRef.current || !isRunning) return;
    // set upward velocity, don't let it exceed the max up speed
    birdRef.current.vel = Math.max(jump, maxUpSpeed);
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    frameRef.current += 1;
    const bird = birdRef.current;
    bird.vel += gravity;
    // clamp velocity to avoid extreme speeds
    bird.vel = Math.max(Math.min(bird.vel, maxFallSpeed), maxUpSpeed);
    bird.y += bird.vel;

    if (frameRef.current % 140 === 0) spawnPipe();

    const pipes = pipesRef.current;
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= pipeSpeed;
      if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
        pipes[i].scored = true;
        setScore(s => s + 1);
      }
      if (pipes[i].x + pipeWidth < -50) pipes.splice(i, 1);
    }

    // collisions
    if (bird.y + bird.r > height - 24 || bird.y - bird.r < 0) {
      endGame();
      return;
    }
    for (const p of pipes) {
      const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeWidth;
      if (inX) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + gap) {
          endGame();
          return;
        }
      }
    }

    // draw
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);

    // ground
    ctx.fillStyle = '#7C4A00';
    ctx.fillRect(0, height - 24, width, 24);

    // pipes
    ctx.fillStyle = '#2E8B57';
    for (const p of pipes) {
      ctx.fillRect(p.x, 0, pipeWidth, p.top);
      ctx.fillRect(p.x, p.top + gap, pipeWidth, height - (p.top + gap) - 24);
    }

    // plane (replaces bird circle) - draw a simple stylized plane and rotate based on vertical velocity
    ctx.save();
    // translate to bird center
    ctx.translate(bird.x, bird.y);
    // rotate slightly based on velocity for pitch effect
    const angle = Math.max(Math.min(bird.vel * 0.35, Math.PI / 6), -Math.PI / 3);
    ctx.rotate(angle);
    // fuselage
    ctx.fillStyle = '#FFDD57';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(10, -4);
    ctx.lineTo(14, 0);
    ctx.lineTo(10, 4);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    // cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(2, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.fillStyle = '#FFB84D';
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-18, -14);
    ctx.lineTo(-10, -4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.lineTo(-18, 14);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
    // tail
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-16, -10);
    ctx.lineTo(-16, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // highest score display (white text overlay)
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Highest Score: ${highestScore}`, 12, 28);

    if (!gameOverRef.current) animationRef.current = requestAnimationFrame(loop);
  };

  const startGame = () => {
    initGameState();
    setIsRunning(true);
    // small delay to ensure canvas exists
    setTimeout(() => {
      // start loop
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(loop);
    }, 50);
  };

  // Key and click handlers
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRunning && !gameOverRef.current) startGame();
        else onJump();
      }
    };
    const canvas = canvasRef.current;
    const onClick = () => {
      if (!isRunning && !gameOverRef.current) startGame();
      else onJump();
    };

    window.addEventListener('keydown', onKey);
    if (canvas) canvas.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (canvas) canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen, isRunning]);

  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-transparent">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-[520px] max-w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Mini Game — Flappy</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">Tip: Space or click to flap</div>
            <button onClick={onClose} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 ml-2">Close</button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <canvas ref={canvasRef} width={480} height={320} className="rounded border" />

          {!isRunning && !gameOver && (
            <div className="mt-4 w-full flex flex-col items-center">
              <div className="text-sm text-gray-600 mb-3">Ready to play? Press Play or press Space to start.</div>
              <div className="flex gap-2">
                <button onClick={startGame} className="px-4 py-2 bg-teal-600 text-white rounded">Play</button>
                <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Close</button>
              </div>
            </div>
          )}

          <div className="mt-3 w-full flex justify-between items-center">
            <div className="text-sm text-gray-600">Score: <strong>{score}</strong></div>
            <div>
              <button onClick={() => { initGameState(); }} className="px-3 py-1 bg-gray-100 rounded mr-2">Reset</button>
              {!gameOver && (
                <button onClick={() => { startGame(); }} className="px-3 py-1 bg-teal-600 text-white rounded">Start</button>
              )}
              {gameOver && (
                <button onClick={() => { initGameState(); startGame(); }} className="px-3 py-1 bg-teal-600 text-white rounded">Play Again</button>
              )}
            </div>
            {/* Continue button shown after answering to resume the game */}
            {selectedAnswer !== null && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    // Close quiz modal and restart game
                    setShowQuizModal(false);
                    setAwaitingContinue(false);
                    setShowQuestion(null);
                    setSelectedAnswer(null);
                    setSelectedQ(null);
                    setGameOver(false);
                    initGameState();
                    setTimeout(() => startGame(), 80);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg"
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          

          {/* Game preview (idle) and Game Over panels */}
          {!isRunning && !gameOver && (
            <div className="mt-4 w-full">
              <div className="rounded-lg p-4 bg-gradient-to-r from-teal-500 to-indigo-600 text-white flex items-center gap-4 shadow-lg">
                <div className="w-28 h-16 relative flex-shrink-0">
                  <svg viewBox="0 0 120 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <rect width="120" height="60" rx="8" fill="rgba(255,255,255,0.08)" />
                    <g transform="translate(8,30)">
                      <g>
                        <g transform="translate(0,0)">
                          <path d="M0 -2 L18 -6 L26 -6 L34 -2 L26 2 L18 2 Z" fill="#FFD86B" />
                          <circle cx="10" cy="0" r="2" fill="#fff" />
                        </g>
                        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 0" dur="1.6s" repeatCount="indefinite" />
                      </g>
                    </g>
                    <g>
                      <ellipse cx="90" cy="14" rx="10" ry="3" fill="#ffffff22" />
                      <ellipse cx="110" cy="8" rx="6" ry="2" fill="#ffffff22" />
                    </g>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold">Flappy — Pilot the plane through gaps</div>
                  <div className="text-sm opacity-90 mt-1">Tap Space or click to flap. Avoid the pipes and beat your high score!</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="px-3 py-1 bg-white/20 rounded">Highest: <strong>{highestScore}</strong></div>
                    <button onClick={startGame} className="px-3 py-1 bg-white text-teal-700 rounded font-semibold">Play</button>
                    <button onClick={() => { generateQuizFromFile(); }} className="px-3 py-1 bg-white/10 border border-white/20 rounded text-sm">Generate Quiz</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="mt-4 w-full">
              <div className="rounded-lg p-4 bg-red-50 border border-red-200 text-red-800 flex items-center gap-4 shadow-inner">
                <div className="flex-1">
                  <div className="text-lg font-semibold">Game Over</div>
                  <div className="text-sm opacity-90 mt-1">Score: <strong>{score}</strong> • Highest: <strong>{highestScore}</strong></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { initGameState(); startGame(); }} className="px-3 py-1 bg-red-600 text-white rounded">Play Again</button>
                  <button onClick={() => { initGameState(); }} className="px-3 py-1 bg-gray-100 rounded">Reset</button>
                </div>
              </div>
            </div>
          )}
          {/* Quiz modal (separate) */}
          {( (showQuizModal && selectedQ) || showQuestion ) && (
            <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => {
                  if (selectedAnswer !== null) {
                    setShowQuizModal(false);
                    setShowQuestion(null);
                    setSelectedQ(null);
                    setSelectedAnswer(null);
                  }
                }}
              />
              <div role="dialog" aria-modal="true" className="relative z-50 w-full max-w-4xl mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">Quiz Question</h3>
                    {selectedAnswer !== null && (
                      <button
                        onClick={() => { setShowQuizModal(false); setShowQuestion(null); setSelectedQ(null); setSelectedAnswer(null); }}
                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Close
                      </button>
                    )}
                  </div>

                  {/* Determine source: structured selectedQ or plain showQuestion */}
                  {selectedQ ? (
                    renderSelectedQContent()
                  ) : (
                    // Plain text question: generate options from fileContent lines
                    <div className="space-y-4">
                      <div className="text-lg font-medium">{showQuestion}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {(() => {
                          const lines = fileContent ? fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
                          const pool = lines.filter(l => l && l !== showQuestion);
                          const opts = [];
                          // correct is the showQuestion
                          const correct = showQuestion;
                          opts.push(correct);
                          // pick up to 3 distractors
                          const used = new Set([correct]);
                          while (opts.length < 4) {
                            if (pool.length > 0) {
                              const i = Math.floor(Math.random() * pool.length);
                              const val = pool.splice(i, 1)[0];
                              if (!used.has(val)) { opts.push(val); used.add(val); }
                            } else {
                              opts.push('N/A');
                            }
                          }
                          // shuffle
                          for (let i = opts.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [opts[i], opts[j]] = [opts[j], opts[i]];
                          }
                          return opts.map((opt, idx) => (
                            <button
                              key={idx}
                              className={`w-full p-4 rounded-lg border-2 text-left transition ${selectedAnswer !== null ? (opt === showQuestion ? 'border-green-500 bg-green-50 text-green-800' : (idx === selectedAnswer ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-500')) : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'}`}
                              onClick={() => { if (selectedAnswer === null) handleQuizAnswerSelect(idx, opt === showQuestion); }}
                              disabled={selectedAnswer !== null}
                            >
                              {opt}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                    {selectedAnswer === null ? (
                      'Select an answer to continue.'
                    ) : (
                      (() => {
                        if (!selectedQ) return 'Answer submitted';
                        // True/False case
                        if (selectedQ.isTrueFalse || selectedQ.statement) {
                          const rawAns = selectedQ.answer;
                          const rawStr = typeof rawAns === 'string' ? rawAns.trim().toLowerCase() : null;
                          const hasAnswer = rawAns === true || rawAns === false || (rawStr === 'true' || rawStr === 'false');
                          const normalizedAns = rawAns === true || rawStr === 'true';
                          const correctIdx = hasAnswer ? (normalizedAns ? 0 : 1) : null;
                          const userCorrect = hasAnswer ? (Number(selectedAnswer) === correctIdx) : null;
                          const correctText = hasAnswer ? (normalizedAns ? 'True' : 'False') : 'Unknown';
                          return (
                            <div>
                              <div className={`${userCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                                {userCorrect === null ? 'Answer submitted' : (userCorrect ? 'Correct ✅' : `Incorrect — correct: ${correctText}`)}
                              </div>
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Explanation: {selectedQ.explanation || 'No explanation available.'}</div>
                            </div>
                          );
                        }

                        // MCQ case
                        const correctIdx = selectedQ.correctIndex ?? 0;
                        const userCorrect = selectedAnswer === correctIdx;
                        const correctText = (selectedQ.options && selectedQ.options[correctIdx]) ? selectedQ.options[correctIdx] : 'the correct answer';
                        return (
                          <div>
                            <div className={`${userCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                              {userCorrect ? 'Correct ✅' : `Incorrect — correct: ${correctText}`}
                            </div>
                            {selectedQ.explanation && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Explanation: {selectedQ.explanation}</div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}