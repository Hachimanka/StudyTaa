import React from 'react';

export default function TrueFalseMode({ content, currentIndex, selectedAnswer, handleAnswerSelect }) {
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center">
          <>
            <h3 className="text-xl font-semibold mb-4">True/False Template</h3>
            <p className="text-gray-700">Statement: [Fact or claim]</p>
            <div className="flex gap-4 mt-4">
              <button className="flex-1 p-4 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-600">True</button>
              <button className="flex-1 p-4 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-600">False</button>
            </div>
            <p className="text-gray-500 mt-2">Upload a file to generate true/false questions</p>
          </>
        </div>
      </div>
    );
  }
  const item = content[currentIndex];
  const statement = item.statement || item.question || '';
  const answer = typeof item.answer !== 'undefined' ? item.answer : item.correct;
  const explanation = item.explanation || '';
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-semibold mb-6">{statement}</h3>
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
            False
          </button>
        </div>
        {selectedAnswer !== null && (
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-teal-800">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
