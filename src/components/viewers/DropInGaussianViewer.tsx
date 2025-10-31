import React, { useRef, useEffect, useState } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

interface DropInGaussianViewerProps {
  scenes: Array<{
    path?: string;
    file?: File;
    splatAlphaRemovalThreshold?: number;
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    position?: [number, number, number];
  }>;
  width?: string | number;
  height?: string | number;
  gpuAcceleratedSort?: boolean;
}

const DropInGaussianViewer: React.FC<DropInGaussianViewerProps> = ({
  scenes,
  width = '100%',
  height = '600px',
  gpuAcceleratedSort = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const viewerRef = useRef<any>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (viewerRef.current) {
      try {
        // Remove viewer from scene
        if (threeSceneRef.current) {
          threeSceneRef.current.remove(viewerRef.current);
        }
        if (typeof viewerRef.current.dispose === 'function') {
          viewerRef.current.dispose();
        }
      } catch (err) {
        console.warn('Error disposing viewer:', err);
      }
      viewerRef.current = null;
    }

    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing renderer:', err);
      }
      rendererRef.current = null;
    }

    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }
  };

  const initViewer = async () => {
    if (!mountRef.current || scenes.length === 0) return;

    cleanup();

    const container = mountRef.current;
    const renderWidth = container.clientWidth || 800;
    const renderHeight = container.clientHeight || 600;

    try {
      setIsLoading(true);
      setError(null);

      // Create Three.js scene
      const threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x000000);
      threeSceneRef.current = threeScene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, renderWidth / renderHeight, 0.1, 1000);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(renderWidth, renderHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add some lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      threeScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      threeScene.add(directionalLight);

      // Check SharedArrayBuffer support
      const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

      console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer);
      console.log('Using GPU acceleration:', gpuAcceleratedSort && supportsSharedArrayBuffer);

      // Create DropInViewer
      const viewer = new GaussianSplats3D.DropInViewer({
        gpuAcceleratedSort: gpuAcceleratedSort && supportsSharedArrayBuffer,
        sharedMemoryForWorkers: supportsSharedArrayBuffer,
        enableSIMDInSort: supportsSharedArrayBuffer,
        selfDrivenMode: false
      });

      viewerRef.current = viewer;

      // Prepare scene configurations
      const sceneConfigs = await Promise.all(
        scenes.map(async (scene) => {
          let path: string;
          let format = GaussianSplats3D.SceneFormat.Ply; // Default

          if (scene.file) {
            path = URL.createObjectURL(scene.file);

            // Detect format from filename
            const fileName = scene.file.name.toLowerCase();
            if (fileName.endsWith('.ksplat')) {
              format = GaussianSplats3D.SceneFormat.KSplat;
            } else if (fileName.endsWith('.splat')) {
              format = GaussianSplats3D.SceneFormat.Splat;
            } else if (fileName.endsWith('.ply')) {
              format = GaussianSplats3D.SceneFormat.Ply;
            }
          } else if (scene.path) {
            path = scene.path;

            // Detect format from path
            const pathLower = scene.path.toLowerCase();
            if (pathLower.endsWith('.ksplat')) {
              format = GaussianSplats3D.SceneFormat.KSplat;
            } else if (pathLower.endsWith('.splat')) {
              format = GaussianSplats3D.SceneFormat.Splat;
            } else if (pathLower.endsWith('.ply')) {
              format = GaussianSplats3D.SceneFormat.Ply;
            }
          } else {
            throw new Error('Scene must have either path or file');
          }

          return {
            path,
            format, // Add format
            splatAlphaRemovalThreshold: scene.splatAlphaRemovalThreshold || 5,
            rotation: scene.rotation,
            scale: scene.scale,
            position: scene.position
          };
        })
      );

      // Add scenes to viewer
      await viewer.addSplatScenes(sceneConfigs);

      // Cleanup blob URLs
      sceneConfigs.forEach((config, index) => {
        if (scenes[index].file) {
          URL.revokeObjectURL(config.path);
        }
      });

      // Add viewer to Three.js scene
      threeScene.add(viewer);

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Update viewer
        if (viewer && typeof viewer.update === 'function') {
          viewer.update();
        }

        // Render scene
        renderer.render(threeScene, camera);
      };
      animate();

      setIsLoading(false);
      console.log('DropIn Gaussian Splat viewer initialized successfully');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize viewer';
      setError(errorMsg);
      console.error('Viewer initialization error:', err);
      setIsLoading(false);
    }
  };

  // Initialize viewer when scenes change
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      initViewer();
    }

    return () => {
      cleanup();
    };
  }, [scenes, gpuAcceleratedSort]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

      const renderWidth = mountRef.current.clientWidth;
      const renderHeight = mountRef.current.clientHeight;

      rendererRef.current.setSize(renderWidth, renderHeight);
      cameraRef.current.aspect = renderWidth / renderHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width, height, position: 'relative' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#000000'
        }}
      />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)',
          color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>Loading {scenes.length} Gaussian Splat Scene(s)...</div>
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              {typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
                ? '🚀 GPU Accelerated Mode'
                : '⚠️ Compatibility Mode (slower)'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(139,0,0,0.8)',
          color: 'white',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>❌ Error</div>
            <div style={{ fontSize: '14px' }}>{error}</div>
            <button
              onClick={initViewer}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropInGaussianViewer;
