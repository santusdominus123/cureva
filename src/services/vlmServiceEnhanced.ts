import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface untuk detailed section
export interface DetailedSection {
  title: string;
  content?: string;
  items?: string[];
  subsections?: { subtitle: string; content: string; bullets?: string[] }[];
}

// Interface untuk response analisis yang ditingkatkan
export interface VLMAnalysisResultEnhanced {
  success: boolean;
  error?: string;

  // Summary
  summary?: string;

  // Detailed sections (untuk historical objects dll)
  sections?: DetailedSection[];

  // Quick info
  tags?: string[];
  detectedObjects?: string[];
  damageLevel?: 'none' | 'low' | 'medium' | 'high' | 'severe';

  // Context
  culturalContext?: string;
  historicalPeriod?: string;

  // Conclusion & recommendations
  conclusion?: string;
  recommendations?: string[];
}

class VLMServiceEnhanced {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Analisis objek bersejarah dengan detail lengkap
   */
  async analyzeHistoricalObject(imageFile: File | string): Promise<VLMAnalysisResultEnhanced> {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Gemini API key belum dikonfigurasi',
        };
      }

      const imageData = await this.fileToGenerativePart(
        imageFile instanceof File ? imageFile : await this.urlToFile(imageFile)
      );

      const prompt = `Kamu adalah ahli arkeologi dan sejarah. Analisis objek bersejarah dalam gambar ini dengan SANGAT DETAIL dalam Bahasa Indonesia.

Berikan analisis komprehensif dengan struktur berikut:

**RINGKASAN**: Deskripsi singkat objek (2-3 kalimat)

**1. MATERIAL DAN KONDISI**
- Material: Jenis material yang digunakan
- Kondisi: Kondisi objek saat ini
- Teknik Pembuatan: Cara objek ini dibuat

**2. DESAIN DAN ORNAMEN**
- Gaya Dekoratif: Karakteristik desain
- Pola dan Motif: Deskripsi detail setiap motif/pola yang terlihat (jelaskan per bagian)
- Warna: Palet warna yang digunakan

**3. KONTEKS BUDAYA DAN SEJARAH**
- Kemungkinan Asal: Budaya/peradaban yang mungkin membuat objek ini
- Periode Sejarah: Perkiraan periode waktu
- Fungsi: Kegunaan objek ini
- Simbolisme: Makna simbolik dari ornamen/motif

**4. ANALISIS ARTISTIK**
- Teknik Artistik: Metode pembuatan ornamen
- Komposisi: Tata letak dan proporsi desain
- Pengaruh: Pengaruh budaya atau gaya lain yang terlihat

**5. PRESERVASI DAN NILAI**
- Kondisi Preservasi: Seberapa baik objek terpelihara
- Nilai Historis: Pentingnya objek dalam konteks sejarah
- Rekomendasi: Saran untuk preservasi atau studi lebih lanjut

**KESIMPULAN**: Kesimpulan menyeluruh tentang objek dan signifikansinya

Format response dalam JSON dengan struktur:
{
  "summary": "ringkasan 2-3 kalimat",
  "sections": [
    {
      "title": "Material dan Kondisi",
      "subsections": [
        {
          "subtitle": "Material",
          "content": "penjelasan...",
          "bullets": ["poin 1", "poin 2"]
        }
      ]
    }
  ],
  "culturalContext": "konteks budaya ringkas",
  "historicalPeriod": "periode sejarah",
  "conclusion": "kesimpulan lengkap",
  "tags": ["tag1", "tag2"],
  "recommendations": ["rekomendasi 1", "rekomendasi 2"]
}`;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            ...parsed,
          };
        }
      } catch (e) {
        console.warn('Failed to parse JSON, trying to parse markdown format');
      }

      // Fallback: parse markdown format
      return this.parseMarkdownResponse(text);
    } catch (error: any) {
      console.error('Historical analysis error:', error);
      return {
        success: false,
        error: error.message || 'Gagal menganalisis objek',
      };
    }
  }

  /**
   * Analisis general dengan format yang lebih baik
   */
  async analyzeGeneral(
    imageFile: File | string,
    analysisType: 'general' | 'artifact' | 'building' | 'nature' = 'general'
  ): Promise<VLMAnalysisResultEnhanced> {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Gemini API key belum dikonfigurasi',
        };
      }

      const imageData = await this.fileToGenerativePart(
        imageFile instanceof File ? imageFile : await this.urlToFile(imageFile)
      );

      let prompt = '';

      switch (analysisType) {
        case 'artifact':
          return await this.analyzeHistoricalObject(imageFile);

        case 'building':
          prompt = `Analisis bangunan dalam gambar dengan detail dalam Bahasa Indonesia:
1. Jenis dan gaya arsitektur
2. Kondisi struktur dan kerusakan
3. Material bangunan
4. Tingkat kerusakan: none/low/medium/high/severe
5. Rekomendasi perbaikan

Format JSON: { "summary": "", "sections": [...], "damageLevel": "", "recommendations": [] }`;
          break;

        case 'nature':
          prompt = `Analisis alam/lingkungan dalam gambar dengan Bahasa Indonesia:
1. Jenis ekosistem/habitat
2. Kondisi lingkungan
3. Flora dan fauna yang terlihat
4. Kondisi kesehatan: none/low/medium/high/severe
5. Rekomendasi konservasi

Format JSON: { "summary": "", "sections": [...], "damageLevel": "", "recommendations": [] }`;
          break;

        default:
          prompt = `Analisis gambar ini dengan detail dalam Bahasa Indonesia.
Berikan informasi terstruktur tentang apa yang terlihat.
Format JSON: { "summary": "", "sections": [...], "tags": [], "detectedObjects": [] }`;
      }

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            ...parsed,
          };
        }
      } catch (e) {
        console.warn('Failed to parse JSON response');
      }

      // Fallback
      return {
        success: true,
        summary: text,
        sections: [{ title: 'Analisis', content: text }],
      };
    } catch (error: any) {
      console.error('Analysis error:', error);
      return {
        success: false,
        error: error.message || 'Gagal menganalisis gambar',
      };
    }
  }

  /**
   * Helper: Parse markdown response ke structured format
   */
  private parseMarkdownResponse(text: string): VLMAnalysisResultEnhanced {
    const sections: DetailedSection[] = [];
    let summary = '';
    let conclusion = '';

    // Extract summary
    const summaryMatch = text.match(/\*\*RINGKASAN\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // Extract conclusion
    const conclusionMatch = text.match(/\*\*KESIMPULAN\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (conclusionMatch) {
      conclusion = conclusionMatch[1].trim();
    }

    // Extract sections (numbered sections like **1. TITLE**)
    const sectionRegex = /\*\*(\d+)\.\s*([^*]+)\*\*\s*([\s\S]*?)(?=\*\*\d+\.|$)/g;
    let match;

    while ((match = sectionRegex.exec(text)) !== null) {
      const title = match[2].trim();
      const content = match[3].trim();

      // Parse subsections (marked with - **Subtitle**)
      const subsections: { subtitle: string; content: string; bullets?: string[] }[] = [];
      const subsectionRegex = /-\s*\*\*([^*]+)\*\*:?\s*([^\n-]+(?:\n(?!-)[^\n-]+)*)/g;
      let subMatch;

      while ((subMatch = subsectionRegex.exec(content)) !== null) {
        const subtitle = subMatch[1].trim();
        const subContent = subMatch[2].trim();
        subsections.push({ subtitle, content: subContent });
      }

      sections.push({
        title,
        subsections: subsections.length > 0 ? subsections : undefined,
        content: subsections.length === 0 ? content : undefined,
      });
    }

    return {
      success: true,
      summary,
      sections: sections.length > 0 ? sections : [{ title: 'Analisis', content: text }],
      conclusion,
    };
  }

  /**
   * Helper: Convert File ke format Google AI
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
   * Helper: Convert URL to File
   */
  private async urlToFile(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], 'image.jpg', { type: blob.type });
  }
}

// Export singleton
export const vlmServiceEnhanced = new VLMServiceEnhanced();
export default vlmServiceEnhanced;
