import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function FillBlanksMode({ content, currentIndex, userAnswer, setUserAnswer, showAnswer, setShowAnswer, score, setScore, onComplete, answeredQuestions = [], checkAnswer }) {
  const { darkMode } = useSettings();
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const cardText = darkMode ? 'text-gray-200' : 'text-gray-800';
  const subtleBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className={`${cardBg} rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center`}>
          <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Fill in the Blank Template</h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sentence: The mitochondria is the _____ of the cell.</p>
          <input
            type="text"
            className={`w-full p-3 border-2 rounded-lg mt-4 ${subtleBg} ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}
            placeholder="Type your answer here..."
            disabled
          />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>Upload a file to generate fill-in-the-blank questions</p>
        </div>
      </div>
    );
  }
  const item = content[currentIndex];
  const blankText = item.title || item.sentence || item.text || item.question || item.statement || '';
  const rawAnswer = item.content || item.answer || '';
  const answerText = rawAnswer.split(' ').slice(0, 2).join(' ');
  
  // Check if all questions have been answered
  const isCompleted = answeredQuestions.length === content.length && content.length > 0;
  
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
            <div className="text-4xl mb-2">🎉</div>
            <h2 className={`text-2xl font-bold mb-2 ${cardText}`}>
              Fill-in-the-Blanks Completed!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-emerald-700'}`}>
              You have answered all {content.length} questions!
            </p>
          </div>

          <div className={`${cardBg} rounded-xl p-6 mb-6`}>
            <div className={`text-4xl font-bold mb-2 ${cardText}`}>
              {score} / {content.length}
            </div>
            <div className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-emerald-600'} mb-1`}>
              {percentage}% Correct
            </div>
            <div className={`text-lg font-medium ${performanceColor}`}>
              {performanceMessage}
            </div>
          </div>

          <div className={`${cardBg} rounded-xl p-6 mb-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${cardText}`}>📝 Review Your Answers</h3>
            <div className="space-y-4">
              {answeredQuestions.map((answered, index) => {
                const questionItem = content[answered.questionIndex];
                const questionText = questionItem.title || questionItem.sentence || questionItem.text || questionItem.question || questionItem.statement || '';
                const correctAnswer = questionItem.content || questionItem.answer || '';
                const correctAnswerText = correctAnswer.split(' ').slice(0, 2).join(' ');
                const isCorrect = answered.userAnswer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim();
                
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${isCorrect ? (darkMode ? 'border-emerald-700 bg-emerald-900' : 'border-emerald-200 bg-emerald-50') : (darkMode ? 'border-red-700 bg-red-900' : 'border-red-200 bg-red-50')}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`font-medium mb-2 ${cardText}`}>
                          <strong>Q{answered.questionIndex + 1}:</strong> {questionText}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className={`${isCorrect ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-red-300' : 'text-red-700')}`}>
                            <strong>Your answer:</strong> {answered.userAnswer}
                          </div>
                          {!isCorrect && (
                            <div className={`${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                              <strong>Correct answer:</strong> {correctAnswerText}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`text-2xl ml-4 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isCorrect ? '✅' : '❌'}
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

  return (
    <div className="space-y-6">
      <div className={`${cardBg} rounded-xl p-6 shadow`}>
        <h3 className={`text-xl font-semibold mb-4 ${cardText}`}>Fill in the blank:</h3>
        <div className="text-lg mb-2">
          <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Question:</span> {blankText ? blankText : <span className="text-gray-400">No question text found in AI response.</span>}
        </div>
        <div className="space-y-4 mb-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className={`w-full p-3 border-2 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-400 focus:outline-none ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'border-gray-300'}`}
            placeholder="Type your answer here..."
            disabled={showAnswer}
          />
          <button
            onClick={() => {
              // Delegate checking to parent if provided so parent can mark this question answered
              if (typeof checkAnswer === 'function') {
                checkAnswer()
              } else {
                // Fallback: local behavior
                setShowAnswer(true);
                if (userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()) {
                  setScore(score + 1);
                }
              }
            }}
            disabled={!userAnswer.trim() || showAnswer}
            className={`px-6 py-2 rounded-lg transition-colors ${
              !userAnswer.trim() || showAnswer
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            Check Answer
          </button>
        </div>
        {/* Only show the answer after user checks */}
        {showAnswer && (
          <>
            <div className="text-lg mb-2">
              <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Answer:</span> {answerText ? answerText : <span className="text-gray-400">No answer found in AI response.</span>}
            </div>
            <div className={`mt-4 p-3 rounded-lg ${
              userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()
                ? (darkMode ? 'bg-green-900 border-green-800 text-green-200' : 'bg-green-50 border border-green-200')
                : (darkMode ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-50 border border-red-200')
            }`}>
              <p className={`font-medium ${
                userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()
                  ? (darkMode ? 'text-green-200' : 'text-green-800')
                  : (darkMode ? 'text-red-200' : 'text-red-800')
              }`}>
                {userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim() 
                  ? 'Correct!' 
                  : `Incorrect. The correct answer is: ${answerText || 'N/A'}`
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
