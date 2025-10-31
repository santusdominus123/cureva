import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Nano Banana Service - Menggunakan Gemini 2.5 Flash Image
 * Untuk rekonstruksi dan perbaikan 3D models
 */

class NanoBananaService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Initialize Generative AI client
   */
  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!this.apiKey) {
        throw new Error('Nano Banana API key not configured. Set VITE_GEMINI_API_KEY in .env file');
      }
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
    return this.genAI;
  }

  /**
   * Convert base64 image to proper format for Gemini API
   */
  private base64ToGenerativePart(base64Data: string, mimeType: string = 'image/png') {
    // Remove data URL prefix if present
    const base64Content = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    return {
      inlineData: {
        data: base64Content,
        mimeType: mimeType
      }
    };
  }

  /**
   * Analyze 3D model screenshot untuk deteksi kerusakan
   */
  async analyzeModelDamage(imageData: string): Promise<{
    hasDamage: boolean;
    damageDescription: string;
    damageLevel: 'none' | 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    try {
      const client = this.getClient();
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const imagePart = this.base64ToGenerativePart(imageData);

      const prompt = `Analyze this 3D model screenshot and detect any structural damage, missing parts, holes, or artifacts.

Please respond in JSON format with the following structure:
{
  "hasDamage": boolean,
  "damageDescription": "detailed description in Indonesian",
  "damageLevel": "none" | "low" | "medium" | "high",
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Look for:
- Missing geometry or holes
- Broken surfaces
- Artifacts or noise
- Incomplete reconstruction
- Low quality areas
- Distortions

Respond ONLY with valid JSON, no other text.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('🔍 Damage analysis response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing model damage:', error);
      throw error;
    }
  }

  /**
   * Rekonstruksi/perbaikan 3D model menggunakan Nano Banana
   */
  async reconstructModel(
    originalImage: string,
    damageDescription: string
  ): Promise<string> {
    try {
      const client = this.getClient();

      // Gunakan Gemini 2.5 Flash Image untuk rekonstruksi
      // Note: Ini adalah simulasi karena Gemini belum support direct image generation
      // Dalam production, gunakan Imagen atau API image generation lainnya
      const model = client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp'
      });

      const imagePart = this.base64ToGenerativePart(originalImage);

      const prompt = `You are an expert 3D reconstruction AI.

Current model has these issues:
${damageDescription}

Please provide detailed instructions in Indonesian on how to fix these issues using 3D modeling techniques. Include:
1. Specific tools or methods to use
2. Step-by-step repair process
3. Best practices for quality reconstruction
4. Recommended software or algorithms

Be specific and technical.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const reconstructionGuide = response.text();

      console.log('🔧 Reconstruction guide generated');

      return reconstructionGuide;

    } catch (error) {
      console.error('❌ Error reconstructing model:', error);
      throw error;
    }
  }

  /**
   * Generate improvement suggestions untuk 3D model
   */
  async generateImprovementSuggestions(imageData: string): Promise<string[]> {
    try {
      const client = this.getClient();
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const imagePart = this.base64ToGenerativePart(imageData);

      const prompt = `Analyze this 3D model and provide 5 specific improvement suggestions in Indonesian.

Focus on:
- Geometry quality
- Surface smoothness
- Detail level
- Texture quality
- Overall reconstruction quality

Respond with a JSON array of suggestions:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]

Respond ONLY with valid JSON array, no other text.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('💡 Improvement suggestions response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions;

    } catch (error) {
      console.error('❌ Error generating improvement suggestions:', error);
      throw error;
    }
  }

  /**
   * Estimate repair complexity
   */
  async estimateRepairComplexity(
    imageData: string,
    damageLevel: string
  ): Promise<{
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    estimatedTime: string;
    requiredSkillLevel: string;
    description: string;
  }> {
    try {
      const client = this.getClient();
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const imagePart = this.base64ToGenerativePart(imageData);

      const prompt = `Based on this 3D model with damage level: ${damageLevel}, estimate the repair complexity.

Respond in JSON format:
{
  "complexity": "simple" | "moderate" | "complex" | "very_complex",
  "estimatedTime": "time estimate in Indonesian",
  "requiredSkillLevel": "beginner/intermediate/advanced/expert",
  "description": "detailed explanation in Indonesian"
}

Respond ONLY with valid JSON, no other text.`;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('⏱️ Complexity estimation response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const estimation = JSON.parse(jsonMatch[0]);
      return estimation;

    } catch (error) {
      console.error('❌ Error estimating repair complexity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nanoBananaService = new NanoBananaService();
