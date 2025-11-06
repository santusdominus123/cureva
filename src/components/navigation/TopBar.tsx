import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  HelpCircleIcon,
  SettingsIcon,
  ChevronDownIcon,
  LogOutIcon,
  Zap,
  Command,
  Moon,
  Sun,
  Mail,
  User
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

interface UserData {
  displayName: string;
  photoURL?: string;
  email?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, sidebarCollapsed }) => {
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('cureva-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as HTMLElement).closest('.user-menu')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !(event.target as HTMLElement).closest('.notifications-menu')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('cureva-user');
      localStorage.removeItem('cureva-intro-seen');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const notificationsList = [
    {
      id: 1,
      title: 'Scan Completed',
      message: 'Bangunan Heritage berhasil diproses',
      time: '2 menit lalu',
      unread: true,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'New AI Model Available',
      message: 'Update VLM v2.0 telah tersedia',
      time: '1 jam lalu',
      unread: true,
      icon: Zap,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      title: 'Storage Alert',
      message: 'Cloud storage 80% terpakai',
      time: '3 jam lalu',
      unread: false,
      icon: Zap,
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Toggle & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 border border-gray-700/50 hover:border-gray-600 group"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <MenuIcon size={20} className="text-gray-400 group-hover:text-white" />
              ) : (
                <XIcon size={20} className="text-gray-400 group-hover:text-white" />
              )}
            </button>

            {/* Premium Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <SearchIcon className="absolute left-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search projects, files, or commands..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl py-3 px-4 pl-12 pr-24 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-gray-800/50">
              {/* Help */}
              <button className="p-2.5 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 border border-gray-800/50 hover:border-gray-700/50 group relative">
                <HelpCircleIcon size={18} className="text-gray-400 group-hover:text-white" />
                <div className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                  <span className="text-xs text-white">Help & Support</span>
                </div>
              </button>

              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="p-2.5 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 border border-gray-800/50 hover:border-gray-700/50 group relative"
                >
                  <BellIcon size={18} className="text-gray-400 group-hover:text-white" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                        <span className="text-xs text-gray-400">{notifications} new</span>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsList.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-gray-700/30 transition-colors border-b border-gray-800/50 last:border-b-0 ${
                            notif.unread ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${notif.color} flex items-center justify-center flex-shrink-0`}>
                              <notif.icon size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-white">{notif.title}</h4>
                                {notif.unread && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-700/50 bg-gray-800/50">
                      <button className="w-full text-center text-xs text-blue-400 hover:text-blue-300 font-medium py-2">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <button className="p-2.5 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 border border-gray-800/50 hover:border-gray-700/50 group relative">
                <SettingsIcon size={18} className="text-gray-400 group-hover:text-white" />
                <div className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                  <span className="text-xs text-white">Settings</span>
                </div>
              </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative user-menu">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 border border-gray-800/50 hover:border-gray-700/50 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                  {userData?.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt={userData.displayName}
                      className="relative w-8 h-8 rounded-full object-cover border-2 border-gray-700"
                    />
                  ) : (
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-700">
                      <span className="font-bold text-xs text-white">
                        {userData ? getInitials(userData.displayName) : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                </div>
                <ChevronDownIcon size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden z-50">
                  {/* User Info */}
                  {userData && (
                    <div className="p-4 border-b border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {userData?.photoURL ? (
                            <img
                              src={userData.photoURL}
                              alt={userData.displayName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="font-bold text-sm text-white">
                                {getInitials(userData.displayName)}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{userData.displayName}</p>
                          {userData.email && (
                            <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                          )}
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                            PRO
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center gap-3">
                      <User size={16} />
                      <span>Profile Settings</span>
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center gap-3">
                      <Mail size={16} />
                      <span>Preferences</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-700/50">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 rounded-lg"
                    >
                      <LogOutIcon size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
