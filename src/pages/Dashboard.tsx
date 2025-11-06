import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Home,
  Camera as CamIcon,
  Settings,
  Bell,
  Search,
  User,
  Plane,
  PlayCircle,
  Image,
  Activity,
  TrendingUp,
  Wifi,
  Battery,
  Target,
  RotateCw,
} from 'lucide-react';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { RecentPhotosGrid } from '../components/RecentPhotosGrid';
import DashboardMobile from './DashboardMobile';


// Mock data for recent captures
const getMockCaptures = () => [
  {
    timestamp: Date.now() - 3600000,
    dataUrl: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=300&fit=crop',
    angle: 45,
    level: 1
  },
  {
    timestamp: Date.now() - 7200000,
    dataUrl: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=400&h=300&fit=crop',
    angle: 90,
    level: 2
  },
  {
    timestamp: Date.now() - 10800000,
    dataUrl: 'https://images.unsplash.com/photo-1589187832032-3c560480f548?w=400&h=300&fit=crop',
    angle: 135,
    level: 1
  },
  {
    timestamp: Date.now() - 14400000,
    dataUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    angle: 180,
    level: 3
  }
];

const Dashboard: React.FC = () => {
  const [recentCaptures, setRecentCaptures] = useState(getMockCaptures());
  const [droneConnected, setDroneConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { title: 'Total Pindaian', value: '24', change: '+3', timeframe: 'bulan', icon: <Camera className="text-blue-400" /> },
    { title: 'Penerbangan Drone', value: '47', change: '+8', timeframe: 'minggu', icon: <Plane className="text-purple-400" /> },
    { title: 'Foto Diambil', value: '1,243', change: '+156', timeframe: 'minggu', icon: <Image className="text-green-400" /> },
    { title: 'Sesi Aktif', value: '3', change: '+1', timeframe: 'hari', icon: <Activity className="text-yellow-400" /> },
  ];

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

  // Desktop view
  return (
    <>
      <main className="px-4 pt-6 pb-20 space-y-6 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white min-h-screen">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dasbor</h1>
              <p className="text-sm text-gray-400">
                {currentTime.toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-3 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
              <Search size={20} className="text-gray-400" />
            </button>

            <button className="relative p-3 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all">
              <Bell size={20} className="text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>
            </button>

            <Link
              to="/drone"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl text-sm font-semibold flex items-center shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              <Plane size={18} className="mr-2" />
              Kontrol Drone
            </Link>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  {React.cloneElement(s.icon, { size: 20 })}
                </div>
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${s.change.startsWith('+') ? 'text-green-400 bg-green-400/10' : s.change.startsWith('-') ? 'text-red-400 bg-red-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                  {s.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-sm text-gray-400">{s.title}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Drone & Camera Views */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drone Control Preview */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Plane size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Pusat Kontrol Drone</h2>
                    <p className="text-sm text-gray-400">Status & Kontrol DJI Tello</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${droneConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className={`text-sm font-medium ${droneConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {droneConnected ? 'Terhubung' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="bg-black/50 rounded-xl h-48 relative overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Plane size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Siaran Kamera Drone</p>
                    <p className="text-gray-500 text-xs">Hubungkan drone untuk melihat siaran langsung</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex space-x-2">
                  <div className="bg-black/70 px-2 py-1 rounded-md text-xs text-white flex items-center">
                    <Battery size={12} className="mr-1 text-green-400" />
                    85%
                  </div>
                  <div className="bg-black/70 px-2 py-1 rounded-md text-xs text-white flex items-center">
                    <Wifi size={12} className="mr-1 text-blue-400" />
                    4/4
                  </div>
                  <div className="bg-black/70 px-2 py-1 rounded-md text-xs text-white flex items-center">
                    <Target size={12} className="mr-1 text-cyan-400" />
                    2.1m
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link
                    to="/drone"
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-sm font-medium text-white hover:from-orange-500 hover:to-red-500 transition-all"
                  >
                    Buka Kontrol
                  </Link>
                  <button className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                    <RotateCw size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Penerbangan Terakhir</p>
                  <p className="text-sm text-white">2 jam lalu</p>
                </div>
              </div>
            </div>

            {/* Recent Photos Gallery */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Image size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Foto Terkini</h2>
                    <p className="text-sm text-gray-400">Tangkapan dan pindaian terbaru</p>
                  </div>
                </div>
                <Link to="/scan" className="text-sm text-green-400 font-medium hover:text-green-300 transition-colors">
                  Lihat Semua →
                </Link>
              </div>
              <RecentPhotosGrid captures={recentCaptures} />
            </div>

            {/* Scan History */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Camera size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Pindaian Terkini</h2>
                    <p className="text-sm text-gray-400">Pindaian 3D terbaru Anda</p>
                  </div>
                </div>
                <Link to="/scan" className="text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">
                  Lihat Semua →
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Relief Candi Borobudur', type: 'Pindai 3D', status: 'Selesai', date: '2 jam lalu' },
                  { name: 'Koleksi Tembikar Kuno', type: 'Foto Multi-sudut', status: 'Diproses', date: 'Kemarin' },
                  { name: 'Topeng Tradisional', type: 'Pindai Video', status: 'Selesai', date: '3 hari lalu' }
                ].map((scan, index) => (
                  <div key={index} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <Camera size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-sm">{scan.name}</h3>
                        <p className="text-xs text-gray-400">{scan.type} • {scan.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      scan.status === 'Selesai'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Resources */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Aksi Cepat</h2>
                  <p className="text-sm text-gray-400">Fitur yang sering digunakan</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/scan"
                  className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl hover:from-blue-600/30 hover:to-blue-700/30 transition-all group"
                >
                  <Camera size={20} className="text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-white">Pindai Baru</p>
                </Link>

                <Link
                  to="/drone"
                  className="p-4 bg-gradient-to-br from-orange-600/20 to-red-700/20 border border-orange-500/30 rounded-xl hover:from-orange-600/30 hover:to-red-700/30 transition-all group"
                >
                  <Plane size={20} className="text-orange-400 mb-2" />
                  <p className="text-sm font-medium text-white">Terbangkan Drone</p>
                </Link>

                <Link
                  to="/viewer"
                  className="p-4 bg-gradient-to-br from-green-600/20 to-emerald-700/20 border border-green-500/30 rounded-xl hover:from-green-600/30 hover:to-emerald-700/30 transition-all group"
                >
                  <PlayCircle size={20} className="text-green-400 mb-2" />
                  <p className="text-sm font-medium text-white">Penampil 3D</p>
                </Link>

                <button
                  className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-700/20 border border-purple-500/30 rounded-xl hover:from-purple-600/30 hover:to-pink-700/30 transition-all group"
                >
                  <Settings size={20} className="text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-white">Pengaturan</p>
                </button>
              </div>
            </div>


            {/* Processing Queue */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Antrian Pemrosesan</h2>
                  <p className="text-sm text-gray-400">Tugas aktif</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-white">Borobudur Relief</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">72%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Memproses...</span>
                    <span>14 menit tersisa</span>
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
                    <span>Memproses...</span>
                    <span>35 menit tersisa</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: '38%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Aktivitas Terkini</h2>
                  <p className="text-sm text-gray-400">Pembaruan terbaru</p>
                </div>
              </div>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 px-4 py-3 shadow-2xl z-50">
        <div className="flex justify-around items-center">
          <Link to="/" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-blue-400 bg-blue-500/10">
            <div className="p-1">
              <Home size={22} />
            </div>
            <span className="text-xs font-medium">Beranda</span>
          </Link>

          <Link to="/scan" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <CamIcon size={22} />
            </div>
            <span className="text-xs font-medium">Pindai</span>
          </Link>

          <Link to="/drone" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <Plane size={22} />
            </div>
            <span className="text-xs font-medium">Drone</span>
          </Link>

          <Link to="/viewer" className="flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <div className="p-1">
              <PlayCircle size={22} />
            </div>
            <span className="text-xs font-medium">Penampil</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Dashboard;