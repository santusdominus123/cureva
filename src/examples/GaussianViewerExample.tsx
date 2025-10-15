import React, { useState } from 'react';
import SimpleGaussianViewer from '../components/SimpleGaussianViewer';
import DropInGaussianViewer from '../components/DropInGaussianViewer';

/**
 * Example 1: Simple Gaussian Viewer with single scene
 */
export const SimpleViewerExample: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Gaussian Splat Viewer</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".ply,.splat,.ksplat"
          onChange={handleFileChange}
        />
      </div>

      {selectedFile && (
        <SimpleGaussianViewer
          modelFile={selectedFile}
          width="100%"
          height="600px"
        />
      )}

      {!selectedFile && (
        <div style={{
          width: '100%',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <div>Upload a .ply, .splat, or .ksplat file</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Simple Viewer with URL path
 */
export const SimpleViewerWithURLExample: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Gaussian Splat Viewer (with URL)</h2>

      <SimpleGaussianViewer
        modelPath="/path/to/your/model.ply"
        width="100%"
        height="600px"
      />
    </div>
  );
};

/**
 * Example 3: DropIn Viewer with multiple scenes
 */
export const DropInViewerExample: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Create scene configurations
  const scenes = files.map((file, index) => ({
    file: file,
    splatAlphaRemovalThreshold: 5,
    position: [index * 2, 0, 0] as [number, number, number], // Offset each scene
    rotation: [0, 0, 0, 1] as [number, number, number, number],
    scale: [1, 1, 1] as [number, number, number]
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h2>DropIn Gaussian Splat Viewer (Multiple Scenes)</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".ply,.splat,.ksplat"
          multiple
          onChange={handleFileChange}
        />
        {files.length > 0 && (
          <div style={{ marginTop: '8px', color: '#666' }}>
            {files.length} file(s) selected
          </div>
        )}
      </div>

      {scenes.length > 0 && (
        <DropInGaussianViewer
          scenes={scenes}
          width="100%"
          height="600px"
          gpuAcceleratedSort={true}
        />
      )}

      {scenes.length === 0 && (
        <div style={{
          width: '100%',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <div>Upload one or more .ply, .splat, or .ksplat files</div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              Multiple scenes will be positioned side by side
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 4: DropIn Viewer with URL paths
 */
export const DropInViewerWithURLsExample: React.FC = () => {
  const scenes = [
    {
      path: '/path/to/first-model.ply',
      splatAlphaRemovalThreshold: 5,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
      scale: [1, 1, 1] as [number, number, number]
    },
    {
      path: '/path/to/second-model.ply',
      splatAlphaRemovalThreshold: 5,
      position: [0, -2, -1.2] as [number, number, number],
      rotation: [0, -0.857, -0.514495, 6.123233995736766e-17] as [number, number, number, number],
      scale: [1.5, 1.5, 1.5] as [number, number, number]
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>DropIn Viewer with Multiple Scenes (URLs)</h2>

      <DropInGaussianViewer
        scenes={scenes}
        width="100%"
        height="600px"
        gpuAcceleratedSort={true}
      />
    </div>
  );
};

/**
 * Example 5: Complete demo with all features
 */
export const CompleteDemoExample: React.FC = () => {
  const [viewerType, setViewerType] = useState<'simple' | 'dropin'>('simple');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gaussian Splat Viewer Demo</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '20px' }}>
          <input
            type="radio"
            value="simple"
            checked={viewerType === 'simple'}
            onChange={(e) => setViewerType(e.target.value as 'simple')}
          />
          {' '}Simple Viewer
        </label>
        <label>
          <input
            type="radio"
            value="dropin"
            checked={viewerType === 'dropin'}
            onChange={(e) => setViewerType(e.target.value as 'dropin')}
          />
          {' '}DropIn Viewer
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".ply,.splat,.ksplat"
          onChange={handleFileChange}
        />
      </div>

      {/* SharedArrayBuffer Info */}
      <div style={{
        padding: '12px',
        marginBottom: '20px',
        background: typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
          ? '#065f46'
          : '#854d0e',
        color: 'white',
        borderRadius: '4px'
      }}>
        <strong>Performance Mode:</strong>{' '}
        {typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
          ? '🚀 GPU Accelerated (SharedArrayBuffer enabled)'
          : '⚠️ Compatibility Mode (SharedArrayBuffer not available)'}
      </div>

      {selectedFile && viewerType === 'simple' && (
        <SimpleGaussianViewer
          modelFile={selectedFile}
          width="100%"
          height="600px"
        />
      )}

      {selectedFile && viewerType === 'dropin' && (
        <DropInGaussianViewer
          scenes={[{
            file: selectedFile,
            splatAlphaRemovalThreshold: 5
          }]}
          width="100%"
          height="600px"
          gpuAcceleratedSort={true}
        />
      )}

      {!selectedFile && (
        <div style={{
          width: '100%',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: 'white',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <div>Upload a Gaussian Splat file to start</div>
            <div style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>
              Supported formats: .ply, .splat, .ksplat
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <h3>Instructions:</h3>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Simple Viewer:</strong> Best for single scenes with full control</li>
          <li><strong>DropIn Viewer:</strong> Best for multiple scenes and Three.js integration</li>
          <li><strong>Controls:</strong> Drag to rotate, scroll to zoom</li>
          <li><strong>File Formats:</strong>
            <ul style={{ marginLeft: '20px' }}>
              <li>.ply - Original format from INRIA project</li>
              <li>.splat - Standard splat format</li>
              <li>.ksplat - Compressed format (fastest loading)</li>
            </ul>
          </li>
          <li><strong>Performance:</strong> Enable CORS headers for GPU acceleration</li>
        </ul>
      </div>
    </div>
  );
};

export default CompleteDemoExample;
