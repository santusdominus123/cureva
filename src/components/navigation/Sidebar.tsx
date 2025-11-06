// src/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  UserIcon,
  BoxIcon,
  PlaneIcon,
  Sparkles,
  Brain,
  Eye,
  Zap
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import logoImg from "../../assets/cureva_logo.jpg";

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
    const storedUser = localStorage.getItem("cureva-user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Generate initials from display name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Clear localStorage
      localStorage.removeItem("cureva-user");
      localStorage.removeItem("cureva-intro-seen");

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: force clear and reload
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const navItems: Array<{
    name: string;
    icon: any;
    path: string;
    badge?: string;
    color?: string;
    description?: string;
  }> = [
    {
      name: "Dashboard",
      icon: HomeIcon,
      path: "/",
      color: "from-blue-500 to-cyan-500",
      description: "Beranda utama"
    },
    {
      name: "3D Scanner",
      icon: CameraIcon,
      path: "/scan",
      color: "from-purple-500 to-pink-500",
      description: "Pindai objek 3D"
    },
    {
      name: "Gaussian Splat",
      icon: Sparkles,
      path: "/gaussian",
      badge: "Pro",
      color: "from-amber-500 to-orange-500",
      description: "Teknologi rendering terbaru"
    },
    {
      name: "Drone Control",
      icon: PlaneIcon,
      path: "/drone",
      color: "from-green-500 to-emerald-500",
      description: "Kontrol drone realtime"
    },
    {
      name: "VLM Analysis",
      icon: Brain,
      path: "/vlm-demo",
      badge: "AI",
      color: "from-violet-500 to-purple-500",
      description: "Analisis AI powered"
    },
  ];

  return (
    <aside className={`bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-72"} h-full flex flex-col border-r border-gray-800/50 backdrop-blur-xl relative overflow-hidden`}>
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50 animate-pulse"></div>

      {/* Header with Premium Logo */}
      <div className={`relative z-10 p-6 flex items-center ${collapsed ? "justify-center" : "justify-between"} border-b border-gray-800/50`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-md opacity-75 animate-pulse"></div>
              <img
                src={logoImg}
                alt="Cureva Logo"
                className="relative h-10 w-10 rounded-xl object-cover border-2 border-white/20 shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Cureva
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider">PRO VERSION</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-md opacity-75 animate-pulse"></div>
            <img
              src={logoImg}
              alt="Cureva Logo"
              className="relative h-10 w-10 rounded-xl object-cover border-2 border-white/20 shadow-lg"
            />
          </div>
        )}

        {/* Modern Collapse Toggle */}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 border border-gray-700/50 hover:border-gray-600"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronLeftIcon size={18} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Premium Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-6 px-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li key={item.name} style={{ animationDelay: `${index * 50}ms` }}>
              <NavLink
                to={item.path}
                preventScrollReset={true}
                replace={false}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r " + (item.color || "from-blue-500 to-purple-600") + " text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Animated Background Glow for Active Item */}
                    {isActive && !collapsed && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 blur-xl`}></div>
                    )}

                    {/* Icon with Gradient Background */}
                    <div className={`relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-white/20 shadow-lg"
                        : "bg-gray-800/50 group-hover:bg-gray-700/50"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>

                    {/* Label and Badge */}
                    {!collapsed && (
                      <div className="relative flex-1 flex items-center justify-between">
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.badge && (
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            item.badge === "Pro"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                              : "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                          } shadow-lg`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip for Collapsed State */}
                    {collapsed && (
                      <div className="absolute left-full ml-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        {item.badge && (
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.badge === "Pro"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-violet-500 to-purple-500"
                          } text-white`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Divider */}
        {!collapsed && (
          <div className="my-6 border-t border-gray-800/50"></div>
        )}
      </nav>

      {/* Premium User Profile Section */}
      <div className="relative z-10 p-4 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
        {!collapsed ? (
          <div className="space-y-3">
            {/* User Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">
              <div className="relative">
                {/* Avatar Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-50"></div>
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.displayName}
                    className="relative w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm text-white">
                      {userData ? getInitials(userData.displayName) : "U"}
                    </span>
                  </div>
                )}
                {/* Online Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate" title={userData?.displayName}>
                  {userData?.displayName || "User"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                    {userData?.role || "USER"}
                  </span>
                  {userData?.provider && (
                    <span className="text-[10px] text-gray-500">
                      • {userData.provider === "password" ? "Email" : userData.provider.replace(".com", "")}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 transition-all duration-200 border border-gray-700/50 hover:border-red-500/50 group"
                title="Logout"
              >
                <LogOutIcon size={16} className="text-gray-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed User Profile */
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-50"></div>
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt={userData.displayName}
                  className="relative w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
                />
              ) : (
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-sm text-white">
                    {userData ? getInitials(userData.displayName) : "U"}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                <div className="text-sm font-medium text-white">{userData?.displayName || "User"}</div>
                <div className="text-xs text-gray-400 mt-0.5">{userData?.role || "USER"}</div>
              </div>
            </div>

            {/* Collapsed Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-gray-800/30 hover:bg-red-500/20 transition-all duration-200 border border-gray-800/50 hover:border-red-500/50 text-gray-400 hover:text-red-400 group relative"
            >
              <LogOutIcon size={16} />
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                <span className="text-xs text-white">Logout</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
