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
import { vlmService, ChatMessage, VLMProvider } from '../services/vlmService';

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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Chat dengan Gambar</h3>
            <p className="text-xs opacity-90">
              {sessionStarted ? `Provider: ${currentProvider.toUpperCase()}` : 'Belum dimulai'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {sessionStarted && (
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border-b p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Pilih Provider:</p>
          <div className="flex gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                onClick={() => handleChangeProvider(provider)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentProvider === provider
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {provider === 'gemini' ? 'Gemini (Gratis)' : 'GPT-4 Vision (Berbayar)'}
                {currentProvider === provider && <CheckCircle className="w-4 h-4 inline ml-2" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="p-3 bg-gray-50 border-b">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-32 w-full object-cover rounded-lg"
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!sessionStarted ? (
          <div className="text-center py-8">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {imageFile
                ? 'Klik "Mulai Chat" untuk bertanya tentang gambar'
                : 'Upload gambar untuk memulai chat'}
            </p>
            {imageFile && (
              <button
                onClick={handleStartSession}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Memulai...
                  </>
                ) : (
                  'Mulai Chat'
                )}
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Chat Siap!</p>
            <p className="text-sm text-gray-500">
              Tanyakan apapun tentang gambar ini. Contoh:
            </p>
            <div className="mt-3 space-y-2 text-sm text-left max-w-md mx-auto">
              <div className="bg-white p-2 rounded border">
                • "Apa yang terlihat di gambar ini?"
              </div>
              <div className="bg-white p-2 rounded border">
                • "Ada kerusakan apa saja?"
              </div>
              <div className="bg-white p-2 rounded border">
                • "Berikan rekomendasi tindakan"
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {sessionStarted && (
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tanyakan sesuatu tentang gambar..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
