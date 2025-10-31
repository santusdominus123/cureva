import React from 'react';
import { FolderIcon, PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';
const ProjectManager: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Project Manager</h1>
          <p className="text-gray-400">
            Organize and manage your 3D digitization projects
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
            <PlusIcon size={16} className="mr-2" /> New Project
          </button>
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search projects..." className="bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 pl-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
              <FilterIcon size={14} className="mr-2" /> Filter
            </button>
            <select className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Projects</option>
              <option>Recent</option>
              <option>Archived</option>
            </select>
          </div>
        </div>
        <div className="text-center py-16">
          <FolderIcon size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold mb-2">Project Manager</h2>
          <p className="text-gray-400 mb-6">
            This is a placeholder for the Project Manager page.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Create Your First Project
          </button>
        </div>
      </div>
    </div>;
};
export default ProjectManager;