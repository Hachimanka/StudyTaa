import React from 'react';

export default function WheelMode({ content, currentIndex, showAnswer, setShowAnswer, wheelSpinning, spinWheel, wheelRotation }) {
  console.log('WheelMode content:', content);
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
  const getText = (q) => q.content || q.title || q.topic || q.front || q.question || q.statement || '';

  // Calculate which slice is at the top (arrow at 12 o'clock, -90deg SVG)
  const normalizedRotation = ((wheelRotation % 360) + 360) % 360;
  // Offset by -90deg to match SVG top
  const selectedIndex = numQuestions > 0 ? Math.round(((360 - normalizedRotation - 90 + 360) % 360) / sliceAngle) % numQuestions : 0;

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
        {/* Large wheel pointer */}
        <div
          className="absolute left-1/2"
          style={{
            top: -32,
            transform: 'translateX(-50%)',
            zIndex: 2,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48">
            <polygon points="24,0 40,32 8,32" fill="#14b8a6" stroke="#0f766e" strokeWidth="2" />
            <circle cx="24" cy="36" r="6" fill="#fff" stroke="#0f766e" strokeWidth="2" />
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
      {content.length > 0 && selectedIndex < content.length && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-xl font-semibold mb-4">Random Question:</h3>
          <p className="text-lg">{content[selectedIndex]?.content || content[selectedIndex]?.title || content[selectedIndex]?.topic || content[selectedIndex]?.front || content[selectedIndex]?.question || content[selectedIndex]?.statement}</p>
          {showAnswer && (
            <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-teal-800">{content[selectedIndex]?.title || content[selectedIndex]?.topic || content[selectedIndex]?.front || content[selectedIndex]?.question || content[selectedIndex]?.statement || 'Answer revealed!'}</p>
            </div>
          )}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
