import React, { useRef, useEffect, useState } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

interface SimpleGaussianViewerProps {
  modelFile?: File | null;
  modelPath?: string;
  width?: string | number;
  height?: string | number;
}

const SimpleGaussianViewer: React.FC<SimpleGaussianViewerProps> = ({
  modelFile,
  modelPath,
  width = '100%',
  height = '600px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Dispose viewer
    if (viewerRef.current) {
      try {
        if (typeof viewerRef.current.dispose === 'function') {
          viewerRef.current.dispose();
        }
      } catch (err) {
        console.warn('Error disposing viewer:', err);
      }
      viewerRef.current = null;
    }

    // Dispose renderer
    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing renderer:', err);
      }
      rendererRef.current = null;
    }

    // Clear mount element
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }
  };

  const initViewer = async () => {
    if (!mountRef.current) return;

    cleanup();

    const container = mountRef.current;
    const renderWidth = container.clientWidth || 800;
    const renderHeight = container.clientHeight || 600;

    try {
      setIsLoading(true);
      setError(null);

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: false
      });
      renderer.setSize(renderWidth, renderHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create camera
      const camera = new THREE.PerspectiveCamera(65, renderWidth / renderHeight, 0.1, 500);
      camera.position.copy(new THREE.Vector3().fromArray([-1, -4, 6]));
      camera.up = new THREE.Vector3().fromArray([0, -1, -0.6]).normalize();
      camera.lookAt(new THREE.Vector3().fromArray([0, 4, 0]));
      cameraRef.current = camera;

      // Check for SharedArrayBuffer support
      const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

      console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer);
      console.log('Cross-origin isolated:', self.crossOriginIsolated);

      // Create viewer with advanced configuration
      const viewer = new GaussianSplats3D.Viewer({
        selfDrivenMode: false,
        renderer: renderer,
        camera: camera,
        useBuiltInControls: false,
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: supportsSharedArrayBuffer,
        enableSIMDInSort: supportsSharedArrayBuffer,
        sharedMemoryForWorkers: supportsSharedArrayBuffer,
        integerBasedSort: supportsSharedArrayBuffer,
        halfPrecisionCovariancesOnGPU: true,
        dynamicScene: false,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.OnChange,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        antialiased: false,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.None,
        sphericalHarmonicsDegree: 0,
        enableOptionalEffects: false,
        inMemoryCompressionLevel: 2,
        freeIntermediateSplatData: false
      });

      viewerRef.current = viewer;

      // Load splat scene
      let sceneUrl: string;
      let sceneFormat = GaussianSplats3D.SceneFormat.Ply; // Default

      if (modelFile) {
        sceneUrl = URL.createObjectURL(modelFile);

        // Detect format from filename
        const fileName = modelFile.name.toLowerCase();
        if (fileName.endsWith('.ksplat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.KSplat;
        } else if (fileName.endsWith('.splat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Splat;
        } else if (fileName.endsWith('.ply')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Ply;
        }
      } else if (modelPath) {
        sceneUrl = modelPath;

        // Detect format from path
        const pathLower = modelPath.toLowerCase();
        if (pathLower.endsWith('.ksplat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.KSplat;
        } else if (pathLower.endsWith('.splat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Splat;
        } else if (pathLower.endsWith('.ply')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Ply;
        }
      } else {
        throw new Error('No model file or path provided');
      }

      console.log('Loading scene, format:', sceneFormat);

      await viewer.addSplatScene(sceneUrl, {
        format: sceneFormat, // Explicitly set format
        progressiveLoad: true,
        showLoadingUI: false,
        splatAlphaRemovalThreshold: 5
      });

      // Cleanup blob URL if we created one
      if (modelFile) {
        URL.revokeObjectURL(sceneUrl);
      }

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        viewer.update();
        viewer.render();
      };
      animate();

      setIsLoading(false);
      console.log('Gaussian Splat viewer initialized successfully');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize viewer';
      setError(errorMsg);
      console.error('Viewer initialization error:', err);
      setIsLoading(false);
    }
  };

  // Initialize viewer when component mounts or model changes
  useEffect(() => {
    if (modelFile || modelPath) {
      initViewer();
    }

    return () => {
      cleanup();
    };
  }, [modelFile, modelPath]);

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
            <div>Loading Gaussian Splat...</div>
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

export default SimpleGaussianViewer;
