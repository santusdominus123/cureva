import React from 'react';
import { DownloadIcon, ShareIcon, ExternalLinkIcon } from 'lucide-react';
const ExportHub: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Export & Share</h1>
          <p className="text-gray-400">
            Export your 3D models in various formats or share with others
          </p>
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="text-center py-16">
          <ShareIcon size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold mb-2">Export Hub</h2>
          <p className="text-gray-400 mb-6">
            This is a placeholder for the Export Hub page.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Select a Model to Export
          </button>
        </div>
      </div>
    </div>;
};
export default ExportHub;