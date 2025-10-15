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
  ArrowUpRight,
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
    {
      title: 'Total Scan',
      value: '24',
      icon: Camera,
      color: 'from-blue-500 to-blue-600',
      bgGlow: 'bg-blue-500/20',
      change: '+3 bulan ini',
      trend: '+12.5%'
    },
    {
      title: 'Foto Drone',
      value: '1,243',
      icon: Image,
      color: 'from-purple-500 to-purple-600',
      bgGlow: 'bg-purple-500/20',
      change: '+156 minggu ini',
      trend: '+8.3%'
    },
    {
      title: 'Penerbangan',
      value: '47',
      icon: Plane,
      color: 'from-green-500 to-green-600',
      bgGlow: 'bg-green-500/20',
      change: '+8 minggu ini',
      trend: '+5.2%'
    },
    {
      title: 'Sesi Aktif',
      value: '3',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      bgGlow: 'bg-orange-500/20',
      change: '+1 hari ini',
      trend: '+33%'
    },
  ];

  const quickActions = [
    {
      title: 'Scan Baru',
      subtitle: 'Mulai capture 3D',
      icon: Camera,
      link: '/scan',
      color: 'from-blue-500 to-blue-600',
      bgGlow: 'shadow-blue-500/50',
    },
    {
      title: 'Drone Cam',
      subtitle: 'Kontrol drone',
      icon: Plane,
      link: '/drone',
      color: 'from-purple-500 to-purple-600',
      bgGlow: 'shadow-purple-500/50',
    },
    {
      title: '3D Viewer',
      subtitle: 'Lihat model 3D',
      icon: Eye,
      link: '/viewer',
      color: 'from-green-500 to-green-600',
      bgGlow: 'shadow-green-500/50',
    },
    {
      title: 'VLM Analysis',
      subtitle: 'Analisis gambar AI',
      icon: Sparkles,
      link: '/vlm-demo',
      color: 'from-orange-500 to-orange-600',
      bgGlow: 'shadow-orange-500/50',
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
      progress: 65,
    },
    {
      id: 2,
      title: 'Survey Lahan',
      images: 156,
      date: 'Kemarin',
      thumbnail: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400',
      status: 'completed',
      progress: 100,
    },
    {
      id: 3,
      title: 'Inspeksi Jembatan',
      images: 89,
      date: '3 hari lalu',
      thumbnail: 'https://images.unsplash.com/photo-1589187832032-3c560480f548?w=400',
      status: 'completed',
      progress: 100,
    },
  ];

  // Desktop view
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-gray-800/50 p-8">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Selamat Datang! 👋
            </h1>
            <p className="text-gray-400 flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              {currentTime.toLocaleString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="group relative bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 ${stat.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl`}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {stat.trend}
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions with Beautiful Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Zap className="w-7 h-7 text-yellow-400" />
            Aksi Cepat
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className="group relative bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-8 hover:border-gray-700 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              {/* Animated Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl ${action.bgGlow} group-hover:shadow-2xl transition-shadow duration-300`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 flex items-center justify-between">
                  {action.title}
                  <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </h3>
                <p className="text-sm text-gray-400">{action.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects with Modern Design */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Star className="w-7 h-7 text-yellow-400" />
            Proyek Terbaru
          </h2>
          <button className="text-sm text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors px-4 py-2 bg-blue-500/10 rounded-xl hover:bg-blue-500/20">
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProjects.map((project, idx) => (
            <div
              key={project.id}
              className="group relative bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Image with Overlay */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {project.status === 'processing' ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur text-white rounded-xl text-xs font-semibold shadow-lg">
                      <Zap className="w-4 h-4 animate-pulse" />
                      Processing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur text-white rounded-xl text-xs font-semibold shadow-lg">
                      ✓ Selesai
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-blue-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  {project.images} foto • {project.date}
                </p>

                {/* Progress Bar */}
                {project.status === 'processing' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button className="w-full py-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 group">
                  <Eye className="w-4 h-4" />
                  Lihat Detail
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed with Timeline Design */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Activity className="w-7 h-7 text-green-400" />
          Aktivitas Terakhir
        </h2>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 overflow-hidden">
          {[
            { text: 'Scan "Bangunan Heritage" selesai', time: '2 jam lalu', icon: Camera, color: 'from-blue-500 to-blue-600' },
            { text: 'Model 3D berhasil di-generate', time: '5 jam lalu', icon: Sparkles, color: 'from-purple-500 to-purple-600' },
            { text: '156 foto baru terupload', time: 'Kemarin', icon: Image, color: 'from-green-500 to-green-600' },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-6 hover:bg-gray-800/30 transition-colors border-b border-gray-800 last:border-b-0 group"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${activity.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <activity.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">{activity.text}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
