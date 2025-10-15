import React, { useRef, useEffect, useState } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

interface Easy3DViewerProps {
  file?: File | null;
  width?: string | number;
  height?: string | number;
}

const Easy3DViewer: React.FC<Easy3DViewerProps> = ({
  file,
  width = '100%',
  height = '600px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStage, setLoadingStage] = useState('');
  const [showDebugButtons, setShowDebugButtons] = useState(true);

  useEffect(() => {
    if (!file || !containerRef.current) return;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError('');
        setLoadingStage('Preparing...');

        // Cleanup viewer lama
        if (viewerRef.current) {
          viewerRef.current.dispose?.();
          viewerRef.current = null;
        }

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        setLoadingStage('Detecting format...');

        // Create blob URL
        const url = URL.createObjectURL(file);

        // Detect file format from filename
        const fileName = file.name.toLowerCase();
        let sceneFormat = GaussianSplats3D.SceneFormat.Ply; // Default

        if (fileName.endsWith('.ksplat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.KSplat;
        } else if (fileName.endsWith('.splat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Splat;
        } else if (fileName.endsWith('.ply')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Ply;
        }

        console.log('Loading file:', file.name, 'Format:', sceneFormat);
        console.log('File size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');

        setLoadingStage('Checking GPU support...');

        // Cek SharedArrayBuffer support
        const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;
        console.log('GPU Acceleration available:', hasSharedArrayBuffer);

        setLoadingStage('Creating viewer...');

        // Get container size for optimal settings
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        console.log('Container size:', containerWidth, 'x', containerHeight);

        // Calculate aspect ratio for optimal FOV
        const aspectRatio = containerWidth / containerHeight;

        // Adjust FOV based on aspect ratio
        // 1023x674 (1.52) needs balanced FOV
        let fov = 60; // Default
        if (aspectRatio > 1.7) {
          fov = 65; // Wider for 16:9
        } else if (aspectRatio > 1.4) {
          fov = 60; // Balanced for 1023x674
        } else {
          fov = 55; // Narrower for 4:3
        }

        console.log('Using FOV:', fov, 'for aspect ratio:', aspectRatio.toFixed(2));

        // Create viewer dengan konfigurasi optimal
        const viewer = new GaussianSplats3D.Viewer({
          rootElement: containerRef.current,
          // Camera settings - optimized for current screen
          initialCameraPosition: [3, 1.5, 3], // Balanced position
          initialCameraLookAt: [0, 0, 0],
          initialCameraUp: [0, 1, 0],
          cameraFov: fov, // Adaptive FOV
          // Basic settings
          selfDrivenMode: true,
          useBuiltInControls: true,
          // Performance - auto detect
          gpuAcceleratedSort: hasSharedArrayBuffer,
          sharedMemoryForWorkers: hasSharedArrayBuffer,
          // Rendering optimized for 1080p
          renderMode: GaussianSplats3D.RenderMode.Always,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          // Quality settings
          sphericalHarmonicsDegree: 0,
          antialiased: false,
          logLevel: GaussianSplats3D.LogLevel.Info,
          // Device pixel ratio for sharp rendering on 1080p
          devicePixelRatio: Math.min(window.devicePixelRatio, 2), // Max 2x for performance
        });

        setLoadingStage('Initializing viewer...');
        console.log('Initializing viewer...');
        await viewer.init();
        viewerRef.current = viewer;
        console.log('Viewer initialized');

        setLoadingStage('Loading 3D model...');
        // Load scene dengan format yang sudah didetect
        console.log('Loading scene...');
        await viewer.addSplatScene(url, {
          format: sceneFormat, // Explicitly set format!
          progressiveLoad: true,
          showLoadingUI: false,
          splatAlphaRemovalThreshold: 5,
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        });

        setLoadingStage('Scene loaded! Positioning camera...');
        console.log('Scene loaded successfully');

        // Cleanup URL
        URL.revokeObjectURL(url);

        // Get scene info
        if (viewer.splatMesh) {
          const splatCount = viewer.splatMesh.getSplatCount?.() || 0;
          console.log('Total splats:', splatCount);
        }

        setLoadingStage('Adjusting camera...');

        // Wait for scene to be fully loaded and get bounds
        setTimeout(() => {
          console.log('Auto-focusing camera...');

          if (viewer.splatMesh) {
            try {
              // Get scene center and size
              const mesh = viewer.splatMesh;
              console.log('SplatMesh:', mesh);
              console.log('SplatMesh visible:', mesh.visible);
              console.log('SplatMesh position:', mesh.position);
              console.log('SplatMesh scale:', mesh.scale);

              // Try to compute bounding sphere
              let center = new THREE.Vector3(0, 0, 0);
              let radius = 5;

              // Method 1: Try to get from geometry
              if (mesh.geometry) {
                mesh.geometry.computeBoundingSphere();
                if (mesh.geometry.boundingSphere) {
                  center = mesh.geometry.boundingSphere.center.clone();
                  radius = mesh.geometry.boundingSphere.radius;
                  console.log('Bounding sphere from geometry:', { center, radius });
                }
              }

              // Method 2: Try to get from splatTree
              if (!radius || radius === 0) {
                if (viewer.getSplatScenes && viewer.getSplatScenes().length > 0) {
                  const scene = viewer.getSplatScenes()[0];
                  if (scene.splatTree) {
                    const bounds = scene.splatTree.rootNode?.boundingBox;
                    if (bounds) {
                      center = bounds.getCenter(new THREE.Vector3());
                      const size = bounds.getSize(new THREE.Vector3());
                      radius = Math.max(size.x, size.y, size.z) / 2;
                      console.log('Bounds from splatTree:', { center, radius, size });
                    }
                  }
                }
              }

              // Fallback: use default if still no bounds
              if (!radius || radius === 0 || !isFinite(radius)) {
                radius = 5;
                console.warn('Using default radius:', radius);
              }

              // Position camera based on scene size
              // Adjust distance based on screen aspect ratio
              const containerWidth = containerRef.current?.clientWidth || 1023;
              const containerHeight = containerRef.current?.clientHeight || 674;
              const aspectRatio = containerWidth / containerHeight;

              console.log('Screen size:', containerWidth, 'x', containerHeight, 'Aspect:', aspectRatio.toFixed(2));

              // Calculate optimal distance based on aspect ratio and FOV
              // For 1023x674 (aspect ~1.52), use balanced distance
              let distanceMultiplier = 3.0; // Default

              if (aspectRatio > 1.7) {
                distanceMultiplier = 2.5; // Wide screen (16:9)
              } else if (aspectRatio > 1.4) {
                distanceMultiplier = 2.8; // Medium (1023x674)
              } else {
                distanceMultiplier = 3.2; // Narrow (4:3)
              }

              const distance = radius * distanceMultiplier;

              // Position camera at 45 degrees angle for best view
              const angle = Math.PI / 4; // 45 degrees
              const cameraPos = new THREE.Vector3(
                center.x + distance * Math.cos(angle),
                center.y + distance * 0.5, // 50% height for balanced view
                center.z + distance * Math.sin(angle)
              );

              console.log('Calculated camera position:', {
                containerSize: `${containerWidth}x${containerHeight}`,
                aspectRatio: aspectRatio.toFixed(2),
                center: center.toArray(),
                radius: radius.toFixed(2),
                distanceMultiplier,
                distance: distance.toFixed(2),
                cameraPos: cameraPos.toArray().map(v => v.toFixed(2))
              });

              if (viewer.camera) {
                viewer.camera.position.copy(cameraPos);
                viewer.camera.lookAt(center);
                viewer.camera.updateProjectionMatrix();
                console.log('Camera positioned at:', viewer.camera.position.toArray());
                console.log('Camera looking at:', center.toArray());
              }

              // Force render
              if (viewer.controls?.update) {
                viewer.controls.update();
              }

              // Make sure mesh is visible
              if (mesh.visible === false) {
                mesh.visible = true;
                console.log('Set mesh visible to true');
              }

            } catch (e) {
              console.error('Camera auto-focus failed:', e);

              // Ultimate fallback - try multiple positions
              console.log('Trying fallback camera positions...');
              const fallbackPositions = [
                [10, 5, 10],
                [50, 25, 50],
                [100, 50, 100],
                [0.1, 0.05, 0.1],
              ];

              fallbackPositions.forEach((pos, i) => {
                setTimeout(() => {
                  if (viewer.camera) {
                    viewer.camera.position.set(pos[0], pos[1], pos[2]);
                    viewer.camera.lookAt(0, 0, 0);
                    viewer.camera.updateProjectionMatrix();
                    console.log(`Fallback position ${i + 1}:`, pos);
                  }
                }, i * 1000);
              });
            }
          }
        }, 1500); // Give more time for scene to settle

        setLoading(false);
        console.log('✅ Load complete!');

      } catch (err) {
        console.error('Load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model');
        setLoading(false);
      }
    };

    loadModel();

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose?.();
        viewerRef.current = null;
      }
    };
  }, [file]);

  return (
    <div style={{ width, height, position: 'relative', background: '#000' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#000'
        }}
      />

      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(0,0,0,0.9)',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          minWidth: '300px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '16px',
            animation: 'spin 2s linear infinite'
          }}>⏳</div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            Loading 3D Model
          </div>
          <div style={{
            fontSize: '14px',
            color: '#60a5fa',
            marginBottom: '8px'
          }}>
            {loadingStage || 'Please wait...'}
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.6,
            marginTop: '12px',
            wordBreak: 'break-word'
          }}>
            {file?.name}
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.5,
            marginTop: '4px'
          }}>
            {file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(139,0,0,0.9)',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          <div style={{ marginBottom: '10px' }}>❌</div>
          <div style={{ marginBottom: '10px' }}>Error</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
      )}

      {!file && !loading && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <div>Upload file untuk melihat 3D model</div>
        </div>
      )}

      {/* Debug Camera Buttons */}
      {file && !loading && showDebugButtons && viewerRef.current && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000
        }}>
          <button
            onClick={() => {
              if (viewerRef.current?.camera) {
                viewerRef.current.camera.position.set(0.5, 0.25, 0.5);
                viewerRef.current.camera.lookAt(0, 0, 0);
                viewerRef.current.camera.updateProjectionMatrix();
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📍 Very Close
          </button>

          <button
            onClick={() => {
              if (viewerRef.current?.camera) {
                // Optimal for 1023x674
                const angle = Math.PI / 4;
                const dist = 4;
                viewerRef.current.camera.position.set(
                  dist * Math.cos(angle),
                  dist * 0.5,
                  dist * Math.sin(angle)
                );
                viewerRef.current.camera.lookAt(0, 0, 0);
                viewerRef.current.camera.updateProjectionMatrix();
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ✅ Default (Best)
          </button>

          <button
            onClick={() => {
              if (viewerRef.current?.camera) {
                viewerRef.current.camera.position.set(20, 10, 20);
                viewerRef.current.camera.lookAt(0, 0, 0);
                viewerRef.current.camera.updateProjectionMatrix();
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📍 Far
          </button>

          <button
            onClick={() => {
              if (viewerRef.current?.camera) {
                viewerRef.current.camera.position.set(100, 50, 100);
                viewerRef.current.camera.lookAt(0, 0, 0);
                viewerRef.current.camera.updateProjectionMatrix();
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📍 Very Far
          </button>

          <button
            onClick={() => {
              if (viewerRef.current?.camera) {
                viewerRef.current.camera.position.set(0, 50, 0);
                viewerRef.current.camera.lookAt(0, 0, 0);
                viewerRef.current.camera.updateProjectionMatrix();
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ⬆️ Top View
          </button>

          <button
            onClick={() => {
              // Force render and check
              const viewer = viewerRef.current;
              if (viewer) {
                // Try to force visibility
                if (viewer.splatMesh) {
                  viewer.splatMesh.visible = true;
                  viewer.splatMesh.frustumCulled = false; // Don't cull

                  // Force material update
                  if (viewer.splatMesh.material) {
                    viewer.splatMesh.material.needsUpdate = true;
                  }
                }

                // Force render
                if (viewer.renderer && viewer.camera && viewer.scene) {
                  viewer.renderer.render(viewer.scene, viewer.camera);
                }

                const info = {
                  hasMesh: !!viewer.splatMesh,
                  meshVisible: viewer.splatMesh?.visible,
                  splatCount: viewer.splatMesh?.getSplatCount?.(),
                  cameraPos: viewer.camera?.position.toArray(),
                  meshPos: viewer.splatMesh?.position,
                  meshScale: viewer.splatMesh?.scale,
                  frustumCulled: viewer.splatMesh?.frustumCulled,
                  hasRenderer: !!viewer.renderer,
                  hasScene: !!viewer.scene,
                };
                console.log('🔍 DEBUG INFO:', info);
                alert('Check console for full info. Forced render attempted.');
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            🔍 Show Info
          </button>

          <button
            onClick={() => setShowDebugButtons(false)}
            style={{
              padding: '8px 12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ❌ Hide
          </button>
        </div>
      )}
    </div>
  );
};

export default Easy3DViewer;
