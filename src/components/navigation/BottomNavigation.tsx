import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CameraIcon,
  FolderIcon,
  TagIcon,
  ShareIcon,
  ShieldIcon,
  EyeIcon, // <-- ikon baru
} from 'lucide-react';

const navItems = [
  { name: 'Home',    icon: <HomeIcon   size={22}/>, path: '/' },
  { name: 'Scan',    icon: <CameraIcon size={22}/>, path: '/scan' },
  { name: '3D',      icon: <EyeIcon    size={22}/>, path: '/viewer' }, // <-- baru
  { name: 'Projects',icon: <FolderIcon size={22}/>, path: '/projects' },
  { name: 'Semantic',icon: <TagIcon    size={22}/>, path: '/semantic' },
  { name: 'Export',  icon: <ShareIcon  size={22}/>, path: '/export' },
  { name: 'Admin',   icon: <ShieldIcon size={22}/>, path: '/admin' },
];

const BottomNavigation: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around py-2 md:hidden z-50">
    {navItems.map(({ name, icon, path }) => (
      <NavLink
        key={path}
        to={path}
        end={path === '/'}
        className={({ isActive }) =>
          `flex flex-col items-center text-xs p-1 rounded transition-colors ${
            isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'
          }`
        }
      >
        {icon}
        <span className="mt-0.5">{name}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNavigation;