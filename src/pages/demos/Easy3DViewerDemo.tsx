import React, { useState } from 'react';
import Easy3DViewer from '../../components/viewers/Easy3DViewer';

const Easy3DViewerDemo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name);
      setFile(selectedFile);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
          🎨 Simple 3D Viewer
        </h1>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Upload file .ply, .splat, atau .ksplat untuk melihat 3D model
        </p>

        {/* File Input */}
        <div style={{
          background: '#2a2a2a',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#3b82f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            📁 Choose File
            <input
              type="file"
              accept=".ply,.splat,.ksplat"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {file && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#1a1a1a',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <div style={{ color: '#3b82f6', marginBottom: '4px' }}>
                ✓ File Loaded
              </div>
              <div style={{ color: '#ccc' }}>
                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div style={{
          background: '#2a2a2a',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#888' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'white' }}>Controls:</strong>
            </div>
            <div>🖱️ Drag = Rotate camera</div>
            <div>🔍 Scroll = Zoom in/out</div>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
              ? '#065f46'
              : '#854d0e',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
              ? '🚀 GPU Acceleration: Enabled'
              : '⚠️ Compatibility Mode (slower)'}
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div style={{ maxWidth: '1920px', margin: '0 auto' }}>
        <div style={{
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #333',
          position: 'relative'
        }}>
          <Easy3DViewer
            file={file}
            width="100%"
            height="calc(100vh - 280px)" // Full height minus header/footer
          />

          {/* Resolution Info Overlay */}
          {file && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#60a5fa',
              fontFamily: 'monospace'
            }}>
              {window.innerWidth} x {window.innerHeight}
              {window.innerWidth >= 1920 && window.innerHeight >= 1080 && ' • 1080p+'}
            </div>
          )}
        </div>
      </div>

      {/* Download Sample Info */}
      {!file && (
        <div style={{
          maxWidth: '1200px',
          margin: '20px auto 0',
          padding: '16px',
          background: '#2a2a2a',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '8px', color: 'white' }}>
            📥 Need sample files?
          </div>
          <a
            href="https://huggingface.co/cakewalk/splat-data/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline'
            }}
          >
            Download sample .ply files here →
          </a>
        </div>
      )}
    </div>
  );
};

export default Easy3DViewerDemo;
