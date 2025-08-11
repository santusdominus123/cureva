// src/pages/Dashboard.tsx (responsive-only)
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
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import RecentProjects from '../components/dashboard/RecentProjects';
import QuotaWidget from '../components/dashboard/QuotaWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';

const Dashboard: React.FC = () => {
  /* Data tetap sama */
  const stats = [
    { title: 'Total Projects', value: '24', change: '+3', timeframe: 'bulan', icon: <FolderIcon className="text-blue-400" /> },
    { title: 'Scans Processed', value: '142', change: '+18', timeframe: 'minggu', icon: <CameraIcon className="text-purple-400" /> },
    { title: 'GPU Hours Used', value: '76.2', change: '-12%', timeframe: 'bulan', icon: <CpuIcon className="text-green-400" />, changeType: 'positive' },
    { title: 'Storage Used', value: '48.7 GB', change: '+2.3 GB', timeframe: 'bulan', icon: <CloudIcon className="text-yellow-400" /> },
  ];

  /* Layout MOBILE-ONLY */
  return (
    <>
      <main className="p-3 space-y-5 bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Hi, Admin</h1>
            <p className="text-sm text-gray-300">Ringkasan hari ini</p>
          </div>
          <button className="px-2 py-1.5 bg-blue-600 rounded text-xs flex items-center">
            <CameraIcon size={14} className="mr-1" />
            Scan
          </button>
        </div>

        {/* Statistik – Scroll horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stats.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-28 bg-white/5 backdrop-blur rounded-lg p-2">
              <div className="text-center">
                {s.icon}
                <p className="text-xs mt-1">{s.title}</p>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-gray-300">{s.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="bg-white/5 backdrop-blur rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Proyek Terbaru</h2>
            <Link to="/projects" className="text-xs text-blue-400">Lainnya →</Link>
          </div>
          <RecentProjects />
        </div>

        {/* Resource & Queue */}
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur rounded-lg p-3">
            <h2 className="text-sm font-semibold mb-2">Resource</h2>
            <QuotaWidget />
          </div>

          <div className="bg-white/5 backdrop-blur rounded-lg p-3">
            <h2 className="text-sm font-semibold mb-2">Antrian</h2>
            <div className="space-y-2">
              <div className="text-xs">
                Borobudur Relief – 72% – 14 m
                <div className="bg-gray-700 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>
              <div className="text-xs">
                Wayang Kulit – 38% – 35 m
                <div className="bg-gray-700 rounded-full h-1">
                  <div className="bg-purple-500 h-1 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-lg p-3">
            <h2 className="text-sm font-semibold mb-2">Aktivitas</h2>
            <ActivityFeed />
          </div>
        </div>
      </main>

      {/* Bottom Navigation (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/90 border-t border-gray-800 flex justify-around py-2 text-xs">
        <Link to="/" className="flex flex-col items-center text-gray-300">
          <HomeIcon size={20} />Home
        </Link>
        <Link to="/scan" className="flex flex-col items-center text-gray-300">
          <CamIcon size={20} />Scan
        </Link>
        <Link to="/settings" className="flex flex-col items-center text-gray-300">
          <SettingsIcon size={20} />Setting
        </Link>
      </nav>
    </>
  );
};

export default Dashboard;