import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Plane,
  Image,
  Activity,
  TrendingUp,
  Clock,
  Eye,
  Sparkles,
  ChevronRight,
  Zap,
  Star,
} from 'lucide-react';
import DashboardMobile from './DashboardMobile';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <DashboardMobile />;
  }

  const stats = [
    { title: 'Scan', value: '24', icon: Camera, color: 'from-blue-500 to-cyan-500', trend: '+12%' },
    { title: 'Foto', value: '1.2K', icon: Image, color: 'from-purple-500 to-pink-500', trend: '+8%' },
    { title: 'Flight', value: '47', icon: Plane, color: 'from-green-500 to-emerald-500', trend: '+5%' },
    { title: 'Aktif', value: '3', icon: Activity, color: 'from-orange-500 to-red-500', trend: '+33%' },
  ];

  const quickActions = [
    { title: 'Scan', icon: Camera, link: '/scan', color: 'from-blue-500 to-cyan-500' },
    { title: 'Drone', icon: Plane, link: '/drone', color: 'from-green-500 to-emerald-500' },
    { title: 'Viewer', icon: Eye, link: '/gaussian', color: 'from-violet-500 to-purple-500' },
    { title: 'VLM AI', icon: Sparkles, link: '/vlm-demo', color: 'from-amber-500 to-orange-500' },
  ];

  const recentProjects = [
    { id: 1, title: 'Heritage Building', images: 24, date: '2h ago', status: 'processing', progress: 65 },
    { id: 2, title: 'Land Survey', images: 156, date: 'Yesterday', status: 'completed', progress: 100 },
  ];

  // Desktop view - Compact
  return (
    <div className="space-y-4 animate-fade-in overflow-x-hidden">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Stats - Single Card */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-3">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
              <div className="flex items-center gap-1 text-green-400 text-[10px] font-semibold">
                <TrendingUp className="w-2.5 h-2.5" />
                {stat.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Compact */}
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.link} className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all hover:scale-105 flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm">{action.title}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects - Compact */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Recent Projects
          </h2>
          <button className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {recentProjects.map((project) => (
            <div key={project.id} className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-3 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-semibold text-sm">{project.title}</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Image className="w-2.5 h-2.5" />
                    {project.images} images • {project.date}
                  </p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-lg ${project.status === 'processing' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                  {project.status === 'processing' ? 'Processing' : 'Done'}
                </span>
              </div>

              {project.status === 'processing' && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              )}

              <button className="w-full py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-white text-[10px] font-medium transition-colors flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" />
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed - Compact */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          Recent Activity
        </h2>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
          {[
            { text: 'Scan completed', time: '2h ago', icon: Camera, color: 'from-blue-500 to-cyan-500' },
            { text: '3D Model generated', time: '5h ago', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-800/30 transition-colors border-b border-gray-800 last:border-b-0">
              <div className={`w-8 h-8 bg-gradient-to-br ${activity.color} rounded-lg flex items-center justify-center`}>
                <activity.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-medium">{activity.text}</p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
