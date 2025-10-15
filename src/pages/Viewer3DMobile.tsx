import React, { useState } from 'react';
import { Upload, Image, Layers, Info, Share2, Download, ArrowLeft, ChevronUp, Maximize2, ZoomIn, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GaussianSplatViewer from '../components/GaussianSplatViewer';
import ThreeJS3DViewer from '../components/ThreeJS3DViewer';
import FileUpload3D from '../components/FileUpload3D';
import AIChatbox from '../components/AIChatbox';

const Viewer3DMobile: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewer' | 'info'>('viewer');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowUpload(false);
  };

  const isGaussianSplat = (file: File | null) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return (
      name.includes('gaussian') ||
      name.includes('splat') ||
      name.endsWith('.ksplat') ||
      name.endsWith('.splat') ||
      (name.endsWith('.ply') && file.size > 50 * 1024 * 1024)
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 to-black overflow-hidden">
      {/* Top Bar - Fixed Height */}
      <div className="h-16 flex-shrink-0 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 px-4 safe-top z-20">
        <div className="flex items-center justify-between h-full">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-800/80 rounded-xl flex items-center justify-center active:scale-95 transition-transform touch-target"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 mx-3 min-w-0">
            <h1 className="text-xs md:text-sm font-bold text-white truncate">
              {selectedFile?.name || '3D Viewer'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 truncate">
              {selectedFile
                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                : 'No file selected'}
            </p>
          </div>

          <div className="flex gap-2">
            <button className="w-9 h-9 md:w-10 md:h-10 bg-gray-800/80 rounded-xl flex items-center justify-center active:scale-95 transition-transform touch-target">
              <Share2 className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </button>
            <button className="w-9 h-9 md:w-10 md:h-10 bg-gray-800/80 rounded-xl flex items-center justify-center active:scale-95 transition-transform touch-target">
              <Download className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewer Area - Fullscreen minus top bar */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-950 via-black to-gray-950">
        {selectedFile ? (
          <>
            <div className="absolute inset-0">
              {isGaussianSplat(selectedFile) ? (
                <GaussianSplatViewer
                  modelFile={selectedFile}
                  width="100%"
                  height="100%"
                />
              ) : (
                <ThreeJS3DViewer
                  modelFile={selectedFile}
                  width="100%"
                  height="100%"
                />
              )}
            </div>

            {/* Touch Instruction Overlay - Shows first time */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
              <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 text-white text-center shadow-2xl border border-gray-700">
                <p className="text-sm font-medium mb-1">Sentuh & Geser untuk Rotasi</p>
                <p className="text-xs text-gray-300">Pinch untuk Zoom</p>
              </div>
            </div>

            {/* Floating Controls - Bottom Center */}
            <div className="absolute bottom-safe-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-full px-2 py-2 flex gap-1.5 shadow-2xl border border-gray-700/50">
                <button
                  className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center active:scale-90 transition-all touch-target shadow-lg hover:from-blue-600 hover:to-blue-700"
                  title="Reset View"
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>
                <button
                  className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center active:scale-90 transition-all touch-target shadow-lg hover:from-blue-600 hover:to-blue-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center active:scale-90 transition-all touch-target shadow-lg"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
                <button
                  className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center active:scale-90 transition-all touch-target shadow-lg hover:from-blue-600 hover:to-blue-700"
                  title="Layers"
                >
                  <Layers className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Model Type Badge - Top Left */}
            <div className="absolute top-4 left-4 z-10">
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md ${
                isGaussianSplat(selectedFile)
                  ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white border border-blue-400/30'
                  : 'bg-gray-900/90 text-gray-300 border border-gray-700/50'
              }`}>
                {isGaussianSplat(selectedFile) ? '✨ Gaussian Splat' : '📦 3D Model'}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="text-center max-w-sm relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-slow">
                <Image className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Upload Model 3D
              </h2>

              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Lihat model 3D Anda dengan teknologi <span className="text-blue-400 font-semibold">Gaussian Splatting</span> atau format 3D standar
              </p>

              <button
                onClick={() => setShowUpload(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold active:scale-95 transition-all shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2 mx-auto"
              >
                <Upload className="w-5 h-5" />
                Pilih File 3D
              </button>

              <div className="mt-8 text-xs text-gray-400 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
                <p className="font-semibold text-yellow-400 mb-3 flex items-center justify-center gap-2">
                  💡 Tips untuk Performa Terbaik
                </p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>File <code className="text-blue-400">.ksplat</code> loading paling cepat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Ukuran {"<"} 50MB untuk hasil optimal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Support: PLY, OBJ, SPLAT, KSPLAT</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info Button - Top Right of Viewer */}
        {selectedFile && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="absolute top-4 right-4 w-10 h-10 md:w-11 md:h-11 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-10 touch-target"
          >
            <Info className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        )}
      </div>

      {/* AI Chatbox */}
      <AIChatbox
        initialMessage="Halo! 👋 Upload screenshot model 3D untuk analisis atau tanya apapun tentang Gaussian Splatting!"
        modelContext={{
          name: selectedFile?.name || 'No file',
          type: isGaussianSplat(selectedFile) ? 'Gaussian Splat' : 'Regular 3D Model',
          metadata: selectedFile
            ? {
                size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
                type: selectedFile.type || 'unknown',
              }
            : null,
        }}
        position="floating"
      />

      {/* Bottom Sheet - File Info */}
      {showInfo && selectedFile && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowInfo(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-gray-900 rounded-t-3xl border-t border-gray-800 shadow-2xl animate-in slide-in-from-bottom duration-300 safe-bottom">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-700 rounded-full"></div>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Detail Model</h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center"
                >
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Nama File</p>
                  <p className="text-sm text-white font-medium break-all">{selectedFile.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Ukuran</p>
                    <p className="text-sm text-white font-medium">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Type</p>
                    <p className="text-sm text-white font-medium">
                      {isGaussianSplat(selectedFile) ? 'Gaussian Splat' : '3D Model'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-xs text-blue-400 font-medium mb-2">📊 Format Info</p>
                  <p className="text-xs text-gray-300">
                    {isGaussianSplat(selectedFile)
                      ? 'Gaussian Splatting menggunakan representasi berbasis partikel 3D untuk rendering real-time berkualitas tinggi.'
                      : 'Model 3D traditional dengan mesh geometry dan textures.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowUpload(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-b from-gray-900 to-gray-900 rounded-3xl border border-gray-800 shadow-2xl p-6 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white mb-4">Upload Model 3D</h3>
            <FileUpload3D
              onFileSelect={handleFileSelect}
              onFileRemove={() => {
                setSelectedFile(null);
                setShowUpload(false);
              }}
              selectedFile={selectedFile}
              acceptedFormats={['.ply', '.obj', '.splat', '.ksplat']}
              maxFileSize={500}
            />
            <button
              onClick={() => setShowUpload(false)}
              className="w-full mt-4 bg-gray-800 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform"
            >
              Batal
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Viewer3DMobile;
