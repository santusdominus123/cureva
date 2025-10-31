import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { vlmServiceEnhanced as vlmService, ChatMessage, VLMProvider } from '../../services/vlmServiceEnhanced';

interface ImageChatInterfaceProps {
  imageFile?: File | string;
  sessionId?: string;
  autoStart?: boolean;
  onSessionStart?: (sessionId: string) => void;
}

export const ImageChatInterface: React.FC<ImageChatInterfaceProps> = ({
  imageFile,
  sessionId: providedSessionId,
  autoStart = false,
  onSessionStart,
}) => {
  const [sessionId] = useState<string>(
    providedSessionId || `session-${Date.now()}-${Math.random()}`
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<VLMProvider>('gemini');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableProviders = vlmService.getAvailableProviders();
  const isAvailable = availableProviders.length > 0;

  // Generate preview URL
  useEffect(() => {
    if (imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof imageFile === 'string') {
      setPreviewUrl(imageFile);
    }
  }, [imageFile]);

  // Auto start session
  useEffect(() => {
    if (autoStart && imageFile && !sessionStarted && isAvailable) {
      handleStartSession();
    }
  }, [imageFile, autoStart, sessionStarted, isAvailable]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    const response = await vlmService.startChatWithImage(sessionId, imageFile);

    if (response.success) {
      setSessionStarted(true);
      if (onSessionStart) {
        onSessionStart(sessionId);
      }
    } else {
      alert(`Error: ${response.error}`);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionStarted) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMsg]);

    // Send to API
    const response = await vlmService.chatWithImage(sessionId, userMessage);

    if (response.success && response.message) {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Error: ${response.error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsLoading(false);
  };

  const handleClearChat = () => {
    if (confirm('Hapus semua percakapan?')) {
      vlmService.clearChatHistory(sessionId);
      setMessages([]);
      setSessionStarted(false);
    }
  };

  const handleChangeProvider = (provider: VLMProvider) => {
    const success = vlmService.setProvider(provider);
    if (success) {
      setCurrentProvider(provider);
      setShowSettings(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">API Belum Dikonfigurasi</h3>
        <p className="text-sm text-yellow-700">
          Tambahkan salah satu API key di file <code className="bg-yellow-100 px-1">.env</code>:
        </p>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
          <li>
            <code className="bg-yellow-100 px-1">VITE_GEMINI_API_KEY</code> (Gratis)
          </li>
          <li>
            <code className="bg-yellow-100 px-1">VITE_OPENAI_API_KEY</code> (Berbayar)
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Obrolan dengan Gambar</h3>
            <p className="text-xs opacity-90">
              {sessionStarted ? `Penyedia: ${currentProvider.toUpperCase()}` : 'Belum dimulai'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-5 h-5" />
          </button>
          {sessionStarted && (
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Hapus Obrolan"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-3">
          <p className="text-sm font-medium text-gray-200 mb-2">Pilih Provider:</p>
          <div className="flex gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                onClick={() => handleChangeProvider(provider)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentProvider === provider
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                }`}
              >
                {provider === 'gemini' ? 'Gemini (Gratis)' : 'GPT-4 Vision (Berbayar)'}
                {currentProvider === provider && <CheckCircle className="w-4 h-4 inline ml-2" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-900">
        {!sessionStarted ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 px-4">
            {/* Image Preview - Compact */}
            {previewUrl && (
              <div className="relative w-full max-w-sm">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border-2 border-blue-500 shadow-lg"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Pratinjau
                </div>
              </div>
            )}

            {/* Start Button - Prominent */}
            <div className="text-center space-y-3">
              {imageFile ? (
                <>
                  <MessageSquare className="w-12 h-12 text-blue-400 mx-auto" />
                  <p className="text-gray-200 font-medium text-lg">Gambar siap dianalisis!</p>
                  <p className="text-gray-400 text-sm">Mulai obrolan untuk bertanya tentang gambar ini</p>
                  <button
                    onClick={handleStartSession}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-lg font-medium text-base flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memulai Obrolan...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5" />
                        Mulai Obrolan
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto" />
                  <p className="text-gray-400">Unggah gambar terlebih dahulu untuk memulai obrolan</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Image Preview Sticky - Shows during chat */}
            {previewUrl && (
              <div className="sticky top-0 z-10 bg-gray-800 border border-gray-700 rounded-lg p-2 mb-3 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Context"
                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-xs font-medium">Gambar Konteks</p>
                  <p className="text-gray-500 text-xs truncate">Tanyakan apa saja tentang gambar ini</p>
                </div>
              </div>
            )}

            {/* Welcome message if no messages yet */}
            {messages.length === 0 && (
              <div className="text-center py-6">
                <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-200 font-medium mb-2">Obrolan Aktif!</p>
                <p className="text-xs text-gray-400 mb-3">Contoh pertanyaan:</p>
                <div className="space-y-2 text-xs text-left max-w-xs mx-auto">
                  <button
                    onClick={() => setInputMessage("Apa yang terlihat di gambar ini?")}
                    className="w-full bg-gray-800 text-gray-300 p-2 rounded-lg border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors text-left"
                  >
                    💬 "Apa yang terlihat di gambar?"
                  </button>
                  <button
                    onClick={() => setInputMessage("Ada kerusakan apa saja?")}
                    className="w-full bg-gray-800 text-gray-300 p-2 rounded-lg border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors text-left"
                  >
                    🔍 "Ada kerusakan apa saja?"
                  </button>
                  <button
                    onClick={() => setInputMessage("Berikan rekomendasi tindakan")}
                    className="w-full bg-gray-800 text-gray-300 p-2 rounded-lg border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors text-left"
                  >
                    💡 "Berikan rekomendasi"
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-xl p-3 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-md">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {sessionStarted && (
        <div className="p-3 md:p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tanyakan sesuatu tentang gambar..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:text-gray-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[48px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageChatInterface;
