import React, { useState, useRef } from 'react';
import { Camera, Upload, Brain, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VLMAnalyzer } from '../components/VLMAnalyzer';
import { ImageChatInterface } from '../components/ImageChatInterface';
import { VLMAnalysisResult } from '../services/vlmService';

export const VLMDemo: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'general' | 'drone' | 'building' | 'agriculture'>('drone');
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('upload');
  const [viewMode, setViewMode] = useState<'analysis' | 'chat'>('analysis');
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
        video: { facingMode: 'environment', width: 1920, height: 1080 },
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

  // Capture photo from camera
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
        }, 'image/jpeg');
      }
    }
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result: VLMAnalysisResult) => {
    console.log('Analysis result:', result);
    // Bisa save ke database atau state management
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">VLM Demo</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Capture Mode Selection */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Gambar</h2>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setCaptureMode('upload');
                    stopCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    captureMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Upload
                </button>
                <button
                  onClick={() => {
                    setCaptureMode('camera');
                    if (!isCameraActive) startCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    captureMode === 'camera'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  Kamera
                </button>
              </div>

              {/* Upload Mode */}
              {captureMode === 'upload' && (
                <div>
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">Klik untuk upload gambar</p>
                      <p className="text-sm text-gray-500">PNG, JPG hingga 10MB</p>
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

              {/* Camera Mode */}
              {captureMode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  {isCameraActive && (
                    <div className="flex gap-2">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Ambil Foto
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analysis Type Selection */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Jenis Analisis</h2>
              <div className="space-y-2">
                {[
                  { value: 'general', label: 'Umum', desc: 'Analisis gambar secara umum' },
                  { value: 'drone', label: 'Foto Drone/Aerial', desc: 'Analisis foto dari udara' },
                  {
                    value: 'building',
                    label: 'Kerusakan Bangunan',
                    desc: 'Deteksi kerusakan struktur',
                  },
                  {
                    value: 'agriculture',
                    label: 'Pertanian',
                    desc: 'Analisis tanaman dan lahan',
                  },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      analysisType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysisType"
                      value={type.value}
                      checked={analysisType === type.value}
                      onChange={(e) =>
                        setAnalysisType(
                          e.target.value as 'general' | 'drone' | 'building' | 'agriculture'
                        )
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analysis / Chat */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Tab Selector */}
            <div className="flex border-b">
              <button
                onClick={() => setViewMode('analysis')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                  viewMode === 'analysis'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-5 h-5" />
                Analisis
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                  viewMode === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                Chat AI
              </button>
            </div>

            <div className="p-6">
              {viewMode === 'analysis' ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Hasil Analisis AI</h2>
                  <VLMAnalyzer
                    imageFile={selectedImage || undefined}
                    analysisType={analysisType}
                    onAnalysisComplete={handleAnalysisComplete}
                    autoAnalyze={false}
                  />
                </>
              ) : (
                <div className="h-[600px]">
                  <ImageChatInterface
                    imageFile={selectedImage || undefined}
                    autoStart={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Tentang VLM (Vision Language Model)</h3>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            Fitur ini menggunakan AI untuk menganalisis gambar. Tersedia 2 mode:
          </p>
          <ul className="text-sm text-blue-800 leading-relaxed space-y-2 list-disc list-inside">
            <li>
              <strong>Analisis:</strong> Deteksi otomatis objek, kondisi, tingkat kerusakan, dan
              rekomendasi tindakan
            </li>
            <li>
              <strong>Chat AI:</strong> Tanyakan apapun tentang gambar secara interaktif. Input
              pertanyaan di web app → Diproses di server OpenAI/Gemini → Output jawaban kembali ke
              web app Anda
            </li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            Provider: Google Gemini (gratis) atau OpenAI GPT-4 Vision (berbayar)
          </p>
        </div>
      </div>
    </div>
  );
};

export default VLMDemo;
