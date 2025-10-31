import React, { useState } from 'react';
import { Upload, Info, AlertCircle } from 'lucide-react';
import SimpleGaussianViewer from '../../components/viewers/SimpleGaussianViewer';

/**
 * Test page untuk Gaussian Splat Viewer
 * Akses di: /test-gaussian
 */
const TestGaussianViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  // Check SharedArrayBuffer support
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const isCrossOriginIsolated = typeof self !== 'undefined' && self.crossOriginIsolated;
  const isGPUAccelerated = hasSharedArrayBuffer && isCrossOriginIsolated;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">🎨 Gaussian Splat Viewer Test</h1>
        <p className="text-gray-400">Upload file .ply, .splat, atau .ksplat untuk testing</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Viewer Header */}
            <div className="border-b border-gray-800 p-4 flex justify-between items-center">
              <h2 className="font-semibold flex items-center">
                <Info className="mr-2" size={18} />
                3D Viewer
              </h2>
              {selectedFile && (
                <button
                  onClick={clearFile}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Viewer Area */}
            <div className="aspect-video bg-black relative">
              {selectedFile ? (
                <SimpleGaussianViewer
                  modelFile={selectedFile}
                  width="100%"
                  height="100%"
                />
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="text-center p-8">
                    <Upload className="mx-auto mb-4 text-gray-500" size={64} />
                    <h3 className="text-xl font-medium mb-2">Drop file atau klik upload</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Supported: .ply, .splat, .ksplat
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".ply,.splat,.ksplat"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer inline-block transition-colors">
                        Choose File
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* System Status */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Info className="mr-2" size={16} />
              System Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">SharedArrayBuffer</span>
                <span className={hasSharedArrayBuffer ? 'text-green-400' : 'text-red-400'}>
                  {hasSharedArrayBuffer ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cross-Origin Isolated</span>
                <span className={isCrossOriginIsolated ? 'text-green-400' : 'text-red-400'}>
                  {isCrossOriginIsolated ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">GPU Acceleration</span>
                <span className={isGPUAccelerated ? 'text-green-400' : 'text-yellow-400'}>
                  {isGPUAccelerated ? '✓ Enabled' : '⚠ Disabled'}
                </span>
              </div>
            </div>

            {!isGPUAccelerated && (
              <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-300">
                <AlertCircle className="inline mr-1" size={12} />
                Running in compatibility mode. Check CORS headers.
              </div>
            )}
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="font-semibold mb-3">File Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-gray-400">Name</div>
                  <div className="font-mono text-xs break-all">{selectedFile.name}</div>
                </div>
                <div>
                  <div className="text-gray-400">Size</div>
                  <div>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <div>
                  <div className="text-gray-400">Type</div>
                  <div>{selectedFile.type || 'application/octet-stream'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Format</div>
                  <div className="uppercase">
                    {selectedFile.name.split('.').pop()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Guide */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-semibold mb-3">Controls</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-start">
                <span className="mr-2">🖱️</span>
                <span>Click + Drag: Rotate</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">🔍</span>
                <span>Scroll: Zoom In/Out</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-blue-400">💡 Tips</h3>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Use .ksplat for fastest loading</li>
              <li>• Files under 50MB load faster</li>
              <li>• Enable CORS for GPU acceleration</li>
              <li>• Check console for detailed logs</li>
            </ul>
          </div>

          {/* Sample Files */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-semibold mb-3">Sample Files</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://huggingface.co/cakewalk/splat-data/tree/main"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300 underline"
              >
                Download Sample PLY Files →
              </a>
              <p className="text-xs text-gray-500">
                Cari file .ply atau .splat untuk testing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Console */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="font-semibold mb-3 font-mono text-sm">Debug Console</h3>
          <div className="bg-black rounded p-3 font-mono text-xs space-y-1 text-gray-400">
            <div>SharedArrayBuffer: {String(hasSharedArrayBuffer)}</div>
            <div>CrossOriginIsolated: {String(isCrossOriginIsolated)}</div>
            <div>UserAgent: {navigator.userAgent.substring(0, 80)}...</div>
            <div>Screen: {window.screen.width}x{window.screen.height}</div>
            <div>DevicePixelRatio: {window.devicePixelRatio}</div>
            {selectedFile && (
              <>
                <div className="mt-2 text-green-400">--- FILE SELECTED ---</div>
                <div>Name: {selectedFile.name}</div>
                <div>Size: {selectedFile.size} bytes</div>
                <div>LastModified: {new Date(selectedFile.lastModified).toLocaleString()}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestGaussianViewer;
