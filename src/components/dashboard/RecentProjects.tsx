import React from 'react';
import { CameraIcon, EyeIcon, EditIcon, MoreHorizontalIcon, PlayIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
const RecentProjects: React.FC = () => {
  const projects = [{
    id: 1,
    name: 'Borobudur Temple Relief',
    type: '3D Scan',
    status: 'Processing',
    lastUpdated: '2 hours ago',
    thumbnail: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    progress: 75
  }, {
    id: 2,
    name: 'Wayang Kulit Collection',
    type: 'Multi-angle Photo',
    status: 'Completed',
    lastUpdated: 'Yesterday',
    thumbnail: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    progress: 100
  }, {
    id: 3,
    name: 'Keris Artifact',
    type: 'Video Scan',
    status: 'Completed',
    lastUpdated: '3 days ago',
    thumbnail: 'https://images.unsplash.com/photo-1589187832032-3c560480f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    progress: 100
  }];
  return <div className="space-y-4">
      {projects.map(project => (
        <div key={project.id} className="bg-gray-800/40 rounded-2xl border border-gray-700/30 overflow-hidden hover:border-gray-600/50 transition-all duration-200">
          <div className="flex">
            {/* Enhanced Thumbnail */}
            <div className="w-24 h-24 flex-shrink-0 relative">
              <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              {/* Status Icon */}
              <div className="absolute bottom-2 left-2">
                {project.status === 'Processing' ? (
                  <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <ClockIcon size={12} className="text-yellow-400" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircleIcon size={12} className="text-green-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Content */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm leading-tight">{project.name}</h3>
                  <div className="flex items-center mt-1">
                    {project.type === '3D Scan' ? (
                      <PlayIcon size={12} className="text-gray-400 mr-1" />
                    ) : (
                      <CameraIcon size={12} className="text-gray-400 mr-1" />
                    )}
                    <span className="text-xs text-gray-400">{project.type}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 ml-2">
                  <button className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
                    <EyeIcon size={14} className="text-gray-400" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
                    <MoreHorizontalIcon size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Status and Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'Processing' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">{project.lastUpdated}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      project.status === 'Processing' 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>;
};
export default RecentProjects;