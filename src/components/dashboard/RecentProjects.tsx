import React from 'react';
import { CameraIcon, EyeIcon, EditIcon, MoreHorizontalIcon } from 'lucide-react';
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
  return <div className="space-y-3">
      {projects.map(project => <div key={project.id} className="bg-gray-800/50 rounded-lg overflow-hidden flex">
          <div className="w-20 h-20 flex-shrink-0">
            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{project.name}</h3>
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  {project.type === '3D Scan' ? <div size={14} className="mr-1" /> : <CameraIcon size={14} className="mr-1" />}
                  <span>{project.type}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded hover:bg-gray-700 transition-colors">
                  <EyeIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1 rounded hover:bg-gray-700 transition-colors">
                  <EditIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1 rounded hover:bg-gray-700 transition-colors">
                  <MoreHorizontalIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={`${project.status === 'Processing' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {project.status}
                </span>
                <span className="text-gray-500">{project.lastUpdated}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className={`${project.status === 'Processing' ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-gradient-to-r from-green-500 to-green-300'} h-1.5 rounded-full`} style={{
              width: `${project.progress}%`
            }}></div>
              </div>
            </div>
          </div>
        </div>)}
    </div>;
};
export default RecentProjects;