import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Sparkles, Monitor, Smartphone } from "lucide-react";

const GaussianDemo: React.FC = () => {
  const [error] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header Section - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center">
            <Sparkles size={isMobile ? 24 : 28} className="mr-2 text-purple-400" />
            Gaussian Splats 3D
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            {isMobile ? 'Viewer 3D Gaussian Splat' : 'Upload dan visualisasi file Gaussian Splat (.ply, .splat, .ksplat)'}
          </p>
        </div>

        {/* Device Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isMobile ? (
            <>
              <Smartphone size={16} className="text-blue-400" />
              <span>Tampilan Mobile</span>
            </>
          ) : (
            <>
              <Monitor size={16} className="text-green-400" />
              <span>Tampilan Desktop</span>
            </>
          )}
        </div>
      </div>

      {/* Viewer Container - Responsive */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-lg md:rounded-xl border border-gray-800 overflow-hidden">
        <div className={`relative ${isMobile ? 'aspect-[4/3]' : 'aspect-[16/9]'}`}>
          <iframe
            src="/gaussian-viewer-simple.html"
            className="absolute inset-0 w-full h-full border-0"
            title="Gaussian Splat Viewer"
            allow="cross-origin-isolated"
            style={{
              touchAction: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          />

          {/* Notifications - Responsive */}
          {error && (
            <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-[90%] md:max-w-md">
              <div className="bg-red-500/95 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-lg flex items-center shadow-2xl text-sm">
                <AlertCircle size={isMobile ? 18 : 20} className="mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-xs md:text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-[90%] md:max-w-md">
              <div className="bg-green-500/95 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-lg flex items-center shadow-2xl text-sm">
                <CheckCircle size={isMobile ? 18 : 20} className="mr-2 md:mr-3 flex-shrink-0" />
                <span className="text-xs md:text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Loading Overlay for Mobile - Better UX */}
          {isMobile && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 text-white text-xs shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Touch & Drag untuk Rotasi</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Bar - Responsive */}
        <div className="border-t border-gray-800 px-3 md:px-6 py-2 md:py-3 bg-gray-900/70">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-gray-400">
            <div className="flex-1">
              <strong className="text-gray-300">Kontrol:</strong>{' '}
              {isMobile ? (
                <span>Sentuh: Rotasi • Cubit: Zoom • 2-Jari: Geser</span>
              ) : (
                <span>Klik Kiri+Seret: Rotasi | Klik Kanan+Seret: Geser | Scroll: Zoom</span>
              )}
            </div>
            <div className="text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="hidden md:inline">Gaussian Splat</span>
              <span className="text-emerald-400 font-medium">Langsung</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tips Card */}
      {isMobile && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm rounded-lg border border-blue-800/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Tips Mobile 📱</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 1 Jari: Rotasi model 360°</li>
                <li>• 2 Jari Pinch: Zoom in/out</li>
                <li>• 2 Jari Drag: Pan kamera</li>
                <li>• Untuk performa terbaik, gunakan landscape mode</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GaussianDemo;
