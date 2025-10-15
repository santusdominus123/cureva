import React, { useState } from 'react';
import { Brain, Loader2, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { vlmService, VLMAnalysisResult } from '../services/vlmService';

interface VLMAnalyzerProps {
  imageFile?: File | string;
  analysisType?: 'general' | 'drone' | 'building' | 'agriculture';
  onAnalysisComplete?: (result: VLMAnalysisResult) => void;
  autoAnalyze?: boolean;
}

export const VLMAnalyzer: React.FC<VLMAnalyzerProps> = ({
  imageFile,
  analysisType = 'general',
  onAnalysisComplete,
  autoAnalyze = false,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VLMAnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Check if VLM is available
  const isAvailable = vlmService.isAvailable();

  // Auto analyze saat imageFile berubah
  React.useEffect(() => {
    if (autoAnalyze && imageFile && isAvailable) {
      handleAnalyze();
    }
  }, [imageFile, autoAnalyze]);

  // Generate preview URL
  React.useEffect(() => {
    if (imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof imageFile === 'string') {
      setPreviewUrl(imageFile);
    }
  }, [imageFile]);

  const handleAnalyze = async () => {
    if (!imageFile || !isAvailable) return;

    setAnalyzing(true);
    setResult(null);

    try {
      let analysisResult: VLMAnalysisResult;

      switch (analysisType) {
        case 'drone':
          analysisResult = await vlmService.analyzeDroneImage(imageFile);
          break;
        case 'building':
          analysisResult = await vlmService.analyzeBuildingDamage(imageFile);
          break;
        case 'agriculture':
          analysisResult = await vlmService.analyzeAgricultureImage(imageFile);
          break;
        default:
          analysisResult = await vlmService.analyzeImage(imageFile);
      }

      setResult(analysisResult);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setResult({
        success: false,
        error: 'Gagal menganalisis gambar',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Get damage level color
  const getDamageLevelColor = (level?: string) => {
    switch (level) {
      case 'none':
        return 'text-green-600 bg-green-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'severe':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDamageLevelText = (level?: string) => {
    switch (level) {
      case 'none':
        return 'Tidak Ada Kerusakan';
      case 'low':
        return 'Kerusakan Ringan';
      case 'medium':
        return 'Kerusakan Sedang';
      case 'high':
        return 'Kerusakan Berat';
      case 'severe':
        return 'Kerusakan Parah';
      default:
        return 'Tidak Diketahui';
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900">VLM Belum Dikonfigurasi</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Tambahkan <code className="bg-yellow-100 px-1 rounded">VITE_GEMINI_API_KEY</code> di
              file .env untuk mengaktifkan analisis AI.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-yellow-800 underline mt-2 inline-block"
            >
              Dapatkan API Key →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Image */}
      {previewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
        </div>
      )}

      {/* Analyze Button */}
      {!autoAnalyze && imageFile && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Analisis dengan AI
            </>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              {/* Success Header */}
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Analisis Selesai</span>
              </div>

              {/* Description */}
              {result.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{result.description}</p>
                </div>
              )}

              {/* Damage Level */}
              {result.damageLevel && result.damageLevel !== 'none' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tingkat Kerusakan</h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDamageLevelColor(
                      result.damageLevel
                    )}`}
                  >
                    {getDamageLevelText(result.damageLevel)}
                  </span>
                </div>
              )}

              {/* Detected Objects */}
              {result.detectedObjects && result.detectedObjects.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Objek Terdeteksi</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedObjects.map((obj, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {result.tags && result.tags.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Rekomendasi</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Error State
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Analisis Gagal</h4>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Image State */}
      {!imageFile && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Upload gambar untuk memulai analisis AI</p>
        </div>
      )}
    </div>
  );
};

export default VLMAnalyzer;
