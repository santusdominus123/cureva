// src/components/dashboard/RecentProjects.tsx
import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  CameraIcon, 
  EyeIcon, 
  SparklesIcon,
  MoreVerticalIcon,
  PlayIcon,
  DownloadIcon,
  ShareIcon,
  TrashIcon
} from 'lucide-react';

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

interface RecentProjectsProps {
  models?: Model[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ models: propModels = [] }) => {
  const [models, setModels] = useState<Model[]>(propModels);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Listen for new models from the scan capture
  useEffect(() => {
    const handleModelAdded = (event: CustomEvent) => {
      const newModel = event.detail;
      setModels(prev => {
        // Check if model already exists
        const exists = prev.some(m => m.id === newModel.id);
        if (!exists) {
          return [newModel, ...prev.slice(0, 3)]; // Keep only 4 most recent
        }
        return prev;
      });
    };

    const handleModelChanged = () => {
      // Refresh models when changes occur
      if (typeof window !== 'undefined' && window.globalModels) {
        setModels(window.globalModels.slice(0, 4));
      }
    };

    window.addEventListener('modelAdded', handleModelAdded);
    window.addEventListener('modelChanged', handleModelChanged);

    return () => {
      window.removeEventListener('modelAdded', handleModelAdded);
      window.removeEventListener('modelChanged', handleModelChanged);
    };
  }, []);

  // Initialize with existing models on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.globalModels && window.globalModels.length > 0) {
      setModels(window.globalModels.slice(0, 4));
    } else if (propModels.length > 0) {
      setModels(propModels);
    }
  }, [propModels]);

  const ProjectCard = ({ model }: { model: Model }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group">
        {/* Thumbnail */}
        <div className="relative h-20 bg-gray-900">
          <img 
            src={model.thumbnail || '/api/placeholder/120/80'} 
            alt={model.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback to a default image if thumbnail fails
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik01MCA0MEw3MCA1NUg1MFY0MFoiIGZpbGw9IiM2QjczODAiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzMCIgcj0iNSIgZmlsbD0iIzZCNzM4MCIvPgo8L3N2Zz4K';
              setImageLoaded(true);
            }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
              <CameraIcon size={24} className="text-gray-600" />
            </div>
          )}
          
          {/* Type indicator */}
          <div className="absolute top-2 left-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              model.type === 'gaussian_splatting' 
                ? 'bg-purple-600/80 text-purple-100' 
                : 'bg-blue-600/80 text-blue-100'
            }`}>
              {model.type === 'gaussian_splatting' ? (
                <><SparklesIcon size={10} className="inline mr-1" />GS</>
              ) : (
                <><CameraIcon size={10} className="inline mr-1" />3D</>
              )}
            </div>
          </div>

          {/* Action menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-gray-900/80 rounded text-gray-300 hover:text-white"
            >
              <MoreVerticalIcon size={14} />
            </button>
            {showMenu && (
              <div className="absolute top-8 right-0 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-32 z-10">
                <button className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center">
                  <EyeIcon size={12} className="mr-2" /> View
                </button>
                <button className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center">
                  <ShareIcon size={12} className="mr-2" /> Share
                </button>
                <button className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center">
                  <DownloadIcon size={12} className="mr-2" /> Export
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-gray-700 flex items-center">
                  <TrashIcon size={12} className="mr-2" /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
              <PlayIcon size={16} className="text-white ml-0.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-medium text-sm mb-1 truncate">{model.name}</h3>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{model.date}</span>
            {model.metadata?.totalPhotos && (
              <span>{model.metadata.totalPhotos} photos</span>
            )}
          </div>
          
          {/* Quality indicators */}
          {model.metadata && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  model.metadata.qualityScore >= 80 ? 'bg-green-400' :
                  model.metadata.qualityScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-gray-400">
                  {Math.round(model.metadata.qualityScore)}% quality
                </span>
              </div>
              <span className="text-gray-500">{model.fileSize || '~20MB'}</span>
            </div>
          )}

          {/* Tags */}
          {model.tags && model.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {model.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                  {tag}
                </span>
              ))}
              {model.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{model.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-4">
        <FolderIcon size={24} className="mx-auto text-gray-600 mb-2" />
        <p className="text-xs text-gray-500">Belum ada proyek</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {models.map((model) => (
        <ProjectCard key={model.id} model={model} />
      ))}
    </div>
  );
};

export default RecentProjects;