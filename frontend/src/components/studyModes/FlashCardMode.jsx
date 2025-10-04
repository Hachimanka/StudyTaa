import React from 'react';

export default function FlashCardMode({ content, currentIndex, showAnswer, setShowAnswer }) {
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="relative h-64">
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
  // Get the question and answer without truncation
  let front = card.front || card.question || '';
  if (front.length < 20 && card.context) {
    front = `${front} - ${card.context}`;
  }
  // Keep the full answer - don't truncate
  let back = card.back || card.answer || '';
  return (
    <div className="space-y-6">
      <div 
        className="relative h-64 cursor-pointer"
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
}
