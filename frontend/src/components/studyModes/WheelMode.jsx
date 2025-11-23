import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function WheelMode({ content, currentIndex, showAnswer, setShowAnswer, wheelSpinning, spinWheel, wheelRotation, onComplete, viewedQuestions, score, setScore }) {
  const { darkMode } = useSettings();
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardText = darkMode ? 'text-gray-200' : 'text-gray-800';
  const subtleBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  console.log('WheelMode content:', content);
  
  // State for user interaction
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  
  // Check if all questions have been answered (completion)
  const isCompleted = answeredQuestions.size === content.length && content.length > 0;
  
  // Notify parent when completed
  React.useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete(true);
    }
  }, [isCompleted, onComplete]);

  // If completed, show results
  if (isCompleted) {
    const percentage = Math.round((score / content.length) * 100);
    const performanceMessage = 
      score === content.length ? 'Perfect Score! 🏆' :
      score >= content.length * 0.8 ? 'Great Job! 🌟' :
      score >= content.length * 0.6 ? 'Good Effort! 👍' : 'Keep Practicing! 💪';
    const performanceColor = 
      score === content.length ? 'text-emerald-600' :
      score >= content.length * 0.8 ? 'text-emerald-600' :
      score >= content.length * 0.6 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-emerald-200'}`}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎡</div>
            <h2 className={`text-2xl font-bold mb-2 ${cardText}`}>
              Wheel Challenge Completed!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-emerald-700'}`}>
              You have answered all {content.length} wheel questions!
            </p>
          </div>

          <div className={`${cardBg} rounded-xl p-6 mb-6`}>
            <div className="text-4xl font-bold text-emerald-700 mb-2">
              {score} / {content.length}
            </div>
            <div className="text-xl font-semibold text-emerald-600 mb-1">
              {percentage}% Correct
            </div>
            <div className={`text-lg font-medium ${performanceColor}`}>
              {performanceMessage}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-6 mb-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${cardText}`}>📝 Review Your Answers</h3>
            <div className="space-y-3">
              {Array.from(answeredQuestions).map((questionIndex) => {
                const question = content[questionIndex];
                const questionText = question?.label || question?.question || question?.content || 'Question not available';
                const correctAnswer = question?.value || question?.answer || 'Answer not available';
                
                return (
                  <div key={questionIndex} className={`p-4 rounded-lg border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`font-medium mb-2 ${cardText}`}>
                          <strong>Q{questionIndex + 1}:</strong> {questionText}
                        </div>
                        <div className={`${darkMode ? 'text-emerald-300' : 'text-sm text-emerald-700'}`}>
                          <strong>Answer:</strong> {correctAnswer}
                        </div>
                      </div>
                      <div className="text-2xl ml-4 text-emerald-600">
                        ✅
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <div className="relative inline-block">
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 shadow-lg flex items-center justify-center">
            <div className="text-white text-xl font-semibold">Spin the Wheel Template</div>
          </div>
        </div>
        <button className="px-8 py-3 rounded-lg font-semibold bg-gray-400 text-white cursor-not-allowed mt-4">Spin the Wheel</button>
        <p className="text-gray-500 mt-2">Upload a file to generate wheel questions</p>
      </div>
    );
  }

  // Calculate slice angles
  const numQuestions = content.length;
  const radius = 128; // px (smaller wheel)
  const center = radius;
  const sliceAngle = 360 / numQuestions;

  // Helper to get question text
  const getText = (q) => q.label || q.question || q.content || q.title || q.topic || q.front || q.statement || '';

  // Calculate which slice is at the top (arrow at 12 o'clock, -90deg SVG)
  const normalizedRotation = ((wheelRotation % 360) + 360) % 360;
  // Offset by -90deg to match SVG top
  const selectedIndex = numQuestions > 0 ? Math.round(((360 - normalizedRotation - 90 + 360) % 360) / sliceAngle) % numQuestions : 0;

  // Helper function to check if answer is correct
  const isAnswerCorrect = (questionIndex) => {
    const question = content[questionIndex];
    if (question?.options) {
      // Multiple choice
      const correctIndex = question.correctAnswer || question.answer || 0;
      return selectedAnswer === correctIndex;
    } else {
      // Text answer - use 'value' property for the correct answer
      const correctAnswer = question?.value || question?.answer || question?.correctAnswer || question?.back || '';
      return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!hasAnswered && (userAnswer.trim() || selectedAnswer !== null)) {
      setHasAnswered(true);
      
      // Check if answer is correct and update score
      if (isAnswerCorrect(selectedIndex)) {
        setScore(score + 1);
      }
      
      // Mark this question as answered
      const newAnsweredQuestions = new Set(answeredQuestions);
      newAnsweredQuestions.add(selectedIndex);
      setAnsweredQuestions(newAnsweredQuestions);
    }
  };

    return (
    <div className="space-y-6 text-center">
  <div className="relative inline-block" style={{ width: radius * 2, height: radius * 2 + 40 }}>
        <svg
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          style={{
            transform: `rotate(${wheelRotation}deg)`,
            transition: wheelSpinning ? 'transform 2s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
            zIndex: 1,
          }}
        >
          {content.map((q, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            const largeArc = sliceAngle > 180 ? 1 : 0;
            // Convert angles to radians
            const startRad = (Math.PI / 180) * startAngle;
            const endRad = (Math.PI / 180) * endAngle;
            // Calculate coordinates
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            // Highlight selected slice (the one at the top)
            const isSelected = i === selectedIndex;
            return (
              <g key={i}>
                <path
                  d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
                  fill={isSelected ? '#14b8a6' : `hsl(${(i * 360) / numQuestions}, 70%, 80%)`}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {/* Text label for each slice */}
                <text
                  x={center + (radius / 1.5) * Math.cos((startRad + endRad) / 2)}
                  y={center + (radius / 1.5) * Math.sin((startRad + endRad) / 2)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={isSelected ? 18 : 13}
                  fill={isSelected ? '#fff' : '#333'}
                  style={{ fontWeight: isSelected ? 'bold' : 'normal', pointerEvents: 'none' }}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Large wheel pointer (adjusted to point at wheel edge) */}
        <div
          className="absolute left-1/2"
          style={{
            top: -12,
            transform: 'translateX(-50%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          <svg width="56" height="44" viewBox="0 0 56 44">
            <polygon points="28,2 52,36 4,36" fill="#14b8a6" stroke="#0f766e" strokeWidth="2" />
            <circle cx="28" cy="36" r="4" fill="#fff" stroke="#0f766e" strokeWidth="2" />
          </svg>
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
      {content.length > 0 && (
        <div className={`${cardBg} rounded-xl p-6 shadow`}>
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>🎡 Wheel Question:</h3>
          {/* If spinning, show spinner text; if no revealed index, prompt to spin; else show question */}
          {wheelSpinning ? (
            <div className="mb-6 text-center py-8">
              <div className="text-lg font-medium mb-2">Spinning...</div>
              <div className="text-sm text-gray-500">The question will appear after the wheel stops.</div>
            </div>
          ) : activeIndex === null ? (
            <div className="mb-6 text-center py-8">
              <div className="text-lg font-medium mb-2">Spin the wheel to reveal a question</div>
              <div className="text-sm text-gray-500">Click "Spin the Wheel" to get a randomized question.</div>
            </div>
          ) : (
            <div className="mb-6">
              <p className={`text-lg font-medium mb-4 ${cardText}`}>
                {content[activeIndex]?.label || content[activeIndex]?.question || content[activeIndex]?.content || content[activeIndex]?.title || content[activeIndex]?.topic || content[activeIndex]?.front || content[activeIndex]?.statement || 'Question not found'}
              </p>
            </div>
          )}

          {/* Answer Section */}
          {!hasAnswered ? (
            <div className="space-y-4">
              {/* Check if it's a multiple choice question */}
              {content[selectedIndex]?.options && Array.isArray(content[selectedIndex].options) ? (
                <div className="space-y-3">
                  <p className={`${darkMode ? 'text-gray-300' : 'font-medium text-gray-700'}`}>Choose your answer:</p>
                  {content[selectedIndex].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === index
                          ? 'border-teal-500 bg-teal-50 text-teal-800'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-teal-25'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                    </button>
                  ))}
                </div>
              ) : (
                /* Text input for open-ended questions */
                <div className="space-y-3">
                  <p className={`${darkMode ? 'text-gray-300' : 'font-medium text-gray-700'}`}>Type your answer:</p>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className={`w-full p-3 border-2 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'border-gray-300'}`}
                    placeholder="Enter your answer here..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && (userAnswer.trim() || selectedAnswer !== null)) {
                        handleSubmitAnswer();
                      }
                    }}
                  />
                </div>
              )}
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() && selectedAnswer === null}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  (!userAnswer.trim() && selectedAnswer === null)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700 transform hover:scale-105'
                }`}
              >
                Submit Answer
              </button>
            </div>
          ) : (
            /* Show result after answering */
            <div className="space-y-4">
              {content[selectedIndex]?.options ? (
                <div className="space-y-3">
                  <p className={`${darkMode ? 'text-gray-300' : 'font-medium text-gray-700'}`}>Your answer vs. Correct answer:</p>
                  {content[selectedIndex].options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                        index === (content[selectedIndex].correctAnswer || content[selectedIndex].answer || 0)
                          ? 'border-green-500 bg-green-50'
                          : index === selectedAnswer
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <span>
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                      </span>
                      <div className="flex space-x-2">
                        {index === selectedAnswer && (
                          <span className="text-blue-600 font-bold">👤 Your Choice</span>
                        )}
                        {index === (content[selectedIndex].correctAnswer || content[selectedIndex].answer || 0) && (
                          <span className="text-green-600 font-bold">✅ Correct</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`${darkMode ? 'bg-blue-900 border-blue-800 text-blue-200 p-4' : 'p-4 bg-blue-50 border border-blue-200'} rounded-lg`}>
                    <p className={`${darkMode ? 'text-blue-200' : 'text-blue-800'}`}><strong>Your Answer:</strong> {userAnswer}</p>
                  </div>
                  <div className={`${darkMode ? 'bg-green-900 border-green-800 text-green-200 p-4' : 'p-4 bg-green-50 border border-green-200'} rounded-lg`}>
                    <p className={`${darkMode ? 'text-green-200' : 'text-green-800'}`}><strong>Correct Answer:</strong> {content[selectedIndex]?.value || content[selectedIndex]?.answer || content[selectedIndex]?.correctAnswer || content[selectedIndex]?.back || 'Answer not available'}</p>
                  </div>
                </div>
              )}
              
              <div className={`p-4 rounded-lg text-center font-semibold ${
                isAnswerCorrect(selectedIndex) 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {isAnswerCorrect(selectedIndex) ? '🎉 Correct!' : '❌ Incorrect'}
              </div>

              <button
                onClick={() => {
                  // Reset for next question
                  setHasAnswered(false);
                  setUserAnswer('');
                  setSelectedAnswer(null);
                  setShowAnswer(false);
                }}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all duration-200 transform hover:scale-105"
              >
                🎡 Spin Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
