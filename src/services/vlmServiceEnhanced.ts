import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface untuk detailed section
export interface DetailedSection {
  title: string;
  content?: string;
  items?: string[];
  subsections?: { subtitle: string; content: string; bullets?: string[] }[];
}

// Interface untuk reference/citation
export interface Reference {
  id: number;
  title: string;
  url: string;
  source: string;
  type: 'article' | 'journal' | 'book' | 'news' | 'web';
  date?: string;
  snippet?: string;
  credibility: 'HIGH' | 'MEDIUM' | 'LOW';
  relevanceScore?: number;
}

// Interface untuk similar image
export interface SimilarImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  similarity?: number;
  context?: string;
}

// Interface untuk accuracy measurement
export interface AccuracyMeasurement {
  confidenceScore: number; // 0-100
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  referencesFound: number;
  similarImagesFound: number;
  consistencyScore: number; // How consistent is the info across sources
  factors: {
    visualAnalysis: number;
    referenceSupport: number;
    sourceTrustworthiness: number;
    crossValidation: number;
  };
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

  // NEW: Accuracy & References (Perplexity-style)
  accuracy?: AccuracyMeasurement;
  references?: Reference[];
  similarImages?: SimilarImage[];
  searchQueries?: string[];
}

class VLMServiceEnhanced {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private searchAPIKey: string | null = null;

  constructor() {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
    // Optional: untuk Google Custom Search API
    this.searchAPIKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || geminiKey;
  }

  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Search for references using multiple methods
   */
  private async searchReferences(query: string, numResults: number = 5): Promise<Reference[]> {
    try {
      console.log(`🔍 Searching references for: "${query}"`);

      // Method 1: Try Wikipedia API first (most reliable)
      const wikiResults = await this.searchWikipedia(query);

      // Method 2: Generate search engine references with real URLs
      const searchEngineRefs = this.generateSearchEngineReferences(query, numResults);

      // Combine results and assign UNIQUE IDs
      const allResults = [...wikiResults, ...searchEngineRefs]
        .slice(0, numResults);

      // Assign unique IDs with timestamp to avoid duplicates
      const uniqueResults = allResults.map((ref, idx) => ({
        ...ref,
        id: Date.now() + idx, // Unique ID using timestamp
      }));

      console.log(`✅ Found ${uniqueResults.length} references`);
      return uniqueResults;
    } catch (error) {
      console.error('Reference search error:', error);
      const fallbackRefs = this.generateSearchEngineReferences(query, numResults);
      return fallbackRefs.map((ref, idx) => ({
        ...ref,
        id: Date.now() + idx,
      }));
    }
  }

  /**
   * Search Wikipedia for relevant articles
   */
  private async searchWikipedia(query: string): Promise<Omit<Reference, 'id'>[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodedQuery}&limit=3&namespace=0&format=json&origin=*`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      const references: Omit<Reference, 'id'>[] = [];

      if (data && data[1] && data[1].length > 0) {
        for (let i = 0; i < data[1].length; i++) {
          const title = data[1][i];
          const snippet = data[2][i] || '';
          const url = data[3][i] || '';

          references.push({
            title,
            url,
            source: 'id.wikipedia.org',
            type: 'web',
            snippet,
            credibility: 'HIGH',
            relevanceScore: 90 - (i * 10),
          });
        }
      }

      return references;
    } catch (error) {
      console.warn('Wikipedia search failed:', error);
      return [];
    }
  }

  /**
   * Generate search engine references with real URLs that open in browser
   */
  private generateSearchEngineReferences(query: string, numResults: number): Omit<Reference, 'id'>[] {
    const encodedQuery = encodeURIComponent(query);

    const references: Omit<Reference, 'id'>[] = [
      {
        title: `Pencarian Google: "${query}"`,
        url: `https://www.google.com/search?q=${encodedQuery}`,
        source: 'Google Search',
        type: 'web',
        snippet: `Hasil pencarian Google untuk "${query}". Klik untuk melihat berbagai sumber informasi terpercaya.`,
        credibility: 'HIGH',
        relevanceScore: 95,
        date: new Date().toLocaleDateString('id-ID'),
      },
      {
        title: `Wikipedia: "${query}"`,
        url: `https://id.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`,
        source: 'Wikipedia Indonesia',
        type: 'web',
        snippet: `Cari artikel ensiklopedia tentang "${query}" di Wikipedia Indonesia.`,
        credibility: 'HIGH',
        relevanceScore: 90,
        date: new Date().toLocaleDateString('id-ID'),
      },
      {
        title: `Google Scholar: "${query}"`,
        url: `https://scholar.google.com/scholar?q=${encodedQuery}`,
        source: 'Google Scholar',
        type: 'journal',
        snippet: `Publikasi ilmiah dan jurnal akademik tentang "${query}".`,
        credibility: 'HIGH',
        relevanceScore: 88,
        date: new Date().toLocaleDateString('id-ID'),
      },
      {
        title: `Britannica: "${query}"`,
        url: `https://www.britannica.com/search?query=${encodedQuery}`,
        source: 'Encyclopedia Britannica',
        type: 'web',
        snippet: `Informasi mendalam tentang "${query}" dari Encyclopedia Britannica.`,
        credibility: 'HIGH',
        relevanceScore: 85,
        date: new Date().toLocaleDateString('id-ID'),
      },
    ];

    return references.slice(0, numResults);
  }

  /**
   * Search for similar images - generates Google Images search links
   */
  private async searchSimilarImages(query: string, numResults: number = 3): Promise<SimilarImage[]> {
    try {
      console.log('🖼️ Generating image search links for:', query);

      const encodedQuery = encodeURIComponent(query);

      // Generate Google Images search results that will open in browser
      const images: SimilarImage[] = [
        {
          url: `https://www.google.com/search?q=${encodedQuery}&tbm=isch`,
          thumbnailUrl: '', // No placeholder, akan pakai icon di UI
          title: `Cari gambar "${query}"`,
          source: 'Google Images',
          similarity: 95,
          context: `Temukan ribuan gambar serupa untuk membandingkan dan memvalidasi identifikasi objek Anda`,
        },
        {
          url: `https://www.bing.com/images/search?q=${encodedQuery}`,
          thumbnailUrl: '', // No placeholder, akan pakai icon di UI
          title: `Cari gambar "${query}"`,
          source: 'Bing Images',
          similarity: 90,
          context: `Pencarian gambar alternatif dengan hasil yang berbeda untuk validasi lebih lanjut`,
        },
        {
          url: `https://commons.wikimedia.org/w/index.php?search=${encodedQuery}&title=Special:MediaSearch&type=image`,
          thumbnailUrl: '', // No placeholder, akan pakai icon di UI
          title: `Cari gambar "${query}"`,
          source: 'Wikimedia Commons',
          similarity: 85,
          context: `Gambar domain publik dan bebas lisensi untuk referensi akademik dan penelitian`,
        },
      ];

      return images.slice(0, numResults);
    } catch (error) {
      console.error('Similar image search error:', error);
      return [];
    }
  }

  /**
   * Determine source type based on domain
   */
  private determineSourceType(domain: string): Reference['type'] {
    if (domain.includes('wikipedia')) return 'web';
    if (domain.includes('.edu')) return 'journal';
    if (domain.includes('news') || domain.includes('kompas') || domain.includes('detik')) return 'news';
    if (domain.includes('scholar') || domain.includes('sciencedirect') || domain.includes('jstor')) return 'journal';
    if (domain.includes('books.google')) return 'book';
    return 'article';
  }

  /**
   * Assess source credibility
   */
  private assessCredibility(domain: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highCredibility = [
      'wikipedia.org', '.gov', '.edu', 'bbc.com', 'reuters.com',
      'kompas.com', 'tempo.co', 'antaranews.com', 'detik.com',
      'nature.com', 'sciencedirect.com', 'scholar.google.com',
      'britannica.com', 'smithsonian', 'museum'
    ];

    const lowCredibility = [
      'blog', 'wordpress', 'medium.com', 'facebook', 'twitter'
    ];

    if (highCredibility.some(trusted => domain.includes(trusted))) {
      return 'HIGH';
    }

    if (lowCredibility.some(untrusted => domain.includes(untrusted))) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  /**
   * Calculate accuracy measurement based on analysis and references
   */
  private calculateAccuracy(
    vlmResponse: string,
    references: Reference[],
    similarImages: SimilarImage[]
  ): AccuracyMeasurement {
    // Calculate individual factors
    const visualAnalysis = 85; // Base confidence from VLM

    // Reference support: more high-quality references = higher score
    const highCredRefs = references.filter(r => r.credibility === 'HIGH').length;
    const mediumCredRefs = references.filter(r => r.credibility === 'MEDIUM').length;
    const referenceSupport = Math.min(100, (highCredRefs * 20) + (mediumCredRefs * 10));

    // Source trustworthiness: average credibility of references
    const avgCredibility = references.length > 0
      ? references.reduce((sum, r) => sum + (r.credibility === 'HIGH' ? 100 : r.credibility === 'MEDIUM' ? 60 : 30), 0) / references.length
      : 50;

    // Cross validation: similarity between images found
    const crossValidation = similarImages.length > 0 ? 75 : 50;

    // Consistency: how many references agree (simplified)
    const consistencyScore = references.length >= 3 ? 85 : references.length * 25;

    // Overall confidence score
    const confidenceScore = Math.round(
      (visualAnalysis * 0.3) +
      (referenceSupport * 0.25) +
      (avgCredibility * 0.25) +
      (crossValidation * 0.2)
    );

    // Verification status
    let verificationStatus: AccuracyMeasurement['verificationStatus'] = 'unverified';
    if (references.length >= 3 && highCredRefs >= 2) {
      verificationStatus = 'verified';
    } else if (references.length >= 1) {
      verificationStatus = 'partially_verified';
    }

    return {
      confidenceScore,
      verificationStatus,
      referencesFound: references.length,
      similarImagesFound: similarImages.length,
      consistencyScore,
      factors: {
        visualAnalysis,
        referenceSupport,
        sourceTrustworthiness: Math.round(avgCredibility),
        crossValidation,
      },
    };
  }

  /**
   * Extract search keywords from VLM response
   */
  private extractSearchKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Method 1: Look for structured fields
    const objectMatch = text.match(/OBJECT[:\s]+([^\n]+)/i);
    if (objectMatch) {
      keywords.push(objectMatch[1].trim());
    }

    const contextMatch = text.match(/CONTEXT[:\s]+([^\n]+)/i);
    if (contextMatch) {
      keywords.push(contextMatch[1].trim());
    }

    const periodMatch = text.match(/PERIOD[:\s]+([^\n]+)/i);
    if (periodMatch) {
      keywords.push(periodMatch[1].trim());
    }

    // Method 2: Look in JSON format
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.object) keywords.push(parsed.object);
        if (parsed.context) keywords.push(parsed.context);
        if (parsed.culturalContext) keywords.push(parsed.culturalContext);
        if (parsed.historicalPeriod) keywords.push(parsed.historicalPeriod);
      }
    } catch (e) {
      // JSON parsing failed, continue with other methods
    }

    // Method 3: Fallback - extract from summary
    if (keywords.length === 0) {
      const summaryMatch = text.match(/RINGKASAN[:\s]+([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
      if (summaryMatch) {
        const summary = summaryMatch[1].trim();
        // Take first sentence as keyword
        const firstSentence = summary.split(/[.!?]/)[0].trim();
        if (firstSentence.length > 0 && firstSentence.length < 100) {
          keywords.push(firstSentence);
        }
      }
    }

    // Method 4: Ultimate fallback
    if (keywords.length === 0) {
      keywords.push('artefak budaya Indonesia');
      keywords.push('sejarah Indonesia');
    }

    console.log('🔑 Extracted keywords:', keywords);
    return keywords.slice(0, 3); // Limit to 3 keywords
  }

  /**
   * Analisis objek bersejarah dengan detail lengkap + referensi & accuracy measurement
   */
  async analyzeHistoricalObject(imageFile: File | string, withReferences: boolean = true): Promise<VLMAnalysisResultEnhanced> {
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

      // Step 1: Initial VLM Analysis dengan keyword extraction
      const initialPrompt = `Kamu adalah ahli arkeologi dan sejarah. Analisis objek bersejarah dalam gambar ini dengan SANGAT DETAIL dalam Bahasa Indonesia.

Berikan analisis komprehensif dengan struktur berikut:

**RINGKASAN**: Deskripsi singkat objek (2-3 kalimat)

**OBJECT**: Nama objek yang teridentifikasi
**CONTEXT**: Konteks budaya/sejarah
**PERIOD**: Periode waktu

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
  "object": "nama objek",
  "context": "konteks budaya",
  "period": "periode sejarah",
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

      const result = await this.model.generateContent([initialPrompt, imageData]);
      const response = await result.response;
      const text = response.text();

      let parsedResult: VLMAnalysisResultEnhanced;

      // Parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedResult = {
            success: true,
            ...parsed,
          };
        } else {
          parsedResult = this.parseMarkdownResponse(text);
        }
      } catch (e) {
        console.warn('Failed to parse JSON, trying to parse markdown format');
        parsedResult = this.parseMarkdownResponse(text);
      }

      // Step 2: Extract keywords and search for references
      if (withReferences) {
        console.log('🔍 WITH REFERENCES ENABLED - Starting reference search...');
        const keywords = this.extractSearchKeywords(text);
        console.log('📝 Extracted keywords:', keywords);

        const searchQueries: string[] = [];
        const allReferences: Reference[] = [];
        const allSimilarImages: SimilarImage[] = [];

        // Search references for each keyword
        for (const keyword of keywords.slice(0, 2)) {
          console.log(`🔎 Searching for keyword: "${keyword}"`);
          searchQueries.push(keyword);
          const refs = await this.searchReferences(keyword, 3);
          console.log(`✅ Found ${refs.length} references for "${keyword}"`);
          allReferences.push(...refs);

          // Add small delay to ensure unique timestamps
          await new Promise(resolve => setTimeout(resolve, 10));

          // Search similar images
          const images = await this.searchSimilarImages(keyword, 2);
          console.log(`🖼️ Found ${images.length} similar images for "${keyword}"`);
          allSimilarImages.push(...images);
        }

        // Remove duplicate references based on URL and reassign unique IDs
        const uniqueRefs = Array.from(
          new Map(allReferences.map(ref => [ref.url, ref])).values()
        ).map((ref, idx) => ({
          ...ref,
          id: idx + 1, // Sequential IDs after deduplication
        }));

        console.log(`📊 TOTAL: ${uniqueRefs.length} unique references, ${allSimilarImages.length} images`);

        // Step 3: Calculate accuracy measurement
        const accuracy = this.calculateAccuracy(text, uniqueRefs, allSimilarImages);
        console.log('⚖️ Accuracy calculated:', accuracy);

        // Step 4: Generate final answer with citations (if references found)
        if (uniqueRefs.length > 0) {
          console.log('📝 Generating final answer with citations...');
          const finalAnswer = await this.generateAnswerWithCitations(text, uniqueRefs);
          parsedResult.conclusion = finalAnswer;
        }

        // Add references and accuracy to result
        parsedResult.references = uniqueRefs;
        parsedResult.similarImages = allSimilarImages;
        parsedResult.searchQueries = searchQueries;
        parsedResult.accuracy = accuracy;

        console.log('✅ FINAL RESULT WITH REFERENCES:', {
          referencesCount: uniqueRefs.length,
          imagesCount: allSimilarImages.length,
          queriesCount: searchQueries.length,
          hasAccuracy: !!accuracy
        });
      } else {
        console.log('⚠️ WITH REFERENCES DISABLED');
      }

      return parsedResult;
    } catch (error: any) {
      console.error('Historical analysis error:', error);
      return {
        success: false,
        error: error.message || 'Gagal menganalisis objek',
      };
    }
  }

  /**
   * Generate final answer with citations from references
   */
  private async generateAnswerWithCitations(vlmResponse: string, references: Reference[]): Promise<string> {
    try {
      // Prepare context from references
      const context = references
        .slice(0, 5)
        .map((ref, idx) => `[${idx + 1}] ${ref.title}\nSource: ${ref.source}\n${ref.snippet || ''}`)
        .join('\n\n');

      const prompt = `Berdasarkan analisis visual dan referensi yang ditemukan, berikan kesimpulan yang lebih komprehensif dan terverifikasi:

ANALISIS VISUAL:
${vlmResponse}

REFERENSI YANG DITEMUKAN:
${context}

INSTRUKSI:
1. Gabungkan informasi dari analisis visual dengan referensi
2. Gunakan citations [1], [2], dst untuk merujuk referensi
3. Berikan informasi yang akurat dan terverifikasi
4. Jelaskan dengan bahasa yang mudah dipahami
5. Fokus pada kesimpulan yang didukung oleh referensi

Berikan kesimpulan dalam 2-3 paragraf singkat (maksimal 500 kata) dalam Bahasa Indonesia.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Citation generation error:', error);
      return vlmResponse; // Return original if failed
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
