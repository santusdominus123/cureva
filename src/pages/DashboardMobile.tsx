import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Plane,
  Image,
  Activity,
  Bell,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Eye,
  Plus,
  Sparkles,
  LogOut,
  User,
  Settings,
  Menu,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const DashboardMobile: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    {
      title: 'Total Scan',
      value: '24',
      icon: Camera,
      color: 'from-blue-500 to-blue-600',
      change: '+3 bulan ini'
    },
    {
      title: 'Foto Drone',
      value: '1,243',
      icon: Image,
      color: 'from-purple-500 to-purple-600',
      change: '+156 minggu ini'
    },
    {
      title: 'Penerbangan',
      value: '47',
      icon: Plane,
      color: 'from-green-500 to-green-600',
      change: '+8 minggu ini'
    },
    {
      title: 'Sesi Aktif',
      value: '3',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      change: '+1 hari ini'
    },
  ];

  const quickActions = [
    {
      title: 'Scan Baru',
      subtitle: 'Mulai capture',
      icon: Camera,
      link: '/scan',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Drone Cam',
      subtitle: 'Kontrol drone',
      icon: Plane,
      link: '/drone',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: '3D Viewer',
      subtitle: 'Lihat model',
      icon: Eye,
      link: '/gaussian',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'AI Analysis',
      subtitle: 'Analisis gambar',
      icon: Sparkles,
      link: '/vlm-demo',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const recentProjects = [
    {
      id: 1,
      title: 'Bangunan Heritage',
      images: 24,
      date: '2 jam lalu',
      thumbnail: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400',
      status: 'processing',
    },
    {
      id: 2,
      title: 'Survey Lahan',
      images: 156,
      date: 'Kemarin',
      thumbnail: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Inspeksi Jembatan',
      images: 89,
      date: '3 hari lalu',
      thumbnail: 'https://images.unsplash.com/photo-1589187832032-3c560480f548?w=400',
      status: 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black pb-20">
      {/* Hero Section dengan Greeting */}
      <div className="px-4 pt-6 pb-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              Selamat Datang! 👋
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex gap-2 relative">
            <button className="w-10 h-10 bg-gray-800/80 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform">
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform border border-blue-500/30"
              title="Menu Pengguna"
            >
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt={userData.displayName}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 py-2 z-50">
                {userData && (
                  <>
                    <div className="px-4 py-3 border-b border-gray-700/50">
                      <div className="flex items-center gap-3">
                        {userData.photoURL ? (
                          <img
                            src={userData.photoURL}
                            alt={userData.displayName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
                            <span className="font-bold text-xs text-white">
                              {getInitials(userData.displayName)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{userData.displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1">
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg flex items-center transition-colors"
                      >
                        <Settings size={16} className="mr-2" />
                        Pengaturan
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="min-w-[140px] snap-start bg-gray-800/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50"
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-white mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-700/50 active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">
                {action.title}
              </h3>
              <p className="text-xs text-gray-400">{action.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Proyek Terbaru</h2>
          <button className="text-sm text-blue-400 flex items-center gap-1">
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-1 truncate">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    {project.images} foto • {project.date}
                  </p>
                  <div className="flex items-center gap-2">
                    {project.status === 'processing' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                        <Zap className="w-3 h-3" />
                        Processing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                        ✓ Selesai
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 self-center" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-white mb-4">Aktivitas Terakhir</h2>
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 divide-y divide-gray-700/50">
          {[
            { text: 'Scan "Bangunan Heritage" selesai', time: '2 jam lalu', icon: Camera },
            { text: 'Model 3D berhasil di-generate', time: '5 jam lalu', icon: Sparkles },
            { text: '156 foto baru terupload', time: 'Kemarin', icon: Image },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center">
                <activity.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.text}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        to="/scan"
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus className="w-7 h-7 text-white" />
      </Link>
    </div>
  );
};

export default DashboardMobile;
