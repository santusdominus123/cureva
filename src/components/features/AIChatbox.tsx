import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2, Image as ImageIcon, Camera, ChevronDown } from 'lucide-react';
import { vlmServiceEnhanced as vlmService, VLMAnalysisResult } from '../../services/vlmServiceEnhanced';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  analysis?: VLMAnalysisResult;
}

interface AIChatboxProps {
  initialMessage?: string;
  modelContext?: {
    name?: string;
    type?: string;
    metadata?: any;
  };
  onClose?: () => void;
  position?: 'sidebar' | 'floating';
  className?: string;
}

export const AIChatbox: React.FC<AIChatboxProps> = ({
  initialMessage = "Halo! Saya AI Assistant. Upload gambar atau tanya apapun tentang model 3D Anda!",
  modelContext,
  onClose,
  position = 'sidebar',
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate preview URL untuk image
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim() || '📷 [Gambar dikirim]',
      image: previewUrl || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsAnalyzing(true);

    try {
      let analysisResult: VLMAnalysisResult | null = null;

      // Jika ada gambar, analisis dulu
      if (selectedImage) {
        analysisResult = await vlmService.analyzeImage(
          selectedImage,
          inputText.trim() || undefined
        );
      }

      // Generate response
      let responseContent = '';

      if (analysisResult) {
        if (analysisResult.success) {
          responseContent = analysisResult.description || 'Analisis selesai!';

          // Tambah info damage level jika ada
          if (analysisResult.damageLevel && analysisResult.damageLevel !== 'none') {
            const levelText = {
              low: 'Kerusakan Ringan',
              medium: 'Kerusakan Sedang',
              high: 'Kerusakan Berat',
              severe: 'Kerusakan Parah',
            }[analysisResult.damageLevel] || '';

            responseContent += `\n\n🔍 Tingkat: **${levelText}**`;
          }

          // Tambah detected objects
          if (analysisResult.detectedObjects && analysisResult.detectedObjects.length > 0) {
            responseContent += `\n\n📦 Terdeteksi: ${analysisResult.detectedObjects.join(', ')}`;
          }

          // Tambah recommendations
          if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
            responseContent += `\n\n💡 Rekomendasi:\n${analysisResult.recommendations.map(r => `• ${r}`).join('\n')}`;
          }
        } else {
          responseContent = `❌ ${analysisResult.error || 'Gagal menganalisis gambar'}`;
        }
      } else if (inputText.trim()) {
        // Response text-only (tanpa gambar)
        responseContent = generateTextResponse(inputText.trim(), modelContext);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        analysis: analysisResult || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mobile: Floating button when minimized
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110 active:scale-95"
        >
          <Bot className="w-6 h-6" />
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Mobile: Full screen overlay
  if (position === 'floating' && !isMinimized) {
    return (
      <>
        {/* Backdrop blur */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMinimized(true)}
        />

        {/* Chatbox container */}
        <div className={`
          fixed z-50
          ${position === 'floating'
            ? 'inset-x-0 bottom-0 top-16 md:bottom-4 md:right-4 md:top-auto md:left-auto md:w-96 md:h-[600px] md:rounded-2xl'
            : ''
          }
          flex flex-col bg-gradient-to-b from-gray-900 to-black md:bg-gray-900/95 backdrop-blur-xl
          md:rounded-2xl shadow-2xl border-t md:border border-gray-800 overflow-hidden
          animate-in slide-in-from-bottom md:slide-in-from-right duration-300
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-4 border-b border-gray-800 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2.5 shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm md:text-base">AI Assistant</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${vlmService.isAvailable() ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                  {vlmService.isAvailable() ? 'Online' : 'Text Only'}
                </p>
              </div>
            </div>
            <button
              onClick={() => position === 'floating' ? setIsMinimized(true) : onClose?.()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
            >
              {position === 'floating' ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <X className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 max-w-[85%] md:max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Uploaded"
                      className="rounded-xl mb-2 max-w-full h-auto max-h-48 md:max-h-56 object-cover shadow-lg border border-gray-700"
                    />
                  )}
                  <div
                    className={`rounded-2xl p-3 md:p-3.5 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-gray-800/90 text-gray-100 border border-gray-700/50'
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-60 mt-1.5">
                      {message.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="bg-gray-800/90 rounded-2xl p-3 md:p-3.5 shadow-lg border border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-300">Menganalisis...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="px-4 pb-2">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="rounded-xl max-h-24 md:max-h-28 object-cover shadow-lg border border-gray-700"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="flex gap-2 items-end">
              {/* Image Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="p-2.5 md:p-3 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50 active:scale-95 flex-shrink-0"
                title="Upload gambar"
              >
                <ImageIcon className="w-5 h-5 text-gray-400" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pesan..."
                disabled={isAnalyzing}
                className="flex-1 bg-gray-800 text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 text-sm md:text-base placeholder:text-gray-500"
                rows={1}
              />

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={isAnalyzing || (!inputText.trim() && !selectedImage)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl p-2.5 md:p-3 transition-all shadow-lg active:scale-95 flex-shrink-0"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {!vlmService.isAvailable() && (
              <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                <span>⚠️</span>
                <span>VLM belum dikonfigurasi. Text-only mode.</span>
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Sidebar mode
  return (
    <div className={`flex flex-col bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2 shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${vlmService.isAvailable() ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
              {vlmService.isAvailable() ? 'Online • Gemini Vision' : 'Text Only'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="rounded-lg mb-2 max-w-full h-auto max-h-48 object-cover shadow-lg border border-gray-700"
                />
              )}
              <div
                className={`rounded-xl p-3 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700/50'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 rounded-xl p-3 shadow-lg border border-gray-700/50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-300">Menganalisis...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-lg max-h-24 object-cover shadow-lg border border-gray-700"
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 shadow-lg"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex gap-2 items-end">
          {/* Image Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Upload gambar"
          >
            <ImageIcon className="w-5 h-5 text-gray-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan atau upload gambar..."
            disabled={isAnalyzing}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isAnalyzing || (!inputText.trim() && !selectedImage)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors shadow-lg"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {!vlmService.isAvailable() && (
          <p className="text-xs text-yellow-500 mt-2">
            ⚠️ VLM belum dikonfigurasi. Tambahkan VITE_GEMINI_API_KEY untuk analisis gambar.
          </p>
        )}
      </div>
    </div>
  );
};

// Helper function untuk generate text response
function generateTextResponse(input: string, modelContext?: any): string {
  const lowerInput = input.toLowerCase();

  // Pattern matching untuk pertanyaan umum
  if (lowerInput.includes('apa') || lowerInput.includes('what')) {
    if (lowerInput.includes('gaussian splat')) {
      return `Gaussian Splatting adalah teknik rendering 3D modern yang menggunakan representasi berbasis partikel (splat) untuk merekonstruksi scene 3D. Setiap splat adalah Gaussian 3D dengan posisi, rotasi, warna, dan opacity. Teknik ini sangat efisien untuk rendering real-time dan menghasilkan visual berkualitas tinggi.

Model saat ini: ${modelContext?.name || 'Tidak diketahui'}
Format: ${modelContext?.type || 'Unknown'}`;
    }

    if (lowerInput.includes('model') && modelContext) {
      return `Model yang sedang ditampilkan:
📦 Nama: ${modelContext.name || 'Tidak diketahui'}
🔧 Tipe: ${modelContext.type || 'Unknown'}
📊 Metadata: ${JSON.stringify(modelContext.metadata || {}, null, 2)}`;
    }
  }

  if (lowerInput.includes('cara') || lowerInput.includes('how')) {
    if (lowerInput.includes('upload') || lowerInput.includes('load')) {
      return `Untuk upload model 3D:
1. Klik tombol "Unggah" di sidebar atau area viewer
2. Pilih file (.ply, .obj, .splat, .ksplat)
3. Tunggu proses loading
4. Model akan tampil otomatis

Tips: File .ksplat akan loading paling cepat!`;
    }

    if (lowerInput.includes('analisis') || lowerInput.includes('analyze')) {
      return `Untuk analisis gambar dengan AI:
1. Klik icon kamera/gambar di chatbox
2. Upload gambar yang ingin dianalisis
3. Tambahkan pertanyaan (opsional)
4. AI akan menganalisis dan memberikan insight

Saya bisa deteksi objek, kondisi, kerusakan, dan memberikan rekomendasi!`;
    }
  }

  if (lowerInput.includes('help') || lowerInput.includes('bantuan')) {
    return `🤖 Saya bisa membantu dengan:

📷 **Analisis Gambar** - Upload gambar untuk deteksi objek, kondisi, kerusakan
🎯 **Info Model 3D** - Tanya tentang Gaussian Splats, format, metadata
💡 **Tutorial** - Cara upload, navigate, optimize model
🔧 **Troubleshooting** - Bantuan jika ada masalah

Upload gambar atau ketik pertanyaan Anda!`;
  }

  // Default response
  return `Terima kasih atas pertanyaan Anda!

Saya siap membantu dengan:
• Analisis gambar (upload gambar untuk mulai)
• Informasi tentang model 3D Anda
• Tips penggunaan viewer

Apa yang bisa saya bantu?`;
}

export default AIChatbox;
