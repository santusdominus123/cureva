import { useState, useEffect, useRef } from 'react';
import {
  RotateCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Target,
  Battery,
  Wifi,
  MinusIcon,
  MaximizeIcon,
  MenuIcon,
  XIcon,
  CameraIcon,
  Radio,
  Navigation,
  Gauge,
  Thermometer,
  Send,
  Plane,
  RotateCcw,
} from 'lucide-react';
import { droneController, DroneStatus } from '../lib/droneController';
import { droneService } from '../services/droneService';

interface DroneControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
}

export default function DroneCamera() {
  const [droneStatus, setDroneStatus] = useState<DroneStatus>({
    connected: false,
    flying: false,
    battery: 0,
    altitude: 0,
    speed: 0,
    temperature: 0,
    signalStrength: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [speed, setSpeed] = useState(50);
  const [autoPattern] = useState<string>('');
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Google Drive integration
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [connectedGoogleEmail, setConnectedGoogleEmail] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState("tello_captures");
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [controls, setControls] = useState<DroneControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    rotateLeft: false,
    rotateRight: false,
  });

  // Force landscape orientation
  const requestLandscapeOrientation = async () => {
    try {
      if ('orientation' in screen && 'lock' in screen.orientation) {
        await screen.orientation.lock('landscape');
        setOrientationLocked(true);
      } else if ('lockOrientation' in screen) {
        (screen as any).lockOrientation('landscape');
        setOrientationLocked(true);
      }
    } catch (error) {
      console.log('Could not lock orientation:', error);
    }
  };

  const unlockOrientation = async () => {
    try {
      if ('orientation' in screen && 'unlock' in screen.orientation) {
        screen.orientation.unlock();
      } else if ('unlockOrientation' in screen) {
        (screen as any).unlockOrientation();
      }
      setOrientationLocked(false);
    } catch (error) {
      console.log('Could not unlock orientation:', error);
    }
  };

  // Initialize drone controller
  useEffect(() => {
    requestLandscapeOrientation();

    droneController.onStatusChange(setDroneStatus);
    droneController.onVideoStream((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    return () => {
      droneController.disconnect();
      unlockOrientation();
    };
  }, []);

  // Send movement commands
  useEffect(() => {
    if (mode === 'auto' || !droneStatus.flying) return;

    const sendMovementCommands = async () => {
      if (controls.forward) {
        await droneController.sendCommand({ type: 'movement', direction: 'forward', speed });
      }
      if (controls.backward) {
        await droneController.sendCommand({ type: 'movement', direction: 'backward', speed });
      }
      if (controls.left) {
        await droneController.sendCommand({ type: 'movement', direction: 'left', speed });
      }
      if (controls.right) {
        await droneController.sendCommand({ type: 'movement', direction: 'right', speed });
      }
      if (controls.up) {
        await droneController.sendCommand({ type: 'altitude', direction: 'up', speed });
      }
      if (controls.down) {
        await droneController.sendCommand({ type: 'altitude', direction: 'down', speed });
      }
      if (controls.rotateLeft) {
        await droneController.sendCommand({ type: 'rotation', direction: 'rotate_left', speed });
      }
      if (controls.rotateRight) {
        await droneController.sendCommand({ type: 'rotation', direction: 'rotate_right', speed });
      }
    };

    sendMovementCommands();
  }, [controls, speed, mode, droneStatus.flying]);

  // WASD Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'auto') return;

      switch (e.key.toLowerCase()) {
        case 'w': setControls(prev => ({ ...prev, forward: true })); break;
        case 's': setControls(prev => ({ ...prev, backward: true })); break;
        case 'a': setControls(prev => ({ ...prev, left: true })); break;
        case 'd': setControls(prev => ({ ...prev, right: true })); break;
        case 'q': setControls(prev => ({ ...prev, rotateLeft: true })); break;
        case 'e': setControls(prev => ({ ...prev, rotateRight: true })); break;
        case ' ': e.preventDefault(); setControls(prev => ({ ...prev, up: true })); break;
        case 'shift': setControls(prev => ({ ...prev, down: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (mode === 'auto') return;

      switch (e.key.toLowerCase()) {
        case 'w': setControls(prev => ({ ...prev, forward: false })); break;
        case 's': setControls(prev => ({ ...prev, backward: false })); break;
        case 'a': setControls(prev => ({ ...prev, left: false })); break;
        case 'd': setControls(prev => ({ ...prev, right: false })); break;
        case 'q': setControls(prev => ({ ...prev, rotateLeft: false })); break;
        case 'e': setControls(prev => ({ ...prev, rotateRight: false })); break;
        case ' ': e.preventDefault(); setControls(prev => ({ ...prev, up: false })); break;
        case 'shift': setControls(prev => ({ ...prev, down: false })); break;
      }
    };

    if (mode === 'manual') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode]);

  const handleConnect = async () => {
    if (droneStatus.connected) {
      droneController.disconnect();
    } else {
      await droneController.connect();
      await droneController.startVideoStream();
    }
  };

  const handleTakeoff = async () => {
    if (!droneStatus.connected) return;

    if (droneStatus.flying) {
      await droneController.sendCommand({ type: 'action', action: 'land' });
    } else {
      await droneController.sendCommand({ type: 'action', action: 'takeoff' });
    }
  };

  const handleEmergencyStop = async () => {
    await droneController.sendCommand({ type: 'action', action: 'emergency' });
    setControls({
      forward: false, backward: false, left: false, right: false,
      up: false, down: false, rotateLeft: false, rotateRight: false,
    });
  };

  const handleFlip = async () => {
    if (!droneStatus.connected || !droneStatus.flying) return;
    await droneController.sendCommand({ type: 'action', action: 'flip' });
  };

  const handleLaunchPythonGUI = async () => {
    await droneService.launchDroneGUI();
  };

  // Google Drive Functions
  const handleConnectGoogleDrive = async () => {
    try {
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!CLIENT_ID || CLIENT_ID === "YOUR_CLIENT_ID") {
        setUploadMessage("❌ Google Client ID belum dikonfigurasi");
        setTimeout(() => setUploadMessage(''), 5000);
        return;
      }

      const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
      const REDIRECT_URI = window.location.origin + window.location.pathname;
      const STATE = Math.random().toString(36).substring(7);

      sessionStorage.setItem('oauth_state', STATE);
      sessionStorage.setItem('oauth_return_path', window.location.pathname);

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('state', STATE);
      authUrl.searchParams.set('prompt', 'select_account');

      window.location.href = authUrl.toString();
    } catch (error) {
      setUploadMessage(`❌ Gagal terhubung: ${error}`);
      setTimeout(() => setUploadMessage(''), 5000);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    try {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const state = params.get('state');
      const savedState = sessionStorage.getItem('oauth_state');

      if (accessToken && state === savedState) {
        setGoogleAccessToken(accessToken);

        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(res => res.json())
        .then(data => {
          setConnectedGoogleEmail(data.email || "Terhubung");
          setUploadMessage(`✅ Terhubung sebagai ${data.email}`);
          setTimeout(() => setUploadMessage(''), 5000);
        })
        .catch(() => {
          setConnectedGoogleEmail("Terhubung");
          setUploadMessage("✅ Terhubung ke Google Drive");
          setTimeout(() => setUploadMessage(''), 3000);
        });

        sessionStorage.removeItem('oauth_state');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error("OAuth error:", error);
    }
  }, []);

  const capturePhotoFromVideo = async () => {
    if (!videoRef.current || !droneStatus.connected) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const dataURLToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const ensureDriveFolder = async (token: string, folderName: string): Promise<string> => {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
    });
    const createData = await createRes.json();
    return createData.id;
  };

  const uploadImageToDrive = async (token: string, folderId: string, filename: string, blob: Blob) => {
    const formData = new FormData();
    const metadata = { name: filename, parents: [folderId] };
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", blob, filename);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`Gagal mengunggah: ${res.statusText}`);
    return await res.json();
  };

  const handleCaptureAndUpload = async () => {
    if (!googleAccessToken) {
      setUploadMessage("⚠️ Hubungkan ke Google Drive terlebih dahulu");
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setIsCapturing(true);
    setUploadMessage("📸 Mengambil foto...");

    try {
      const dataUrl = await capturePhotoFromVideo();
      if (!dataUrl) throw new Error("Gagal mengambil foto");

      setUploadMessage("☁️ Mengunggah ke Google Drive...");

      const blob = dataURLToBlob(dataUrl);
      const timestamp = Date.now();
      const filename = `tello_${timestamp}.jpg`;
      const folderId = await ensureDriveFolder(googleAccessToken, uploadFolder);

      await uploadImageToDrive(googleAccessToken, folderId, filename, blob);

      setUploadMessage(`✅ Foto berhasil diunggah: ${filename}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error: any) {
      setUploadMessage(`❌ Gagal: ${error.message}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="drone-landscape-container h-screen w-screen flex landscape:flex-row flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">

      {/* LEFT SIDEBAR - Control Panel (Landscape) */}
      <div className={`landscape:w-64 landscape:h-full w-full h-auto bg-gradient-to-b from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-r border-gray-700/50 flex flex-col transition-all duration-300 ${
        sidebarMinimized ? 'landscape:w-16' : 'landscape:w-64'
      }`}>

        {/* Header dengan Logo */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            {!sidebarMinimized && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Drone ROS2</h1>
                  <p className="text-xs text-orange-400">Kontrol Penuh</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              {sidebarMinimized ? <MenuIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b border-gray-700/50">
          {!sidebarMinimized && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Status</span>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${
                  droneStatus.connected ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    droneStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}></div>
                  <span className={`text-xs font-bold ${
                    droneStatus.connected ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {droneStatus.connected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  droneStatus.connected
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                }`}
              >
                {droneStatus.connected ? 'PUTUSKAN' : 'HUBUNGKAN'}
              </button>
            </div>
          )}
        </div>

        {/* Telemetry Data */}
        {!sidebarMinimized && (
          <div className="p-4 space-y-3 border-b border-gray-700/50">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Telemetri</h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Battery className={`w-3 h-3 ${droneStatus.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className="text-xs text-gray-400">Baterai</span>
                </div>
                <p className={`text-lg font-bold ${droneStatus.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {droneStatus.battery.toFixed(0)}%
                </p>
              </div>

              <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Navigation className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-gray-400">Altitude</span>
                </div>
                <p className="text-lg font-bold text-blue-400">{droneStatus.altitude.toFixed(1)}m</p>
              </div>

              <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Gauge className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-gray-400">Kecepatan</span>
                </div>
                <p className="text-lg font-bold text-cyan-400">{droneStatus.speed.toFixed(1)} m/s</p>
              </div>

              <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Wifi className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-gray-400">Sinyal</span>
                </div>
                <p className="text-lg font-bold text-purple-400">{droneStatus.signalStrength}/4</p>
              </div>

              <div className="bg-black/40 rounded-lg p-2 border border-gray-700/50 col-span-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Thermometer className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-400">Suhu</span>
                </div>
                <p className="text-lg font-bold text-orange-400">{droneStatus.temperature.toFixed(1)}°C</p>
              </div>
            </div>
          </div>
        )}

        {/* Flight Controls */}
        {!sidebarMinimized && (
          <div className="p-4 space-y-2 border-b border-gray-700/50">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Kontrol Terbang</h3>

            <button
              onClick={handleTakeoff}
              disabled={!droneStatus.connected}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                droneStatus.flying
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-2 border-orange-500/50'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-2 border-blue-500/50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {droneStatus.flying ? '⬇️ MENDARAT' : '🚁 LEPAS LANDAS'}
            </button>

            <button
              onClick={handleEmergencyStop}
              disabled={!droneStatus.connected}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 border-2 border-red-600/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🚨 DARURAT STOP
            </button>

            <button
              onClick={handleFlip}
              disabled={!droneStatus.flying}
              className="w-full py-2 px-4 rounded-lg font-bold text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔄 FLIP
            </button>
          </div>
        )}

        {/* Mode & Speed Control */}
        {!sidebarMinimized && (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Pengaturan</h3>

            {/* Mode Toggle */}
            <div className="bg-black/40 rounded-lg p-3 border border-gray-700/50">
              <label className="text-xs text-gray-400 block mb-2">Mode Kontrol</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === 'manual'
                      ? 'bg-blue-500/30 text-blue-300 border-2 border-blue-400'
                      : 'bg-gray-700/30 text-gray-400 border border-gray-600'
                  }`}
                >
                  MANUAL
                </button>
                <button
                  onClick={() => setMode('auto')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === 'auto'
                      ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-400'
                      : 'bg-gray-700/30 text-gray-400 border border-gray-600'
                  }`}
                >
                  AUTO
                </button>
              </div>
            </div>

            {/* Speed Control */}
            <div className="bg-black/40 rounded-lg p-3 border border-gray-700/50">
              <label className="text-xs text-gray-400 block mb-2">Kecepatan: {speed}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Google Drive */}
            <div className="bg-black/40 rounded-lg p-3 border border-gray-700/50">
              <label className="text-xs text-gray-400 block mb-2">Google Drive</label>
              <button
                onClick={handleConnectGoogleDrive}
                disabled={!!googleAccessToken}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  googleAccessToken
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400'
                    : 'bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-600/30'
                }`}
              >
                {googleAccessToken ? `✅ ${connectedGoogleEmail}` : '☁️ Hubungkan Drive'}
              </button>
            </div>

            {/* Python GUI Launcher */}
            <button
              onClick={handleLaunchPythonGUI}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border-2 border-green-500/50 transition-all"
            >
              🐍 PYTHON GUI
            </button>

            {/* Orientation Lock */}
            <button
              onClick={orientationLocked ? unlockOrientation : requestLandscapeOrientation}
              className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                orientationLocked
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                  : 'bg-gray-700/30 text-gray-400 border border-gray-600'
              }`}
            >
              {orientationLocked ? '🔒 Landscape Locked' : '🔓 Lock Landscape'}
            </button>
          </div>
        )}
      </div>

      {/* CENTER - Video Feed */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Video Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Target className="w-8 h-8 text-white/40" />
            <div className="absolute inset-0 w-48 h-32 -translate-x-1/2 -translate-y-1/2 border border-white/20 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/10"></div>
              ))}
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-500/30 backdrop-blur-sm border border-red-500/50 rounded-lg px-3 py-2 pointer-events-auto">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-bold">REC</span>
              </div>
            </div>
          )}

          {/* Flight Status */}
          {droneStatus.flying && (
            <div className="absolute top-4 right-4 bg-emerald-500/30 backdrop-blur-sm border border-emerald-500/50 rounded-lg px-4 py-2">
              <span className="text-emerald-300 font-bold text-sm">✈️ FLYING</span>
            </div>
          )}

          {/* Upload Message */}
          {uploadMessage && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <div className="bg-black/80 backdrop-blur-xl border-2 border-white/30 rounded-xl px-6 py-3 shadow-2xl">
                <p className="text-white text-sm font-bold">{uploadMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Capture Button (when GDrive connected) */}
        {googleAccessToken && droneStatus.connected && (
          <button
            onClick={handleCaptureAndUpload}
            disabled={isCapturing}
            className="absolute bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-4 border-blue-400/80 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            <CameraIcon className={`w-8 h-8 text-white ${isCapturing ? 'animate-pulse' : ''}`} />
          </button>
        )}

        {/* Folder Input */}
        {googleAccessToken && (
          <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-xl rounded-lg p-3 border border-white/30">
            <label className="text-xs text-gray-300 block mb-1">Folder:</label>
            <input
              type="text"
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="bg-gray-900/60 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:outline-none focus:border-blue-500"
              placeholder="tello_captures"
            />
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Joystick Controls (Landscape) */}
      <div className={`landscape:w-72 landscape:h-full w-full h-auto bg-gradient-to-b from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-l border-gray-700/50 flex flex-col transition-all duration-300 ${
        controlsMinimized ? 'landscape:w-16' : 'landscape:w-72'
      }`}>

        {/* Controls Header */}
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          {!controlsMinimized && <h2 className="text-sm font-bold text-white">Kontrol Manual</h2>}
          <button
            onClick={() => setControlsMinimized(!controlsMinimized)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
          >
            {controlsMinimized ? <MaximizeIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Joystick Controls */}
        {!controlsMinimized && mode === 'manual' && (
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">

            {/* Movement Joystick */}
            <div className="bg-black/40 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Pergerakan</h3>
              <div className="relative w-40 h-40 mx-auto">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-black/60 to-gray-900/60 border-2 border-white/20 flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    {/* Up */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, forward: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, forward: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, forward: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, forward: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, forward: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.forward
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-cyan-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUpIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Down */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, backward: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, backward: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, backward: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, backward: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, backward: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.backward
                          ? 'bg-gradient-to-b from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-cyan-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ArrowDownIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Left */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, left: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, left: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, left: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, left: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, left: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.left
                          ? 'bg-gradient-to-l from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-cyan-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeftIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Right */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, right: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, right: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, right: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, right: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, right: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.right
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-cyan-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ArrowRightIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20 border-2 border-white/40"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">WASD Keys</p>
            </div>

            {/* Altitude & Rotation Joystick */}
            <div className="bg-black/40 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Altitude & Rotasi</h3>
              <div className="relative w-40 h-40 mx-auto">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-black/60 to-gray-900/60 border-2 border-white/20 flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    {/* Up - Altitude */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, up: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, up: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, up: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, up: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, up: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.up
                          ? 'bg-gradient-to-t from-emerald-500 to-green-500 shadow-lg shadow-emerald-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-emerald-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ChevronUpIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Down - Altitude */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, down: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, down: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, down: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, down: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, down: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.down
                          ? 'bg-gradient-to-b from-red-500 to-rose-500 shadow-lg shadow-red-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-red-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <ChevronDownIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Left - Rotate */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, rotateLeft: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, rotateLeft: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, rotateLeft: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, rotateLeft: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, rotateLeft: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.rotateLeft
                          ? 'bg-gradient-to-l from-amber-500 to-yellow-500 shadow-lg shadow-amber-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-amber-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Right - Rotate */}
                    <button
                      onMouseDown={() => setControls(prev => ({ ...prev, rotateRight: true }))}
                      onMouseUp={() => setControls(prev => ({ ...prev, rotateRight: false }))}
                      onMouseLeave={() => setControls(prev => ({ ...prev, rotateRight: false }))}
                      onTouchStart={() => setControls(prev => ({ ...prev, rotateRight: true }))}
                      onTouchEnd={() => setControls(prev => ({ ...prev, rotateRight: false }))}
                      disabled={!droneStatus.flying}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all ${
                        controls.rotateRight
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-400/50'
                          : droneStatus.flying
                          ? 'bg-white/10 hover:bg-amber-500/30 border border-white/30'
                          : 'bg-gray-600/20 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <RotateCwIcon className="w-5 h-5 mx-auto text-white" />
                    </button>

                    {/* Center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20 border-2 border-white/40"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">Space/Shift + Q/E Keys</p>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500/30 text-red-300 border border-red-400'
                      : 'bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-600/30'
                  }`}
                >
                  {isRecording ? '⏹️ Stop Record' : '⏺️ Start Record'}
                </button>

                <button className="w-full py-2 px-4 rounded-lg text-sm font-bold bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-600/30 transition-all flex items-center justify-center space-x-2">
                  <Radio className="w-4 h-4" />
                  <span>Stream ROS</span>
                </button>

                <button className="w-full py-2 px-4 rounded-lg text-sm font-bold bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-600/30 transition-all flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Waypoint Nav</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto Mode Info */}
        {!controlsMinimized && mode === 'auto' && (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Radio className="w-10 h-10 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Mode Otomatis</h3>
              <p className="text-sm text-gray-400">Kontrol manual dinonaktifkan</p>
              <p className="text-xs text-gray-500 mt-2">Pattern: {autoPattern || 'Idle'}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        @media (orientation: landscape) {
          .drone-landscape-container {
            flex-direction: row;
          }
        }

        @media (orientation: portrait) {
          .drone-landscape-container {
            flex-direction: column;
          }
        }

        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        button {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
