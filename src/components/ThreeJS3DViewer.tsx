import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FileIcon, LoaderIcon, AlertCircle, RotateCw, ZoomIn, Move3D, Home } from 'lucide-react';

interface ThreeJS3DViewerProps {
  modelFile?: File | null;
  width?: string | number;
  height?: string | number;
}

const ThreeJS3DViewer: React.FC<ThreeJS3DViewerProps> = ({
  modelFile,
  width = '100%',
  height = '600px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Initialize Three.js scene
  const initScene = () => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Better lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // Add a simple coordinate system for reference
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Add a test cube to verify rendering works
    const testGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 0, 0);
    testCube.name = 'testCube';
    scene.add(testCube);

    console.log('Scene initialized:', scene);
    console.log('Camera position:', camera.position);
    console.log('Test cube added at origin');

    // Controls (basic manual implementation)
    setupControls();

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (modelRef.current && !controlsRef.current?.isUserInteracting) {
        modelRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();
  };

  // Basic orbit controls implementation
  const setupControls = () => {
    if (!mountRef.current || !cameraRef.current) return;

    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const controls = {
      isUserInteracting: false,
      rotationSpeed: 0.005,
      zoomSpeed: 0.1
    };

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      controls.isUserInteracting = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !modelRef.current) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * controls.rotationSpeed;
      targetRotationX += deltaY * controls.rotationSpeed;

      modelRef.current.rotation.y = targetRotationY;
      modelRef.current.rotation.x = targetRotationX;

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
      controls.isUserInteracting = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      event.preventDefault();

      const delta = event.deltaY > 0 ? 1.1 : 0.9;
      cameraRef.current.position.multiplyScalar(delta);
      cameraRef.current.position.clampLength(1, 50);
    };

    mountRef.current.addEventListener('mousedown', onMouseDown);
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('mouseup', onMouseUp);
    mountRef.current.addEventListener('wheel', onWheel, { passive: false });

    controlsRef.current = controls;
  };

  // Load PLY file
  const loadPLYFile = async (file: File) => {
    try {
      const text = await file.text();
      const geometry = parsePLY(text);

      if (geometry) {
        // Create material with adaptive point size for dense clouds
        const pointCount = geometry.attributes.position.count;
        let pointSize;
        if (pointCount > 100000) pointSize = 0.002;
        else if (pointCount > 50000) pointSize = 0.005;
        else if (pointCount > 10000) pointSize = 0.01;
        else if (pointCount > 1000) pointSize = 0.02;
        else pointSize = 0.05;

        console.log(`Point count: ${pointCount}, using point size: ${pointSize}`);

        const material = new THREE.PointsMaterial({
          color: 0xffffff,
          size: pointSize,
          vertexColors: geometry.hasAttribute('color'),
          sizeAttenuation: false // Disable distance-based sizing for dense clouds
        });

        // Create object
        const points = new THREE.Points(geometry, material);

        // Center and scale the model properly
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          const center = geometry.boundingBox.getCenter(new THREE.Vector3());
          const size = geometry.boundingBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          console.log('PLY Bounding box center:', center);
          console.log('PLY Bounding box size:', size);
          console.log('PLY Max dimension:', maxDim);

          if (maxDim > 0) {
            // Scale to fit in a 4x4x4 box (larger)
            const scale = 4 / maxDim;
            points.scale.setScalar(scale);

            // Center the model at origin - apply scaling to centering
            const scaledCenter = center.clone().multiplyScalar(scale);
            points.position.copy(scaledCenter).negate();

            console.log('PLY Final scale:', scale);
            console.log('PLY Final position:', points.position);
            console.log('PLY Scaled center that was negated:', scaledCenter);
          }
        }

        console.log('PLY Points created:', points);
        console.log('Point count:', geometry.attributes.position.count);

        return points;
      }
    } catch (error) {
      console.error('Error loading PLY:', error);
      throw new Error('Failed to parse PLY file');
    }
    return null;
  };

  // Simple PLY parser for point clouds
  const parsePLY = (text: string): THREE.BufferGeometry | null => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      let vertexCount = 0;
      let headerEnd = 0;
      let hasColors = false;

      // Parse header
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('element vertex')) {
          const parts = line.split(/\s+/);
          vertexCount = parseInt(parts[2]);
        }
        if (line.includes('property uchar red') || line.includes('property float red')) {
          hasColors = true;
        }
        if (line === 'end_header') {
          headerEnd = i + 1;
          break;
        }
      }

      if (vertexCount === 0 || headerEnd === 0) {
        console.warn('Invalid PLY header');
        return null;
      }

      const positions = [];
      const colors = [];

      // Parse vertices
      for (let i = headerEnd; i < headerEnd + vertexCount && i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(/\s+/).map(val => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        });

        if (values.length >= 3) {
          // Validate position values
          const x = values[0];
          const y = values[1];
          const z = values[2];

          if (!isNaN(x) && !isNaN(y) && !isNaN(z) &&
              isFinite(x) && isFinite(y) && isFinite(z)) {
            positions.push(x, y, z);

            if (hasColors && values.length >= 6) {
              const r = Math.max(0, Math.min(255, values[3])) / 255;
              const g = Math.max(0, Math.min(255, values[4])) / 255;
              const b = Math.max(0, Math.min(255, values[5])) / 255;
              colors.push(r, g, b);
            } else {
              colors.push(0.7, 0.7, 0.7); // Default light gray
            }
          }
        }
      }

      if (positions.length === 0) {
        console.warn('No valid vertices found in PLY file');
        return null;
      }

      console.log(`PLY parsed: ${positions.length / 3} vertices`);
      console.log('Sample positions:', positions.slice(0, 9));
      console.log('Has colors:', hasColors);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      if (hasColors && colors.length === positions.length) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        console.log('Colors added to geometry');
      }

      // Compute bounding box to validate geometry
      geometry.computeBoundingBox();

      if (!geometry.boundingBox ||
          !isFinite(geometry.boundingBox.min.x) ||
          !isFinite(geometry.boundingBox.max.x)) {
        console.warn('Invalid geometry bounds');
        return null;
      }

      return geometry;
    } catch (error) {
      console.error('PLY parsing error:', error);
      return null;
    }
  };

  // Load OBJ file (basic implementation)
  const loadOBJFile = async (file: File) => {
    try {
      const text = await file.text();
      const geometry = parseOBJ(text);

      if (geometry) {
        const material = new THREE.MeshLambertMaterial({
          color: 0x00ff88,
          side: THREE.DoubleSide,
          wireframe: false
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Center and scale properly
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          const center = geometry.boundingBox.getCenter(new THREE.Vector3());
          const size = geometry.boundingBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          console.log('OBJ Bounding box center:', center);
          console.log('OBJ Bounding box size:', size);
          console.log('OBJ Max dimension:', maxDim);

          if (maxDim > 0) {
            // Scale to fit in a 4x4x4 box (larger)
            const scale = 4 / maxDim;
            mesh.scale.setScalar(scale);

            // Center the model at origin - apply scaling to centering
            const scaledCenter = center.clone().multiplyScalar(scale);
            mesh.position.copy(scaledCenter).negate();

            console.log('OBJ Final scale:', scale);
            console.log('OBJ Final position:', mesh.position);
            console.log('OBJ Scaled center that was negated:', scaledCenter);
          }
        }

        console.log('OBJ Mesh created:', mesh);
        console.log('Vertex count:', geometry.attributes.position.count);

        return mesh;
      }
    } catch (error) {
      console.error('Error loading OBJ:', error);
      throw new Error('Failed to parse OBJ file');
    }
    return null;
  };

  // Simple OBJ parser
  const parseOBJ = (text: string): THREE.BufferGeometry | null => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const vertices: number[][] = [];
      const faces: number[][] = [];

      for (const line of lines) {
        if (line.startsWith('#')) continue; // Skip comments

        const parts = line.split(/\s+/);

        if (parts[0] === 'v' && parts.length >= 4) {
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);

          if (!isNaN(x) && !isNaN(y) && !isNaN(z) &&
              isFinite(x) && isFinite(y) && isFinite(z)) {
            vertices.push([x, y, z]);
          }
        } else if (parts[0] === 'f' && parts.length >= 4) {
          const face = [];
          for (let i = 1; i < parts.length; i++) {
            const vertexIndex = parseInt(parts[i].split('/')[0]) - 1;
            if (!isNaN(vertexIndex) && vertexIndex >= 0 && vertexIndex < vertices.length) {
              face.push(vertexIndex);
            }
          }

          if (face.length >= 3) {
            // Triangulate face
            for (let i = 1; i < face.length - 1; i++) {
              faces.push([face[0], face[i], face[i + 1]]);
            }
          }
        }
      }

      if (vertices.length === 0 || faces.length === 0) {
        console.warn('No valid vertices or faces found in OBJ file');
        return null;
      }

      const positions = [];
      for (const face of faces) {
        for (const vertexIndex of face) {
          const vertex = vertices[vertexIndex];
          if (vertex) {
            positions.push(vertex[0], vertex[1], vertex[2]);
          }
        }
      }

      if (positions.length === 0) {
        console.warn('No valid positions generated from OBJ file');
        return null;
      }

      console.log(`OBJ parsed: ${vertices.length} vertices, ${faces.length} faces`);
      console.log(`Generated positions: ${positions.length / 3} triangulated vertices`);
      console.log('Sample positions:', positions.slice(0, 9));

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();

      // Validate geometry
      geometry.computeBoundingBox();
      if (!geometry.boundingBox ||
          !isFinite(geometry.boundingBox.min.x) ||
          !isFinite(geometry.boundingBox.max.x)) {
        console.warn('Invalid geometry bounds in OBJ');
        return null;
      }

      return geometry;
    } catch (error) {
      console.error('OBJ parsing error:', error);
      return null;
    }
  };

  // Load model based on file type
  const loadModel = async () => {
    if (!modelFile || !sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Remove existing model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current = null;
      }

      const extension = modelFile.name.split('.').pop()?.toLowerCase();
      let model = null;

      if (extension === 'ply') {
        model = await loadPLYFile(modelFile);
      } else if (extension === 'obj') {
        model = await loadOBJFile(modelFile);
      } else {
        throw new Error(`Unsupported file format: ${extension}`);
      }

      if (model && model.geometry) {
        // Validate the model before adding to scene
        const positionAttribute = model.geometry.attributes.position;
        if (!positionAttribute || positionAttribute.count === 0) {
          throw new Error('Model has no valid vertices');
        }

        // Clear existing models first
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
        }

        // Remove test cube when loading real model
        const testCube = sceneRef.current.getObjectByName('testCube');
        if (testCube) {
          sceneRef.current.remove(testCube);
        }

        // Reset model position and add to scene
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        sceneRef.current.add(model);
        modelRef.current = model;

        console.log('Model added to scene:', model);
        console.log('Model position:', model.position);
        console.log('Model scale:', model.scale);
        console.log('Scene children count:', sceneRef.current.children.length);

        const vertexCount = positionAttribute.count;
        const faceCount = model.geometry.index
          ? model.geometry.index.count / 3
          : (extension === 'ply' ? 0 : vertexCount / 3);

        setModelInfo({
          name: modelFile.name,
          vertices: vertexCount,
          faces: Math.floor(faceCount),
          type: extension?.toUpperCase()
        });
      } else {
        throw new Error('Failed to create valid 3D model from file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setIsLoading(false);
    }
  };

  // Controls
  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(8, 8, 8);
      cameraRef.current.lookAt(0, 0, 0);
      if (modelRef.current) {
        modelRef.current.rotation.set(0, 0, 0);
      }
      console.log('Camera reset to:', cameraRef.current.position);
    }
  };

  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
    }
  };

  // Cleanup
  useEffect(() => {
    initScene();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Load model when file changes
  useEffect(() => {
    if (modelFile && sceneRef.current) {
      loadModel();
    }
  }, [modelFile]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);

        console.log('ThreeJS resized:', width, 'x', height, 'aspect:', width / height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial resize after mount
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative" style={{ width, height }}>
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ width, height }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center p-6 bg-gray-800/90 rounded-lg">
            <LoaderIcon className="animate-spin mx-auto h-8 w-8 text-blue-400 mb-3" />
            <p className="text-white font-medium">Loading 3D Model...</p>
            <p className="text-gray-400 text-sm mt-1">{modelFile?.name}</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center p-6 bg-red-900/90 rounded-lg max-w-md">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
            <p className="text-white font-medium mb-2">Error Loading Model</p>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <button
              onClick={loadModel}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {modelRef.current && !isLoading && !error && (
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <button
            onClick={resetCamera}
            className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors"
            title="Reset View"
          >
            <Home size={16} />
          </button>
          <button
            onClick={toggleAutoRotate}
            className="p-2 bg-black/70 hover:bg-black/80 rounded-lg text-white transition-colors"
            title="Toggle Rotation"
          >
            <RotateCw size={16} />
          </button>
        </div>
      )}

      {/* Model Info */}
      {modelInfo && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/70 rounded-lg px-3 py-2 text-white text-sm">
            <div className="flex items-center space-x-2 mb-1">
              <FileIcon size={16} />
              <span className="font-medium">{modelInfo.name}</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Type: {modelInfo.type}</div>
              <div>Vertices: {modelInfo.vertices.toLocaleString()}</div>
              {modelInfo.faces > 0 && <div>Faces: {modelInfo.faces.toLocaleString()}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!modelFile && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <Move3D className="mx-auto h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">3D Viewer</h3>
            <p className="text-gray-400 mb-4">Upload a PLY or OBJ file to view in 3D</p>
            <div className="text-sm text-gray-500">
              • Drag to rotate • Scroll to zoom • Supported: PLY, OBJ
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeJS3DViewer;