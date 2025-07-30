import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Sidebar   from './components/navigation/Sidebar';
import TopBar    from './components/navigation/TopBar';
import BottomNavigation from './components/navigation/BottomNavigation'; // ➕
import Dashboard from './pages/Dashboard';
import ScanCapture from './pages/ScanCapture';
import Viewer3D  from './pages/Viewer3D';
import ProjectManager from './pages/ProjectManager';
import SemanticLayers from './pages/SemanticLayers';
import ExportHub   from './pages/ExportHub';
import AdminPanel  from './pages/AdminPanel';
import Login  from './pages/auth/Login';
import Register from './pages/auth/Register';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleLogin = () => setIsAuthenticated(true);

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />
          <MainContent />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <MainContent />
        <BottomNavigation />
      </div>
    </Router>
  );
}

/* Komponen agar tidak duplicate */
const MainContent = () => (
  <main className="flex-1 overflow-y-auto p-4 bg-black/30 backdrop-blur-sm">
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/scan" element={<ScanCapture />} />
      <Route path="/viewer" element={<Viewer3D />} />
      <Route path="/projects" element={<ProjectManager />} />
      <Route path="/semantic" element={<SemanticLayers />} />
      <Route path="/export" element={<ExportHub />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </main>
);