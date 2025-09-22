import React from 'react';

export default function MatchingMode({ content, matchedPairs, selectedTerm, setSelectedTerm, selectedDef, setSelectedDef, matchingScore }) {
  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow h-64 flex flex-col justify-center items-center">
          <h3 className="text-xl font-semibold mb-4">Matching Template</h3>
          <div className="grid grid-cols-2 gap-4 w-full mt-2">
            <div className="p-3 bg-teal-50 rounded-lg border-2 border-teal-200 text-gray-600">Term 1</div>
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 text-gray-600">Definition 1</div>
            <div className="p-3 bg-teal-50 rounded-lg border-2 border-teal-200 text-gray-600">Term 2</div>
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 text-gray-600">Definition 2</div>
          </div>
          <p className="text-gray-500 mt-2">Upload a file to generate matching pairs</p>
        </div>
      </div>
    );
  }
  // Filter out empty values
  const initialTerms = content
    .map((pair, idx) => ({ value: pair.left || pair.term || pair.question || '', idx }))
    .filter(t => t.value);
  const initialDefs = content
    .map((pair, idx) => ({ value: pair.right || pair.definition || pair.answer || '', idx }))
    .filter(d => d.value);

  // Randomize only once at mount
  const [shuffledTerms] = React.useState(() => {
    return initialTerms
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  });
  const [shuffledDefs] = React.useState(() => {
    return initialDefs
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  });

  const unmatchedTerms = shuffledTerms.filter(t => !matchedPairs.some(mp => mp.termIdx === t.idx));
  const unmatchedDefs = shuffledDefs.filter(d => !matchedPairs.some(mp => mp.defIdx === d.idx));
  const totalPairs = Math.min(shuffledTerms.length, shuffledDefs.length);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">Match the pairs:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Terms</h4>
            {unmatchedTerms.map((term) => (
              <button
                key={term.idx}
                className={`w-full p-3 rounded-lg border-2 ${selectedTerm === term.idx ? 'border-teal-600 bg-teal-100' : 'border-teal-200 bg-teal-50'} transition-all`}
                onClick={() => setSelectedTerm(term.idx)}
                disabled={selectedTerm === term.idx}
              >
                {term.value}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Definitions</h4>
            {unmatchedDefs.map((def) => (
              <button
                key={def.idx}
                className={`w-full p-3 rounded-lg border-2 ${selectedDef === def.idx ? 'border-gray-600 bg-gray-100' : 'border-gray-200 bg-gray-50'} transition-all`}
                onClick={() => setSelectedDef(def.idx)}
                disabled={selectedDef === def.idx}
              >
                {def.value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <span className="font-medium text-teal-700">Score: {matchingScore} / {totalPairs}</span>
        </div>
        {matchedPairs.length === totalPairs && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-semibold text-center">
            All pairs matched!
          </div>
        )}
      </div>
    </div>
  );
}
