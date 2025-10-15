import React, { useState, useEffect, useRef } from 'react';
import {
  VideoIcon,
  PlayIcon,
  StopCircleIcon,
  RotateCwIcon,
  Settings2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Target,
  Battery,
  Wifi,
  AlertCircleIcon,
  MinusIcon,
  MaximizeIcon,
  MenuIcon,
  XIcon,
  CameraIcon,
  CloudIcon
} from 'lucide-react';
import { droneController, DroneStatus } from '../lib/droneController';
import { droneService, DroneResponse } from '../services/droneService';
import { auth } from '../lib/firebase';

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
  const [autoPattern, setAutoPattern] = useState<string>('');
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [pythonGuiLaunching, setPythonGuiLaunching] = useState(false);
  const [pythonGuiMessage, setPythonGuiMessage] = useState('');
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
      // Check if screen orientation API is available
      if ('orientation' in screen && 'lock' in screen.orientation) {
        await screen.orientation.lock('landscape');
        setOrientationLocked(true);
        console.log('Orientation locked to landscape');
      } else if ('lockOrientation' in screen) {
        // Fallback for older browsers
        (screen as any).lockOrientation('landscape');
        setOrientationLocked(true);
      } else {
        // For browsers without orientation lock API, use CSS transform
        document.body.style.transform = 'rotate(90deg)';
        document.body.style.transformOrigin = 'center center';
        document.body.style.width = '100vh';
        document.body.style.height = '100vw';
        setOrientationLocked(true);
      }
    } catch (error) {
      console.log('Could not lock orientation:', error);
      // Fallback: show a message to user to rotate device manually
      if (window.innerHeight > window.innerWidth) {
        // Portrait mode detected, add visual indicator
        const rotateMessage = document.createElement('div');
        rotateMessage.id = 'rotate-message';
        rotateMessage.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; color: white; text-align: center; font-family: sans-serif;">
            <div>
              <div style="font-size: 4rem; margin-bottom: 1rem;">📱➡️📱</div>
              <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">Putar Perangkat</div>
              <div style="font-size: 1rem; opacity: 0.8;">Harap putar perangkat Anda ke mode lanskap untuk pengalaman kontrol drone terbaik</div>
            </div>
          </div>
        `;
        document.body.appendChild(rotateMessage);
        
        // Remove message when orientation changes to landscape
        const checkOrientation = () => {
          if (window.innerWidth > window.innerHeight) {
            const message = document.getElementById('rotate-message');
            if (message) {
              message.remove();
            }
            window.removeEventListener('resize', checkOrientation);
          }
        };
        window.addEventListener('resize', checkOrientation);
      }
    }
  };

  const unlockOrientation = async () => {
    try {
      if ('orientation' in screen && 'unlock' in screen.orientation) {
        screen.orientation.unlock();
      } else if ('unlockOrientation' in screen) {
        (screen as any).unlockOrientation();
      } else {
        // Reset CSS transform
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
      setOrientationLocked(false);
      
      // Remove rotate message if it exists
      const message = document.getElementById('rotate-message');
      if (message) {
        message.remove();
      }
    } catch (error) {
      console.log('Could not unlock orientation:', error);
    }
  };

  // Check screen size and orientation
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(portrait);
      
      // Auto-minimize controls only on very small screens in portrait
      // For landscape drone control, keep controls visible
      if (mobile && portrait && window.innerHeight < 500) {
        setControlsMinimized(true);
        setSidebarMinimized(true);
      } else {
        // Keep controls visible for landscape drone operation
        setControlsMinimized(false);
        setSidebarMinimized(false);
      }
    };
    
    // Set viewport meta tag for mobile
    const setViewport = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    };
    
    setViewport();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkScreenSize, 100); // Delay to get accurate dimensions after orientation change
    });
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  // Initialize drone controller and handle orientation
  useEffect(() => {
    // Always request landscape orientation when component mounts
    requestLandscapeOrientation();
    
    droneController.onStatusChange(setDroneStatus);
    droneController.onVideoStream((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
    
    return () => {
      droneController.disconnect();
      // Unlock orientation when leaving the component
      unlockOrientation();
    };
  }, []);

  // Send movement commands when controls change
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
      if (mode === 'auto') return; // Disable manual controls in auto mode
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setControls(prev => ({ ...prev, forward: true }));
          break;
        case 's':
          setControls(prev => ({ ...prev, backward: true }));
          break;
        case 'a':
          setControls(prev => ({ ...prev, left: true }));
          break;
        case 'd':
          setControls(prev => ({ ...prev, right: true }));
          break;
        case 'q':
          setControls(prev => ({ ...prev, rotateLeft: true }));
          break;
        case 'e':
          setControls(prev => ({ ...prev, rotateRight: true }));
          break;
        case ' ':
          e.preventDefault();
          setControls(prev => ({ ...prev, up: true }));
          break;
        case 'shift':
          setControls(prev => ({ ...prev, down: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (mode === 'auto') return;
      
      switch (e.key.toLowerCase()) {
        case 'w':
          setControls(prev => ({ ...prev, forward: false }));
          break;
        case 's':
          setControls(prev => ({ ...prev, backward: false }));
          break;
        case 'a':
          setControls(prev => ({ ...prev, left: false }));
          break;
        case 'd':
          setControls(prev => ({ ...prev, right: false }));
          break;
        case 'q':
          setControls(prev => ({ ...prev, rotateLeft: false }));
          break;
        case 'e':
          setControls(prev => ({ ...prev, rotateRight: false }));
          break;
        case ' ':
          e.preventDefault();
          setControls(prev => ({ ...prev, up: false }));
          break;
        case 'shift':
          setControls(prev => ({ ...prev, down: false }));
          break;
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
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      rotateLeft: false,
      rotateRight: false,
    });
  };

  const handleRecord = () => {
    if (!droneStatus.connected) return;
    setIsRecording(!isRecording);
  };

  const handleAutoPattern = async (pattern: 'circle' | 'square' | 'follow') => {
    if (!droneStatus.flying || mode !== 'auto') return;
    
    setAutoPattern(pattern);
    await droneController.executeAutoPattern(pattern);
    setAutoPattern('');
  };

  const handleFlip = async () => {
    if (!droneStatus.connected || !droneStatus.flying) return;
    await droneController.sendCommand({ type: 'action', action: 'flip' });
  };

  const handleLaunchPythonGUI = async () => {
    try {
      setPythonGuiLaunching(true);
      setPythonGuiMessage('Meluncurkan Pengendali Drone Python...');

      const response: DroneResponse = await droneService.launchDroneGUI();

      setPythonGuiMessage(response.message);

      if (response.status === 'success') {
        // Show success message for a moment, then clear
        setTimeout(() => {
          setPythonGuiMessage('');
        }, 3000);
      } else if (response.status === 'error') {
        // Show error message longer
        setTimeout(() => {
          setPythonGuiMessage('');
        }, 5000);
      }
    } catch (error) {
      setPythonGuiMessage(`Gagal meluncurkan GUI Python: ${error}`);
      setTimeout(() => {
        setPythonGuiMessage('');
      }, 5000);
    } finally {
      setPythonGuiLaunching(false);
    }
  };

  // Google Drive Functions - Using Google Identity Services
  const handleConnectGoogleDrive = async () => {
    try {
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!CLIENT_ID || CLIENT_ID === "YOUR_CLIENT_ID") {
        setUploadMessage("❌ Google Client ID belum dikonfigurasi. Periksa file .env");
        setTimeout(() => setUploadMessage(''), 5000);
        return;
      }

      setUploadMessage("🔄 Membuka login Google...");

      // Method 1: Using OAuth 2.0 with same-window redirect
      const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
      const REDIRECT_URI = window.location.origin + window.location.pathname;
      const STATE = Math.random().toString(36).substring(7);

      // Save state for verification
      sessionStorage.setItem('oauth_state', STATE);
      sessionStorage.setItem('oauth_return_path', window.location.pathname);

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('state', STATE);
      authUrl.searchParams.set('prompt', 'select_account');

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();

    } catch (error) {
      console.error("OAuth error:", error);
      setUploadMessage(`❌ Gagal terhubung: ${error}`);
      setTimeout(() => setUploadMessage(''), 5000);
    }
  };

  // Handle OAuth callback on page load
  useEffect(() => {
    const handleOAuthCallback = () => {
      // Check if we have hash fragment (OAuth response)
      const hash = window.location.hash;
      if (!hash) return;

      console.log('[OAuth] Processing callback...');

      try {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const error = params.get('error');
        const savedState = sessionStorage.getItem('oauth_state');

        // Check for OAuth errors
        if (error) {
          console.error('[OAuth] Error from Google:', error);
          const errorDesc = params.get('error_description') || 'Unknown error';
          setUploadMessage(`❌ OAuth error: ${errorDesc}`);
          setTimeout(() => setUploadMessage(''), 5000);
          return;
        }

        if (accessToken) {
          console.log('[OAuth] Access token received');

          // Verify state to prevent CSRF
          if (state !== savedState) {
            console.error('[OAuth] State mismatch - possible CSRF attack');
            console.error('[OAuth] Expected:', savedState, 'Got:', state);
            setUploadMessage("❌ Kesalahan keamanan - silakan coba lagi");
            setTimeout(() => setUploadMessage(''), 5000);
            return;
          }

          console.log('[OAuth] State verified, storing token');

          // Success! Store token
          setGoogleAccessToken(accessToken);

          // Get user info
          console.log('[OAuth] Fetching user info...');
          fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            console.log('[OAuth] User info received:', data.email);
            setConnectedGoogleEmail(data.email || "Terhubung");
            setUploadMessage(`✅ Terhubung sebagai ${data.email}`);
            setTimeout(() => setUploadMessage(''), 5000);
          })
          .catch(err => {
            console.warn('[OAuth] Failed to fetch user info:', err);
            setConnectedGoogleEmail("Terhubung");
            setUploadMessage("✅ Terhubung ke Google Drive");
            setTimeout(() => setUploadMessage(''), 3000);
          });

          // Clean up
          sessionStorage.removeItem('oauth_state');
          console.log('[OAuth] Cleanup complete');

          // Clean URL (remove hash)
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (error) {
        console.error("[OAuth] Error parsing response:", error);
        setUploadMessage("❌ Gagal memproses respons login");
        setTimeout(() => setUploadMessage(''), 5000);
      }
    };

    // Suppress Chrome extension errors during OAuth
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known Chrome extension errors
      const message = args[0]?.toString() || '';
      if (
        message.includes('message channel closed') ||
        message.includes('Extension context invalidated')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };

    handleOAuthCallback();

    // Restore original console.error after a delay
    setTimeout(() => {
      console.error = originalError;
    }, 5000);
  }, []);

  const capturePhotoFromVideo = async () => {
    if (!videoRef.current || !droneStatus.connected) {
      setUploadMessage("⚠️ Tidak ada video yang tersedia");
      setTimeout(() => setUploadMessage(''), 3000);
      return null;
    }

    try {
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
    } catch (error) {
      console.error("Error capturing photo:", error);
      return null;
    }
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
    // Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
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

    if (!res.ok) {
      throw new Error(`Gagal mengunggah: ${res.statusText}`);
    }

    return await res.json();
  };

  const handleCaptureAndUpload = async () => {
    if (!googleAccessToken) {
      setUploadMessage("⚠️ Harap hubungkan ke Google Drive terlebih dahulu");
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setIsCapturing(true);
    setUploadMessage("📸 Mengambil foto...");

    try {
      const dataUrl = await capturePhotoFromVideo();
      if (!dataUrl) {
        throw new Error("Gagal mengambil foto");
      }

      setUploadMessage("☁️ Mengunggah ke Google Drive...");

      const blob = dataURLToBlob(dataUrl);
      const timestamp = Date.now();
      const filename = `tello_${timestamp}.jpg`;
      const folderId = await ensureDriveFolder(googleAccessToken, uploadFolder);

      await uploadImageToDrive(googleAccessToken, folderId, filename, blob);

      setUploadMessage(`✅ Foto berhasil diunggah: ${filename}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error: any) {
      setUploadMessage(`❌ Gagal mengunggah: ${error.message}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className={`drone-camera-container h-screen w-screen flex bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden ${
      isPortrait ? 'flex-col' : 'flex-col'
    }`}>
      {/* Modern Header with Drone ROS2 Branding */}
      <div className={`relative bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl border-b border-gray-700/30 shrink-0 ${
        isMobile ? 'px-4 py-2' : 'px-8 py-3'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-orange-500/5"></div>

        <div className="relative flex items-center justify-between">
          <div className={`flex items-center ${
            isMobile ? 'space-x-3' : 'space-x-6'
          }`}>
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarMinimized(!sidebarMinimized)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20"
                title={sidebarMinimized ? "Buka menu" : "Tutup menu"}
              >
                {sidebarMinimized ? <MenuIcon className="w-4 h-4 text-white" /> : <XIcon className="w-4 h-4 text-white" />}
              </button>
            )}

            {/* Drone ROS2 Branding */}
            <div className={`flex items-center ${
              isMobile ? 'space-x-2' : 'space-x-4'
            }`}>
              <div className="flex items-center space-x-2">
                {/* Drone Logo Placeholder */}
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className={`font-bold text-white ${
                    isMobile ? 'text-sm' : 'text-lg'
                  }`}>Drone</h1>
                  <span className={`text-orange-400 font-medium ${
                    isMobile ? 'text-[10px]' : 'text-xs'
                  }`}>Pengendali ROS2</span>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/20 backdrop-blur-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  droneStatus.connected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
                } animate-pulse`}></div>
                <span className={`font-medium ${
                  droneStatus.connected ? 'text-emerald-400' : 'text-red-400'
                } ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {droneStatus.connected ? 'TERHUBUNG' : 'TERPUTUS'}
                </span>
              </div>
            </div>
            
            {/* Mode Indicator */}
            <div className={`px-4 py-2 rounded-xl font-bold border-2 transition-all duration-200 ${
              mode === 'manual' 
                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/60 text-blue-300 shadow-lg shadow-blue-500/20' 
                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/60 text-purple-300 shadow-lg shadow-purple-500/20'
            } ${isMobile ? 'text-xs' : 'text-sm'}`}>
              MODE {mode === 'manual' ? 'MANUAL' : 'OTOMATIS'}
            </div>

            {/* Python GUI Launcher */}
            <button
              onClick={handleLaunchPythonGUI}
              disabled={pythonGuiLaunching}
              className={`px-4 py-2 rounded-xl font-bold border-2 transition-all duration-300 active:scale-95 ${
                pythonGuiLaunching
                  ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-400/60 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/60 text-green-300 shadow-lg shadow-green-500/20 hover:from-green-500/30 hover:to-emerald-500/30'
              } ${isMobile ? 'text-xs' : 'text-sm'}`}
              title="Luncurkan GUI Pengendali Drone Python"
            >
              {pythonGuiLaunching ? '⏳ MELUNCURKAN...' : '🐍 PYTHON GUI'}
            </button>

            {/* Google Drive Connection */}
            <button
              onClick={handleConnectGoogleDrive}
              disabled={!!googleAccessToken}
              className={`px-4 py-2 rounded-xl font-bold border-2 transition-all duration-300 active:scale-95 ${
                googleAccessToken
                  ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/60 text-blue-300 shadow-lg shadow-blue-500/20'
                  : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/60 text-blue-300 shadow-lg shadow-blue-500/20 hover:from-blue-500/30 hover:to-cyan-500/30'
              } ${isMobile ? 'text-xs' : 'text-sm'}`}
              title={googleAccessToken ? `Terhubung: ${connectedGoogleEmail}` : "Hubungkan ke Google Drive"}
            >
              {googleAccessToken ? '✅ GDRIVE' : '☁️ GDRIVE'}
            </button>
          </div>
        
          {/* Modern Telemetry Dashboard */}
          <div className={`flex items-center ${
            isMobile ? 'space-x-2' : 'space-x-4'
          }`}>
            {!sidebarMinimized && (
              <div className={`flex items-center ${
                isMobile ? 'space-x-2' : 'space-x-4'
              }`}>
                {/* Battery Status */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/20 backdrop-blur-sm">
                  <Battery className={`w-4 h-4 ${droneStatus.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className={`font-bold text-sm ${droneStatus.battery < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {droneStatus.battery.toFixed(0)}%
                  </span>
                </div>
                
                {/* Signal Strength */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/20 backdrop-blur-sm">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-bold text-sm">{droneStatus.signalStrength}/4</span>
                </div>
                
                {/* Altitude */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/20 backdrop-blur-sm">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-bold text-sm">{droneStatus.altitude.toFixed(1)}m</span>
                </div>
              </div>
            )}
            
            {/* Flight Status Indicator */}
            {droneStatus.flying && (
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-2 border-emerald-400/60 rounded-xl shadow-lg shadow-emerald-500/20">
                <span className="text-emerald-300 font-bold text-sm">✈️ SEDANG TERBANG</span>
              </div>
            )}
            
            {/* Control toggles */}
            <div className="flex items-center space-x-2">
              {/* Sidebar minimize toggle */}
              {!isMobile && (
                <button
                  onClick={() => setSidebarMinimized(!sidebarMinimized)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20 active:scale-95"
                  title={sidebarMinimized ? 'Tampilkan panel info' : 'Sembunyikan panel info'}
                >
                  {sidebarMinimized ? <MaximizeIcon className="w-4 h-4 text-white" /> : <MinusIcon className="w-4 h-4 text-white" />}
                </button>
              )}
              
              {/* Orientation Toggle Button */}
              <button
                onClick={orientationLocked ? unlockOrientation : requestLandscapeOrientation}
                className={`p-2 rounded-xl transition-all duration-200 active:scale-95 border ${
                  orientationLocked
                    ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-blue-400/60 text-blue-300 shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm'
                }`}
                title={orientationLocked ? 'Buka kunci orientasi' : 'Kunci ke mode lanskap'}
              >
                <RotateCwIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Video Stream with Integrated Controls */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster="/api/placeholder/800/600"
          />
          
          {/* Video Overlay with Controls */}
          <div className="absolute inset-0">
            {/* Enhanced Crosshair with Grid */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <Target className="w-6 h-6 text-white/60" />
                {/* Grid Lines */}
                <div className="absolute inset-0 w-32 h-24 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-full h-full border border-white/20 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/10"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Python GUI Status Notification */}
            {pythonGuiMessage && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                <div className={`px-6 py-3 rounded-2xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 ${
                  pythonGuiMessage.includes('Gagal') || pythonGuiMessage.includes('Error')
                    ? 'bg-gradient-to-r from-red-600/80 to-rose-600/80 border-red-400/60 text-white'
                    : pythonGuiMessage.includes('berhasil') || pythonGuiMessage.includes('diluncurkan')
                    ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 border-green-400/60 text-white'
                    : 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-blue-400/60 text-white'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      pythonGuiMessage.includes('Gagal') || pythonGuiMessage.includes('Error')
                        ? 'bg-red-300 animate-pulse'
                        : pythonGuiMessage.includes('berhasil') || pythonGuiMessage.includes('diluncurkan')
                        ? 'bg-green-300'
                        : 'bg-blue-300 animate-spin'
                    }`}></div>
                    <span className="font-bold text-sm">{pythonGuiMessage}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Status Notification */}
            {uploadMessage && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                <div className={`px-6 py-3 rounded-2xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 ${
                  uploadMessage.includes('❌') || uploadMessage.includes('Gagal')
                    ? 'bg-gradient-to-r from-red-600/80 to-rose-600/80 border-red-400/60 text-white'
                    : uploadMessage.includes('✅') || uploadMessage.includes('berhasil')
                    ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 border-green-400/60 text-white'
                    : 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-blue-400/60 text-white'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      uploadMessage.includes('❌') || uploadMessage.includes('Gagal')
                        ? 'bg-red-300 animate-pulse'
                        : uploadMessage.includes('✅')
                        ? 'bg-green-300'
                        : 'bg-blue-300 animate-spin'
                    }`}></div>
                    <span className="font-bold text-sm">{uploadMessage}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Corner Status Indicators */}
            <div className="absolute top-3 left-3 pointer-events-none">
              {isRecording && (
                <div className="bg-red-500/30 backdrop-blur-sm border border-red-500/50 rounded-lg px-3 py-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-bold">MEREKAM</span>
                  </div>
                </div>
              )}
            </div>

            {/* Capture Photo Button */}
            {droneStatus.connected && googleAccessToken && (
              <div className="absolute bottom-6 right-6 pointer-events-auto z-50">
                <button
                  onClick={handleCaptureAndUpload}
                  disabled={isCapturing}
                  className={`p-4 rounded-full transition-all duration-300 active:scale-95 shadow-2xl border-4 ${
                    isCapturing
                      ? 'bg-gradient-to-r from-gray-600/60 to-gray-700/60 border-gray-500/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600/90 hover:to-cyan-600/90 border-blue-400/80 shadow-blue-500/50'
                  }`}
                  title="Ambil foto dan unggah ke Google Drive"
                >
                  <CameraIcon className={`w-8 h-8 text-white ${isCapturing ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            )}

            {/* Folder Name Input (shown when GDrive connected) */}
            {googleAccessToken && (
              <div className="absolute bottom-6 left-6 pointer-events-auto z-40">
                <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-xl rounded-xl p-3 border border-white/30 shadow-2xl">
                  <label className="text-xs text-gray-300 mb-1 block">Nama Folder:</label>
                  <input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="bg-gray-900/60 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-48 focus:outline-none focus:border-blue-500"
                    placeholder="tello_captures"
                  />
                </div>
              </div>
            )}
            
            {/* Modern Controls Toggle - Floating */}
            {mode === 'manual' && (
              <div className="absolute top-6 right-6 pointer-events-auto minimize-toggle z-50">
                <button
                  onClick={() => setControlsMinimized(!controlsMinimized)}
                  className="p-3 rounded-2xl bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-xl border border-white/30 text-white hover:from-black/80 hover:to-gray-900/80 transition-all duration-300 active:scale-95 shadow-2xl shadow-black/50 group"
                  title={controlsMinimized ? 'Tampilkan panel kontrol' : 'Sembunyikan panel kontrol'}
                >
                  {controlsMinimized ?
                    <MaximizeIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" /> :
                    <MinusIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                  }
                </button>
              </div>
            )}

            {/* Python Native GUI Notice */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/30 shadow-2xl max-w-md text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-white rounded-lg"></div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Pengendali Drone</h2>
                  <p className="text-gray-300 text-sm">Antarmuka Python Native</p>
                </div>

                <div className="space-y-4 text-sm text-gray-300">
                  <p>🎮 Kontrol joystick lengkap</p>
                  <p>📹 Kamera waktu nyata</p>
                  <p>🔄 Pola terbang otomatis</p>
                  <p>⌨️ Pintasan keyboard (WASD)</p>
                  <p>🚨 Fitur keamanan darurat</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-xs text-gray-400">
                    Klik tombol "🐍 PYTHON GUI" di atas untuk meluncurkan
                  </p>
                </div>
              </div>
            </div>

            {/* Legacy React Controls (hidden) */}
            <div className="hidden">
            {mode === 'manual' && !controlsMinimized && (
              <>
                {/* Right Joystick - Movement Controls */}
                <div className="absolute right-6 bottom-24 pointer-events-auto">
                  <div className="relative">
                    {/* Joystick Base */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-black/40 to-gray-900/60 backdrop-blur-xl border-2 border-white/20 shadow-2xl shadow-black/50 flex items-center justify-center">
                      {/* Joystick Background Ring */}
                      <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
                        {/* Direction Buttons */}
                        <div className="relative w-24 h-24">
                          {/* Up */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, forward: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, forward: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, forward: false }))}
                            onTouchStart={() => setControls(prev => ({ ...prev, forward: true }))}
                            onTouchEnd={() => setControls(prev => ({ ...prev, forward: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.forward 
                                ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50 border-2 border-cyan-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-t from-white/10 to-white/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Down */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, backward: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, backward: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, backward: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.backward 
                                ? 'bg-gradient-to-b from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50 border-2 border-cyan-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-b from-white/10 to-white/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ArrowDownIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Left */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, left: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, left: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, left: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.left 
                                ? 'bg-gradient-to-l from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50 border-2 border-cyan-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-l from-white/10 to-white/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ArrowLeftIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Right */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, right: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, right: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, right: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.right 
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-400/50 border-2 border-cyan-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-r from-white/10 to-white/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ArrowRightIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Center Indicator */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-white/40 to-white/20 border border-white/50"></div>
                        </div>
                      </div>
                    </div>
                    {/* Label */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-bold text-white/80 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">PERGERAKAN</span>
                    </div>
                  </div>
                </div>

                {/* Left Joystick - Rotation & Altitude Controls */}
                <div className="absolute left-6 bottom-24 pointer-events-auto">
                  <div className="relative">
                    {/* Joystick Base */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-black/40 to-gray-900/60 backdrop-blur-xl border-2 border-white/20 shadow-2xl shadow-black/50 flex items-center justify-center">
                      {/* Joystick Background Ring */}
                      <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
                        {/* Control Buttons */}
                        <div className="relative w-24 h-24">
                          {/* Up - Altitude Up */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, up: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, up: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, up: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.up 
                                ? 'bg-gradient-to-t from-emerald-500 to-green-500 shadow-lg shadow-emerald-400/50 border-2 border-emerald-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-t from-white/10 to-white/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ChevronUpIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Down - Altitude Down */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, down: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, down: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, down: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.down 
                                ? 'bg-gradient-to-b from-red-500 to-rose-500 shadow-lg shadow-red-400/50 border-2 border-red-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-b from-white/10 to-white/20 hover:from-red-500/30 hover:to-rose-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <ChevronDownIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Left - Rotate Left */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, rotateLeft: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, rotateLeft: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, rotateLeft: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.rotateLeft 
                                ? 'bg-gradient-to-l from-amber-500 to-yellow-500 shadow-lg shadow-amber-400/50 border-2 border-amber-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-l from-white/10 to-white/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <RotateCwIcon className="w-4 h-4 mx-auto text-white transform scale-x-[-1] drop-shadow-lg" />
                          </button>

                          {/* Right - Rotate Right */}
                          <button
                            onMouseDown={() => setControls(prev => ({ ...prev, rotateRight: true }))}
                            onMouseUp={() => setControls(prev => ({ ...prev, rotateRight: false }))}
                            onMouseLeave={() => setControls(prev => ({ ...prev, rotateRight: false }))}
                            disabled={!droneStatus.flying}
                            className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation ${
                              controls.rotateRight 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-400/50 border-2 border-amber-300' 
                                : droneStatus.flying 
                                ? 'bg-gradient-to-r from-white/10 to-white/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-white/30' 
                                : 'bg-gray-600/20 border border-gray-500/30 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <RotateCwIcon className="w-4 h-4 mx-auto text-white drop-shadow-lg" />
                          </button>

                          {/* Center Indicator */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-white/40 to-white/20 border border-white/50"></div>
                        </div>
                      </div>
                    </div>
                    {/* Label */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-bold text-white/80 bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">ROTASI/KETINGGIAN</span>
                    </div>
                  </div>
                </div>

                {/* Floating Speed Control Panel */}
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 pointer-events-auto">
                  <div className="bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-2xl shadow-black/50">
                    <div className="flex flex-col items-center space-y-3">
                      {/* Speed Label */}
                      <div className="text-xs font-bold text-white/90">KECEPATAN</div>
                      
                      {/* Vertical Speed Slider */}
                      <div className="relative h-32 w-6 bg-gradient-to-t from-gray-800/60 to-gray-700/60 rounded-full border border-white/20 shadow-inner">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={speed}
                          onChange={(e) => setSpeed(parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                        />
                        
                        {/* Speed Indicator */}
                        <div 
                          className="absolute w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full border-2 border-white shadow-lg shadow-cyan-400/50 transition-all duration-200"
                          style={{ 
                            bottom: `${((speed - 10) / 90) * (128 - 16)}px`,
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        ></div>
                        
                        {/* Speed Track Fill */}
                        <div 
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
                          style={{ height: `${((speed - 10) / 90) * 100}%` }}
                        ></div>
                      </div>
                      
                      {/* Speed Value Display */}
                      <div className="flex flex-col items-center space-y-1">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 rounded-xl">
                          <span className="text-sm font-bold text-cyan-300">{speed}%</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-white/60">
                          <span>10</span>
                          <div className="w-8 h-px bg-white/20"></div>
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            </div> {/* End hidden legacy controls */}

            {/* Python GUI Launch Control Bar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <div className={`bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-2xl rounded-2xl border-2 border-white/30 shadow-2xl shadow-black/50 ${
                isMobile ? 'px-6 py-4' : 'px-10 py-6'
              }`}>
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/5 to-orange-500/10 rounded-2xl"></div>
                
                <div className="relative flex flex-col items-center space-y-6">
                  {/* Main Python GUI Launch Button */}
                  <button
                    onClick={handleLaunchPythonGUI}
                    disabled={pythonGuiLaunching}
                    className={`relative group rounded-3xl font-bold transition-all duration-500 active:scale-95 shadow-2xl border-4 overflow-hidden ${
                      isMobile ? 'px-8 py-4 text-lg' : 'px-12 py-6 text-xl'
                    } ${
                      pythonGuiLaunching
                        ? 'bg-gradient-to-r from-gray-600/50 to-gray-700/50 border-gray-500/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border-emerald-400/80 text-white shadow-emerald-500/50 hover:shadow-emerald-400/60'
                    }`}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Content */}
                    <div className="relative flex items-center space-x-3">
                      <div className={`${pythonGuiLaunching ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                        {pythonGuiLaunching ? '⏳' : '🐍'}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="leading-tight">
                          {pythonGuiLaunching ? 'MELUNCURKAN...' : 'LUNCURKAN PYTHON GUI'}
                        </span>
                        <span className={`text-emerald-200 ${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
                          Pengendali Drone
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Feature highlights */}
                  <div className="flex items-center space-x-6 text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400">🎮</span>
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>Kontrol Lengkap</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">📹</span>
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>Video Langsung</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-400">🔄</span>
                      <span className={isMobile ? 'text-xs' : 'text-sm'}>Pola Otomatis</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>


      <style jsx>{`
        /* Landscape Layout Optimization */
        .drone-camera-container {
          overflow: hidden;
          position: relative;
        }

        /* Enhanced slider styling for landscape */
        .slider-horizontal {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          height: 4px;
        }

        .slider-horizontal::-webkit-slider-track {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.8));
          height: 4px;
          border-radius: 2px;
          border: 1px solid rgba(59, 130, 246, 0.5);
        }

        .slider-horizontal::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #3b82f6;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: 2px solid #1d4ed8;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
        }

        .slider-horizontal::-webkit-slider-thumb:hover {
          background: #1d4ed8;
          transform: scale(1.15);
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
        }

        /* Touch-optimized controls */
        .touch-manipulation {
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        /* Enhanced animations */
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 0 0 currentColor;
          }
          50% { 
            opacity: 0.8;
            box-shadow: 0 0 0 10px transparent;
          }
        }

        .animate-pulse {
          animation: pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Mobile optimizations - Force landscape for drone control */
        @media screen and (max-width: 768px) {
          .drone-camera-container {
            height: 100vh;
            width: 100vw;
          }
          
          /* Touch-friendly button sizing for mobile */
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Prevent text selection on mobile */
          * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Ensure landscape layout even on mobile portrait */
          .drone-camera-container {
            flex-direction: column;
          }
          
          /* Optimize video display */
          video {
            object-fit: cover;
            height: 100%;
            width: 100%;
          }
        }

        /* Landscape specific optimizations */
        @media screen and (orientation: landscape) {
          .drone-camera-container {
            height: 100vh;
            width: 100vw;
          }
          
          /* Compact mode for small screens */
          @media (max-height: 500px) {
            .drone-camera-container .text-lg {
              font-size: 1rem;
            }
            
            .drone-camera-container .px-6 {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            
            .drone-camera-container .py-3 {
              padding-top: 0.5rem;
              padding-bottom: 0.5rem;
            }
          }
        }

        /* Hide scrollbars and prevent scroll */
        ::-webkit-scrollbar {
          display: none;
        }
        
        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overflow: hidden;
        }

        /* Prevent zoom and bounce on iOS */
        * {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }

        input, button {
          -webkit-user-select: none;
        }

        /* Mobile-specific improvements */
        @supports (env(safe-area-inset-top)) {
          .drone-camera-container {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }

        /* Improve touch performance */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Ensure proper z-index layering */
        .drone-camera-container {
          position: relative;
        }

        /* Control panel spacing */
        .control-panel {
          margin: 8px;
          z-index: 10;
        }

        /* Minimize button highest priority */
        .minimize-toggle {
          z-index: 50 !important;
        }

        /* Disable double-tap zoom */
        button, input, select, textarea, a {
          touch-action: manipulation;
        }

        /* Professional glass morphism effects */
        .glass-panel {
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Enhanced drop shadows */
        .enhanced-shadow {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)) 
                  drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
        }

        /* Modern Joystick Animations */
        @keyframes joystickPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
        }

        .joystick-active {
          animation: joystickPulse 1.5s ease-in-out infinite;
        }

        /* Floating Panel Backdrop */
        .floating-panel {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        /* Emergency Button Pulse */
        @keyframes emergencyPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% { 
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        .emergency-active {
          animation: emergencyPulse 1s ease-in-out infinite;
        }

        /* DJI Brand Colors */
        .dji-orange { background: linear-gradient(135deg, #ff6b35, #f7931e); }
        .dji-blue { background: linear-gradient(135deg, #0066cc, #004499); }
        .dji-gray { background: linear-gradient(135deg, #2d3748, #1a202c); }
      `}</style>
    </div>
  );
}