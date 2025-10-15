import React from 'react';

export default function FillBlanksMode({ content, currentIndex, userAnswer, setUserAnswer, showAnswer, setShowAnswer, score, setScore, onComplete, answeredQuestions = [] }) {
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center">
          <h3 className="text-xl font-semibold mb-4">Fill in the Blank Template</h3>
          <p className="text-gray-700">Sentence: The mitochondria is the _____ of the cell.</p>
          <input
            type="text"
            className="w-full p-3 border-2 border-gray-300 rounded-lg mt-4 bg-gray-100 text-gray-600"
            placeholder="Type your answer here..."
            disabled
          />
          <p className="text-gray-500 mt-2">Upload a file to generate fill-in-the-blank questions</p>
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
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg border border-emerald-200">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">
              Fill-in-the-Blanks Completed!
            </h2>
            <p className="text-emerald-700">
              You have answered all {content.length} questions!
            </p>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6">
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

          <div className="bg-white rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📝 Review Your Answers</h3>
            <div className="space-y-4">
              {answeredQuestions.map((answered, index) => {
                const questionItem = content[answered.questionIndex];
                const questionText = questionItem.title || questionItem.sentence || questionItem.text || questionItem.question || questionItem.statement || '';
                const correctAnswer = questionItem.content || questionItem.answer || '';
                const correctAnswerText = correctAnswer.split(' ').slice(0, 2).join(' ');
                const isCorrect = answered.userAnswer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim();
                
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 mb-2">
                          <strong>Q{answered.questionIndex + 1}:</strong> {questionText}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className={`${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            <strong>Your answer:</strong> {answered.userAnswer}
                          </div>
                          {!isCorrect && (
                            <div className="text-emerald-700">
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
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">Fill in the blank:</h3>
        <div className="text-lg mb-2">
          <span className="font-semibold text-gray-700">Question:</span> {blankText ? blankText : <span className="text-gray-400">No question text found in AI response.</span>}
        </div>
        <div className="space-y-4 mb-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-400 focus:outline-none"
            placeholder="Type your answer here..."
            disabled={showAnswer}
          />
          <button
            onClick={() => {
              setShowAnswer(true);
              // Check if correct and increment score
              if (
                userAnswer.toLowerCase().trim() === answerText.toLowerCase().trim()
              ) {
                setScore(score + 1);
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
              <span className="font-semibold text-gray-700">Answer:</span> {answerText ? answerText : <span className="text-gray-400">No answer found in AI response.</span>}
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
