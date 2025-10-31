import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { RotateCw, ZoomIn, ZoomOut, Home, Maximize2, Grid3x3 } from 'lucide-react';

interface EnhancedGaussianViewerProps {
  modelFile?: File | null;
  modelPath?: string;
  width?: string | number;
  height?: string | number;
}

const EnhancedGaussianViewer: React.FC<EnhancedGaussianViewerProps> = ({
  modelFile,
  modelPath,
  width = '100%',
  height = '600px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

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

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }
  };

  const initViewer = async () => {
    if (!mountRef.current) return;
    if (!modelFile && !modelPath) return;

    cleanup();

    const container = mountRef.current;
    const renderWidth = container.clientWidth || 800;
    const renderHeight = container.clientHeight || 600;

    try {
      setIsLoading(true);
      setError(null);

      // Create camera with better initial position
      const camera = new THREE.PerspectiveCamera(75, renderWidth / renderHeight, 0.1, 500);
      camera.position.set(0, 1.5, 5);
      camera.up.set(0, 1, 0);

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
      });
      renderer.setSize(renderWidth, renderHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Setup OrbitControls for smooth rotation
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 0.5;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI;
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // Check SharedArrayBuffer support
      const supportsSharedArrayBuffer =
        typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

      console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer);

      // Create viewer with optimized settings
      const viewer = new GaussianSplats3D.Viewer({
        selfDrivenMode: false,
        renderer: renderer,
        camera: camera,
        useBuiltInControls: false, // We use OrbitControls
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: supportsSharedArrayBuffer,
        enableSIMDInSort: supportsSharedArrayBuffer,
        sharedMemoryForWorkers: supportsSharedArrayBuffer,
        integerBasedSort: supportsSharedArrayBuffer,
        halfPrecisionCovariancesOnGPU: true,
        dynamicScene: false,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.OnChange,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
        antialiased: true,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.None,
        sphericalHarmonicsDegree: 2,
        enableOptionalEffects: true,
        inMemoryCompressionLevel: 1,
        freeIntermediateSplatData: true
      });

      viewerRef.current = viewer;

      // Load splat scene
      let sceneUrl: string;
      let sceneFormat = GaussianSplats3D.SceneFormat.Ply;

      if (modelFile) {
        sceneUrl = URL.createObjectURL(modelFile);
        const fileName = modelFile.name.toLowerCase();
        if (fileName.endsWith('.ksplat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.KSplat;
        } else if (fileName.endsWith('.splat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Splat;
        }
      } else if (modelPath) {
        sceneUrl = modelPath;
        const pathLower = modelPath.toLowerCase();
        if (pathLower.endsWith('.ksplat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.KSplat;
        } else if (pathLower.endsWith('.splat')) {
          sceneFormat = GaussianSplats3D.SceneFormat.Splat;
        }
      } else {
        throw new Error('No model file or path provided');
      }

      console.log('Loading scene, format:', sceneFormat);

      await viewer.addSplatScene(sceneUrl, {
        format: sceneFormat,
        progressiveLoad: true,
        showLoadingUI: false,
        splatAlphaRemovalThreshold: 5
      });

      if (modelFile) {
        URL.revokeObjectURL(sceneUrl);
      }

      // Animation loop with OrbitControls
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        if (controlsRef.current) {
          controlsRef.current.update();
        }

        if (viewerRef.current) {
          viewerRef.current.update();
          viewerRef.current.render();
        }
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

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (controlsRef.current) {
      const distance = controlsRef.current.object.position.distanceTo(controlsRef.current.target);
      const newDistance = distance * 0.8;
      const direction = controlsRef.current.object.position.clone()
        .sub(controlsRef.current.target)
        .normalize()
        .multiplyScalar(newDistance);
      controlsRef.current.object.position.copy(controlsRef.current.target).add(direction);
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      const distance = controlsRef.current.object.position.distanceTo(controlsRef.current.target);
      const newDistance = distance * 1.25;
      const direction = controlsRef.current.object.position.clone()
        .sub(controlsRef.current.target)
        .normalize()
        .multiplyScalar(newDistance);
      controlsRef.current.object.position.copy(controlsRef.current.target).add(direction);
    }
  };

  useEffect(() => {
    if (modelFile || modelPath) {
      initViewer();
    }

    return () => {
      cleanup();
    };
  }, [modelFile, modelPath]);

  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !viewerRef.current) return;

      const renderWidth = mountRef.current.clientWidth;
      const renderHeight = mountRef.current.clientHeight;

      if (viewerRef.current.renderer) {
        viewerRef.current.renderer.setSize(renderWidth, renderHeight);
      }

      if (viewerRef.current.camera) {
        viewerRef.current.camera.aspect = renderWidth / renderHeight;
        viewerRef.current.camera.updateProjectionMatrix();
      }
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
          background: '#000',
          touchAction: 'none'
        }}
      />

      {/* Enhanced Controls */}
      {showControls && !isLoading && !error && (
        <>
          {/* Control Buttons */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10
          }}>
            <button
              onClick={zoomIn}
              style={controlButtonStyle}
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={zoomOut}
              style={controlButtonStyle}
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={resetCamera}
              style={controlButtonStyle}
              title="Reset Camera"
            >
              <Home size={20} />
            </button>
          </div>

          {/* Instructions Overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            maxWidth: '250px',
            zIndex: 10
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎮 Controls</div>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <div>• <strong>Drag</strong>: Rotate view</div>
              <div>• <strong>Scroll/Pinch</strong>: Zoom</div>
              <div>• <strong>Right-click drag</strong>: Pan</div>
              <div style={{ marginTop: '6px', opacity: 0.7 }}>
                Mobile: 1 finger rotate, 2 finger zoom/pan
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading Overlay */}
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
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          zIndex: 20
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', fontSize: '18px' }}>Loading Gaussian Splat...</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Initializing controls
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
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
          background: 'rgba(139,0,0,0.9)',
          color: 'white',
          padding: '20px',
          zIndex: 20
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>❌ Error</div>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>
            <button
              onClick={initViewer}
              style={{
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

const controlButtonStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(0,0,0,0.8)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  backdropFilter: 'blur(10px)'
};

export default EnhancedGaussianViewer;
