// src/pages/ExportHub.tsx (enhanced with real models)
import React, { useState, useEffect } from 'react';
import { DownloadIcon, ShareIcon, ExternalLinkIcon, FileIcon, ImageIcon, SparklesIcon, FilterIcon, SearchIcon, FolderIcon } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  type: string;
  date: string;
  thumbnail: string;
  captures: string[];
  metadata?: {
    totalPhotos: number;
    qualityScore: number;
    gaussianCompatibility: number;
  };
  vertices?: number;
  faces?: number;
  fileSize?: string;
  tags?: string[];
}

const ExportHub: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'gaussian_splatting' | 'traditional'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for model updates
  useEffect(() => {
    const handleModelAdded = (event: CustomEvent) => {
      const newModel = event.detail;
      setModels(prev => {
        const exists = prev.some(m => m.id === newModel.id);
        if (!exists) {
          return [newModel, ...prev];
        }
        return prev;
      });
    };

    const handleModelChanged = () => {
      if (typeof window !== 'undefined' && window.globalModels) {
        setModels(window.globalModels);
      }
    };

    window.addEventListener('modelAdded', handleModelAdded);
    window.addEventListener('modelChanged', handleModelChanged);

    // Initialize with existing models
    if (typeof window !== 'undefined' && window.globalModels) {
      setModels(window.globalModels);
    }

    return () => {
      window.removeEventListener('modelAdded', handleModelAdded);
      window.removeEventListener('modelChanged', handleModelChanged);
    };
  }, []);

  // Filter models
  const filteredModels = models.filter(model => {
    const matchesType = filterType === 'all' || model.type === filterType;
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (model.tags && model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesType && matchesSearch;
  });

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const exportFormats = [
    { name: 'GLB', description: 'Optimized for web viewing', icon: <FileIcon size={16} /> },
    { name: 'OBJ', description: 'Universal 3D format', icon: <FileIcon size={16} /> },
    { name: 'PLY', description: 'Point cloud format', icon: <FileIcon size={16} /> },
    { name: 'GLTF', description: 'Web-ready with textures', icon: <FileIcon size={16} /> },
    { name: 'STL', description: 'For 3D printing', icon: <FileIcon size={16} /> },
    { name: 'ZIP', description: 'All photos + model', icon: <FileIcon size={16} /> }
  ];

  const ModelCard = ({ model }: { model: Model }) => {
    const isSelected = selectedModels.includes(model.id);
    
    return (
      <div 
        className={`bg-gray-800/30 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
        }`}
        onClick={() => toggleModelSelection(model.id)}
      >
        <div className="relative h-32 bg-gray-900">
          <img 
            src={model.thumbnail} 
            alt={model.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik04MCA2NEwxMjAgODRIODBWNjRaIiBmaWxsPSIjNkI3MzgwIi8+CjxjaXJjbGUgY3g9IjcwIiBjeT0iNTAiIHI9IjgiIGZpbGw9IiM2QjczODAiLz4KPC9zdmc+Cg==';
            }}
          />
          
          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <DownloadIcon size={16} className="text-white" />
              </div>
            </div>
          )}
          
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
              model.type === 'gaussian_splatting' 
                ? 'bg-purple-600/90 text-purple-100' 
                : 'bg-blue-600/90 text-blue-100'
            }`}>
              {model.type === 'gaussian_splatting' ? (
                <><SparklesIcon size={12} className="inline mr-1" />Gaussian Splatting</>
              ) : (
                <><ImageIcon size={12} className="inline mr-1" />Traditional</>
              )}
            </div>
          </div>

          {/* Quality indicator */}
          {model.metadata?.qualityScore && (
            <div className="absolute top-3 right-3">
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                model.metadata.qualityScore >= 80 ? 'bg-green-600/90 text-green-100' :
                model.metadata.qualityScore >= 60 ? 'bg-yellow-600/90 text-yellow-100' :
                'bg-red-600/90 text-red-100'
              }`}>
                {Math.round(model.metadata.qualityScore)}%
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-white mb-2">{model.name}</h3>
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <span>{model.date}</span>
            <span>{model.fileSize || '~20MB'}</span>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>Photos: {model.metadata?.totalPhotos || 'N/A'}</div>
            <div>Vertices: {model.vertices?.toLocaleString() || 'N/A'}</div>
          </div>

          {/* Tags */}
          {model.tags && model.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {model.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Export & Share</h1>
          <p className="text-gray-400">
            Export your 3D models in various formats or share with others
          </p>
        </div>
        {selectedModels.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">
              {selectedModels.length} model{selectedModels.length > 1 ? 's' : ''} selected
            </span>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
              <DownloadIcon size={16} className="mr-2" />
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FilterIcon size={16} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="gaussian_splatting">Gaussian Splatting</option>
                <option value="traditional">Traditional</option>
              </select>
            </div>
            <button 
              onClick={() => setSelectedModels([])}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* Export Formats */}
      {selectedModels.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Available Export Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {exportFormats.map((format) => (
              <button
                key={format.name}
                className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left border border-gray-700 hover:border-gray-600"
              >
                <div className="flex items-center mb-2">
                  {format.icon}
                  <span className="ml-2 font-medium">{format.name}</span>
                </div>
                <p className="text-xs text-gray-400">{format.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Models Grid */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        {filteredModels.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Available Models ({filteredModels.length})</h2>
              <button
                onClick={() => setSelectedModels(filteredModels.map(m => m.id))}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            {models.length === 0 ? (
              <>
                <FolderIcon size={48} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-bold mb-2">No Models Yet</h2>
                <p className="text-gray-400 mb-6">
                  Create your first 3D model using the scanner to start exporting.
                </p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Go to Scanner
                </button>
              </>
            ) : (
              <>
                <SearchIcon size={48} className="mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-bold mb-2">No Models Found</h2>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search query or filter settings.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportHub;