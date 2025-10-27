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
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  FileText,
  Newspaper,
  GraduationCap,
  BookMarked,
  Globe,
  Search,
} from 'lucide-react';
import {
  vlmServiceEnhanced,
  VLMAnalysisResultEnhanced,
  DetailedSection,
  Reference,
  AccuracyMeasurement,
  SimilarImage,
} from '../services/vlmServiceEnhanced';

interface VLMAnalyzerEnhancedProps {
  imageFile?: File | string;
  analysisType?: 'general' | 'artifact' | 'building' | 'nature';
  onAnalysisComplete?: (result: VLMAnalysisResultEnhanced) => void;
  autoAnalyze?: boolean;
  withReferences?: boolean; // Enable/disable reference search & accuracy measurement
}

export const VLMAnalyzerEnhanced: React.FC<VLMAnalyzerEnhancedProps> = ({
  imageFile,
  analysisType = 'artifact',
  onAnalysisComplete,
  autoAnalyze = false,
  withReferences = true, // Default: enabled
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
        analysisResult = await vlmServiceEnhanced.analyzeHistoricalObject(imageFile, withReferences);
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
    <div className="space-y-2.5">
      {/* Preview Image */}
      {previewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 shadow-md">
          <img src={previewUrl} alt="Preview" className="w-full h-48 sm:h-56 object-contain bg-gray-50" />
        </div>
      )}

      {/* Analyze Button */}
      {!autoAnalyze && imageFile && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md touch-manipulation active:scale-95 text-sm font-semibold"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menganalisis dengan AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analisis dengan AI</span>
            </>
          )}
        </button>
      )}

      {/* Loading State */}
      {analyzing && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-blue-900 font-semibold text-sm">🧠 Menganalisis Objek...</p>
          {withReferences && analysisType === 'artifact' && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Analisis gambar</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span>Cari referensi</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span>Gambar serupa</span>
              </div>
            </div>
          )}
          <p className="text-xs text-blue-600">⏱️ ~10-20 detik</p>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-2.5">
          {result.success ? (
            <>
              {/* Success Header */}
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold text-sm">Analisis Selesai</span>
                </div>
                {result.sections && result.sections.length > 0 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={expandAll}
                      className="text-xs bg-white border border-green-300 text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors touch-manipulation"
                    >
                      Buka
                    </button>
                    <button
                      onClick={collapseAll}
                      className="text-xs bg-white border border-green-300 text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors touch-manipulation"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1 text-sm">Ringkasan</h3>
                      <p className="text-xs text-blue-800 leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags & Quick Info */}
              {(result.tags || result.historicalPeriod || result.culturalContext) && (
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    Informasi Cepat
                  </h4>
                  <div className="space-y-1.5">
                    {result.historicalPeriod && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 min-w-[60px]">Periode:</span>
                        <span className="text-xs text-gray-900">{result.historicalPeriod}</span>
                      </div>
                    )}
                    {result.culturalContext && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 min-w-[60px]">Budaya:</span>
                        <span className="text-xs text-gray-900">{result.culturalContext}</span>
                      </div>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-600 min-w-[60px]">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {result.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium"
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Analisis Detail
                  </h3>
                  {result.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors"
                    >
                      {/* Section Header - Clickable */}
                      <button
                        onClick={() => toggleSection(idx)}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                      >
                        <h4 className="font-semibold text-gray-900 text-left flex items-center gap-1.5 text-sm">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {idx + 1}
                          </span>
                          {section.title}
                        </h4>
                        {expandedSections.has(idx) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {/* Section Content - Collapsible */}
                      {expandedSections.has(idx) && (
                        <div className="px-2.5 pb-2.5 space-y-2 border-t border-gray-100">
                          {section.content && (
                            <p className="text-xs text-gray-700 leading-relaxed pt-2">{section.content}</p>
                          )}

                          {section.items && section.items.length > 0 && (
                            <ul className="space-y-1 pt-1">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-1.5 text-xs text-gray-700">
                                  <span className="text-indigo-600 mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {section.subsections && section.subsections.length > 0 && (
                            <div className="space-y-2 pt-1.5">
                              {section.subsections.map((sub, subIdx) => (
                                <div key={subIdx} className="bg-gray-50 rounded p-2">
                                  <h5 className="font-semibold text-gray-800 mb-1 text-xs">{sub.subtitle}</h5>
                                  <p className="text-xs text-gray-700 leading-relaxed">{sub.content}</p>
                                  {sub.bullets && sub.bullets.length > 0 && (
                                    <ul className="mt-1.5 space-y-0.5">
                                      {sub.bullets.map((bullet, bulletIdx) => (
                                        <li key={bulletIdx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                          <span className="text-indigo-500 mt-0.5">◦</span>
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-2.5">
                  <h4 className="font-semibold text-purple-900 mb-1.5 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4" />
                    Kesimpulan
                  </h4>
                  <p className="text-xs text-purple-800 leading-relaxed">{result.conclusion}</p>
                </div>
              )}

              {/* Accuracy Measurement - Perplexity Style */}
              {result.accuracy && (
                <AccuracyCard accuracy={result.accuracy} />
              )}

              {/* References - Perplexity Style */}
              {result.references && result.references.length > 0 && (
                <ReferencesSection references={result.references} searchQueries={result.searchQueries} />
              )}

              {/* Similar Images */}
              {result.similarImages && result.similarImages.length > 0 && (
                <SimilarImagesSection images={result.similarImages} />
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  <h4 className="font-semibold text-blue-900 mb-1.5 text-sm">💡 Rekomendasi</h4>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-blue-800">
                        <span className="text-blue-600 mt-0.5 font-semibold">{idx + 1}.</span>
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

// ============================================================================
// ACCURACY CARD COMPONENT (Perplexity-style)
// ============================================================================

interface AccuracyCardProps {
  accuracy: AccuracyMeasurement;
}

const AccuracyCard: React.FC<AccuracyCardProps> = ({ accuracy }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const getVerificationBadge = (status: AccuracyMeasurement['verificationStatus']) => {
    const badges = {
      verified: { label: 'Terverifikasi', color: 'bg-green-100 text-green-700', icon: '✓' },
      partially_verified: { label: 'Sebagian Terverifikasi', color: 'bg-yellow-100 text-yellow-700', icon: '◐' },
      unverified: { label: 'Belum Terverifikasi', color: 'bg-gray-100 text-gray-700', icon: '○' },
    };
    return badges[status];
  };

  const badge = getVerificationBadge(accuracy.verificationStatus);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Pengukuran Akurasi
        </h4>
        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
          {badge.icon} {badge.label}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-white rounded-lg p-2.5 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-700">Skor Kepercayaan</span>
          <span className={`text-lg font-bold ${getScoreColor(accuracy.confidenceScore)}`}>
            {accuracy.confidenceScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              accuracy.confidenceScore >= 80
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : accuracy.confidenceScore >= 60
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : 'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
            style={{ width: `${accuracy.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Factors Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <FactorCard
          icon={<Brain className="w-3 h-3" />}
          label="Analisis Visual"
          score={accuracy.factors.visualAnalysis}
        />
        <FactorCard
          icon={<FileText className="w-3 h-3" />}
          label="Dukungan Referensi"
          score={accuracy.factors.referenceSupport}
        />
        <FactorCard
          icon={<ShieldCheck className="w-3 h-3" />}
          label="Kredibilitas Sumber"
          score={accuracy.factors.sourceTrustworthiness}
        />
        <FactorCard
          icon={<TrendingUp className="w-3 h-3" />}
          label="Validasi Silang"
          score={accuracy.factors.crossValidation}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around bg-white rounded-lg p-2 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">{accuracy.referencesFound}</div>
          <div className="text-xs text-gray-600">Referensi</div>
        </div>
        <div className="w-px h-8 bg-gray-300" />
        <div>
          <div className="text-lg font-bold text-indigo-600">{accuracy.similarImagesFound}</div>
          <div className="text-xs text-gray-600">Gambar</div>
        </div>
        <div className="w-px h-8 bg-gray-300" />
        <div>
          <div className="text-lg font-bold text-purple-600">{accuracy.consistencyScore}%</div>
          <div className="text-xs text-gray-600">Konsistensi</div>
        </div>
      </div>
    </div>
  );
};

interface FactorCardProps {
  icon: React.ReactNode;
  label: string;
  score: number;
}

const FactorCard: React.FC<FactorCardProps> = ({ icon, label, score }) => {
  return (
    <div className="bg-white rounded-lg p-2 shadow-sm">
      <div className="flex items-center gap-1 mb-1">
        <div className="text-blue-600">{icon}</div>
        <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-700">{score}</span>
      </div>
    </div>
  );
};

// ============================================================================
// SIMILAR IMAGES SECTION COMPONENT
// ============================================================================

interface SimilarImagesSectionProps {
  images: SimilarImage[];
}

const SimilarImagesSection: React.FC<SimilarImagesSectionProps> = ({ images }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2.5 space-y-2">
      <div>
        <h4 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          🔍 Cari Gambar Serupa
        </h4>
        <p className="text-xs text-gray-600 mt-0.5">
          Klik untuk membuka pencarian di browser
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {images.map((img, idx) => {
          // Icon untuk setiap search engine
          const getIcon = () => {
            if (img.source.includes('Google')) return '🔵';
            if (img.source.includes('Bing')) return '🟢';
            if (img.source.includes('Wikimedia')) return '🟡';
            return '🔍';
          };

          return (
            <a
              key={idx}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg overflow-hidden border border-indigo-200 hover:border-indigo-500 transition-all hover:shadow-lg bg-white transform hover:scale-105 duration-200"
            >
              {/* Header dengan icon search engine */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 text-center">
                <div className="text-2xl mb-1">{getIcon()}</div>
                <p className="text-white font-semibold text-xs">{img.source}</p>
              </div>

              {/* Content */}
              <div className="p-2 space-y-1.5">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
                    {img.title}
                  </p>
                  <ExternalLink className="w-3 h-3 text-indigo-600 flex-shrink-0 group-hover:scale-125 transition-transform" />
                </div>

                {/* Similarity Score */}
                {img.similarity && (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Relevansi</span>
                      <span className="font-bold text-indigo-600">{img.similarity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-400 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${img.similarity}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs text-gray-600 leading-tight line-clamp-2">{img.context}</p>

                {/* CTA Button */}
                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-1.5 rounded font-semibold text-xs group-hover:from-indigo-600 group-hover:to-purple-600 transition-all flex items-center justify-center gap-1">
                  <Search className="w-3 h-3" />
                  Cari Gambar
                </button>
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="bg-white/80 backdrop-blur rounded p-2 border border-indigo-200">
        <p className="text-xs text-gray-700 text-center">
          💡 Bandingkan dengan hasil pencarian untuk validasi
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// REFERENCES SECTION COMPONENT (Perplexity-style)
// ============================================================================

interface ReferencesSectionProps {
  references: Reference[];
  searchQueries?: string[];
}

const ReferencesSection: React.FC<ReferencesSectionProps> = ({ references, searchQueries }) => {
  const [expandedRef, setExpandedRef] = useState<number | null>(null);

  const getTypeIcon = (type: Reference['type']) => {
    const icons = {
      article: <FileText className="w-3 h-3" />,
      journal: <GraduationCap className="w-3 h-3" />,
      book: <BookMarked className="w-3 h-3" />,
      news: <Newspaper className="w-3 h-3" />,
      web: <Globe className="w-3 h-3" />,
    };
    return icons[type];
  };

  const getCredibilityBadge = (credibility: Reference['credibility']) => {
    const badges = {
      HIGH: { label: 'Tinggi', color: 'bg-green-100 text-green-700 border-green-200' },
      MEDIUM: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      LOW: { label: 'Rendah', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    };
    return badges[credibility];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Referensi & Sumber
        </h4>
        <div className="text-xs text-gray-600">
          {references.length} sumber
        </div>
      </div>

      {/* Search Queries Used */}
      {searchQueries && searchQueries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-600">Pencarian:</span>
          {searchQueries.map((query, idx) => (
            <span
              key={idx}
              className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full border border-gray-200"
            >
              "{query}"
            </span>
          ))}
        </div>
      )}

      {/* References List */}
      <div className="space-y-1.5">
        {references.map((ref) => {
          const isExpanded = expandedRef === ref.id;
          const badge = getCredibilityBadge(ref.credibility);

          return (
            <div
              key={ref.id}
              className="border border-gray-200 rounded overflow-hidden hover:border-indigo-300 transition-colors"
            >
              {/* Reference Header */}
              <button
                onClick={() => setExpandedRef(isExpanded ? null : ref.id)}
                className="w-full flex items-start gap-2 p-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {ref.id}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1 mb-0.5">
                    <div className="text-indigo-600 mt-0.5">{getTypeIcon(ref.type)}</div>
                    <h5 className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">{ref.title}</h5>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <span className="font-medium truncate">{ref.source}</span>
                    {ref.date && (
                      <>
                        <span>•</span>
                        <span>{ref.date}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {ref.relevanceScore && (
                      <span className="text-xs text-gray-500">
                        {ref.relevanceScore}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-2 pb-2 pt-0 space-y-1.5 border-t border-gray-100">
                  {ref.snippet && (
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-2 rounded">
                      {ref.snippet}
                    </p>
                  )}
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka Sumber
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 Referensi dikumpulkan otomatis. Selalu verifikasi dari sumber asli.
      </div>
    </div>
  );
};

export default VLMAnalyzerEnhanced;
