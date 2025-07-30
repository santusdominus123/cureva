import React, { useState } from 'react';
import { BellIcon, SearchIcon, MenuIcon, XIcon, HelpCircleIcon, SettingsIcon, ChevronDownIcon } from 'lucide-react';
interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}
const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  sidebarCollapsed
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState(3);
  return <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-800 transition-colors mr-2" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {sidebarCollapsed ? <MenuIcon size={20} /> : <XIcon size={20} />}
        </button>
        <div className="relative ml-2">
          <input type="text" placeholder="Search projects, scans, or assets..." value={searchValue} onChange={e => setSearchValue(e.target.value)} className="bg-gray-800/50 border border-gray-700 rounded-full py-1 px-4 pl-10 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
        <div className="flex items-center cursor-pointer hover:bg-gray-800 rounded-full px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
            <span className="font-bold text-xs">JS</span>
          </div>
          <ChevronDownIcon size={16} className="ml-1 text-gray-400" />
        </div>
      </div>
    </header>;
};
export default TopBar;