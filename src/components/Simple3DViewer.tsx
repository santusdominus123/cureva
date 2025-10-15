import React, { useRef, useEffect, useState } from 'react';
import { FileIcon, LoaderIcon, AlertCircle, Upload, RotateCw, ZoomIn } from 'lucide-react';

interface Simple3DViewerProps {
  modelFile?: File | null;
  width?: string | number;
  height?: string | number;
}

const Simple3DViewer: React.FC<Simple3DViewerProps> = ({
  modelFile,
  width = '100%',
  height = '600px'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<string | null>(null);

  const loadModel = async () => {
    if (!modelFile || !canvasRef.current) return;

    setIsLoading(true);
    setError(null);
    setModelInfo(null);

    try {
      // Try to load Online3DViewer dynamically
      const OV = await import('online-3d-viewer');

      // Initialize the viewer
      const viewer = new OV.EmbeddedViewer(canvasRef.current.parentElement!, {
        backgroundColor: new OV.RGBAColor(42, 43, 46, 255),
        defaultColor: new OV.RGBColor(200, 200, 200)
      });

      // Load the model
      await viewer.LoadModelFromFileList([modelFile]);
      setModelInfo(modelFile.name);

    } catch (err) {
      console.error('Failed to load 3D model:', err);
      setError(`Failed to load 3D model: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (modelFile) {
      loadModel();
    }
  }, [modelFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Canvas/Viewer Container */}
      <div
        className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 relative overflow-hidden"
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: modelFile && !error ? 'block' : 'none' }}
        />

        {/* No Model State */}
        {!modelFile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <Upload className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No 3D Model</h3>
              <p className="text-gray-400">
                Upload a 3D file to view it here
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center p-6 bg-gray-800/90 rounded-lg">
              <LoaderIcon className="animate-spin mx-auto h-8 w-8 text-blue-400 mb-3" />
              <p className="text-white font-medium">Loading 3D Model...</p>
              <p className="text-gray-400 text-sm mt-1">
                {modelFile?.name}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center p-6 bg-red-900/90 rounded-lg max-w-md">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
              <p className="text-white font-medium mb-2">Error Loading Model</p>
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={loadModel}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Controls (when model is loaded) */}
        {modelInfo && !isLoading && !error && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors">
              <RotateCw size={16} />
            </button>
            <button className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>
        )}

        {/* Model Info */}
        {modelInfo && !isLoading && !error && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/70 rounded-lg px-3 py-2 text-white text-sm flex items-center space-x-2">
              <FileIcon size={16} />
              <span>{modelInfo}</span>
              {modelFile && (
                <span className="text-gray-300">
                  ({formatFileSize(modelFile.size)})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simple3DViewer;