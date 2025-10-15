import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FileIcon, Info } from 'lucide-react';

interface DebugViewerProps {
  modelFile?: File | null;
}

const DebugViewer: React.FC<DebugViewerProps> = ({ modelFile }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (!modelFile || !mountRef.current) return;

    const analyzeFile = async () => {
      try {
        const text = await modelFile.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let vertexCount = 0;
        let headerEnd = 0;
        let hasColors = false;
        let properties = [];

        // Parse header
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          if (line.includes('element vertex')) {
            vertexCount = parseInt(line.split(/\s+/)[2]);
          }
          if (line.startsWith('property')) {
            properties.push(line);
            if (line.includes('red') || line.includes('green') || line.includes('blue')) {
              hasColors = true;
            }
          }
          if (line === 'end_header') {
            headerEnd = i + 1;
            break;
          }
        }

        // Sample some vertices
        const sampleVertices = [];
        for (let i = headerEnd; i < Math.min(headerEnd + 10, lines.length); i++) {
          if (lines[i]) {
            const values = lines[i].split(/\s+/);
            sampleVertices.push(values);
          }
        }

        // Compute actual bounds from all vertices
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (let i = headerEnd; i < Math.min(headerEnd + 1000, lines.length); i++) {
          const values = lines[i].split(/\s+/).map(Number);
          if (values.length >= 3) {
            const x = values[0], y = values[1], z = values[2];
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
              minZ = Math.min(minZ, z);
              maxZ = Math.max(maxZ, z);
            }
          }
        }

        setDebugInfo({
          filename: modelFile.name,
          fileSize: modelFile.size,
          totalLines: lines.length,
          headerEnd,
          vertexCount,
          hasColors,
          properties,
          sampleVertices,
          bounds: {
            x: { min: minX, max: maxX, range: maxX - minX },
            y: { min: minY, max: maxY, range: maxY - minY },
            z: { min: minZ, max: maxZ, range: maxZ - minZ }
          },
          center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2
          }
        });

      } catch (error) {
        console.error('Debug analysis failed:', error);
      }
    };

    analyzeFile();
  }, [modelFile]);

  if (!modelFile) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-white mb-2">No file selected</h3>
        <p className="text-gray-400">Upload a PLY file to see debug information</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white space-y-4">
      <h3 className="text-lg font-bold flex items-center">
        <Info className="mr-2" size={20} />
        File Debug Information
      </h3>

      {debugInfo && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-400">File Info</h4>
              <div className="text-sm space-y-1">
                <div>Name: {debugInfo.filename}</div>
                <div>Size: {(debugInfo.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                <div>Total Lines: {debugInfo.totalLines}</div>
                <div>Header End: {debugInfo.headerEnd}</div>
                <div>Vertex Count: {debugInfo.vertexCount}</div>
                <div>Has Colors: {debugInfo.hasColors ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-green-400">Bounds Analysis</h4>
              <div className="text-sm space-y-1">
                <div>X: {debugInfo.bounds.x.min.toFixed(2)} to {debugInfo.bounds.x.max.toFixed(2)} (range: {debugInfo.bounds.x.range.toFixed(2)})</div>
                <div>Y: {debugInfo.bounds.y.min.toFixed(2)} to {debugInfo.bounds.y.max.toFixed(2)} (range: {debugInfo.bounds.y.range.toFixed(2)})</div>
                <div>Z: {debugInfo.bounds.z.min.toFixed(2)} to {debugInfo.bounds.z.max.toFixed(2)} (range: {debugInfo.bounds.z.range.toFixed(2)})</div>
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div>Center: ({debugInfo.center.x.toFixed(2)}, {debugInfo.center.y.toFixed(2)}, {debugInfo.center.z.toFixed(2)})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="font-semibold text-yellow-400">Properties</h4>
            <div className="text-xs bg-gray-900 p-2 rounded">
              {debugInfo.properties.map((prop: string, idx: number) => (
                <div key={idx}>{prop}</div>
              ))}
            </div>
          </div>

          {/* Sample Vertices */}
          <div>
            <h4 className="font-semibold text-purple-400">Sample Vertices (first 10)</h4>
            <div className="text-xs bg-gray-900 p-2 rounded max-h-40 overflow-y-auto">
              {debugInfo.sampleVertices.map((vertex: string[], idx: number) => (
                <div key={idx} className="font-mono">
                  {vertex.slice(0, 6).join(' ')} {vertex.length > 6 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-900/30 p-3 rounded">
            <h4 className="font-semibold text-blue-400">Analysis</h4>
            <div className="text-sm space-y-1">
              <div>• Point density: {(debugInfo.vertexCount / 1000).toFixed(1)}K points</div>
              <div>• Largest dimension: {Math.max(debugInfo.bounds.x.range, debugInfo.bounds.y.range, debugInfo.bounds.z.range).toFixed(2)}</div>
              <div>• Recommended point size: {debugInfo.vertexCount > 100000 ? '0.005' : debugInfo.vertexCount > 10000 ? '0.01' : '0.02'}</div>
              <div>• Model type: {debugInfo.vertexCount > 50000 ? 'Dense point cloud' : 'Sparse point cloud'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugViewer;