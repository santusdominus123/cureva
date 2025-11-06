import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, CameraIcon, PlaneIcon, Sparkles, Brain, Eye } from "lucide-react";

const navItems = [
  { name: "Home", icon: HomeIcon, path: "/", color: "from-blue-500 to-cyan-500" },
  { name: "Scan", icon: CameraIcon, path: "/scan", color: "from-purple-500 to-pink-500" },
  { name: "Drone", icon: PlaneIcon, path: "/drone", color: "from-green-500 to-emerald-500" },
  { name: "VLM AI", icon: Brain, path: "/vlm-demo", badge: "AI", color: "from-violet-500 to-purple-500" },
  { name: "Gaussian", icon: Sparkles, path: "/gaussian", badge: "Pro", color: "from-amber-500 to-orange-500" },
];

const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/98 to-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 md:hidden z-[100] shadow-2xl">
      {/* Bottom Nav Content */}
      <div className="flex justify-around items-center px-1.5 py-2">
        {navItems.map(({ name, icon: Icon, path, badge, color }) => (
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
              relative flex flex-col items-center justify-center
              min-w-[64px] min-h-[56px]
              px-2.5 py-2 rounded-xl
              transition-all duration-300 ease-out
              active:scale-95
              group
              ${isActive
                ? `bg-gradient-to-br ${color} text-white shadow-lg shadow-blue-500/20`
                : "text-gray-400 active:bg-gray-800/50"
              }
            `}
          >
            {({ isActive }) => (
              <>
                {/* Badge */}
                {badge && (
                  <span className="absolute -top-1 -right-1 z-10">
                    {isActive ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 shadow-lg">
                        {badge}
                      </span>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 border-2 border-gray-900 shadow-lg"></span>
                      </>
                    )}
                  </span>
                )}

                {/* Icon with Glow Effect */}
                <div className="relative">
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${color} blur-md opacity-50`}></div>
                  )}
                  <Icon
                    size={22}
                    className={`relative mb-1 transition-all duration-300 ${
                      isActive ? "scale-110" : "group-active:scale-95"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                  isActive ? "scale-100 opacity-100" : "scale-95 opacity-80"
                }`}>
                  {name}
                </span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Safe Area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-gray-900"></div>
    </nav>
  );
};

export default BottomNavigation;
