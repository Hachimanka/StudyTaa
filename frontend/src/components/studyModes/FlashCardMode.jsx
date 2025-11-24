import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function FlashCardMode({ content, currentIndex, showAnswer, setShowAnswer, onNext, onPrevious }) {
  const { getThemeColors } = useSettings();
  const themeColors = getThemeColors();
  
  // Helper: lighten a hex color by percent (0-100)
  const lightenHex = (hex, percent) => {
    try {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const num = parseInt(h, 16);
      let r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
      let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * (percent / 100));
      let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * (percent / 100));
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch (e) {
      return hex;
    }
  };
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="relative h-64">
          <div className="absolute inset-0 w-full h-full rounded-xl shadow-lg flex items-center justify-center p-6" style={{ background: themeColors.gradientCss }}>
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
            <div className="absolute inset-0 w-full h-full rounded-xl shadow-lg flex items-center justify-center p-6" style={{ background: themeColors.gradientCss }}>
              <h3 className="text-xl font-semibold text-white text-center">{front}</h3>
            </div>
          ) : (
            (() => {
              // Use a lighter variant for the flipped side to improve contrast with text
              const light = lightenHex(themeColors.primaryHex || '#0C969C', 40);
              const backGradient = `linear-gradient(90deg, ${light}, ${themeColors.primaryHex || '#0C969C'})`;
              return (
                <div className="absolute inset-0 w-full h-full rounded-xl shadow-lg flex items-center justify-center p-6" style={{ background: backGradient }}>
                  <p className="text-lg text-center">{back}</p>
                </div>
              );
            })()
          )}
        </div>
      </div>
      <p className="text-center text-gray-600">Click the card to flip it</p>

      {/* Inline navigation for flashcards: Previous / Next */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => onPrevious && onPrevious()}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-md font-medium transition ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          style={currentIndex === 0 ? {} : { background: themeColors.primaryHex, color: 'white' }}
        >
          ← Previous
        </button>

        <span className="text-sm text-gray-500">{currentIndex + 1} / {content.length}</span>

        <button
          onClick={() => onNext && onNext()}
          disabled={currentIndex === content.length - 1}
          className={`px-4 py-2 rounded-md font-medium transition ${currentIndex === content.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          style={currentIndex === content.length - 1 ? {} : { background: themeColors.primaryHex, color: 'white' }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
