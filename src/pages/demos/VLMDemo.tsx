import React, { useState, useRef } from 'react';
import { Camera, Upload, Brain, ArrowLeft, MessageSquare, Sparkles, ChevronDown, Scroll } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VLMAnalyzerEnhanced } from '../../components/features/VLMAnalyzerEnhanced';
import { ImageChatInterface } from '../../components/features/ImageChatInterface';
import { VLMAnalysisResultEnhanced } from '../../services/vlmServiceEnhanced';

export const VLMDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'general' | 'artifact' | 'building' | 'nature'>('artifact');
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('upload');
  const [viewMode, setViewMode] = useState<'analysis' | 'chat'>('analysis');
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Gagal mengakses kamera');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedImage(file);
            stopCamera();
            setCaptureMode('upload');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result: VLMAnalysisResultEnhanced) => {
    console.log('Analysis result:', result);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const analysisTypes = [
    { value: 'artifact', label: 'Objek Bersejarah', icon: '🏺', desc: 'Analisis mendalam artefak & benda antik' },
    { value: 'building', label: 'Bangunan/Arsitektur', icon: '🏛️', desc: 'Analisis struktur bangunan' },
    { value: 'nature', label: 'Alam/Lingkungan', icon: '🌿', desc: 'Analisis ekosistem & lingkungan' },
    { value: 'general', label: 'Umum', icon: '🔍', desc: 'Analisis gambar secara umum' },
  ];

  const currentAnalysisType = analysisTypes.find(t => t.value === analysisType);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20 md:pb-0 min-h-screen">
      {/* Header - Compact Mobile */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1 sm:p-1.5 rounded-lg">
                  <Brain className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-bold text-gray-900">VLM Analyzer</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">AI Vision Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        <div className="lg:grid lg:grid-cols-5 lg:gap-4 space-y-2 lg:space-y-0">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-2 sm:space-y-3">

            {/* Image Input Card - Compact */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-2 sm:px-4 py-2 sm:py-2.5">
                <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-1.5 sm:gap-2">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  Input Gambar
                </h2>
              </div>

              <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                {/* Capture Mode Toggle - Compact */}
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => {
                      setCaptureMode('upload');
                      stopCamera();
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation active:scale-95 ${
                      captureMode === 'upload'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Upload</span>
                  </button>
                  <button
                    onClick={() => {
                      setCaptureMode('camera');
                      if (!isCameraActive) startCamera();
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation active:scale-95 ${
                      captureMode === 'camera'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Kamera</span>
                  </button>
                </div>

                {/* Upload Mode - Compact */}
                {captureMode === 'upload' && (
                  <div>
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 cursor-pointer transition-all hover:bg-blue-50/50 touch-manipulation active:scale-[0.98]">
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600 mb-0.5 font-medium">Tap untuk upload</p>
                        <p className="text-xs text-gray-500">PNG, JPG max 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Camera Mode - Compact */}
                {captureMode === 'camera' && (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden bg-black shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-video object-cover"
                      />
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    {isCameraActive && (
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2.5 sm:py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-1.5 font-medium touch-manipulation active:scale-95 text-xs sm:text-sm"
                        >
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                          Ambil Foto
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-3 py-2.5 sm:py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium touch-manipulation active:scale-95 text-xs sm:text-sm"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Type Selection - Compact */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowAnalysisOptions(!showAnalysisOptions)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between touch-manipulation active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                  <Scroll className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base font-semibold">Jenis Analisis</span>
                </div>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform lg:hidden ${showAnalysisOptions ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${showAnalysisOptions ? 'block' : 'hidden'} lg:block p-2 sm:p-3 space-y-1.5 sm:space-y-2`}>
                {/* Current Selection (Mobile) - Compact */}
                <div className="lg:hidden mb-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{currentAnalysisType?.icon}</span>
                    <div>
                      <div className="font-semibold text-indigo-900 text-xs">{currentAnalysisType?.label}</div>
                      <div className="text-xs text-indigo-700">{currentAnalysisType?.desc}</div>
                    </div>
                  </div>
                </div>

                {analysisTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-2 sm:gap-2.5 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all touch-manipulation active:scale-[0.98] ${
                      analysisType === type.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysisType"
                      value={type.value}
                      checked={analysisType === type.value}
                      onChange={(e) => {
                        setAnalysisType(e.target.value as 'general' | 'artifact' | 'building' | 'nature');
                        setShowAnalysisOptions(false);
                      }}
                      className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base sm:text-lg">{type.icon}</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{type.label}</span>
                      </div>
                      <div className="text-xs text-gray-600">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="hidden lg:block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tentang VLM
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Gunakan AI untuk menganalisis objek bersejarah, bangunan, dan alam dengan detail lengkap. Powered by Google Gemini 2.0.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Tab Selector - Compact */}
              <div className="flex border-b bg-gray-50">
                <button
                  onClick={() => setViewMode('analysis')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2.5 sm:py-3 font-medium transition-all touch-manipulation ${
                    viewMode === 'analysis'
                      ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Analisis Detail</span>
                </button>
                <button
                  onClick={() => setViewMode('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2.5 sm:py-3 font-medium transition-all touch-manipulation ${
                    viewMode === 'chat'
                      ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Chat AI</span>
                </button>
              </div>

              {/* Content Area - Compact */}
              <div className="p-2 sm:p-4">
                {viewMode === 'analysis' ? (
                  <VLMAnalyzerEnhanced
                    imageFile={selectedImage || undefined}
                    analysisType={analysisType}
                    onAnalysisComplete={handleAnalysisComplete}
                    autoAnalyze={false}
                    withReferences={true}
                  />
                ) : (
                  <div className="h-[400px] sm:h-[500px] md:h-[600px]">
                    <ImageChatInterface
                      imageFile={selectedImage || undefined}
                      autoStart={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VLMDemo;
