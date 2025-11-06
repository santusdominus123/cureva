import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertCircle, CheckCircle, Sparkles, Camera, Upload,
  MessageSquare, Send, FileText, Info, Database, Box, Eye,
  Maximize2, RefreshCw, Settings, Loader2, Wrench
} from "lucide-react";
import { VLMAnalyzerEnhanced } from "../../components/features/VLMAnalyzerEnhanced";
import { ModelReconstructor } from "../../components/features/ModelReconstructor";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FileMetadata {
  name: string;
  size: number;
  format: string;
  vertices?: number;
  faces?: number;
  uploaded: Date;
}

const GaussianDemo: React.FC = () => {
  const [error] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [showVLM, setShowVLM] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya asisten AI Gaussian Splat. Saya dapat melihat dan menganalisis objek 3D yang Anda render. Upload file 3D untuk memulai, dan saya akan otomatis mendeteksi objeknya. Tanya saya apa saja!',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File metadata state
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);

  // Reconstruction state
  const [showReconstructor, setShowReconstructor] = useState(false);

  // Active panel for mobile
  const [activePanel, setActivePanel] = useState<'viewer' | 'chat' | 'analysis' | 'metadata' | 'reconstruct'>('viewer');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fungsi untuk capture screenshot dari iframe 3D viewer
  const captureScreenshot = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'CAPTURE_SCREENSHOT' }, '*');
    }
  };

  // Auto analyze screenshot ketika pertama kali captured
  const autoAnalyzeScreenshot = useCallback(async (imageDataUrl: string) => {
    try {
      console.log('🔍 Starting auto-analysis with screenshot...');
      setIsAutoDetecting(true);

      // Tambahkan pesan "detecting..." di chat
      const detectingMessage: ChatMessage = {
        role: 'assistant',
        content: '🔍 Mendeteksi objek 3D...',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, detectingMessage]);

      const { vlmServiceEnhanced } = await import('../../services/vlmServiceEnhanced');

      // Check if service is available
      if (!vlmServiceEnhanced.isAvailable()) {
        console.error('❌ VLM service not available - missing API key');
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '⚠️ VLM service belum dikonfigurasi. Silakan tambahkan VITE_GEMINI_API_KEY di file .env',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
        setIsAutoDetecting(false);
        return;
      }

      // Quick initial analysis dengan prompt yang lebih spesifik
      console.log('📸 Analyzing 3D object screenshot...');
      const responseText = await vlmServiceEnhanced.chatWithImage(
        imageDataUrl,
        'Identifikasi objek 3D pada gambar ini. Jelaskan dengan detail: 1) Jenis objek apa ini? 2) Bentuk dan karakteristik utama? 3) Material atau tekstur yang terlihat? Jawab dalam Bahasa Indonesia dengan ringkas.',
        []
      );

      console.log('✅ Analysis complete:', responseText);

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ Objek 3D terdeteksi!\n\n${responseText}\n\nSilakan tanya saya lebih lanjut tentang objek ini!`,
        timestamp: new Date()
      };

      // Replace detecting message dengan hasil
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.content !== '🔍 Mendeteksi objek 3D...');
        return [...filtered, aiMessage];
      });
      setIsAutoDetecting(false);
    } catch (error) {
      console.error('❌ Auto analysis error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Gagal menganalisis objek 3D. Error: ' + (error as Error).message,
        timestamp: new Date()
      };
      // Replace detecting message dengan error
      setChatMessages(prev => {
        const filtered = prev.filter(msg => msg.content !== '🔍 Mendeteksi objek 3D...');
        return [...filtered, errorMessage];
      });
      setIsAutoDetecting(false);
    }
  }, []);

  // Listen untuk screenshot result dan file loaded dari iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received message from iframe:', event.data.type);

      if (event.data.type === 'SCREENSHOT_RESULT') {
        console.log('📸 Screenshot received, length:', event.data.dataUrl?.substring(0, 50));
        setCapturedImage(event.data.dataUrl);
        setUploadedImage(null);

        // Tampilkan VLM panel untuk analisis manual
        setShowVLM(true);
        console.log('✅ Screenshot captured. VLM panel opened for analysis.');
      } else if (event.data.type === 'FILE_LOADED') {
        console.log('📁 File loaded:', event.data.metadata);
        // Auto-populate metadata ketika file di-load
        const metadata: FileMetadata = {
          name: event.data.metadata.name,
          size: event.data.metadata.size,
          format: event.data.metadata.format,
          vertices: event.data.metadata.vertices,
          uploaded: new Date(event.data.metadata.uploaded)
        };
        setFileMetadata(metadata);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [autoAnalyzeScreenshot]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setCapturedImage(null);
      setShowVLM(true);
    }
  };

  // Get current image untuk VLM
  const getCurrentImage = (): File | string | undefined => {
    if (uploadedImage) return uploadedImage;
    if (capturedImage) return capturedImage;
    return undefined;
  };

  // Handle chat submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    const currentQuestion = chatInput;
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Import VLM service
      const { vlmServiceEnhanced } = await import('../../services/vlmServiceEnhanced');

      // Check if we have a captured image
      const imageToAnalyze = getCurrentImage();

      if (!imageToAnalyze) {
        // No image available
        const aiResponse: ChatMessage = {
          role: 'assistant',
          content: 'Maaf, saya memerlukan screenshot dari objek 3D untuk menjawab pertanyaan Anda. Silakan load file 3D terlebih dahulu atau ambil screenshot.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
        setIsChatLoading(false);
        return;
      }

      // Get conversation history (last 4 messages for context)
      const history = chatMessages.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call VLM service with image and conversation history
      const responseText = await vlmServiceEnhanced.chatWithImage(
        imageToAnalyze,
        currentQuestion,
        history
      );

      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Pastikan API key Gemini sudah dikonfigurasi dengan benar.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="h-screen flex flex-col pb-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles size={28} className="text-purple-400" />
                Gaussian Splats 3D Studio
              </h1>
              <p className="text-sm text-gray-400">Advanced 3D Analysis & Visualization Platform</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={captureScreenshot}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
              >
                <Camera className="w-4 h-4" />
                Screenshot 3D
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
          {/* Left Column - 3D Viewer + Metadata */}
          <div className="col-span-5 flex flex-col gap-6 overflow-hidden">
            {/* 3D Viewer */}
            <div className="flex-1 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden flex flex-col">
              <div className="flex-shrink-0 border-b border-gray-800 px-5 py-3.5 flex items-center justify-between bg-gray-900/70">
                <div className="flex items-center gap-2.5">
                  <Box className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-base">3D Viewer</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                    <Maximize2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 relative">
                <iframe
                  ref={iframeRef}
                  src="/gaussian-viewer-simple.html"
                  className="absolute inset-0 w-full h-full border-0"
                  title="Gaussian Splat Viewer"
                  allow="cross-origin-isolated"
                  style={{ touchAction: 'none' }}
                />

                {error && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-md">
                    <div className="bg-red-500/95 backdrop-blur-sm text-white px-6 py-3 rounded-lg flex items-center shadow-2xl text-sm">
                      <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-md">
                    <div className="bg-green-500/95 backdrop-blur-sm text-white px-6 py-3 rounded-lg flex items-center shadow-2xl text-sm">
                      <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-gray-800 px-3 py-1.5 bg-gray-900/70">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <div>
                    <strong className="text-gray-300">Kontrol:</strong> Klik Kiri: Rotasi | Klik Kanan: Geser | Scroll: Zoom
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>

            {/* File Metadata */}
            <div className="flex-shrink-0 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-xs">File Metadata</h3>
              </div>

              {fileMetadata ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-[9px] text-gray-400 mb-0.5">Filename</div>
                    <div className="font-medium text-[10px] truncate">{fileMetadata.name}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-[9px] text-gray-400 mb-0.5">Format</div>
                    <div className="font-medium text-[10px] uppercase">{fileMetadata.format}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-[9px] text-gray-400 mb-0.5">File Size</div>
                    <div className="font-medium text-[10px]">{formatFileSize(fileMetadata.size)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-[9px] text-gray-400 mb-0.5">Uploaded</div>
                    <div className="font-medium text-[10px]">{fileMetadata.uploaded.toLocaleDateString()}</div>
                  </div>
                  {fileMetadata.vertices && (
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-[9px] text-gray-400 mb-0.5">Vertices</div>
                      <div className="font-medium text-[10px]">{fileMetadata.vertices.toLocaleString()}</div>
                    </div>
                  )}
                  {fileMetadata.faces && (
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-[9px] text-gray-400 mb-0.5">Faces</div>
                      <div className="font-medium text-[10px]">{fileMetadata.faces.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                  <p className="text-[10px]">No file loaded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - AI Chat */}
          <div className="col-span-4 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-gray-800 px-5 py-3.5 bg-gray-900/70">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-base">AI Chat Assistant</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="flex-shrink-0 border-t border-gray-800 p-4 bg-gray-900/50">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanya tentang objek 3D..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-green-600 text-white p-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - VLM Analysis & Reconstruction */}
          <div className="col-span-3 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-gray-800 px-5 py-3.5 bg-gray-900/70">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {showReconstructor ? (
                    <>
                      <Wrench className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="font-semibold text-base truncate">Rekonstruksi 3D</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span className="font-semibold text-base truncate">VLM Analysis</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowReconstructor(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !showReconstructor
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Analisis
                  </button>
                  <button
                    onClick={() => setShowReconstructor(true)}
                    disabled={!capturedImage}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      showReconstructor
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Repair
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {showReconstructor ? (
                capturedImage ? (
                  <ModelReconstructor
                    imageData={capturedImage}
                    onClose={() => setShowReconstructor(false)}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-2">Ambil screenshot terlebih dahulu</p>
                    <p className="text-xs">Gunakan tombol "Ambil Gambar" di viewer</p>
                  </div>
                )
              ) : (
                showVLM && getCurrentImage() ? (
                  <VLMAnalyzerEnhanced
                    imageFile={getCurrentImage()}
                    analysisType="artifact"
                    autoAnalyze={true}
                    withReferences={true}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-2">No image captured</p>
                    <p className="text-xs">Take a screenshot or upload an image to analyze</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout with Tabs - Compact
  return (
    <div className="h-screen flex flex-col pb-0 overflow-hidden">
      {/* Mobile Header - Ultra Compact */}
      <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles size={16} className="text-purple-400" />
            3D Studio
          </h1>
          <div className="flex gap-1.5">
            <button
              onClick={captureScreenshot}
              className="bg-purple-600 text-white p-1.5 rounded-lg active:scale-95 transition-transform"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white p-1.5 rounded-lg active:scale-95 transition-transform"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Mobile Tabs - Compact */}
        <div className="grid grid-cols-5 gap-0.5 bg-gray-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setActivePanel('viewer')}
            className={`py-1.5 px-1 rounded text-xs font-medium transition-all active:scale-95 ${
              activePanel === 'viewer'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5 mx-auto mb-0.5" />
            <span className="text-[10px]">Viewer</span>
          </button>
          <button
            onClick={() => setActivePanel('chat')}
            className={`py-1.5 px-1 rounded text-xs font-medium transition-all active:scale-95 ${
              activePanel === 'chat'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 mx-auto mb-0.5" />
            <span className="text-[10px]">Chat</span>
          </button>
          <button
            onClick={() => setActivePanel('analysis')}
            className={`py-1.5 px-1 rounded text-xs font-medium transition-all active:scale-95 ${
              activePanel === 'analysis'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 mx-auto mb-0.5" />
            <span className="text-[10px]">AI</span>
          </button>
          <button
            onClick={() => setActivePanel('reconstruct')}
            disabled={!capturedImage}
            className={`py-1.5 px-1 rounded text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              activePanel === 'reconstruct'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 mx-auto mb-0.5" />
            <span className="text-[10px]">Repair</span>
          </button>
          <button
            onClick={() => setActivePanel('metadata')}
            className={`py-1.5 px-1 rounded text-xs font-medium transition-all active:scale-95 ${
              activePanel === 'metadata'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 mx-auto mb-0.5" />
            <span className="text-[10px]">Info</span>
          </button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 overflow-hidden">
        {/* 3D Viewer Panel */}
        {activePanel === 'viewer' && (
          <div className="h-full bg-gray-900/50">
            <iframe
              ref={iframeRef}
              src="/gaussian-viewer-simple.html"
              className="w-full h-full border-0"
              title="Gaussian Splat Viewer"
              allow="cross-origin-isolated"
              style={{ touchAction: 'none' }}
            />
          </div>
        )}

        {/* Chat Panel - Compact */}
        {activePanel === 'chat' && (
          <div className="h-full flex flex-col bg-gray-900/50">
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-2.5 py-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-2 border-t border-gray-800">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanya AI..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-blue-600 text-white p-1.5 rounded-lg disabled:bg-gray-700 active:scale-95 transition-transform"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Analysis Panel - Compact */}
        {activePanel === 'analysis' && (
          <div className="h-full overflow-y-auto p-2 bg-gray-900/50">
            {showVLM && getCurrentImage() ? (
              <VLMAnalyzerEnhanced
                imageFile={getCurrentImage()}
                analysisType="artifact"
                autoAnalyze={true}
                withReferences={true}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xs">Ambil screenshot atau upload gambar</p>
              </div>
            )}
          </div>
        )}

        {/* Reconstruction Panel - Compact */}
        {activePanel === 'reconstruct' && (
          <div className="h-full overflow-y-auto p-2 bg-gray-900/50">
            {capturedImage ? (
              <ModelReconstructor
                imageData={capturedImage}
                onClose={() => setActivePanel('viewer')}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xs mb-1">Ambil screenshot terlebih dahulu</p>
                <p className="text-[10px] text-gray-600">Gunakan tombol "Ambil Gambar"</p>
              </div>
            )}
          </div>
        )}

        {/* Metadata Panel - Compact */}
        {activePanel === 'metadata' && (
          <div className="h-full overflow-y-auto p-2 bg-gray-900/50">
            <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-indigo-400" />
              File Info
            </h3>
            {fileMetadata ? (
              <div className="space-y-1.5">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400 mb-0.5">Filename</div>
                  <div className="font-medium text-xs truncate">{fileMetadata.name}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400 mb-0.5">Format</div>
                  <div className="font-medium text-xs uppercase">{fileMetadata.format}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-[10px] text-gray-400 mb-0.5">Size</div>
                  <div className="font-medium text-xs">{formatFileSize(fileMetadata.size)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xs">Load file 3D terlebih dahulu</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GaussianDemo;
