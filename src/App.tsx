import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/navigation/Sidebar";
import TopBar from "./components/navigation/TopBar";
import BottomNavigation from "./components/navigation/BottomNavigation";
import Dashboard from "./pages/dashboard/Dashboard";
import ScanCapture from "./pages/tools/ScanCapture";
import DroneCamera from "./pages/tools/DroneCamera";
import TestGaussianViewer from "./pages/demos/TestGaussianViewer";
import Easy3DViewerDemo from "./pages/demos/Easy3DViewerDemo";
import GaussianDemo from "./pages/demos/GaussianDemo";
import BlenderGaussianDemo from "./pages/demos/BlenderGaussianDemo";
import VLMDemo from "./pages/demos/VLMDemo";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = (userData: any) => {
    console.log("handleLogin called with:", userData);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "logged in" : "logged out");
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "User",
          photoURL: user.photoURL,
          provider: user.providerData?.[0]?.providerId || "password",
          role: "Admin",
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem("cureva-user", JSON.stringify(userData));
      }
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
        {/* Responsive Layout Container */}
        <div className="relative flex min-h-screen md:h-screen">
          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar collapsed={sidebarCollapsed} />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 w-full min-h-screen md:h-screen">
            {/* Desktop Top Bar - hidden on mobile */}
            <div className="hidden md:block">
              <TopBar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
            </div>

            {/* Mobile Top Bar - visible only on mobile */}
            <div className="md:hidden sticky top-0 z-30 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-lg border-b border-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Cureva</h1>
                  <p className="text-xs text-gray-400">3D Vision Platform</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>

            {/* Shared Content Area - Mobile needs padding bottom for nav */}
            <main className="flex-1 overflow-y-auto px-3 py-4 md:p-6 bg-black/30 backdrop-blur-sm pb-20 md:pb-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/scan"
                  element={
                    <React.Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading Scanner...</p>
                          </div>
                        </div>
                      }
                    >
                      <ScanCapture key="scan-capture" />
                    </React.Suspense>
                  }
                />
                <Route path="/gaussian" element={<GaussianDemo />} />
                <Route path="/blender-gaussian" element={<BlenderGaussianDemo />} />
                <Route path="/drone" element={<DroneCamera />} />
                <Route path="/test-gaussian" element={<TestGaussianViewer />} />
                <Route path="/easy-viewer" element={<Easy3DViewerDemo />} />
                <Route path="/vlm-demo" element={<VLMDemo />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Mobile Bottom Navigation - FIXED POSITION */}
            <BottomNavigation />
          </div>
        </div>
      </div>
    </Router>
  );
}
