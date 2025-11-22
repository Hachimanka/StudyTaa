import React, { useRef, useEffect, useState } from 'react';
import QuizMode from './studyModes/QuizMode';

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
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef(null);

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
      setShowQuestion(q);
    }
    cancelAnimationFrame(animationRef.current);
  };

  const handleSelectAnswer = (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
  };

  // When the quiz modal receives an answer
  const handleQuizAnswerSelect = (idx, correct) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    // keep the selection visible briefly, then close quiz modal so user can Play Again
    setTimeout(() => {
      setShowQuizModal(false);
      // reset selected answer so next quiz works
      setSelectedAnswer(null);
      setSelectedQ(null);
      setGameOver(false);
    }, 800);
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

    // bird
    ctx.beginPath();
    ctx.fillStyle = '#FFDD57';
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

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

  // cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cancelAnimationFrame(animationRef.current);
      gameOverRef.current = false;
      setIsRunning(false);
    } else {
      initGameState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          </div>

          

          {gameOver && (
            <div className="mt-4 w-full bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="font-semibold mb-2">Game Over</div>
              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">Here's a random question from your file:</div>
              {selectedQ ? (
                // The quiz question will be shown in a separate modal using QuizMode
                <div className="p-3 bg-white dark:bg-gray-800 border rounded text-sm text-gray-800 dark:text-gray-200">
                  <div className="mb-2 font-medium">A quiz question will open in a separate modal.</div>
                  <div className="text-sm text-gray-600">Close this and answer in the quiz modal.</div>
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-gray-800 border rounded text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{showQuestion}</div>
              )}
            </div>
          )}
          {/* Quiz modal (separate) */}
          {showQuizModal && selectedQ && (
            <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-30">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-[640px] max-w-full">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Quiz Question</h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setShowQuizModal(false)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
                  </div>
                </div>
                <QuizMode
                  content={[{ question: selectedQ.question, options: selectedQ.options, correct: selectedQ.correctIndex }]}
                  currentIndex={0}
                  selectedAnswer={selectedAnswer}
                  handleAnswerSelect={(idx, correct) => { setSelectedAnswer(idx); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
