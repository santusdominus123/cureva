import React, { useState } from 'react';
import {
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  History,
  Info,
} from 'lucide-react';
import {
  vlmServiceEnhanced,
  VLMAnalysisResultEnhanced,
  DetailedSection,
} from '../services/vlmServiceEnhanced';

interface VLMAnalyzerEnhancedProps {
  imageFile?: File | string;
  analysisType?: 'general' | 'artifact' | 'building' | 'nature';
  onAnalysisComplete?: (result: VLMAnalysisResultEnhanced) => void;
  autoAnalyze?: boolean;
}

export const VLMAnalyzerEnhanced: React.FC<VLMAnalyzerEnhancedProps> = ({
  imageFile,
  analysisType = 'artifact',
  onAnalysisComplete,
  autoAnalyze = false,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VLMAnalysisResultEnhanced | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const isAvailable = vlmServiceEnhanced.isAvailable();

  // Auto analyze
  React.useEffect(() => {
    if (autoAnalyze && imageFile && isAvailable) {
      handleAnalyze();
    }
  }, [imageFile, autoAnalyze]);

  // Generate preview
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
    setExpandedSections(new Set([0])); // Expand first section by default

    try {
      let analysisResult: VLMAnalysisResultEnhanced;

      if (analysisType === 'artifact') {
        analysisResult = await vlmServiceEnhanced.analyzeHistoricalObject(imageFile);
      } else {
        analysisResult = await vlmServiceEnhanced.analyzeGeneral(imageFile, analysisType);
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

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    if (result?.sections) {
      setExpandedSections(new Set(result.sections.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  if (!isAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">VLM Belum Dikonfigurasi</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Tambahkan <code className="bg-yellow-100 px-2 py-0.5 rounded">VITE_GEMINI_API_KEY</code> di file .env
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-yellow-800 underline mt-2 inline-block hover:text-yellow-900"
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
        <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-md">
          <img src={previewUrl} alt="Preview" className="w-full h-56 sm:h-64 object-contain bg-gray-50" />
        </div>
      )}

      {/* Analyze Button */}
      {!autoAnalyze && imageFile && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md touch-manipulation active:scale-95 font-semibold"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menganalisis dengan AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analisis dengan AI</span>
            </>
          )}
        </button>
      )}

      {/* Loading State */}
      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-blue-900 font-medium">Sedang menganalisis objek...</p>
          <p className="text-sm text-blue-700 mt-1">Ini mungkin memakan waktu beberapa detik</p>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-4">
          {result.success ? (
            <>
              {/* Success Header */}
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Analisis Selesai</span>
                </div>
                {result.sections && result.sections.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={expandAll}
                      className="text-xs bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors touch-manipulation"
                    >
                      Buka Semua
                    </button>
                    <button
                      onClick={collapseAll}
                      className="text-xs bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors touch-manipulation"
                    >
                      Tutup Semua
                    </button>
                  </div>
                )}
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">Ringkasan</h3>
                      <p className="text-sm sm:text-base text-blue-800 leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags & Quick Info */}
              {(result.tags || result.historicalPeriod || result.culturalContext) && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    Informasi Cepat
                  </h4>
                  <div className="space-y-2">
                    {result.historicalPeriod && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 min-w-[80px]">Periode:</span>
                        <span className="text-sm text-gray-900">{result.historicalPeriod}</span>
                      </div>
                    )}
                    {result.culturalContext && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 min-w-[80px]">Budaya:</span>
                        <span className="text-sm text-gray-900">{result.culturalContext}</span>
                      </div>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 min-w-[80px]">Tags:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Sections - Collapsible */}
              {result.sections && result.sections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Analisis Detail
                  </h3>
                  {result.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors"
                    >
                      {/* Section Header - Clickable */}
                      <button
                        onClick={() => toggleSection(idx)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                      >
                        <h4 className="font-semibold text-gray-900 text-left flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {idx + 1}
                          </span>
                          {section.title}
                        </h4>
                        {expandedSections.has(idx) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {/* Section Content - Collapsible */}
                      {expandedSections.has(idx) && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                          {section.content && (
                            <p className="text-sm text-gray-700 leading-relaxed pt-3">{section.content}</p>
                          )}

                          {section.items && section.items.length > 0 && (
                            <ul className="space-y-2 pt-2">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-indigo-600 mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {section.subsections && section.subsections.length > 0 && (
                            <div className="space-y-4 pt-3">
                              {section.subsections.map((sub, subIdx) => (
                                <div key={subIdx} className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="font-semibold text-gray-800 mb-2 text-sm">{sub.subtitle}</h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">{sub.content}</p>
                                  {sub.bullets && sub.bullets.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                      {sub.bullets.map((bullet, bulletIdx) => (
                                        <li key={bulletIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                          <span className="text-indigo-500 mt-1">◦</span>
                                          <span>{bullet}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Conclusion */}
              {result.conclusion && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 sm:p-5">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Kesimpulan
                  </h4>
                  <p className="text-sm sm:text-base text-purple-800 leading-relaxed">{result.conclusion}</p>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">💡 Rekomendasi</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-600 mt-0.5 font-bold">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Error State
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Analisis Gagal</h4>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Image State */}
      {!imageFile && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Upload gambar untuk memulai analisis AI</p>
          <p className="text-sm text-gray-500 mt-1">Mendukung objek bersejarah, bangunan, dan alam</p>
        </div>
      )}
    </div>
  );
};

export default VLMAnalyzerEnhanced;
