import React from "react";
import { Capture } from "../../lib/firebase";

interface RecentPhotosGridProps {
  captures: Capture[];
  onDelete?: (index: number) => void;
}

export const RecentPhotosGrid: React.FC<RecentPhotosGridProps> = ({ captures, onDelete }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">Foto Terbaru</h3>
      <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
        {captures.map((capture, index) => (
          <div key={capture.timestamp} className="relative group">
            <img src={capture.dataUrl} alt={`Capture at ${capture.angle}°`} className="w-full h-24 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button onClick={() => onDelete?.(index)} className="p-1 bg-red-500/80 hover:bg-red-500 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 rounded-b-lg">
              <div className="text-center">
                {capture.angle}° - Level {capture.level}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
