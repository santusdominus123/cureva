import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CameraIcon, FolderIcon, TagIcon, ShareIcon, ShieldIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface SidebarProps {
  collapsed: boolean;
}
const Sidebar: React.FC<SidebarProps> = ({
  collapsed
}) => {
  const navItems = [{
    name: 'Dashboard',
    icon: <HomeIcon size={20} />,
    path: '/'
  }, {
    name: 'Scan Capture',
    icon: <CameraIcon size={20} />,
    path: '/scan'
  }, {
    name: '3D Viewer',
    icon: <div size={20} />,
    path: '/viewer'
  }, {
    name: 'Projects',
    icon: <FolderIcon size={20} />,
    path: '/projects'
  }, {
    name: 'Semantic Layers',
    icon: <TagIcon size={20} />,
    path: '/semantic'
  }, {
    name: 'Export & Share',
    icon: <ShareIcon size={20} />,
    path: '/export'
  }, {
    name: 'Admin Panel',
    icon: <ShieldIcon size={20} />,
    path: '/admin'
  }];
  return <aside className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} h-full flex flex-col border-r border-gray-800`}>
      <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Cureva
          </h1>}
        {collapsed && <div className="text-blue-400" size={24} />}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map(item => <li key={item.name}>
              <NavLink to={item.path} className={({
            isActive
          }) => `flex items-center p-2 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400' : 'hover:bg-gray-800'} ${collapsed ? 'justify-center' : 'justify-start'}`}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </NavLink>
            </li>)}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
            <span className="font-bold text-xs">JS</span>
          </div>
          {!collapsed && <div className="ml-3">
              <p className="text-sm font-medium">Santus</p>
              <p className="text-xs text-gray-400">Researcher</p>
            </div>}
        </div>
      </div>
    </aside>;
};
export default Sidebar;