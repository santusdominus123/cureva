import React, { useState, useEffect } from 'react';
import { BellIcon, SearchIcon, MenuIcon, XIcon, HelpCircleIcon, SettingsIcon, ChevronDownIcon, LogOutIcon } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

interface UserData {
  displayName: string;
  photoURL?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  sidebarCollapsed
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as HTMLElement).closest('.relative')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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
  return <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-800 transition-colors mr-2" aria-label={sidebarCollapsed ? 'Perluas sidebar' : 'Tutup sidebar'}>
          {sidebarCollapsed ? <MenuIcon size={20} /> : <XIcon size={20} />}
        </button>
        <img
          src="/src/assets/cureva_logo.jpg"
          alt="Cureva Logo"
          className="h-8 w-8 rounded-full object-cover border border-gray-700 mr-2"
        />
        <div className="relative ml-2">
          <input type="text" placeholder="Cari scan, foto, atau aset..." value={searchValue} onChange={e => setSearchValue(e.target.value)} className="bg-gray-800/50 border border-gray-700 rounded-full py-1 px-4 pl-10 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <HelpCircleIcon size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <BellIcon size={20} className="text-gray-400" />
            {notifications > 0 && <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications}
              </span>}
          </button>
        </div>
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <SettingsIcon size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="border-l border-gray-700 h-8 mx-2"></div>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center cursor-pointer hover:bg-gray-800 rounded-full px-2 py-1 transition-colors"
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData.displayName}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
                <span className="font-bold text-xs">
                  {userData ? getInitials(userData.displayName) : 'U'}
                </span>
              </div>
            )}
            <ChevronDownIcon size={16} className="ml-1 text-gray-400" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
              {userData && (
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">{userData.displayName}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
              >
                <LogOutIcon size={16} className="mr-2" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>;
};
export default TopBar;