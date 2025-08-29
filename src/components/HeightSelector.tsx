import React from "react";

interface HeightSelectorProps {
  currentLevel: 1 | 2 | 3 | 4;
  onChange: (level: 1 | 2 | 3 | 4) => void;
}

export const HeightSelector: React.FC<HeightSelectorProps> = ({ currentLevel, onChange }) => {
  const levels = [
    { level: 1, name: "Low", description: "Below object level", color: "#ef4444" },
    { level: 2, name: "Eye", description: "Object center level", color: "#3b82f6" },
    { level: 3, name: "High", description: "Above object level", color: "#10b981" },
    { level: 4, name: "Overhead", description: "Top-down view", color: "#f59e0b" },
  ];

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">Camera Height Level</h3>
      <div className="grid grid-cols-2 gap-2">
        {levels.map((level) => (
          <button
            key={level.level}
            onClick={() => onChange(level.level as 1 | 2 | 3 | 4)}
            className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${currentLevel === level.level ? "bg-gray-700 border-2" : "bg-gray-800/50 hover:bg-gray-700/50"}`}
            style={{ borderColor: currentLevel === level.level ? level.color : "transparent" }}
          >
            <span className="font-medium" style={{ color: level.color }}>
              {level.name}
            </span>
            <span className="text-xs text-gray-400 mt-1">{level.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
