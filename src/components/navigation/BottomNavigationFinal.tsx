import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, CameraIcon, PlaneIcon, Sparkles, Brain } from "lucide-react";

const navItems = [
  { name: "Beranda", icon: HomeIcon, path: "/" },
  { name: "Pindai", icon: CameraIcon, path: "/scan" },
  { name: "VLM AI", icon: Brain, path: "/vlm-demo", badge: true },
  { name: "Gaussian", icon: Sparkles, path: "/gaussian" },
];

const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/95 backdrop-blur-lg border-t border-gray-800/50 md:hidden z-[100] shadow-2xl">
      <div className="flex justify-around items-center px-2 py-2 safe-area-inset-bottom">
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
              min-w-[60px] min-h-[60px]
              px-3 py-2.5 rounded-xl
              transition-all duration-300 ease-in-out
              active:scale-95
              relative group
              ${isActive
                ? "text-white bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30"
                : "text-gray-300 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            {/* Badge Indicator */}
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center z-10">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-gray-900"></span>
              </span>
            )}

            {/* Icon with responsive size */}
            <Icon size={24} className="mb-1" strokeWidth={2.5} />

            {/* Label */}
            <span className="text-[11px] font-semibold tracking-wide">
              {name}
            </span>

            {/* Active Indicator Line */}
            {badge && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Safe area spacer for iOS notch */}
      <div className="h-[env(safe-area-inset-bottom)] bg-gray-900"></div>
    </nav>
  );
};

export default BottomNavigation;
