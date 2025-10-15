import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, CameraIcon, PlaneIcon, Sparkles } from "lucide-react";

const navItems = [
  { name: "Beranda", icon: HomeIcon, path: "/" },
  { name: "Pindai", icon: CameraIcon, path: "/scan" },
  { name: "Gaussian", icon: Sparkles, path: "/gaussian", badge: true },
  { name: "Drone", icon: PlaneIcon, path: "/drone" },
];

const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/95 backdrop-blur-lg border-t border-gray-800/50 md:hidden z-50 safe-bottom shadow-2xl">
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map(({ name, icon: Icon, path, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
            className={({ isActive }) => `
              flex flex-col items-center justify-center
              min-w-[60px] min-h-[56px]
              px-3 py-2 rounded-xl
              transition-all duration-300 ease-in-out
              active:scale-95
              relative group
              ${isActive
                ? "text-white bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            {/* Badge Indicator */}
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-gray-900"></span>
              </span>
            )}

            {/* Icon with responsive size */}
            <Icon size={22} className="mb-1" strokeWidth={2} />

            {/* Label */}
            <span className="text-[10px] font-medium tracking-wide">
              {name}
            </span>

            {/* Active Indicator Line */}
            {badge && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-bottom bg-gray-900"></div>
    </nav>
  );
};

export default BottomNavigation;
