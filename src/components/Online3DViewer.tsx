import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileIcon, LoaderIcon, AlertCircle, RotateCw, ZoomIn, Download } from 'lucide-react';

interface Online3DViewerProps {
  modelUrl?: string;
  modelFile?: File;
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  showControls?: boolean;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: string) => void;
}

const Online3DViewer: React.FC<Online3DViewerProps> = ({
  modelUrl,
  modelFile,
  width = '100%',
  height = '600px',
  backgroundColor = '#2a2b2e',
  showControls = true,
  onLoadStart,
  onLoadComplete,
  onLoadError
}) => {
  const parentDiv = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedModel, setLoadedModel] = useState<string | null>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 42, g: 43, b: 46 };
  };

  const bgColor = hexToRgb(backgroundColor);

  const initializeViewer = useCallback(async () => {
    if (!parentDiv.current) return;

    try {
      // Dynamically import the library to handle potential loading issues
      const OV = await import('online-3d-viewer');

      // Clean up previous viewer
      if (viewerRef.current) {
        viewerRef.current.Clear();
      }

      // Initialize viewer with basic configuration
      const viewer = new OV.EmbeddedViewer(parentDiv.current, {
        backgroundColor: new OV.RGBAColor(bgColor.r, bgColor.g, bgColor.b, 255),
        defaultColor: new OV.RGBColor(200, 200, 200)
      });

      viewerRef.current = viewer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize 3D viewer';
      setError(errorMsg);
      onLoadError?.(errorMsg);
      console.error('3D Viewer initialization error:', err);
    }
  }, [bgColor.r, bgColor.g, bgColor.b, onLoadError]);

  const loadModel = useCallback(async () => {
    if (!viewerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      if (modelUrl) {
        const fileName = modelUrl.split('/').pop() || 'model';
        await viewerRef.current.LoadModelFromUrlList([modelUrl]);
        setLoadedModel(fileName);
      } else if (modelFile) {
        await viewerRef.current.LoadModelFromFileList([modelFile]);
        setLoadedModel(modelFile.name);
      }

      onLoadComplete?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load 3D model';
      setError(errorMsg);
      onLoadError?.(errorMsg);
      console.error('Model loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [modelUrl, modelFile, onLoadStart, onLoadComplete, onLoadError]);

  const resetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.FitToWindow(1.0, true);
    }
  };

  const zoomToFit = () => {
    if (viewerRef.current) {
      viewerRef.current.FitToWindow(0.9, true);
    }
  };

  const exportModel = () => {
    if (viewerRef.current) {
      // This would implement export functionality
      console.log('Export functionality not yet implemented');
    }
  };

  useEffect(() => {
    initializeViewer();
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.Clear();
        } catch (err) {
          console.warn('Error clearing viewer:', err);
        }
        viewerRef.current = null;
      }
    };
  }, [initializeViewer]);

  useEffect(() => {
    if (viewerRef.current && (modelUrl || modelFile)) {
      loadModel();
    }
  }, [loadModel, modelUrl, modelFile]);

  return (
    <div className="relative">
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={resetCamera}
            className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors"
            title="Reset Camera"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={zoomToFit}
            className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors"
            title="Zoom to Fit"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={exportModel}
            className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors"
            title="Export Model"
          >
            <Download size={16} />
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="bg-white/90 rounded-lg p-4 flex items-center space-x-3">
            <LoaderIcon className="animate-spin" size={20} />
            <span className="text-gray-800">Loading 3D model...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3 max-w-md">
            <AlertCircle size={20} />
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Info */}
      {loadedModel && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/70 rounded-lg px-3 py-2 text-white text-sm flex items-center space-x-2">
            <FileIcon size={16} />
            <span>{loadedModel}</span>
          </div>
        </div>
      )}

      {/* 3D Viewer Container */}
      <div
        ref={parentDiv}
        style={{
          width,
          height,
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}
        className="bg-gray-900"
      />
    </div>
  );
};

export default Online3DViewer;