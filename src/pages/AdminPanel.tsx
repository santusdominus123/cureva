import React from 'react';
import { ShieldIcon, UsersIcon, ServerIcon } from 'lucide-react';
const AdminPanel: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
          <p className="text-gray-400">
            Manage users, permissions, and system settings
          </p>
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="text-center py-16">
          <ShieldIcon size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold mb-2">Admin Panel</h2>
          <p className="text-gray-400 mb-6">
            This is a placeholder for the Admin Panel page.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Access Admin Settings
          </button>
        </div>
      </div>
    </div>;
};
export default AdminPanel;