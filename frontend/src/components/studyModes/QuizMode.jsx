import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function QuizMode({ content, currentIndex, selectedAnswer, handleAnswerSelect }) {
  const { darkMode } = useSettings();
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardText = darkMode ? 'text-gray-200' : 'text-gray-800';
  const subtleBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  if (content.length === 0 || !content[currentIndex]) {
    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center`}>
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
  const qText = question.question || '';
  let options = question.options || question.choices || [];
  if (typeof options === 'string') {
    options = options.split(/\n|,/).map(o => o.trim()).filter(Boolean);
  }
  // Determine correct answer index
  let correctIndex = null;
  if (typeof question.correct === 'number') {
    correctIndex = question.correct;
  } else if (typeof question.answer === 'number') {
    correctIndex = question.answer;
  } else if (typeof question.correct === 'string') {
    correctIndex = options.findIndex(opt => opt.toLowerCase().trim() === question.correct.toLowerCase().trim());
  } else if (typeof question.answer === 'string') {
    correctIndex = options.findIndex(opt => opt.toLowerCase().trim() === question.answer.toLowerCase().trim());
  }
  console.log('Quiz options:', options);
  console.log('Quiz correctIndex:', correctIndex);
  // Track selected answer per question
  // If selectedAnswer is an array, use selectedAnswer[currentIndex]
  let selected = selectedAnswer;
  if (Array.isArray(selectedAnswer)) {
    selected = selectedAnswer[currentIndex];
  }
  // Memoize options per question so they do not reshuffle on every render
  const [optionsCache] = React.useState(() => {
    // For each question, generate options once
    return content.map((q, idx) => {
      if (!q || !q.answer) return null;
      const allAnswers = content.map(qq => qq.answer).filter(a => a && a !== q.answer);
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
      const optionsArr = [q.answer, ...distractors];
      for (let i = optionsArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsArr[i], optionsArr[j]] = [optionsArr[j], optionsArr[i]];
      }
      return optionsArr;
    });
  });

  if (!qText || options.length === 0) {
    // Fallback: use memoized options
    if (qText && question.answer) {
      const optionsArr = optionsCache[currentIndex] || [];
      const correctIndex = optionsArr.findIndex(opt => opt === question.answer);
      return (
        <div className="space-y-6">
          <div className={`${cardBg} rounded-xl p-6 shadow`}>
            <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>{qText}</h3>
            <div className="space-y-3">
              {optionsArr.map((option, index) => {
                let buttonClass = 'border-gray-200 hover:border-teal-300 hover:bg-teal-50';
                
                if (selected !== null) {
                  // First check if this is the correct answer
                  if (index === correctIndex) {
                    // Always highlight the correct answer in green when an answer is selected
                    buttonClass = 'border-green-500 bg-green-50 text-green-800';
                  }
                  // Then check if this is the selected wrong answer (this can override correct answer styling)
                  else if (selected === index && index !== correctIndex) {
                    // Highlight the selected wrong answer in red
                    buttonClass = 'border-red-500 bg-red-50 text-red-800';
                  }
                  // Other unselected options
                  else if (selected !== index && index !== correctIndex) {
                    // Other options remain neutral
                    buttonClass = 'border-gray-200 bg-gray-50 text-gray-500';
                  }
                }

                return (
                  <button
                    key={index}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${buttonClass}`}
                    onClick={() => {
                      handleAnswerSelect(index, index === correctIndex);
                    }}
                    disabled={selected !== null}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    // Default template if no question/answer
    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center`}>
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
          {options.map((option, index) => (
            <button
              key={index}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedAnswer === index
                  ? index === correctIndex
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
              }`}
              onClick={() => {
                console.log('Selected:', index, 'Correct:', correctIndex);
                handleAnswerSelect(index, index === correctIndex);
              }}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
