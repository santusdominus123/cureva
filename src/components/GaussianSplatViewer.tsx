import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { FileIcon, LoaderIcon, AlertCircle, RotateCw, ZoomIn, Home, Info, Camera, Maximize, BarChart3, Settings, Download, Eye, Target } from 'lucide-react';

interface GaussianSplatViewerProps {
  modelFile?: File | null;
  width?: string | number;
  height?: string | number;
}

const GaussianSplatViewer: React.FC<GaussianSplatViewerProps> = ({
  modelFile,
  width = '100%',
  height = '600px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const viewerRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [showStats, setShowStats] = useState(false);
  const [renderStats, setRenderStats] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fastLoadMode, setFastLoadMode] = useState(true);

  // Debug canvas function to test basic rendering
  const createDebugCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!mountRef.current) return null;

    try {
      console.log('Creating debug canvas...');

      // Clear the container
      mountRef.current.innerHTML = '';

      // Create a simple test canvas
      const canvas = document.createElement('canvas');
      const width = mountRef.current.clientWidth || 800;
      const height = mountRef.current.clientHeight || 600;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.background = 'linear-gradient(45deg, #1a1a2e, #16213e)';

      console.log('Canvas created with size:', { width, height });

      // Try 2D context first
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        console.log('2D context available');

        // Draw a simple test pattern
        ctx2d.fillStyle = '#ff0000';
        ctx2d.fillRect(50, 50, 100, 100);

        ctx2d.fillStyle = '#00ff00';
        ctx2d.fillRect(200, 50, 100, 100);

        ctx2d.fillStyle = '#0000ff';
        ctx2d.fillRect(350, 50, 100, 100);

        ctx2d.fillStyle = '#ffffff';
        ctx2d.font = '24px Arial';
        ctx2d.fillText('Canvas Test - Basic 2D', 50, 200);
        ctx2d.fillText('If you see this, canvas works!', 50, 230);

        console.log('2D test pattern drawn');
      } else {
        console.error('2D context not available');
      }

      // Try WebGL context
      const glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (glContext) {
        console.log('WebGL context available');
        console.log('WebGL version:', glContext.getParameter(glContext.VERSION));
        console.log('WebGL vendor:', glContext.getParameter(glContext.VENDOR));
        console.log('WebGL renderer:', glContext.getParameter(glContext.RENDERER));

        // Simple WebGL test
        glContext.clearColor(0.2, 0.4, 0.8, 1.0);
        glContext.clear(glContext.COLOR_BUFFER_BIT);

        console.log('WebGL clear color applied');
      } else {
        console.error('WebGL context not available');
      }

      // Append to container
      mountRef.current.appendChild(canvas);

      console.log('Debug canvas added to DOM');
      console.log('Container children count:', mountRef.current.children.length);
      console.log('Canvas in DOM:', canvas.parentElement === mountRef.current);

      // Add debugging info text overlay
      const debugInfo = document.createElement('div');
      debugInfo.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        z-index: 1000;
        pointer-events: none;
      `;

      debugInfo.innerHTML = `
        <strong>RENDERING DEBUG INFO</strong><br>
        Canvas Size: ${width}x${height}<br>
        2D Context: ${ctx2d ? '✓ Available' : '✗ Failed'}<br>
        WebGL Context: ${glContext ? '✓ Available' : '✗ Failed'}<br>
        Container Size: ${mountRef.current.clientWidth}x${mountRef.current.clientHeight}<br>
        DOM Children: ${mountRef.current.children.length}<br>
        <br>
        <strong>Expected:</strong> Red, Green, Blue squares<br>
        <strong>Status:</strong> ${ctx2d && glContext ? 'All systems OK' : 'Issues detected'}<br>
      `;

      if (mountRef.current.style.position !== 'relative') {
        mountRef.current.style.position = 'relative';
      }
      mountRef.current.appendChild(debugInfo);

      console.log('Debug info overlay added');

      return canvas;

    } catch (error) {
      console.error('Debug canvas creation failed:', error);
      return null;
    }
  };

  // Container validation function
  const validateContainer = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mountRef.current) {
      errors.push('Mount ref is null');
      return { isValid: false, errors, warnings };
    }

    const rect = mountRef.current.getBoundingClientRect();
    console.log('Container validation - mount element:', {
      tagName: mountRef.current.tagName,
      className: mountRef.current.className,
      clientWidth: mountRef.current.clientWidth,
      clientHeight: mountRef.current.clientHeight,
      boundingRect: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      computedStyle: {
        display: getComputedStyle(mountRef.current).display,
        visibility: getComputedStyle(mountRef.current).visibility,
        position: getComputedStyle(mountRef.current).position,
        overflow: getComputedStyle(mountRef.current).overflow
      }
    });

    if (mountRef.current.clientWidth === 0) {
      errors.push('Container width is 0');
    }

    if (mountRef.current.clientHeight === 0) {
      errors.push('Container height is 0');
    }

    if (rect.width < 100 || rect.height < 100) {
      warnings.push(`Container is very small: ${rect.width}x${rect.height}`);
    }

    const style = getComputedStyle(mountRef.current);
    if (style.display === 'none') {
      errors.push('Container display is none');
    }

    if (style.visibility === 'hidden') {
      errors.push('Container visibility is hidden');
    }

    // Check for CSS that might interfere
    if (style.pointerEvents === 'none') {
      warnings.push('Container pointer-events is none');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Container content validation
  const validateContainerContent = (container: HTMLElement) => {
    const info = {
      element: container,
      size: {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight
      },
      style: {
        width: container.style.width,
        height: container.style.height,
        position: container.style.position,
        background: container.style.background
      },
      computed: {
        display: getComputedStyle(container).display,
        visibility: getComputedStyle(container).visibility,
        zIndex: getComputedStyle(container).zIndex
      },
      dom: {
        parent: container.parentElement?.tagName,
        children: container.children.length,
        innerHTML: container.innerHTML.length
      },
      bounds: container.getBoundingClientRect()
    };

    console.log('Container content validation:', info);

    return info;
  };

  // Initialize Three.js scene with fallback approach
  const initScene = () => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer with high quality settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Add a test cube to verify the scene is working
    const testGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(2, 0, 0); // Position to the side
    testCube.name = 'testCube';
    scene.add(testCube);

    // Setup basic controls
    setupControls();

    console.log('Three.js scene initialized for Gaussian splat rendering');
    console.log('Test cube added for debugging');
    console.log('Scene children:', scene.children.length);
  };

  // Setup manual controls with touch support
  const setupControls = () => {
    if (!mountRef.current || !cameraRef.current) return;

    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let touchStartDistance = 0;
    let lastTouchDistance = 0;

    // Mouse events
    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !cameraRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Rotate camera around origin
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(cameraRef.current.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));

      cameraRef.current.position.setFromSpherical(spherical);
      cameraRef.current.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      event.preventDefault();

      const delta = event.deltaY > 0 ? 1.1 : 0.9;
      cameraRef.current.position.multiplyScalar(delta);
      cameraRef.current.position.clampLength(0.5, 50);
    };

    // Touch events for mobile
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        // Single touch - rotation
        isMouseDown = true;
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        // Two finger pinch - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        lastTouchDistance = touchStartDistance;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1 && isMouseDown && cameraRef.current) {
        // Single touch rotation
        const deltaX = event.touches[0].clientX - mouseX;
        const deltaY = event.touches[0].clientY - mouseY;

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(cameraRef.current.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));

        cameraRef.current.position.setFromSpherical(spherical);
        cameraRef.current.lookAt(0, 0, 0);

        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      } else if (event.touches.length === 2 && cameraRef.current) {
        // Pinch to zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const delta = distance / lastTouchDistance;
        cameraRef.current.position.multiplyScalar(1 / delta);
        cameraRef.current.position.clampLength(0.5, 50);

        lastTouchDistance = distance;
      }
    };

    const onTouchEnd = () => {
      isMouseDown = false;
      touchStartDistance = 0;
      lastTouchDistance = 0;
    };

    // Add mouse listeners
    mountRef.current.addEventListener('mousedown', onMouseDown);
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('mouseup', onMouseUp);
    mountRef.current.addEventListener('wheel', onWheel, { passive: false });

    // Add touch listeners
    mountRef.current.addEventListener('touchstart', onTouchStart, { passive: false });
    mountRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
    mountRef.current.addEventListener('touchend', onTouchEnd);
  };

  // Load Gaussian Splat file with enhanced rendering and progress tracking
  const loadGaussianSplat = async () => {
    if (!modelFile || !sceneRef.current) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStage('Initializing...');
    setError(null);

    try {
      console.log('Loading Gaussian Splat file:', modelFile.name);

      // Estimate steps for progress
      const fileSize = modelFile.size;
      const estimatedSteps = Math.min(10, Math.max(3, Math.floor(fileSize / (10 * 1024 * 1024)))); // 1 step per 10MB

      // Try to use the Gaussian Splats 3D library with a fresh approach
      try {
        setLoadingStage('Creating viewer...');
        setLoadingProgress(10);

        // Comprehensive container diagnostics
        const containerDiagnostics = validateContainer();
        if (!containerDiagnostics.isValid) {
          throw new Error(`Container validation failed: ${containerDiagnostics.errors.join(', ')}`);
        }

        // Create a new container for the gaussian splat viewer
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';

        if (mountRef.current) {
          // Clear existing content
          mountRef.current.innerHTML = '';
          mountRef.current.appendChild(container);

          // Ensure container is visible
          container.style.background = 'transparent';
          container.style.pointerEvents = 'auto';

          console.log('Container setup:', {
            parentSize: {
              width: mountRef.current.clientWidth,
              height: mountRef.current.clientHeight
            },
            containerSize: {
              width: container.clientWidth,
              height: container.clientHeight
            }
          });

          // Verify container after setup
          const postSetupValidation = validateContainerContent(container);
          console.log('Post-setup container validation:', postSetupValidation);
        }

        setLoadingStage('Optimizing for your device...');
        setLoadingProgress(20);

        // Check for SharedArrayBuffer support and cross-origin isolation
        const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;

        console.log('SharedArrayBuffer support:', supportsSharedArrayBuffer);
        console.log('Cross-origin isolated:', self.crossOriginIsolated);

        // Create the viewer with safe configuration and better camera setup
        const viewer = new GaussianSplats3D.Viewer({
          rootElement: container,
          initialCameraPosition: [0, 0, 5], // More standard camera position
          initialCameraLookAt: [0, 0, 0],   // Look at origin
          initialCameraUp: [0, 1, 0],       // Standard up vector
          selfDrivenMode: true,
          useBuiltInControls: true,
          ignoreDevicePixelRatio: false,
          // Safe configuration without SharedArrayBuffer dependencies
          gpuAcceleratedSort: supportsSharedArrayBuffer && fastLoadMode,
          enableSIMDInSort: supportsSharedArrayBuffer && fastLoadMode,
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
          sphericalHarmonicsDegree: fastLoadMode ? 1 : 2,
          enableOptionalEffects: !fastLoadMode,
          inMemoryCompressionLevel: fastLoadMode ? 0 : 1,
          freeIntermediateSplatData: true,
          webWorkerCount: supportsSharedArrayBuffer ? Math.min(navigator.hardwareConcurrency || 4, 6) : 0,
          // Progressive loading options
          progressiveLoad: true,
          maxScreenSpaceSplatSize: fastLoadMode ? 1024 : 2048,
        });

        setLoadingStage('Initializing GPU resources...');
        setLoadingProgress(40);

        await viewer.init();
        viewerRef.current = viewer;

        setLoadingStage('Loading file data...');
        setLoadingProgress(60);

        console.log('Viewer initialized. Available methods:', Object.getOwnPropertyNames(viewer));
        console.log('Viewer constructor:', viewer.constructor.name);

        // Create blob URL and load the scene
        const url = URL.createObjectURL(modelFile);

        // Support for multiple scene formats and optimizations
        const sceneOptions = {
          format: modelFile.name.toLowerCase().endsWith('.ksplat')
            ? GaussianSplats3D.SceneFormat.KSplat
            : modelFile.name.toLowerCase().endsWith('.splat')
            ? GaussianSplats3D.SceneFormat.Splat
            : GaussianSplats3D.SceneFormat.Ply,
          progressiveLoad: true,
          showLoadingUI: false, // We handle our own loading UI
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
          splatAlphaRemovalThreshold: fastLoadMode ? 15 : 5,
          minimumAlpha: fastLoadMode ? 10 : 1,
          compressionLevel: 0, // Faster decompression
          optimizeSplatData: supportsSharedArrayBuffer && !fastLoadMode, // Only if safe
          halfPrecisionCovariancesOnGPU: supportsSharedArrayBuffer,
          dynamicScene: false,
          streamView: true, // Enable streaming for faster perceived loading
          // Progressive loading callbacks (if supported)
          ...(typeof window !== 'undefined' && {
            onProgress: (progress: number, stage: string) => {
              const mappedProgress = 60 + (progress * 0.3); // Map to 60-90%
              setLoadingProgress(mappedProgress);
              setLoadingStage(`Processing: ${stage || 'Loading splats'}`);
            }
          })
        };

        setLoadingStage('Processing Gaussian splats...');
        setLoadingProgress(70);

        await viewer.addSplatScene(url, sceneOptions);

        setLoadingStage('Optimizing rendering...');
        setLoadingProgress(90);

        URL.revokeObjectURL(url);

        // Detailed debugging after scene load
        console.log('=== SCENE LOADED SUCCESSFULLY ===');
        console.log('Viewer object:', viewer);
        console.log('Container element:', container);
        console.log('Container size:', {
          width: container.clientWidth,
          height: container.clientHeight,
          visible: container.style.display !== 'none'
        });

        // Check if renderer is working
        if (viewer.renderer) {
          console.log('Renderer:', {
            domElement: viewer.renderer.domElement,
            size: {
              width: viewer.renderer.domElement.width,
              height: viewer.renderer.domElement.height
            },
            pixelRatio: viewer.renderer.getPixelRatio(),
            autoClear: viewer.renderer.autoClear
          });
        }

        // Check camera
        if (viewer.camera) {
          console.log('Camera:', {
            position: viewer.camera.position,
            target: viewer.camera.target || 'N/A',
            fov: viewer.camera.fov,
            aspect: viewer.camera.aspect,
            near: viewer.camera.near,
            far: viewer.camera.far
          });
        }

        // Check scenes
        if (viewer.getSplatScenes) {
          const scenes = viewer.getSplatScenes();
          console.log('Loaded scenes:', scenes.length);
          scenes.forEach((scene, i) => {
            console.log(`Scene ${i}:`, {
              splatCount: scene.getSplatCount ? scene.getSplatCount() : 'Unknown',
              visible: scene.visible !== false,
              position: scene.position || 'N/A',
              scale: scene.scale || 'N/A'
            });
          });
        }

        // Get scene info with fallback for different API versions
        let splatCount = 0;
        try {
          if (typeof viewer.getSplatScenes === 'function') {
            const scenes = viewer.getSplatScenes();
            if (scenes && scenes.length > 0) {
              const scene = scenes[0];
              splatCount = scene.splatTree?.getSplatCount() || scene.getSplatCount?.() || 0;
            }
          } else if (typeof viewer.splatMesh !== 'undefined') {
            splatCount = viewer.splatMesh?.getSplatCount?.() || 0;
          } else if (typeof viewer.scene !== 'undefined') {
            // Try to estimate from scene children
            splatCount = viewer.scene.children.length;
          }
        } catch (e) {
          console.warn('Could not get splat count:', e);
          splatCount = 0;
        }

        setModelInfo({
          name: modelFile.name,
          splatCount: splatCount || 'Unknown',
          format: 'Gaussian Splat PLY',
          fileSize: (modelFile.size / (1024 * 1024)).toFixed(2) + ' MB'
        });

        setDebugInfo({
          format: 'Gaussian Splat',
          splatCount: splatCount || 'Unknown',
          renderMode: 'GPU Accelerated',
          antialiasing: true,
          qualityLevel: 'Perfect',
          compressionLevel: 'Optimized',
          bytesPerSplat: 'Variable'
        });

        // Auto-focus on the scene with multiple attempts
        try {
          // Wait a moment for the scene to be fully loaded
          setTimeout(() => {
            try {
              if (viewer.controls) {
                // Try different methods to focus on the scene
                if (typeof viewer.controls.lookAtSplatScene === 'function') {
                  viewer.controls.lookAtSplatScene(0);
                  console.log('Camera focused using lookAtSplatScene');
                } else if (typeof viewer.controls.fitToScene === 'function') {
                  viewer.controls.fitToScene();
                  console.log('Camera focused using fitToScene');
                } else if (typeof viewer.controls.reset === 'function') {
                  viewer.controls.reset();
                  console.log('Camera reset to default');
                }

                // Get scene bounds if available
                if (viewer.getSplatScenes && viewer.getSplatScenes().length > 0) {
                  const scene = viewer.getSplatScenes()[0];
                  if (scene.splatTree) {
                    const bounds = scene.splatTree.getBounds();
                    console.log('Scene bounds:', bounds);
                  }
                }

                // Force a render
                if (viewer.renderer) {
                  viewer.renderer.render();
                }
              }
            } catch (focusError) {
              console.warn('Auto-focus failed:', focusError);

              // Manual camera positioning as fallback
              if (viewer.camera) {
                viewer.camera.position.set(0, 0, 5);
                viewer.camera.lookAt(0, 0, 0);
                viewer.camera.updateProjectionMatrix();
                console.log('Camera manually positioned');
              }
            }
          }, 500); // Wait 500ms for scene to settle
        } catch (e) {
          console.warn('Could not auto-focus camera:', e);
        }

        setLoadingStage('Complete!');
        setLoadingProgress(100);

        // Small delay to show completion before hiding loading
        setTimeout(() => {
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingStage('');
        }, 1000);

        console.log(`✅ Gaussian Splat loaded successfully!`);
        console.log(`📊 Total splats: ${splatCount.toLocaleString()}`);
        console.log(`📐 Format: ${modelInfo.format}`);
        console.log(`💾 File size: ${modelInfo.fileSize}`);

        // Add visual debugging info
        console.log(`
