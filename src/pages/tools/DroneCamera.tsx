import { useState, useEffect, useRef } from 'react';
import {
  RotateCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Battery,
  Wifi,
  CameraIcon,
  Navigation,
  Plane,
  RotateCcw,
  Smartphone,
  Power,
  Maximize2,
  Minimize2,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';

interface DroneStatus {
  connected: boolean;
  flying: boolean;
  battery: number;
  altitude: number;
  speed: number;
  temperature: number;
  signalStrength: number;
}

export default function DroneCamera() {
  const [droneStatus, setDroneStatus] = useState<DroneStatus>({
    connected: false,
    flying: false,
    battery: 75,
    altitude: 0,
    speed: 0,
    temperature: 28,
    signalStrength: 85
  });
  const [isLandscape, setIsLandscape] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
      if (isLandscapeMode) setShowWarning(false);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleConnect = () => {
    setDroneStatus(prev => ({ ...prev, connected: !prev.connected }));
  };

  const handleTakeoff = () => {
    setDroneStatus(prev => ({ ...prev, flying: true, altitude: 1.2 }));
  };

  const handleLand = () => {
    setDroneStatus(prev => ({ ...prev, flying: false, altitude: 0 }));
  };

  // Portrait warning screen
  if (!isLandscape && showWarning) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50">
        <Smartphone className="w-20 h-20 text-blue-400 mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-3 text-center">Rotate Your Phone</h2>
        <p className="text-gray-400 text-center mb-6 max-w-sm">
          For the best drone control experience, please rotate your device to landscape mode.
        </p>
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <RotateCwIcon className="w-5 h-5 animate-spin" />
          <span>Rotate device horizontally</span>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="mt-8 px-6 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Continue Anyway
        </button>
      </div>
    );
  }

  // Landscape drone interface
  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex overflow-hidden">
      {/* Video Feed - Center */}
      <div className="flex-1 relative bg-gray-900" onClick={() => setShowControls(!showControls)}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Top Status Bar */}
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-2 flex items-center justify-between transition-all duration-300 ${!showControls && 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${droneStatus.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <Wifi className="w-3 h-3" />
              <span className="text-[10px] font-medium">{droneStatus.signalStrength}%</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-400">
              <Battery className="w-3 h-3" />
              <span className="text-[10px] font-medium">{droneStatus.battery}%</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-400">
              <Navigation className="w-3 h-3" />
              <span className="text-[10px] font-medium">{droneStatus.altitude.toFixed(1)}m</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Controls Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowControls(!showControls);
              }}
              className="w-7 h-7 bg-gray-800/80 rounded-lg flex items-center justify-center hover:bg-gray-700/80 transition-all"
            >
              {showControls ? <EyeOffIcon className="w-3.5 h-3.5 text-gray-300" /> : <EyeIcon className="w-3.5 h-3.5 text-gray-300" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="w-7 h-7 bg-gray-800/80 rounded-lg flex items-center justify-center hover:bg-gray-700/80 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-gray-300" /> : <Maximize2 className="w-3.5 h-3.5 text-gray-300" />}
            </button>

            <span className="text-white text-[10px] font-medium">CUREVA DRONE</span>
            <Plane className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/40" />
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/40" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-white/40" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-white/40" />
            <div className="w-2 h-2 rounded-full border border-white/60" />
          </div>
        </div>
      </div>

      {/* Right Control Panel */}
      <div className={`w-28 bg-gray-900/95 backdrop-blur border-l border-gray-800 flex flex-col transition-all duration-300 ${!showControls && 'translate-x-full'}`}>
        {/* Connection */}
        <div className="p-2 border-b border-gray-800">
          <button
            onClick={handleConnect}
            className={`w-full py-1.5 rounded text-[10px] font-medium transition-all ${
              droneStatus.connected
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {droneStatus.connected ? 'Connected' : 'Connect'}
          </button>
        </div>

        {/* Takeoff/Land */}
        <div className="p-2 border-b border-gray-800 space-y-1">
          <button
            onClick={handleTakeoff}
            disabled={!droneStatus.connected || droneStatus.flying}
            className="w-full py-1.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUpIcon className="w-3 h-3 mx-auto" />
            Takeoff
          </button>
          <button
            onClick={handleLand}
            disabled={!droneStatus.flying}
            className="w-full py-1.5 bg-orange-500/20 text-orange-400 rounded text-[10px] font-medium hover:bg-orange-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDownIcon className="w-3 h-3 mx-auto" />
            Land
          </button>
        </div>

        {/* Altitude Controls */}
        <div className="p-2 border-b border-gray-800">
          <p className="text-[9px] text-gray-500 mb-1 text-center">ALTITUDE</p>
          <div className="flex gap-1">
            <button
              disabled={!droneStatus.flying}
              className="flex-1 py-1.5 bg-gray-800/60 rounded hover:bg-gray-700/60 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronUpIcon className="w-4 h-4 text-green-400 mx-auto" />
            </button>
            <button
              disabled={!droneStatus.flying}
              className="flex-1 py-1.5 bg-gray-800/60 rounded hover:bg-gray-700/60 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronDownIcon className="w-4 h-4 text-red-400 mx-auto" />
            </button>
          </div>
        </div>

        {/* Rotation */}
        <div className="p-2 border-b border-gray-800">
          <p className="text-[9px] text-gray-500 mb-1 text-center">ROTATE</p>
          <div className="flex gap-1">
            <button
              disabled={!droneStatus.flying}
              className="flex-1 py-1.5 bg-gray-800/60 rounded hover:bg-gray-700/60 disabled:opacity-30 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-blue-400 mx-auto" />
            </button>
            <button
              disabled={!droneStatus.flying}
              className="flex-1 py-1.5 bg-gray-800/60 rounded hover:bg-gray-700/60 disabled:opacity-30 transition-all active:scale-95"
            >
              <RotateCwIcon className="w-4 h-4 text-blue-400 mx-auto" />
            </button>
          </div>
        </div>

        {/* Camera */}
        <div className="p-2 border-b border-gray-800">
          <button className="w-full py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all active:scale-95">
            <CameraIcon className="w-4 h-4 mx-auto mb-0.5" />
            <span className="text-[9px] font-medium">Capture</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Emergency Stop */}
        <div className="p-2">
          <button className="w-full py-1.5 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600 transition-all active:scale-95">
            <Power className="w-4 h-4 mx-auto mb-0.5" />
            STOP
          </button>
        </div>
      </div>

      {/* Left D-Pad Controls */}
      <div className={`absolute bottom-4 left-4 w-24 h-24 transition-all duration-300 ${!showControls && '-translate-x-32 opacity-0'}`}>
        <div className="relative w-full h-full">
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-gray-800/80 rounded-full border-2 border-gray-700" />

          {/* Up */}
          <button
            disabled={!droneStatus.flying}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-800/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gray-700/80 disabled:opacity-30 border border-gray-700 transition-all active:scale-95"
          >
            <ArrowUpIcon className="w-4 h-4 text-blue-400" />
          </button>

          {/* Down */}
          <button
            disabled={!droneStatus.flying}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-800/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gray-700/80 disabled:opacity-30 border border-gray-700 transition-all active:scale-95"
          >
            <ArrowDownIcon className="w-4 h-4 text-blue-400" />
          </button>

          {/* Left */}
          <button
            disabled={!droneStatus.flying}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gray-700/80 disabled:opacity-30 border border-gray-700 transition-all active:scale-95"
          >
            <ArrowLeftIcon className="w-4 h-4 text-blue-400" />
          </button>

          {/* Right */}
          <button
            disabled={!droneStatus.flying}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-gray-700/80 disabled:opacity-30 border border-gray-700 transition-all active:scale-95"
          >
            <ArrowRightIcon className="w-4 h-4 text-blue-400" />
          </button>
        </div>
        <p className="text-[9px] text-gray-500 text-center mt-1.5">MOVEMENT</p>
      </div>
    </div>
  );
}
