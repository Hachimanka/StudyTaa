import React from 'react';

export default function FillBlanksMode({ content, currentIndex, userAnswer, setUserAnswer, showAnswer, setShowAnswer, score, setScore }) {
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
