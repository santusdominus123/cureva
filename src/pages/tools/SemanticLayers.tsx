import React from 'react';
import { TagIcon, PlusIcon, LayersIcon } from 'lucide-react';
const SemanticLayers: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Semantic Layers</h1>
          <p className="text-gray-400">
            Add metadata and annotations to your 3D models
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
            <PlusIcon size={16} className="mr-2" /> New Layer
          </button>
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="text-center py-16">
          <LayersIcon size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold mb-2">Semantic Layers</h2>
          <p className="text-gray-400 mb-6">
            This is a placeholder for the Semantic Layers page.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Create Your First Layer
          </button>
        </div>
      </div>
    </div>;
};
export default SemanticLayers;