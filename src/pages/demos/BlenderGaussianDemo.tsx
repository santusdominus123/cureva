import React, { useState } from "react";
import { Upload, Info, Sparkles } from "lucide-react";
import BlenderLikeGaussianViewer from "../../components/viewers/BlenderLikeGaussianViewer";

const BlenderGaussianDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validFormats = ['.ply', '.splat', '.ksplat'];
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validFormats.includes(fileExt)) {
        setError(`Format tidak didukung. Gunakan: ${validFormats.join(', ')}`);
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={32} className="text-purple-400" />
          <h1 className="text-3xl font-bold">Blender-Style Gaussian Viewer</h1>
        </div>
        <p className="text-gray-400">
          3D Gaussian Splat viewer dengan kontrol seperti Blender - orbit, pan, zoom yang smooth
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Viewer Area */}
          <div className="lg:col-span-2">
            {selectedFile ? (
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                <BlenderLikeGaussianViewer
                  modelFile={selectedFile}
                  width="100%"
                  height="600px"
                />
                <div className="p-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">File yang dimuat:</p>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-4 py-2 bg-red-900/50 hover:bg-red-900 rounded-lg text-sm transition-colors"
                    >
                      Ganti File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".ply,.splat,.ksplat"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="p-16 text-center">
                    <Upload size={64} className="mx-auto text-purple-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Upload Gaussian Splat File</h3>
                    <p className="text-gray-400 mb-4">
                      Click atau drag & drop file di sini
                    </p>
                    <div className="flex justify-center gap-2">
                      <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs">
                        .ply
                      </span>
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs">
                        .splat
                      </span>
                      <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs">
                        .ksplat
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Instructions Panel */}
          <div className="space-y-4">
            {/* Control Modes */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={20} className="text-blue-400" />
                Mode Kontrol
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="font-semibold text-sm">Orbit Mode</h4>
                  </div>
                  <p className="text-xs text-gray-400">
                    Drag untuk merotasi model mengelilingi pusat. Seperti middle-click di Blender.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h4 className="font-semibold text-sm">Pan Mode</h4>
                  </div>
                  <p className="text-xs text-gray-400">
                    Drag untuk menggeser kamera. Seperti Shift + middle-click di Blender.
                  </p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold mb-4">⌨️ Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mouse Drag</span>
                  <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">Rotate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scroll Wheel</span>
                  <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">Zoom</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pan Mode + Drag</span>
                  <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">Move</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Home Button</span>
                  <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">Reset</span>
                </div>
              </div>
            </div>

            {/* View Angles */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold mb-4">📐 View Angles</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="font-mono text-xs mb-1">T</div>
                  <div className="text-gray-400 text-xs">Top</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="font-mono text-xs mb-1">F</div>
                  <div className="text-gray-400 text-xs">Front</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="font-mono text-xs mb-1">R</div>
                  <div className="text-gray-400 text-xs">Right</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2 text-center">
                  <div className="font-mono text-xs mb-1">L</div>
                  <div className="text-gray-400 text-xs">Left</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Gunakan tombol view angle di kanan atas viewer untuk quick navigation
              </p>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-800/30">
              <h3 className="text-lg font-bold mb-3">✨ Fitur</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Smooth orbit rotation seperti Blender</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Pan kamera dengan kontrol presisi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Zoom in/out dengan scroll atau button</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Quick view angles (6 preset sudut)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Grid helper untuk referensi ruang</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Real-time camera info display</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Touch support untuk mobile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlenderGaussianDemo;