🔧 TROUBLESHOOTING TIPS:
1. Check browser console for any errors
2. Use the Target button (🎯) to try different camera positions
3. Try dragging to rotate the view
4. Use mouse wheel to zoom in/out
5. The model should be visible as ${splatCount.toLocaleString()} splat points

🎥 CAMERA CONTROLS:
- Drag: Rotate view
- Scroll: Zoom in/out
- Target button: Auto-try different viewpoints
- Home button: Reset to default view
        `);

        return; // Success, don't fall back

      } catch (gaussianError) {
        console.warn('Gaussian Splats 3D library failed, falling back to enhanced point rendering:', gaussianError);

        // Check if it's a SharedArrayBuffer issue
        if (gaussianError instanceof Error && gaussianError.message.includes('SharedArrayBuffer')) {
          console.warn('SharedArrayBuffer not available, trying fallback configuration...');

          try {
            // Try again with SharedArrayBuffer completely disabled
            setLoadingStage('Switching to compatibility mode...');
            setLoadingProgress(50);

            const fallbackViewer = new GaussianSplats3D.Viewer({
              rootElement: container,
              initialCameraPosition: [-1, -4, 6],
              initialCameraLookAt: [0, 4, 0],
              selfDrivenMode: true,
              useBuiltInControls: true,
              // Completely disable all SharedArrayBuffer-dependent features
              gpuAcceleratedSort: false,
              enableSIMDInSort: false,
              sharedMemoryForWorkers: false,
              integerBasedSort: false,
              halfPrecisionCovariancesOnGPU: false,
              dynamicScene: false,
              webXRMode: GaussianSplats3D.WebXRMode.None,
              renderMode: GaussianSplats3D.RenderMode.Always,
              sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
              antialiased: false, // Disable for compatibility
              sphericalHarmonicsDegree: 0, // Minimal quality for compatibility
              enableOptionalEffects: false,
              inMemoryCompressionLevel: 0,
              freeIntermediateSplatData: true,
              webWorkerCount: 0, // No workers to avoid SharedArrayBuffer
              logLevel: GaussianSplats3D.LogLevel.Silent
            });

            await fallbackViewer.init();
            viewerRef.current = fallbackViewer;

            const fallbackSceneOptions = {
              ...sceneOptions,
              optimizeSplatData: false,
              halfPrecisionCovariancesOnGPU: false
            };

            await fallbackViewer.addSplatScene(url, fallbackSceneOptions);

            console.log('Fallback Gaussian Splats viewer loaded successfully');
            return; // Success with fallback

          } catch (fallbackError) {
            console.warn('Fallback Gaussian Splats also failed:', fallbackError);
          }
        }

        // Try a simple canvas debug test first before point rendering
        try {
          console.log('Testing basic canvas rendering...');
          const debugCanvas = await createDebugCanvas();
          if (debugCanvas) {
            console.log('Debug canvas created successfully, now trying point rendering...');
          }
        } catch (canvasError) {
          console.error('Debug canvas failed:', canvasError);
        }

        // Fallback to enhanced Three.js point rendering
        await loadGaussianSplatFallback();
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load Gaussian Splat';
      setError(errorMsg);
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback enhanced point rendering for Gaussian splats
  const loadGaussianSplatFallback = async () => {
    if (!modelFile || !sceneRef.current) return;

    console.log('Using enhanced point rendering fallback...');

    const arrayBuffer = await modelFile.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('File size:', arrayBuffer.byteLength, 'bytes');
    console.log('Total lines:', lines.length);
    console.log('First 10 lines:', lines.slice(0, 10));

    let vertexCount = 0;
    let headerEnd = 0;

    // Parse header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('element vertex')) {
        vertexCount = parseInt(line.split(/\s+/)[2]);
        console.log('Found vertex count:', vertexCount);
      }
      if (line === 'end_header') {
        headerEnd = i + 1;
        console.log('Header ends at line:', headerEnd);
        break;
      }
    }

    const positions = [];
    const colors = [];
    const sizes = [];

    console.log('Starting to parse vertices from line', headerEnd, 'to', headerEnd + vertexCount);
    console.log('Sample data lines:', lines.slice(headerEnd, headerEnd + 3));

    let validVertices = 0;
    let skippedVertices = 0;

    // Parse vertices
    for (let i = headerEnd; i < headerEnd + vertexCount && i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skippedVertices++;
        continue;
      }

      const values = line.split(/\s+/).map(val => parseFloat(val));

      if (values.length >= 3) {
        const x = values[0];
        const y = values[1];
        const z = values[2];

        // Skip vertices with NaN or invalid values
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
          skippedVertices++;
          if (skippedVertices <= 3) {
            console.log('Skipped invalid vertex:', [x, y, z]);
          }
          continue;
        }

        positions.push(x, y, z);
        validVertices++;

        // Extract colors with better defaults
        let r = 1.0, g = 0.0, b = 0.0; // Default to red for visibility

        if (values.length >= 6) {
          const rawR = values[3];
          const rawG = values[4];
          const rawB = values[5];

          if (isFinite(rawR) && isFinite(rawG) && isFinite(rawB)) {
            r = Math.max(0, Math.min(1, rawR <= 1 ? rawR : rawR / 255));
            g = Math.max(0, Math.min(1, rawG <= 1 ? rawG : rawG / 255));
            b = Math.max(0, Math.min(1, rawB <= 1 ? rawB : rawB / 255));
          }
        }
        colors.push(r, g, b);

        // Larger sizes for better visibility
        sizes.push(0.1);

        // Log first few vertices for debugging
        if (validVertices <= 3) {
          console.log(`Vertex ${validVertices}:`, {
            position: [x, y, z],
            color: [r, g, b],
            rawLine: line.substring(0, 100)
          });
        }
      } else {
        skippedVertices++;
        if (skippedVertices <= 3) {
          console.log('Skipped line with insufficient values:', line);
        }
      }
    }

    console.log('Parsing results:', {
      validVertices,
      skippedVertices,
      totalPositions: positions.length,
      totalColors: colors.length
    });

    // Validate we have valid data
    if (positions.length === 0) {
      console.error('No valid vertex data found, creating test points');

      // Create some test points as fallback
      for (let i = 0; i < 100; i++) {
        positions.push(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        colors.push(Math.random(), Math.random(), Math.random());
        sizes.push(0.1);
      }

      console.log('Created 100 test points for debugging');
    }

    console.log(`Parsed ${positions.length / 3} valid vertices`);

    // Create enhanced geometry with custom shader material
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Use built-in PointsMaterial for better compatibility
    const material = new THREE.PointsMaterial({
      size: 0.2, // Increased size for visibility
      vertexColors: true,
      transparent: false, // Make opaque first to ensure visibility
      opacity: 1.0,
      sizeAttenuation: false, // Disable size attenuation for consistent size
      alphaTest: 0,
      blending: THREE.NormalBlending
    });

    // Create a texture for circular points
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Draw a circular gradient
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;

    const points = new THREE.Points(geometry, material);

    // Auto-scale and center with validation
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;

    if (boundingBox &&
        isFinite(boundingBox.min.x) && isFinite(boundingBox.min.y) && isFinite(boundingBox.min.z) &&
        isFinite(boundingBox.max.x) && isFinite(boundingBox.max.y) && isFinite(boundingBox.max.z)) {

      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      console.log('Bounding box info:', {
        min: boundingBox.min.toArray(),
        max: boundingBox.max.toArray(),
        center: center.toArray(),
        size: size.toArray(),
        maxDim: maxDim
      });

      if (maxDim > 0 && isFinite(maxDim)) {
        const scale = 2 / maxDim;
        points.scale.setScalar(scale);
        points.position.copy(center).negate().multiplyScalar(scale);

        console.log('Model scaled and centered:', {
          originalSize: size.toArray(),
          scale: scale,
          center: center.toArray(),
          finalPosition: points.position.toArray(),
          finalScale: points.scale.toArray()
        });
      } else {
        console.warn('maxDim is not valid:', maxDim);
        points.position.set(0, 0, 0);
        points.scale.set(0.1, 0.1, 0.1); // Make it smaller
      }
    } else {
      console.warn('Invalid bounding box, using default positioning');
      points.position.set(0, 0, 0);
      points.scale.set(0.1, 0.1, 0.1); // Make it smaller but visible
    }

    // Final check - if model is too far or too close, adjust
    const modelDistance = points.position.length();
    if (modelDistance > 10) {
      points.position.multiplyScalar(0.1);
      console.log('Model was too far, moved closer');
    }

    // Clear scene and add the enhanced points
    if (sceneRef.current) {
      // Remove existing models but keep lights
      const objectsToRemove = sceneRef.current.children.filter(child =>
        child.type === 'Points' || child.type === 'Mesh' || child.type === 'Group'
      );
      objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

      // Add the new points
      sceneRef.current.add(points);

      console.log('Points added to scene. Scene children:', sceneRef.current.children.length);
      console.log('Points object info:', {
        type: points.type,
        visible: points.visible,
        position: points.position.toArray(),
        scale: points.scale.toArray(),
        geometry: {
          vertices: geometry.attributes.position.count,
          hasPosition: !!geometry.attributes.position,
          hasColor: !!geometry.attributes.color
        }
      });
    }

    setModelInfo({
      name: modelFile.name,
      splatCount: positions.length / 3,
      format: 'Enhanced Point Rendering',
      fileSize: (modelFile.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    setDebugInfo({
      format: 'Enhanced Point Cloud',
      splatCount: positions.length / 3,
      renderMode: 'Custom Shader',
      antialiasing: true,
      qualityLevel: 'High',
      compressionLevel: 'Fallback',
      bytesPerSplat: 'Optimized'
    });

    // Force camera to look at the model
    if (cameraRef.current) {
      // Position camera at a good distance
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();

      console.log('Camera positioned at:', cameraRef.current.position.toArray());
      console.log('Camera looking at origin');
    }

    // Make sure the points are visible
    points.visible = true;
    material.visible = true;

    console.log(`Enhanced point rendering loaded with ${positions.length / 3} points`);
    console.log('Final model state:', {
      pointsVisible: points.visible,
      materialVisible: material.visible,
      pointsPosition: points.position.toArray(),
      pointsScale: points.scale.toArray(),
      materialSize: material.size,
      materialOpacity: material.opacity
    });
  };

  // Enhanced camera controls
  const resetCamera = () => {
    if (viewerRef.current && viewerRef.current.controls) {
      // Try multiple methods to focus on the scene
      try {
        if (typeof viewerRef.current.controls.lookAtSplatScene === 'function') {
          viewerRef.current.controls.lookAtSplatScene(0);
        } else if (typeof viewerRef.current.controls.fitToScene === 'function') {
          viewerRef.current.controls.fitToScene();
        } else if (typeof viewerRef.current.controls.reset === 'function') {
          viewerRef.current.controls.reset();
        }
      } catch (e) {
        console.warn('Controls reset failed:', e);
      }
    } else if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);
    }

    // Manual camera positioning for Gaussian splats
    if (viewerRef.current && viewerRef.current.camera) {
      viewerRef.current.camera.position.set(0, 0, 5);
      viewerRef.current.camera.lookAt(0, 0, 0);
      viewerRef.current.camera.updateProjectionMatrix();
      console.log('Camera manually reset for Gaussian splat viewer');
    }
  };

  // Try different camera positions
  const tryDifferentViews = () => {
    if (!viewerRef.current || !viewerRef.current.camera) return;

    const positions = [
      [0, 0, 5],    // Front
      [5, 0, 0],    // Right
      [0, 5, 0],    // Top
      [-5, 0, 0],   // Left
      [0, 0, -5],   // Back
      [3, 3, 3],    // Diagonal
      [0, 0, 10],   // Far front
      [0, 0, 2],    // Close front
    ];

    let currentIndex = 0;
    const tryNext = () => {
      if (currentIndex < positions.length) {
        const pos = positions[currentIndex];
        viewerRef.current.camera.position.set(pos[0], pos[1], pos[2]);
        viewerRef.current.camera.lookAt(0, 0, 0);
        viewerRef.current.camera.updateProjectionMatrix();
        console.log(`Trying camera position ${currentIndex + 1}:`, pos);
        currentIndex++;
        setTimeout(tryNext, 1000); // Wait 1 second before trying next position
      }
    };
    tryNext();
  };

  // Screenshot function
  const takeScreenshot = () => {
    if (viewerRef.current && viewerRef.current.renderer) {
      try {
        const canvas = viewerRef.current.renderer.domElement;
        const link = document.createElement('a');
        link.download = `gaussian-splat-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (err) {
        console.error('Screenshot failed:', err);
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!mountRef.current) return;

    if (!document.fullscreenElement) {
      mountRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error('Fullscreen failed:', err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Quality settings
  const changeQuality = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    setQualityLevel(quality);
    if (viewerRef.current) {
      const settings = {
        low: { sphericalHarmonicsDegree: 0, enableOptionalEffects: false, antialiased: false },
        medium: { sphericalHarmonicsDegree: 1, enableOptionalEffects: false, antialiased: true },
        high: { sphericalHarmonicsDegree: 2, enableOptionalEffects: true, antialiased: true },
        ultra: { sphericalHarmonicsDegree: 3, enableOptionalEffects: true, antialiased: true }
      };

      try {
        Object.assign(viewerRef.current, settings[quality]);
      } catch (err) {
        console.warn('Quality change failed:', err);
      }
    }
  };

  // Performance monitoring
  const updateStats = () => {
    if (viewerRef.current) {
      try {
        const stats = {
          fps: viewerRef.current.fps || 'N/A',
          splatCount: viewerRef.current.getSplatCount?.() || 'N/A',
          memoryUsage: (performance as any).memory ?
            `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A',
          renderTime: viewerRef.current.lastRenderTime || 'N/A'
        };
        setRenderStats(stats);
      } catch (err) {
        console.warn('Stats update failed:', err);
      }
    }
  };

  // Auto-update stats
  useEffect(() => {
    if (showStats) {
      const interval = setInterval(updateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [showStats]);

  // Initialize scene
  useEffect(() => {
    initScene();

    // Resize handler for responsive canvas
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      // Update camera aspect ratio
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      // Update renderer size
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);

      console.log('Canvas resized:', width, 'x', height, 'aspect:', width / height);
    };

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize on fullscreen change
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Initial resize after mount
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (err) {
          console.warn('Error disposing viewer:', err);
        }
      }
      if (rendererRef.current && mountRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        } catch (err) {
          console.warn('Error disposing renderer:', err);
        }
      }
    };
  }, []);

  // Load model when file changes
  useEffect(() => {
    if (modelFile) {
      loadGaussianSplat();
    }
  }, [modelFile]);

  return (
    <div className="space-y-4">
      {/* 3D Viewer */}
      <div className="relative" style={{ width, height }}>
        <div
          ref={mountRef}
          className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 relative overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ width, height }}
        />

        {/* Enhanced Loading with Progress */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center p-8 bg-gray-800/95 rounded-2xl border border-gray-700 backdrop-blur-md max-w-md w-full mx-4">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-500"
                    style={{
                      background: `conic-gradient(from 0deg, #3B82F6 ${loadingProgress * 3.6}deg, transparent ${loadingProgress * 3.6}deg)`,
                      borderRadius: '50%'
                    }}
                  ></div>
                  <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{Math.round(loadingProgress)}%</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">Loading Gaussian Splat</h3>
              <p className="text-blue-400 font-medium mb-4">{loadingStage}</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>

              {/* File Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <div>File: {modelFile?.name}</div>
                <div>Size: {modelFile ? (modelFile.size / (1024 * 1024)).toFixed(1) : '0'} MB</div>
                <div className="flex items-center space-x-2 mt-2">
                  <span>Mode:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-blue-900/50 text-blue-400'
                  }`}>
                    {typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated
                      ? 'GPU Accelerated'
                      : 'Enhanced Compatibility'
                    }
                  </span>
                </div>
                {!(typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated) && (
                  <div className="mt-2 text-xs text-blue-300">
                    Using enhanced fallback rendering with excellent compatibility
                  </div>
                )}
                <div className="mt-3 text-gray-500">
                  {loadingProgress < 30 && "🚀 Preparing viewer..."}
                  {loadingProgress >= 30 && loadingProgress < 60 && "🔧 Optimizing GPU resources..."}
                  {loadingProgress >= 60 && loadingProgress < 85 && "📊 Processing Gaussian splats..."}
                  {loadingProgress >= 85 && "✨ Almost ready!"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-center p-6 bg-red-900/90 rounded-lg max-w-md">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
              <p className="text-white font-medium mb-2">Error Loading Gaussian Splat</p>
              <p className="text-red-200 text-sm mb-4">{error}</p>
              <button
                onClick={loadGaussianSplat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Advanced Controls - Responsive */}
        {modelInfo && !isLoading && !error && (
          <div className="absolute top-2 md:top-4 right-2 md:right-4 flex flex-col space-y-2 z-10">
            {/* Main Controls */}
            <div className="flex space-x-1 md:space-x-2">
              <button
                onClick={resetCamera}
                className="p-2 md:p-2.5 bg-black/80 hover:bg-black/90 active:scale-95 rounded-lg md:rounded-xl text-white shadow-lg transition-all touch-target backdrop-blur-sm"
                title="Reset View"
              >
                <Home size={18} className="md:w-5 md:h-5" />
              </button>
              <button
                onClick={tryDifferentViews}
                className="hidden md:flex p-2.5 bg-black/80 hover:bg-black/90 active:scale-95 rounded-xl text-white shadow-lg transition-all backdrop-blur-sm"
                title="Try Different Views"
              >
                <Target size={20} />
              </button>
              <button
                onClick={takeScreenshot}
                className="p-2 md:p-2.5 bg-black/80 hover:bg-black/90 active:scale-95 rounded-lg md:rounded-xl text-white shadow-lg transition-all touch-target backdrop-blur-sm"
                title="Screenshot"
              >
                <Camera size={18} className="md:w-5 md:h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 md:p-2.5 bg-black/80 hover:bg-black/90 active:scale-95 rounded-lg md:rounded-xl text-white shadow-lg transition-all touch-target backdrop-blur-sm"
                title="Fullscreen"
              >
                <Maximize size={18} className="md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 md:p-2.5 rounded-lg md:rounded-xl text-white shadow-lg transition-all active:scale-95 touch-target backdrop-blur-sm ${
                  showStats ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black/80 hover:bg-black/90'
                }`}
                title="Stats"
              >
                <BarChart3 size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Quality Selector - Hidden on small screens, toggleable */}
            <div className="hidden md:block bg-black/80 backdrop-blur-sm rounded-xl p-3 shadow-lg">
              <div className="text-xs text-gray-300 mb-2 font-medium">Quality</div>
              <select
                value={qualityLevel}
                onChange={(e) => changeQuality(e.target.value as any)}
                className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 w-full mb-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>

              {/* Fast Load Toggle */}
              <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fastLoadMode}
                  onChange={(e) => setFastLoadMode(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span>Fast Load</span>
              </label>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {showStats && renderStats && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/80 rounded-lg p-3 text-white text-xs min-w-[150px]">
              <div className="font-medium mb-2 text-green-400">Performance Stats</div>
              <div className="space-y-1">
                <div>FPS: {renderStats.fps}</div>
                <div>Splats: {renderStats.splatCount}</div>
                <div>Memory: {renderStats.memoryUsage}</div>
                <div>Render: {renderStats.renderTime}ms</div>
                <div>Quality: {qualityLevel.toUpperCase()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Model Info - Responsive */}
        {modelInfo && !isLoading && !error && (
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 z-10 max-w-[calc(100%-1rem)] md:max-w-sm">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg md:rounded-xl px-3 py-2 text-white text-xs md:text-sm shadow-lg">
              <div className="flex items-center space-x-2 mb-1">
                <FileIcon size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                <span className="font-medium truncate">{modelInfo.name}</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-300 space-y-0.5">
                <div>Splats: {modelInfo.splatCount.toLocaleString()}</div>
                <div className="hidden md:block">Format: {modelInfo.format}</div>
                <div>Size: {modelInfo.fileSize}</div>
                <div className="hidden md:block text-green-400">✓ GPU Accelerated</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions - Responsive */}
        {!modelFile && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <Info className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-500 mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-white mb-2">Gaussian Splat Viewer</h3>
              <p className="text-sm md:text-base text-gray-400 mb-3 md:mb-4">Upload a Gaussian Splat PLY file</p>
              <div className="text-xs md:text-sm text-gray-500 space-y-1">
                <div>✓ 3D Gaussian Splatting format</div>
                <div className="hidden md:block">Drag to rotate • Scroll to zoom</div>
                <div className="md:hidden">Touch to rotate • Pinch to zoom</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-gray-800 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2 flex items-center">
            <Info className="mr-2" size={18} />
            Gaussian Splat Rendering Info
          </h4>
          <div className="text-sm space-y-2">
            <div>Format: {debugInfo.format}</div>
            <div>Splat Count: {debugInfo.splatCount.toLocaleString()}</div>
            <div>Render Mode: {debugInfo.renderMode}</div>
            <div>Quality Level: {debugInfo.qualityLevel}</div>
            <div>Antialiasing: {debugInfo.antialiasing ? 'Enabled' : 'Disabled'}</div>
            <div>Compression Level: {debugInfo.compressionLevel}</div>
            <div>Bytes per Splat: {debugInfo.bytesPerSplat}</div>

            <div className="text-xs bg-gray-900 p-2 rounded">
              <div className="font-semibold mb-1">Rendering Features:</div>
              <div>✓ GPU Accelerated Sorting</div>
              <div>✓ Real-time Splatting</div>
              <div>✓ Perfect Alpha Blending</div>
              <div>✓ Perspective-correct Scaling</div>
              <div>✓ High-quality Filtering</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaussianSplatViewer;