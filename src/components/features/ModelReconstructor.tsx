import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Wrench, Sparkles, Loader2, Info, ArrowRight } from 'lucide-react';
import { nanoBananaService } from '../../services/nanoBananaService';

interface ModelReconstructorProps {
  imageData: string | null;
  onClose: () => void;
}

interface DamageAnalysis {
  hasDamage: boolean;
  damageDescription: string;
  damageLevel: 'none' | 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface RepairComplexity {
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  estimatedTime: string;
  requiredSkillLevel: string;
  description: string;
}

export const ModelReconstructor: React.FC<ModelReconstructorProps> = ({ imageData, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [damageAnalysis, setDamageAnalysis] = useState<DamageAnalysis | null>(null);
  const [repairComplexity, setRepairComplexity] = useState<RepairComplexity | null>(null);
  const [reconstructionGuide, setReconstructionGuide] = useState<string>('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'analyze' | 'reconstruct' | 'complete'>('analyze');

  const handleAnalyze = async () => {
    if (!imageData) {
      setError('Tidak ada gambar untuk dianalisis');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      console.log('🔍 Starting damage analysis...');

      // Analyze damage
      const analysis = await nanoBananaService.analyzeModelDamage(imageData);
      setDamageAnalysis(analysis);

      if (analysis.hasDamage) {
        // Get repair complexity
        const complexity = await nanoBananaService.estimateRepairComplexity(
          imageData,
          analysis.damageLevel
        );
        setRepairComplexity(complexity);

        // Get improvement suggestions
        const suggestions = await nanoBananaService.generateImprovementSuggestions(imageData);
        setImprovements(suggestions);
      }

      console.log('✅ Analysis complete:', analysis);
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError('Gagal menganalisis model: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReconstruct = async () => {
    if (!imageData || !damageAnalysis) {
      setError('Tidak ada data untuk rekonstruksi');
      return;
    }

    setIsReconstructing(true);
    setError('');
    setCurrentStep('reconstruct');

    try {
      console.log('🔧 Starting reconstruction...');

      const guide = await nanoBananaService.reconstructModel(
        imageData,
        damageAnalysis.damageDescription
      );

      setReconstructionGuide(guide);
      setCurrentStep('complete');

      console.log('✅ Reconstruction guide generated');
    } catch (err) {
      console.error('❌ Reconstruction error:', err);
      setError('Gagal merekonstruksi model: ' + (err as Error).message);
      setCurrentStep('analyze');
    } finally {
      setIsReconstructing(false);
    }
  };

  const getDamageLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'text-green-400';
      case 'low': return 'text-yellow-400';
      case 'medium': return 'text-orange-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'complex': return 'text-orange-400';
      case 'very_complex': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!nanoBananaService.isAvailable()) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Nano Banana Not Configured</h3>
            <p className="text-sm text-gray-300">
              Please set VITE_GEMINI_API_KEY in your .env file to use AI reconstruction features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Rekonstruksi 3D Model</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Image Preview */}
      {imageData && (
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Model Preview:</p>
          <img
            src={imageData}
            alt="3D Model"
            className="w-full h-48 object-contain bg-gray-900 rounded"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {!damageAnalysis && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !imageData}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menganalisis Model...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analisis Kerusakan
            </>
          )}
        </button>
      )}

      {/* Damage Analysis Results */}
      {damageAnalysis && (
        <div className="space-y-4">
          {/* Damage Status */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Status Kerusakan</h4>
              <span className={`text-sm font-medium ${getDamageLevelColor(damageAnalysis.damageLevel)}`}>
                {damageAnalysis.damageLevel.toUpperCase()}
              </span>
            </div>

            {damageAnalysis.hasDamage ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{damageAnalysis.damageDescription}</p>
                </div>

                {/* Recommendations */}
                {damageAnalysis.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-400 mb-2">Rekomendasi:</p>
                    <ul className="space-y-1">
                      {damageAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-1" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">Model dalam kondisi baik, tidak ada kerusakan terdeteksi.</p>
              </div>
            )}
          </div>

          {/* Repair Complexity */}
          {repairComplexity && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Kompleksitas Perbaikan</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Tingkat Kesulitan:</span>
                  <span className={`text-sm font-medium ${getComplexityColor(repairComplexity.complexity)}`}>
                    {repairComplexity.complexity.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Estimasi Waktu:</span>
                  <span className="text-sm text-white">{repairComplexity.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Skill Level:</span>
                  <span className="text-sm text-white">{repairComplexity.requiredSkillLevel}</span>
                </div>
                <p className="text-sm text-gray-300 mt-3 pt-3 border-t border-gray-700">
                  {repairComplexity.description}
                </p>
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {improvements.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="font-semibold">Saran Perbaikan</h4>
              </div>
              <ul className="space-y-2">
                {improvements.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400 font-medium">{idx + 1}.</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reconstruct Button */}
          {damageAnalysis.hasDamage && !reconstructionGuide && (
            <button
              onClick={handleReconstruct}
              disabled={isReconstructing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isReconstructing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Panduan Rekonstruksi...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  Mulai Rekonstruksi
                </>
              )}
            </button>
          )}

          {/* Reconstruction Guide */}
          {reconstructionGuide && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-400">Panduan Rekonstruksi</h4>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {reconstructionGuide}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
