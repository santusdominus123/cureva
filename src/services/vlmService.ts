import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface untuk response analisis
export interface VLMAnalysisResult {
  success: boolean;
  description?: string;
  tags?: string[];
  detectedObjects?: string[];
  damageLevel?: 'none' | 'low' | 'medium' | 'high' | 'severe';
  recommendations?: string[];
  error?: string;
}

// Interface untuk chat message
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Interface untuk chat response
export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Provider type
export type VLMProvider = 'gemini' | 'openai';

class VLMService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private openaiApiKey: string | null = null;
  private currentProvider: VLMProvider = 'gemini';
  private chatHistory: Map<string, ChatMessage[]> = new Map();
  private currentImageData: Map<string, any> = new Map();

  constructor() {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      // Gunakan gemini-2.0-flash (model terbaru yang support multimodal)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      this.currentProvider = 'gemini';
    }

    if (openaiKey) {
      this.openaiApiKey = openaiKey;
      if (!geminiKey) {
        this.currentProvider = 'openai';
      }
    }
  }

  /**
   * Set provider (gemini atau openai)
   */
  setProvider(provider: VLMProvider): boolean {
    if (provider === 'gemini' && this.model) {
      this.currentProvider = 'gemini';
      return true;
    }
    if (provider === 'openai' && this.openaiApiKey) {
      this.currentProvider = 'openai';
      return true;
    }
    return false;
  }

  /**
   * Get current provider
   */
  getProvider(): VLMProvider {
    return this.currentProvider;
  }

  /**
   * Cek apakah VLM service sudah tersedia
   */
  isAvailable(provider?: VLMProvider): boolean {
    const checkProvider = provider || this.currentProvider;
    if (checkProvider === 'gemini') {
      return this.model !== null;
    }
    if (checkProvider === 'openai') {
      return this.openaiApiKey !== null;
    }
    return false;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): VLMProvider[] {
    const providers: VLMProvider[] = [];
    if (this.model) providers.push('gemini');
    if (this.openaiApiKey) providers.push('openai');
    return providers;
  }

  /**
   * Analisis gambar dengan prompt custom
   */
  async analyzeImage(
    imageFile: File | string,
    customPrompt?: string
  ): Promise<VLMAnalysisResult> {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Gemini API key belum dikonfigurasi. Tambahkan VITE_GEMINI_API_KEY di file .env',
        };
      }

      // Convert image ke base64 jika berupa File
      let imageData: any;
      if (imageFile instanceof File) {
        imageData = await this.fileToGenerativePart(imageFile);
      } else {
        // Jika string URL, fetch dulu
        const response = await fetch(imageFile);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        imageData = await this.fileToGenerativePart(file);
      }

      // Default prompt untuk analisis umum
      const defaultPrompt = `Analisis gambar ini secara detail dalam Bahasa Indonesia.
      Berikan informasi tentang:
      1. Deskripsi singkat apa yang terlihat
      2. Objek-objek utama yang terdeteksi
      3. Kondisi atau kerusakan jika ada (none/low/medium/high/severe)
      4. Rekomendasi tindakan jika diperlukan

      Format response dalam JSON dengan struktur:
      {
        "description": "deskripsi singkat",
        "tags": ["tag1", "tag2"],
        "detectedObjects": ["objek1", "objek2"],
        "damageLevel": "none/low/medium/high/severe",
        "recommendations": ["rekomendasi1", "rekomendasi2"]
      }`;

      const prompt = customPrompt || defaultPrompt;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON dari response
      try {
        // Coba extract JSON dari response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            ...parsed,
          };
        }
      } catch (e) {
        // Jika gagal parse JSON, return sebagai deskripsi
        console.warn('Failed to parse JSON, returning as description');
      }

      // Fallback: return sebagai deskripsi text biasa
      return {
        success: true,
        description: text,
        tags: [],
        detectedObjects: [],
        damageLevel: 'none',
        recommendations: [],
      };
    } catch (error: any) {
      console.error('VLM Analysis Error:', error);
      return {
        success: false,
        error: error.message || 'Terjadi kesalahan saat analisis gambar',
      };
    }
  }

  /**
   * Analisis khusus untuk foto drone/aerial
   */
  async analyzeDroneImage(imageFile: File | string): Promise<VLMAnalysisResult> {
    const prompt = `Ini adalah foto aerial/drone. Analisis dalam Bahasa Indonesia:

    1. Identifikasi jenis area (pertanian, pemukiman, hutan, infrastruktur, dll)
    2. Deteksi kondisi lahan atau bangunan
    3. Estimasi level kerusakan jika ada: none/low/medium/high/severe
    4. Berikan rekomendasi tindakan yang diperlukan

    Format response dalam JSON:
    {
      "description": "deskripsi area dan kondisi",
      "tags": ["jenis area", "kondisi"],
      "detectedObjects": ["objek yang terdeteksi"],
      "damageLevel": "none/low/medium/high/severe",
      "recommendations": ["rekomendasi tindakan"]
    }`;

    return this.analyzeImage(imageFile, prompt);
  }

  /**
   * Analisis untuk deteksi kerusakan bangunan
   */
  async analyzeBuildingDamage(imageFile: File | string): Promise<VLMAnalysisResult> {
    const prompt = `Analisis kerusakan bangunan dalam gambar ini (Bahasa Indonesia):

    1. Identifikasi jenis bangunan
    2. Deteksi semua kerusakan yang terlihat (retak, roboh, rusak, dll)
    3. Estimasi tingkat kerusakan: none/low/medium/high/severe
    4. Prioritas perbaikan yang diperlukan

    Format JSON:
    {
      "description": "kondisi bangunan",
      "tags": ["jenis bangunan", "jenis kerusakan"],
      "detectedObjects": ["bagian yang rusak"],
      "damageLevel": "none/low/medium/high/severe",
      "recommendations": ["prioritas perbaikan"]
    }`;

    return this.analyzeImage(imageFile, prompt);
  }

  /**
   * Analisis untuk pertanian/tanaman
   */
  async analyzeAgricultureImage(imageFile: File | string): Promise<VLMAnalysisResult> {
    const prompt = `Analisis foto pertanian/tanaman ini (Bahasa Indonesia):

    1. Identifikasi jenis tanaman atau area pertanian
    2. Kondisi kesehatan tanaman (sehat, kurang sehat, rusak)
    3. Deteksi hama, penyakit, atau masalah lain
    4. Estimasi level masalah: none/low/medium/high/severe
    5. Rekomendasi perawatan atau tindakan

    Format JSON:
    {
      "description": "kondisi tanaman/lahan",
      "tags": ["jenis tanaman", "kondisi"],
      "detectedObjects": ["masalah yang terdeteksi"],
      "damageLevel": "none/low/medium/high/severe",
      "recommendations": ["tindakan yang disarankan"]
    }`;

    return this.analyzeImage(imageFile, prompt);
  }

  /**
   * Helper: Convert File ke format yang diperlukan Google AI
   */
  private async fileToGenerativePart(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analisis batch multiple images
   */
  async analyzeMultipleImages(
    imageFiles: File[],
    analysisType: 'general' | 'drone' | 'building' | 'agriculture' = 'general'
  ): Promise<VLMAnalysisResult[]> {
    const results: VLMAnalysisResult[] = [];

    for (const file of imageFiles) {
      let result: VLMAnalysisResult;

      switch (analysisType) {
        case 'drone':
          result = await this.analyzeDroneImage(file);
          break;
        case 'building':
          result = await this.analyzeBuildingDamage(file);
          break;
        case 'agriculture':
          result = await this.analyzeAgricultureImage(file);
          break;
        default:
          result = await this.analyzeImage(file);
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Start chat session dengan gambar
   */
  async startChatWithImage(
    sessionId: string,
    imageFile: File | string,
    initialMessage?: string
  ): Promise<ChatResponse> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'API key belum dikonfigurasi',
        };
      }

      // Convert image
      let imageData: any;
      if (imageFile instanceof File) {
        imageData = await this.fileToGenerativePart(imageFile);
      } else {
        const response = await fetch(imageFile);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        imageData = await this.fileToGenerativePart(file);
      }

      // Store image data untuk session ini
      this.currentImageData.set(sessionId, imageData);
      this.chatHistory.set(sessionId, []);

      // Jika ada initial message, kirim sebagai chat pertama
      if (initialMessage) {
        return await this.chatWithImage(sessionId, initialMessage);
      }

      return {
        success: true,
        message: 'Chat session dimulai. Silakan tanyakan apapun tentang gambar ini.',
      };
    } catch (error: any) {
      console.error('Start chat error:', error);
      return {
        success: false,
        error: error.message || 'Gagal memulai chat session',
      };
    }
  }

  /**
   * Chat dengan gambar (OpenAI GPT-4 Vision)
   */
  private async chatWithOpenAI(
    sessionId: string,
    userMessage: string
  ): Promise<ChatResponse> {
    try {
      const imageData = this.currentImageData.get(sessionId);
      const history = this.chatHistory.get(sessionId) || [];

      // Build messages untuk OpenAI
      const messages: any[] = [];

      // Tambahkan gambar di message pertama
      if (history.length === 0 && imageData) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Saya akan bertanya tentang gambar ini. Jawab dalam Bahasa Indonesia.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`,
              },
            },
          ],
        });
      }

      // Tambahkan history
      history.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // Tambahkan user message baru
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // atau 'gpt-4-vision-preview'
          messages: messages,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      // Update history
      history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });
      history.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });
      this.chatHistory.set(sessionId, history);

      return {
        success: true,
        message: assistantMessage,
      };
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      return {
        success: false,
        error: error.message || 'Gagal berkomunikasi dengan OpenAI',
      };
    }
  }

  /**
   * Chat dengan gambar (Gemini)
   */
  private async chatWithGemini(
    sessionId: string,
    userMessage: string
  ): Promise<ChatResponse> {
    try {
      const imageData = this.currentImageData.get(sessionId);
      const history = this.chatHistory.get(sessionId) || [];

      // Build content untuk Gemini
      const contents: any[] = [];

      // Message pertama dengan gambar
      if (history.length === 0 && imageData) {
        contents.push(
          'Jawab pertanyaan tentang gambar ini dalam Bahasa Indonesia.',
          imageData
        );
      }

      // Tambahkan user message
      contents.push(userMessage);

      const result = await this.model.generateContent(contents);
      const response = await result.response;
      const assistantMessage = response.text();

      // Update history
      history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });
      history.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });
      this.chatHistory.set(sessionId, history);

      return {
        success: true,
        message: assistantMessage,
      };
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      return {
        success: false,
        error: error.message || 'Gagal berkomunikasi dengan Gemini',
      };
    }
  }

  /**
   * Chat dengan gambar (auto-select provider)
   */
  async chatWithImage(sessionId: string, userMessage: string): Promise<ChatResponse> {
    if (!this.currentImageData.has(sessionId)) {
      return {
        success: false,
        error: 'Chat session tidak ditemukan. Mulai session dengan startChatWithImage() terlebih dahulu.',
      };
    }

    if (this.currentProvider === 'openai' && this.openaiApiKey) {
      return await this.chatWithOpenAI(sessionId, userMessage);
    } else if (this.currentProvider === 'gemini' && this.model) {
      return await this.chatWithGemini(sessionId, userMessage);
    }

    return {
      success: false,
      error: 'Tidak ada provider yang tersedia',
    };
  }

  /**
   * Get chat history untuk session
   */
  getChatHistory(sessionId: string): ChatMessage[] {
    return this.chatHistory.get(sessionId) || [];
  }

  /**
   * Clear chat history
   */
  clearChatHistory(sessionId: string): void {
    this.chatHistory.delete(sessionId);
    this.currentImageData.delete(sessionId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.chatHistory.clear();
    this.currentImageData.clear();
  }
}

// Export singleton instance
export const vlmService = new VLMService();
export default vlmService;
