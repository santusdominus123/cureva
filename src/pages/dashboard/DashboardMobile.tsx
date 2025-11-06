import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Plane,
  Image,
  Eye,
  Sparkles,
  LogOut,
  Clock,
  TrendingUp,
  Zap,
  Star,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import logoImg from '../../assets/cureva_logo.jpg';

const DashboardMobile: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('cureva-user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('cureva-user');
      localStorage.removeItem('cureva-intro-seen');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  return (
    <div className="min-h-screen pb-16 space-y-2 overflow-x-hidden">
      {/* Compact Header with Logo */}
      <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-2.5 mx-2 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-sm opacity-75"></div>
              <img src={logoImg} alt="Cureva Logo" className="relative h-7 w-7 rounded-lg object-cover border border-white/20" />
            </div>
            <div>
              <h1 className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Cureva</h1>
              <p className="text-[8px] text-gray-400 font-medium">Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-6 h-6 bg-gray-800/50 rounded-lg flex items-center justify-center active:scale-95">
            <LogOut className="w-3 h-3 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-800/50">
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className="w-6 h-6 rounded-full object-cover border border-gray-700" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">
              {userData?.displayName ? getInitials(userData.displayName) : 'U'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-[10px] font-semibold text-white">{userData?.displayName || 'User'}</h2>
            <p className="text-[8px] text-gray-400 flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-2 mx-2">
        <div className="grid grid-cols-4 gap-1.5">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-7 h-7 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-1`}>
                <stat.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[7px] text-gray-400 mb-0.5">{stat.title}</p>
              <div className="flex items-center gap-0.5 text-green-400 text-[6px] font-semibold">
                <TrendingUp className="w-1.5 h-1.5" />
                {stat.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-2">
        <h2 className="text-[10px] font-semibold flex items-center gap-1 mb-1.5 text-white">
          <Zap className="w-3 h-3 text-yellow-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.link} className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-2 active:scale-95 transition-all flex items-center gap-1.5">
              <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-semibold text-[10px]">{action.title}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] font-semibold flex items-center gap-1 text-white">
            <Star className="w-3 h-3 text-yellow-400" />
            Recent Projects
          </h2>
          <button className="text-[8px] text-blue-400 flex items-center gap-0.5">
            View All <ChevronRight className="w-2 h-2" />
          </button>
        </div>

        <div className="space-y-1.5">
          {recentProjects.map((project) => (
            <div key={project.id} className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-2">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-white font-semibold text-[10px]">{project.title}</h3>
                  <p className="text-[7px] text-gray-400 flex items-center gap-0.5">
                    <Image className="w-2 h-2" />
                    {project.images} images • {project.date}
                  </p>
                </div>
                <span className={`text-[7px] px-1 py-0.5 rounded ${project.status === 'processing' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                  {project.status === 'processing' ? 'Processing' : 'Done'}
                </span>
              </div>

              {project.status === 'processing' && (
                <div className="mb-1">
                  <div className="flex items-center justify-between text-[7px] text-gray-400 mb-0.5">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              )}

              <button className="w-full py-1 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-white text-[8px] font-medium transition-colors flex items-center justify-center gap-0.5">
                <Eye className="w-2 h-2" />
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="px-2 pb-2">
        <h2 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1 text-white">
          <Activity className="w-3 h-3 text-green-400" />
          Recent Activity
        </h2>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
          {[
            { text: 'Scan completed', time: '2h ago', icon: Camera, color: 'from-blue-500 to-cyan-500' },
            { text: '3D Model generated', time: '5h ago', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-1.5 p-2 border-b border-gray-800 last:border-b-0">
              <div className={`w-6 h-6 bg-gradient-to-br ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <activity.icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[9px] font-medium">{activity.text}</p>
                <p className="text-[7px] text-gray-500 flex items-center gap-0.5">
                  <Clock className="w-1.5 h-1.5" />
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

export default DashboardMobile;
