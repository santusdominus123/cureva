import React, { useState, useEffect } from 'react';
import { FileIcon, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface BasicFileViewerProps {
  modelFile?: File | null;
  width?: string | number;
  height?: string | number;
}

const BasicFileViewer: React.FC<BasicFileViewerProps> = ({
  modelFile,
  width = '100%',
  height = '600px'
}) => {
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (modelFile) {
      const fileExtension = modelFile.name.split('.').pop()?.toLowerCase();
      const supportedFormats = ['ply', 'obj', 'stl', 'gltf', 'glb', '3ds', 'dae', 'fbx'];

      setIsSupported(supportedFormats.includes(fileExtension || ''));
      setFileInfo({
        name: modelFile.name,
        size: modelFile.size,
        type: modelFile.type || 'Unknown',
        extension: fileExtension,
        lastModified: new Date(modelFile.lastModified)
      });
    } else {
      setFileInfo(null);
      setIsSupported(false);
    }
  }, [modelFile]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDescription = (extension: string) => {
    const descriptions: { [key: string]: string } = {
      'ply': 'Polygon File Format - Point cloud and mesh data',
      'obj': 'Wavefront OBJ - 3D geometry definition',
      'stl': 'STL File - Stereolithography format',
      'gltf': 'GL Transmission Format - 3D scenes and models',
      'glb': 'Binary GL Transmission Format',
      '3ds': 'Autodesk 3D Studio format',
      'dae': 'COLLADA Digital Asset Exchange',
      'fbx': 'Autodesk FBX format'
    };
    return descriptions[extension] || 'Unknown 3D format';
  };

  return (
    <div className="relative" style={{ width, height }}>
      <div
        className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 relative overflow-hidden"
        style={{ width, height }}
      >
        {!modelFile ? (
          /* No File State */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <Upload className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Upload 3D Model</h3>
              <p className="text-gray-400">
                Select a file to preview its information
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Supported: PLY, OBJ, STL, GLTF, GLB, 3DS, DAE, FBX
              </div>
            </div>
          </div>
        ) : fileInfo ? (
          /* File Information Display */
          <div className="p-6 h-full overflow-y-auto">
            <div className="space-y-6">
              {/* File Header */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    isSupported ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    <FileIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">
                    {fileInfo?.name || 'Unknown File'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {fileInfo?.extension ? getFileTypeDescription(fileInfo.extension) : 'Unknown format'}
                  </p>
                  <div className="flex items-center mt-2">
                    {isSupported ? (
                      <div className="flex items-center text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Supported Format
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Format may not be fully supported
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* File Details */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  File Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">File Size</span>
                    <span className="text-white text-sm">{fileInfo?.size ? formatFileSize(fileInfo.size) : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">File Type</span>
                    <span className="text-white text-sm">{fileInfo?.type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Extension</span>
                    <span className="text-white text-sm uppercase">.{fileInfo?.extension || 'unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Last Modified</span>
                    <span className="text-white text-sm">{fileInfo?.lastModified ? fileInfo.lastModified.toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* 3D Viewer Placeholder */}
              <div className="bg-gray-800/30 rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <FileIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-white font-medium mb-2">3D Preview</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Interactive 3D viewer will be available here once the Online3DViewer library is properly configured.
                </p>
                <div className="text-xs text-gray-500">
                  Current Status: File loaded and ready for 3D rendering
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">💡 Tips</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Ensure your 3D file is properly formatted</li>
                  <li>• Large files may take longer to process</li>
                  <li>• PLY and OBJ formats are recommended for best compatibility</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Error/Loading State */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Error Loading File</h3>
              <p className="text-gray-400">
                Unable to read file information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicFileViewer;