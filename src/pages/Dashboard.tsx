import React from 'react';
import { Link } from 'react-router-dom';
import {
  MailIcon,
  CameraIcon,
  FolderIcon,
  CloudIcon,
  CpuIcon,
  BadgeAlertIcon,
  ArrowRightIcon,
  ScanLineIcon,
  ShareIcon,
  HomeIcon,
  CameraIcon as CamIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import RecentProjects from '../components/dashboard/RecentProjects';
import QuotaWidget from '../components/dashboard/QuotaWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';

// Model storage utility for dashboard
const getRecentModels = () => {
  // Get models from global storage if available
  if (typeof window !== 'undefined' && window.globalModels) {
    return window.globalModels.slice(0, 4); // Get 4 most recent
  }
  return [];
};

const Dashboard: React.FC = () => {
  /* Data tetap sama */
  const stats = [
    { title: 'Total Projects', value: '24', change: '+3', timeframe: 'bulan', icon: <FolderIcon className="text-blue-400" /> },
    { title: 'Scans Processed', value: '142', change: '+18', timeframe: 'minggu', icon: <CameraIcon className="text-purple-400" /> },
    { title: 'GPU Hours Used', value: '76.2', change: '-12%', timeframe: 'bulan', icon: <CpuIcon className="text-green-400" />, changeType: 'positive' },
    { title: 'Storage Used', value: '48.7 GB', change: '+2.3 GB', timeframe: 'bulan', icon: <CloudIcon className="text-yellow-400" /> },
  ];

  /* Layout MOBILE-FIRST */
  return (
    <>
      <main className="px-4 pt-6 pb-20 space-y-6 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white min-h-screen">
        {/* Modern Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Hi, Admin</h1>
              <p className="text-sm text-gray-400">Welcome back</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2.5 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
              <SearchIcon size={18} className="text-gray-400" />
            </button>
            
            <button className="relative p-2.5 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
              <BellIcon size={18} className="text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>
            </button>
            
            <Link 
              to="/scan" 
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-semibold flex items-center shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <CameraIcon size={16} className="mr-2" />
              Scan
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {stats.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-32 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 shadow-xl">
              <div className="text-center space-y-2">
                <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  {React.cloneElement(s.icon, { size: 16 })}
                </div>
                <p className="text-xs text-gray-400 font-medium">{s.title}</p>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <div className={`text-xs font-medium ${s.change.startsWith('+') ? 'text-green-400' : s.change.startsWith('-') ? 'text-red-400' : 'text-blue-400'}`}>
                  {s.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Recent Projects */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">
              View All →
            </Link>
          </div>
          <RecentProjects models={getRecentModels()} />
        </div>

        {/* Enhanced Resource & Queue */}
        <div className="space-y-4">
          {/* Resource Usage */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Resources</h2>
            <QuotaWidget />
          </div>

          {/* Processing Queue */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Processing Queue</h2>
            <div className="space-y-4">
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-white">Borobudur Relief</h3>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">72%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Processing...</span>
                  <span>14 min remaining</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: '72%' }}></div>
                </div>
              </div>
              
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-white">Wayang Kulit</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">38%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Processing...</span>
                  <span>35 min remaining</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: '38%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <ActivityFeed />
          </div>
        </div>
      </main>

      {/* Enhanced Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 px-4 py-3 shadow-2xl">
        <div className="flex justify-around items-center">
          <Link to="/" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-blue-400 bg-blue-500/10">
            <div className="p-1">
              <HomeIcon size={22} />
            </div>
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link to="/scan" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <CamIcon size={22} />
            </div>
            <span className="text-xs font-medium">Scan</span>
          </Link>
          
          <Link to="/projects" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <FolderIcon size={22} />
            </div>
            <span className="text-xs font-medium">Projects</span>
          </Link>
          
          <Link to="/settings" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <SettingsIcon size={22} />
            </div>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Dashboard;