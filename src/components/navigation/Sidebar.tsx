// src/components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  CameraIcon, 
  FolderIcon, 
  TagIcon, 
  ShareIcon, 
  ShieldIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  LogOutIcon,
  UserIcon,
  BoxIcon
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  role: string;
  loginTime: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Load user data from localStorage
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

  // Generate initials from display name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('cureva-user');
    localStorage.removeItem('cureva-intro-seen');
    window.location.reload();
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: <HomeIcon size={20} />,
      path: '/'
    },
    {
      name: 'Scan Capture',
      icon: <CameraIcon size={20} />,
      path: '/scan'
    },
    {
      name: '3D Viewer',
      icon: <BoxIcon size={20} />, // Fixed the icon
      path: '/viewer'
    },
    {
      name: 'Projects',
      icon: <FolderIcon size={20} />,
      path: '/projects'
    },
    {
      name: 'Semantic Layers',
      icon: <TagIcon size={20} />,
      path: '/semantic'
    },
    {
      name: 'Export & Share',
      icon: <ShareIcon size={20} />,
      path: '/export'
    },
    {
      name: 'Admin Panel',
      icon: <ShieldIcon size={20} />,
      path: '/admin'
    }
  ];

  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${
      collapsed ? 'w-16' : 'w-64'
    } h-full flex flex-col border-r border-gray-800 relative`}>
      
      {/* Header with Logo */}
      <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Cureva
          </h1>
        )}
        {collapsed && (
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            C
          </div>
        )}
        
        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map(item => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                      : 'hover:bg-gray-800'
                  } ${collapsed ? 'justify-center' : 'justify-start'}`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center">
            {/* User Avatar */}
            <div className="relative group">
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
              
              {/* User tooltip for collapsed state */}
              {collapsed && userData && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 bottom-0">
                  {userData.displayName}
                  <br />
                  <span className="text-xs text-gray-400">{userData.role}</span>
                </div>
              )}
            </div>

            {/* User Info (visible when not collapsed) */}
            {!collapsed && userData && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium truncate" title={userData.displayName}>
                  {userData.displayName}
                </p>
                <p className="text-xs text-gray-400">{userData.role}</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Logout"
            >
              <LogOutIcon size={16} />
            </button>
          )}
        </div>

        {/* Provider Badge (visible when not collapsed) */}
        {!collapsed && userData && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {userData.provider === 'google.com' && (
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
              )}
              {userData.provider === 'github.com' && (
                <img src="https://authjs.dev/img/providers/github-dark.svg" alt="GitHub" className="w-4 h-4" />
              )}
              {userData.provider === 'password' && (
                <UserIcon size={16} className="text-gray-400" />
              )}
              <span className="text-xs text-gray-400 capitalize">
                {userData.provider === 'password' ? 'Email' : userData.provider.replace('.com', '')}
              </span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Online"></div>
          </div>
        )}

        {/* Collapsed logout button */}
        {collapsed && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white relative group"
              title="Logout"
            >
              <LogOutIcon size={16} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;