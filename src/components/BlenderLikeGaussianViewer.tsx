import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Home,
  Maximize2,
  Target,
  Grid3x3,
  Eye,
  Settings
} from 'lucide-react';

interface BlenderLikeGaussianViewerProps {
  modelFile?: File | null;
  modelPath?: string;
  width?: string | number;
  height?: string | number;
}

const BlenderLikeGaussianViewer: React.FC<BlenderLikeGaussianViewerProps> = ({
  modelFile,
  modelPath,
  width = '100%',
  height = '600px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);

  // Camera control state
  const [cameraState, setCameraState] = useState({
    distance: 5,
    azimuth: 0, // horizontal rotation
    elevation: 30, // vertical rotation
    target: new THREE.Vector3(0, 0, 0),
    fov: 75
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'orbit' | 'pan' | 'zoom'>('orbit');
  const [showGrid, setShowGrid] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Mouse/Touch interaction state
  const interactionState = useRef({
    isInteracting: false,
    lastX: 0,
    lastY: 0,
    lastDistance: 0
  });

  // Initialize scene
  const initScene = () => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      cameraState.fov,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    updateCameraPosition(camera);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Grid helper
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
      gridHelper.name = 'gridHelper';
      scene.add(gridHelper);
    }

    // Axes helper (like Blender)
    const axesHelper = new THREE.AxesHelper(1);
    axesHelper.name = 'axesHelper';
    scene.add(axesHelper);

    console.log('Scene initialized');
  };

  // Update camera position based on spherical coordinates
  const updateCameraPosition = (camera: THREE.PerspectiveCamera) => {
    const { distance, azimuth, elevation, target } = cameraState;

    // Convert spherical to cartesian coordinates
    const theta = (azimuth * Math.PI) / 180;
    const phi = ((90 - elevation) * Math.PI) / 180;

    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.cos(phi);
    const z = distance * Math.sin(phi) * Math.sin(theta);

    camera.position.set(
      target.x + x,
      target.y + y,
      target.z + z
    );
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  };

  // Load Gaussian Splat
  const loadGaussianSplat = async () => {
    if (!modelFile && !modelPath) return;
    if (!mountRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const container = mountRef.current;

      // Check SharedArrayBuffer support
      const supportsSharedArrayBuffer =
        typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

      console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer);

      // Create viewer with enhanced controls
      const viewer = new GaussianSplats3D.Viewer({
        rootElement: container,
        selfDrivenMode: false,
        renderer: rendererRef.current || undefined,
        camera: cameraRef.current || undefined,
        useBuiltInControls: false, // We use custom controls
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

      await viewer.init();
      viewerRef.current = viewer;

      // Load scene
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

      await viewer.addSplatScene(sceneUrl, {
        format: sceneFormat,
        progressiveLoad: true,
        showLoadingUI: false,
        splatAlphaRemovalThreshold: 5
      });

      if (modelFile) {
        URL.revokeObjectURL(sceneUrl);
      }

      // Start animation loop
      const animate = () => {
        if (viewerRef.current && cameraRef.current) {
          updateCameraPosition(cameraRef.current);
          viewer.update();
          viewer.render();
        }
        requestAnimationFrame(animate);
      };
      animate();

      setModelLoaded(true);
      setIsLoading(false);
      console.log('Gaussian Splat loaded successfully');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMsg);
      console.error('Load error:', err);
      setIsLoading(false);
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    interactionState.current.isInteracting = true;
    interactionState.current.lastX = e.clientX;
    interactionState.current.lastY = e.clientY;
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactionState.current.isInteracting) return;

    const deltaX = e.clientX - interactionState.current.lastX;
    const deltaY = e.clientY - interactionState.current.lastY;

    if (controlMode === 'orbit') {
      // Orbit rotation (like Blender middle mouse)
      setCameraState(prev => ({
        ...prev,
        azimuth: (prev.azimuth - deltaX * 0.5) % 360,
        elevation: Math.max(-89, Math.min(89, prev.elevation + deltaY * 0.5))
      }));
    } else if (controlMode === 'pan') {
      // Pan (like Blender Shift + middle mouse)
      const panSpeed = 0.01;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();

      if (cameraRef.current) {
        cameraRef.current.getWorldDirection(right);
        right.cross(cameraRef.current.up).normalize();
        up.copy(cameraRef.current.up).normalize();

        const panX = right.multiplyScalar(-deltaX * panSpeed);
        const panY = up.multiplyScalar(deltaY * panSpeed);

        setCameraState(prev => ({
          ...prev,
          target: new THREE.Vector3(
            prev.target.x + panX.x + panY.x,
            prev.target.y + panX.y + panY.y,
            prev.target.z + panX.z + panY.z
          )
        }));
      }
    }

    interactionState.current.lastX = e.clientX;
    interactionState.current.lastY = e.clientY;
  };

  // Handle mouse up
  const handleMouseUp = () => {
    interactionState.current.isInteracting = false;
  };

  // Handle wheel (zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

    setCameraState(prev => ({
      ...prev,
      distance: Math.max(0.5, Math.min(50, prev.distance * delta))
    }));
  };

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      interactionState.current.isInteracting = true;
      interactionState.current.lastX = e.touches[0].clientX;
      interactionState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      interactionState.current.lastDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && interactionState.current.isInteracting) {
      const deltaX = e.touches[0].clientX - interactionState.current.lastX;
      const deltaY = e.touches[0].clientY - interactionState.current.lastY;

      if (controlMode === 'orbit') {
        setCameraState(prev => ({
          ...prev,
          azimuth: (prev.azimuth - deltaX * 0.5) % 360,
          elevation: Math.max(-89, Math.min(89, prev.elevation + deltaY * 0.5))
        }));
      }

      interactionState.current.lastX = e.touches[0].clientX;
      interactionState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (interactionState.current.lastDistance > 0) {
        const delta = distance / interactionState.current.lastDistance;
        setCameraState(prev => ({
          ...prev,
          distance: Math.max(0.5, Math.min(50, prev.distance / delta))
        }));
      }

      interactionState.current.lastDistance = distance;
    }
  };

  const handleTouchEnd = () => {
    interactionState.current.isInteracting = false;
    interactionState.current.lastDistance = 0;
  };

  // Control functions
  const resetCamera = () => {
    setCameraState({
      distance: 5,
      azimuth: 0,
      elevation: 30,
      target: new THREE.Vector3(0, 0, 0),
      fov: 75
    });
  };

  const zoomIn = () => {
    setCameraState(prev => ({
      ...prev,
      distance: Math.max(0.5, prev.distance * 0.8)
    }));
  };

  const zoomOut = () => {
    setCameraState(prev => ({
      ...prev,
      distance: Math.min(50, prev.distance * 1.2)
    }));
  };

  const focusOnCenter = () => {
    setCameraState(prev => ({
      ...prev,
      target: new THREE.Vector3(0, 0, 0)
    }));
  };

  const setViewAngle = (angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
    const angles: Record<typeof angle, { azimuth: number; elevation: number }> = {
      front: { azimuth: 0, elevation: 30 },
      back: { azimuth: 180, elevation: 30 },
      left: { azimuth: -90, elevation: 30 },
      right: { azimuth: 90, elevation: 30 },
      top: { azimuth: 0, elevation: 89 },
      bottom: { azimuth: 0, elevation: -89 }
    };

    setCameraState(prev => ({
      ...prev,
      ...angles[angle]
    }));
  };

  // Initialize
  useEffect(() => {
    initScene();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (err) {
          console.warn('Error disposing viewer:', err);
        }
      }
    };
  }, []);

  // Load model when file/path changes
  useEffect(() => {
    if (modelFile || modelPath) {
      loadGaussianSplat();
    }
  }, [modelFile, modelPath]);

  // Update camera when state changes
  useEffect(() => {
    if (cameraRef.current) {
      updateCameraPosition(cameraRef.current);
    }
  }, [cameraState]);

  return (
    <div style={{ width, height, position: 'relative' }}>
      {/* 3D Canvas */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#1a1a1a',
          cursor: controlMode === 'orbit' ? 'grab' : controlMode === 'pan' ? 'move' : 'zoom-in'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Control Mode Selector */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={() => setControlMode('orbit')}
          style={{
            padding: '8px 12px',
            background: controlMode === 'orbit' ? '#3b82f6' : 'rgba(0,0,0,0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}
          title="Orbit (Rotate)"
        >
          <RotateCw size={16} />
          <span>Orbit</span>
        </button>
        <button
          onClick={() => setControlMode('pan')}
          style={{
            padding: '8px 12px',
            background: controlMode === 'pan' ? '#3b82f6' : 'rgba(0,0,0,0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}
          title="Pan (Move)"
        >
          <Move size={16} />
          <span>Pan</span>
        </button>
      </div>

      {/* View Angle Shortcuts (Blender Numpad style) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        zIndex: 10
      }}>
        <button onClick={() => setViewAngle('top')} style={viewButtonStyle} title="Top View (7)">T</button>
        <button onClick={() => setViewAngle('front')} style={viewButtonStyle} title="Front View (1)">F</button>
        <button onClick={() => setViewAngle('right')} style={viewButtonStyle} title="Right View (3)">R</button>
        <button onClick={() => setViewAngle('bottom')} style={viewButtonStyle} title="Bottom View">B</button>
        <button onClick={() => setViewAngle('back')} style={viewButtonStyle} title="Back View">Bk</button>
        <button onClick={() => setViewAngle('left')} style={viewButtonStyle} title="Left View">L</button>
      </div>

      {/* Zoom Controls */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10
      }}>
        <button onClick={zoomIn} style={iconButtonStyle} title="Zoom In (Scroll Up)">
          <ZoomIn size={20} />
        </button>
        <button onClick={zoomOut} style={iconButtonStyle} title="Zoom Out (Scroll Down)">
          <ZoomOut size={20} />
        </button>
        <button onClick={focusOnCenter} style={iconButtonStyle} title="Focus Center (.)">
          <Target size={20} />
        </button>
        <button onClick={resetCamera} style={iconButtonStyle} title="Reset View (Home)">
          <Home size={20} />
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            ...iconButtonStyle,
            background: showGrid ? '#3b82f6' : 'rgba(0,0,0,0.8)'
          }}
          title="Toggle Grid (G)"
        >
          <Grid3x3 size={20} />
        </button>
      </div>

      {/* Info Display */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 10
      }}>
        <div>Distance: {cameraState.distance.toFixed(2)}</div>
        <div>Azimuth: {cameraState.azimuth.toFixed(1)}°</div>
        <div>Elevation: {cameraState.elevation.toFixed(1)}°</div>
        <div>Mode: {controlMode.toUpperCase()}</div>
      </div>

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
              Setting up Blender-like controls
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
            <div style={{ fontSize: '14px' }}>{error}</div>
            <button
              onClick={loadGaussianSplat}
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

      {/* Help Tooltip */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '11px',
        maxWidth: '200px',
        zIndex: 10
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>🎮 Controls</div>
        <div>• Orbit: Drag to rotate</div>
        <div>• Pan: Shift + Drag</div>
        <div>• Zoom: Scroll wheel</div>
        <div>• Reset: Home button</div>
        <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.7 }}>
          Blender-inspired controls
        </div>
      </div>
    </div>
  );
};

// Button styles
const iconButtonStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(0,0,0,0.8)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

const viewButtonStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(0,0,0,0.8)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '500',
  minWidth: '30px'
};

export default BlenderLikeGaussianViewer;
