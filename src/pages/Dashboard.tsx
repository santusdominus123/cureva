import React from 'react';
import { BarChart3Icon, CameraIcon, FolderIcon, CloudIcon, CpuIcon, BadgeAlertIcon, ArrowRightIcon } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import RecentProjects from '../components/dashboard/RecentProjects';
import QuotaWidget from '../components/dashboard/QuotaWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';
const Dashboard: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, John</h1>
          <p className="text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            Import Data
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
            New Scan <CameraIcon size={16} className="ml-2" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value="24" change="+3" timeframe="this month" icon={<FolderIcon className="text-blue-400" />} />
        <StatCard title="Scans Processed" value="142" change="+18" timeframe="this week" icon={<div className="text-purple-400" />} />
        <StatCard title="GPU Hours Used" value="76.2" change="-12%" timeframe="vs last month" icon={<CpuIcon className="text-green-400" />} changeType="positive" />
        <StatCard title="Storage Used" value="48.7 GB" change="+2.3 GB" timeframe="this month" icon={<CloudIcon className="text-yellow-400" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <button className="text-blue-400 text-sm flex items-center hover:text-blue-300 transition-colors">
              View All <ArrowRightIcon size={14} className="ml-1" />
            </button>
          </div>
          <RecentProjects />
        </div>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4">Resource Usage</h2>
          <QuotaWidget />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Processing Queue</h2>
            <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-lg text-xs flex items-center">
              <BadgeAlertIcon size={14} className="mr-1" />2 Processing
            </div>
          </div>
          <div className="space-y-3">
            <ProcessingItem name="Borobudur Relief Scan" type="Video Processing" progress={72} timeRemaining="14 min" />
            <ProcessingItem name="Wayang Kulit 3D Model" type="NeRF Generation" progress={38} timeRemaining="35 min" />
          </div>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>;
};
interface ProcessingItemProps {
  name: string;
  type: string;
  progress: number;
  timeRemaining: string;
}
const ProcessingItem: React.FC<ProcessingItemProps> = ({
  name,
  type,
  progress,
  timeRemaining
}) => {
  return <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex justify-between mb-2">
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-400">{type}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{progress}%</p>
          <p className="text-sm text-gray-400">{timeRemaining} left</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{
        width: `${progress}%`
      }}></div>
      </div>
    </div>;
};
export default Dashboard;