import React, { useState, useRef, useEffect } from 'react';
import {
  CameraIcon, VideoIcon, UploadIcon, ArrowRightIcon, LayoutGridIcon,
  CheckIcon, RocketIcon, PlayIcon, StopCircleIcon, HelpCircleIcon,
  ZapIcon, Grid2x2Icon, SunIcon, TimerIcon, RotateCwIcon, MoveIcon,
  NavigationIcon, Eye, Target, ArrowUpIcon, ArrowDownIcon, 
  MessageCircleIcon, LightbulbIcon, AlertTriangleIcon, CheckCircleIcon,
  ChevronUpIcon, ChevronDownIcon, BarChart3Icon, MapPinIcon,
  CpuIcon, ZapIcon as GpuIcon, HardDriveIcon, HardDriveIcon as MemoryStickIcon, Settings2Icon,
  MonitorIcon, SparklesIcon, BrainIcon, DatabaseIcon, CloudIcon,
  RotateCwIcon as RotateIcon, ZoomInIcon, RulerIcon, ScissorsIcon, 
  DownloadIcon, Share2Icon, FullscreenIcon, EyeIcon, LayersIcon, 
  SunIcon as LightIcon, InfoIcon, Maximize2Icon
} from 'lucide-react';

// Global state for sharing between components
let globalModels = [];
let globalActiveModel = null;

// Model storage utility
const ModelStorage = {
  addModel: (model) => {
    globalModels.unshift(model);
    globalActiveModel = model.id;
    // Trigger storage event for cross-component communication
    window.dispatchEvent(new CustomEvent('modelAdded', { detail: model }));
  },
  
  getModels: () => globalModels,
  
  getActiveModel: () => globalModels.find(m => m.id === globalActiveModel),
  
  setActiveModel: (id) => {
    globalActiveModel = id;
    window.dispatchEvent(new CustomEvent('modelChanged', { detail: id }));
  }
};

// Types for Gaussian Splatting
const GaussianSplattingConfigPanel = ({ config, onConfigChange, isProcessing }) => {
  const [activeSection, setActiveSection] = useState('basic');

  const updateConfig = (section, key, value) => {
    if (section === 'learningRate') {
      onConfigChange({
        ...config,
        learningRate: { ...config.learningRate, [key]: value }
      });
    } else {
      onConfigChange({ ...config, [key]: value });
    }
  };

  const presets = {
    fast: {
      iterations: 7000,
      densificationInterval: 100,
      opacityResetInterval: 3000,
      densifyFromIteration: 500,
      densifyUntilIteration: 15000,
      densifyGradThreshold: 0.0002,
      percentDense: 0.01,
      lambdaDssim: 0.2,
      learningRate: {
        position: 0.00016,
        rotation: 0.001,
        scaling: 0.001,
        opacity: 0.05,
        shHarmonics: 0.0025
      }
    },
    balanced: {
      iterations: 15000,
      densificationInterval: 100,
      opacityResetInterval: 3000,
      densifyFromIteration: 500,
      densifyUntilIteration: 15000,
      densifyGradThreshold: 0.0002,
      percentDense: 0.01,
      lambdaDssim: 0.2,
      learningRate: {
        position: 0.00016,
        rotation: 0.001,
        scaling: 0.005,
        opacity: 0.05,
        shHarmonics: 0.0025
      }
    },
    highQuality: {
      iterations: 30000,
      densificationInterval: 100,
      opacityResetInterval: 3000,
      densifyFromIteration: 500,
      densifyUntilIteration: 25000,
      densifyGradThreshold: 0.0002,
      percentDense: 0.01,
      lambdaDssim: 0.2,
      learningRate: {
        position: 0.00016,
        rotation: 0.001,
        scaling: 0.005,
        opacity: 0.05,
        shHarmonics: 0.0025
      }
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <SparklesIcon size={20} className="mr-3 text-purple-400" />
          Gaussian Splatting Configuration
        </h3>
        <div className="flex items-center space-x-2">
          <select
            onChange={(e) => e.target.value && onConfigChange(presets[e.target.value])}
            disabled={isProcessing}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Custom</option>
            <option value="fast">Fast (7K iterations)</option>
            <option value="balanced">Balanced (15K iterations)</option>
            <option value="highQuality">High Quality (30K iterations)</option>
          </select>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-1 bg-gray-900/50 rounded-lg p-1 mb-6">
        {[
          { id: 'basic', name: 'Basic', icon: <Settings2Icon size={16} /> },
          { id: 'advanced', name: 'Advanced', icon: <BrainIcon size={16} /> },
          { id: 'hardware', name: 'Hardware', icon: <CpuIcon size={16} /> }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {section.icon}
            <span className="ml-2">{section.name}</span>
          </button>
        ))}
      </div>

      {/* Basic Settings */}
      {activeSection === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/30 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Total Iterations</label>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={config.iterations}
              onChange={(e) => updateConfig('', 'iterations', parseInt(e.target.value))}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1K</span>
              <span className="font-bold text-purple-400">{config.iterations.toLocaleString()}</span>
              <span>50K</span>
            </div>
          </div>

          <div className="bg-gray-900/30 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">DSSIM Weight (λ)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.lambdaDssim}
              onChange={(e) => updateConfig('', 'lambdaDssim', parseFloat(e.target.value))}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.0</span>
              <span className="font-bold text-purple-400">{config.lambdaDssim}</span>
              <span>1.0</span>
            </div>
          </div>

          <div className="bg-gray-900/30 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Densification Interval</label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={config.densificationInterval}
              onChange={(e) => updateConfig('', 'densificationInterval', parseInt(e.target.value))}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50</span>
              <span className="font-bold text-purple-400">{config.densificationInterval}</span>
              <span>500</span>
            </div>
          </div>

          <div className="bg-gray-900/30 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Opacity Reset Interval</label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={config.opacityResetInterval}
              onChange={(e) => updateConfig('', 'opacityResetInterval', parseInt(e.target.value))}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1K</span>
              <span className="font-bold text-purple-400">{config.opacityResetInterval}</span>
              <span>10K</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {activeSection === 'advanced' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/30 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Densify From Iteration</label>
              <input
                type="number"
                min="100"
                max="5000"
                value={config.densifyFromIteration}
                onChange={(e) => updateConfig('', 'densifyFromIteration', parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-gray-900/30 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Densify Until Iteration</label>
              <input
                type="number"
                min="5000"
                max="40000"
                value={config.densifyUntilIteration}
                onChange={(e) => updateConfig('', 'densifyUntilIteration', parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-gray-900/30 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Densification Gradient Threshold</label>
              <input
                type="number"
                min="0.0001"
                max="0.001"
                step="0.0001"
                value={config.densifyGradThreshold}
                onChange={(e) => updateConfig('', 'densifyGradThreshold', parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-gray-900/30 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Percent Dense</label>
              <input
                type="number"
                min="0.001"
                max="0.1"
                step="0.001"
                value={config.percentDense}
                onChange={(e) => updateConfig('', 'percentDense', parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Learning Rates */}
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 text-indigo-300">Learning Rates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(config.learningRate).map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 rounded p-3">
                  <label className="block text-xs font-medium mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type="number"
                    min="0.0001"
                    max="0.1"
                    step="0.0001"
                    value={value}
                    onChange={(e) => updateConfig('learningRate', key, parseFloat(e.target.value))}
                    disabled={isProcessing}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hardware Settings */}
      {activeSection === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center">
              <GpuIcon size={16} className="mr-2 text-green-400" />
              GPU Settings
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">CUDA Memory Fraction</label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  defaultValue="0.8"
                  disabled={isProcessing}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>50%</span>
                  <span>80%</span>
                  <span>95%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Batch Size</label>
                <select disabled={isProcessing} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs">
                  <option value="1">1 (Low VRAM)</option>
                  <option value="2">2 (Medium)</option>
                  <option value="4">4 (High)</option>
                  <option value="8">8 (Very High)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center">
              <CpuIcon size={16} className="mr-2 text-blue-400" />
              CPU Settings
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Worker Threads</label>
                <select disabled={isProcessing} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs">
                  <option value="auto">Auto</option>
                  <option value="4">4 Threads</option>
                  <option value="8">8 Threads</option>
                  <option value="16">16 Threads</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">RAM Cache Size</label>
                <select disabled={isProcessing} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs">
                  <option value="2">2 GB</option>
                  <option value="4">4 GB</option>
                  <option value="8">8 GB</option>
                  <option value="16">16 GB</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Gaussian Splatting Progress Monitor
const GaussianSplattingProgress = ({ progress, isVisible }) => {
  const getStageInfo = (stage) => {
    switch (stage) {
      case 'preprocessing':
        return { name: 'Preprocessing Images', color: 'text-blue-400', icon: <DatabaseIcon size={16} /> };
      case 'feature_extraction':
        return { name: 'Feature Extraction', color: 'text-yellow-400', icon: <BrainIcon size={16} /> };
      case 'point_cloud':
        return { name: 'Point Cloud Generation', color: 'text-green-400', icon: <SparklesIcon size={16} /> };
      case 'training':
        return { name: 'Gaussian Training', color: 'text-purple-400', icon: <CpuIcon size={16} /> };
      case 'optimization':
        return { name: 'Final Optimization', color: 'text-pink-400', icon: <SparklesIcon size={16} /> };
      case 'complete':
        return { name: 'Complete', color: 'text-green-400', icon: <CheckIcon size={16} /> };
      default:
        return { name: 'Processing', color: 'text-gray-400', icon: <CpuIcon size={16} /> };
    }
  };

  const stageInfo = getStageInfo(progress.stage);
  const overallProgress = progress.stage === 'complete' ? 100 : 
    (progress.iteration / progress.totalIterations) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-8 max-w-2xl w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="p-4 bg-purple-600/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <SparklesIcon size={40} className="text-purple-400 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Gaussian Splatting in Progress</h3>
          <p className="text-gray-400">Creating high-quality 3D representation...</p>
        </div>

        {/* Current Stage */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`p-2 bg-gray-700 rounded-lg mr-3 ${stageInfo.color}`}>
                {stageInfo.icon}
              </div>
              <span className="font-medium">{stageInfo.name}</span>
            </div>
            <span className="text-sm text-gray-400">
              {progress.stage !== 'complete' && `${Math.round(overallProgress)}%`}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Training Metrics */}
        {(progress.stage === 'training' || progress.stage === 'optimization') && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{progress.iteration}</div>
              <div className="text-xs text-gray-400">Iteration</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">{progress.psnr.toFixed(2)}</div>
              <div className="text-xs text-gray-400">PSNR</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">{progress.ssim.toFixed(3)}</div>
              <div className="text-xs text-gray-400">SSIM</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-400">{progress.loss.toFixed(4)}</div>
              <div className="text-xs text-gray-400">Loss</div>
            </div>
          </div>
        )}

        {/* System Resources */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center">
                <MemoryStickIcon size={14} className="mr-2 text-blue-400" />
                Memory Usage
              </span>
              <span className="text-sm text-gray-400">{progress.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.memoryUsage}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center">
                <GpuIcon size={14} className="mr-2 text-green-400" />
                GPU Utilization
              </span>
              <span className="text-sm text-gray-400">{progress.gpuUtilization}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-green-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.gpuUtilization}%` }}
              />
            </div>
          </div>
        </div>

        {/* Time Estimate */}
        {progress.stage !== 'complete' && (
          <div className="text-center text-sm text-gray-400">
            Estimated time remaining: {Math.round(progress.estimatedTimeRemaining / 60)} minutes
          </div>
        )}

        {/* Complete State */}
        {progress.stage === 'complete' && (
          <div className="text-center">
            <div className="p-3 bg-green-600/20 text-green-400 rounded-lg mb-4">
              <CheckIcon size={20} className="inline mr-2" />
              Gaussian Splatting Complete!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Camera Analysis for Gaussian Splatting
const GaussianSplattingCameraAnalysis = ({ stats, captures }) => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeForGaussianSplatting = () => {
    setAnalyzing(true);
    
    // Simulate advanced analysis for Gaussian Splatting requirements
    setTimeout(() => {
      const anglesCovered = [...new Set(captures.map(c => c.angle))].length;
      const levelsCovered = [...new Set(captures.map(c => c.level))].length;
      
      // Calculate various metrics important for Gaussian Splatting
      const coverage = (anglesCovered / 36) * 100;
      const verticalCoverage = (levelsCovered / 4) * 100;
      const density = captures.length / Math.max(1, anglesCovered);
      
      // Simulate feature detection quality
      const featureQuality = Math.min(95, 60 + coverage * 0.3 + density * 10);
      const overlappingViews = Math.min(100, density * 15);
      const reconstructionQuality = Math.min(100, (coverage + verticalCoverage) / 2 + featureQuality * 0.2);
      
      const results = {
        coverage,
        verticalCoverage,
        density,
        featureQuality,
        overlappingViews,
        reconstructionQuality,
        gaussianCompatibility: Math.min(100, (reconstructionQuality + overlappingViews) / 2),
        recommendations: []
      };
      
      // Generate recommendations
      if (coverage < 80) {
        results.recommendations.push('Capture more angles for better 360° coverage');
      }
      if (verticalCoverage < 75) {
        results.recommendations.push('Add more vertical levels for complete coverage');
      }
      if (density < 2) {
        results.recommendations.push('Increase photo density at each angle');
      }
      if (overlappingViews < 60) {
        results.recommendations.push('Ensure sufficient overlap between adjacent views');
      }

      setAnalysisResults(results);
      setAnalyzing(false);
    }, 3000);
  };

  useEffect(() => {
    if (captures.length > 10) {
      analyzeForGaussianSplatting();
    }
  }, [captures.length]);

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <SparklesIcon size={20} className="mr-3 text-purple-400" />
          Gaussian Splatting Analysis
        </h3>
        {analyzing && (
          <div className="flex items-center text-purple-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
            Analyzing...
          </div>
        )}
      </div>

      {analysisResults ? (
        <div className="space-y-6">
          {/* Main Compatibility Score */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {Math.round(analysisResults.gaussianCompatibility)}%
              </div>
              <div className="text-sm text-gray-300 mb-4">Gaussian Splatting Compatibility</div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analysisResults.gaussianCompatibility}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {analysisResults.gaussianCompatibility >= 80 ? 'Excellent for high-quality reconstruction' :
                 analysisResults.gaussianCompatibility >= 60 ? 'Good compatibility with minor improvements needed' :
                 'Consider capturing more photos for better results'}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{Math.round(analysisResults.featureQuality)}%</div>
                <div className="text-xs text-gray-400 mt-1">Feature Quality</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${analysisResults.featureQuality}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-pink-400">{Math.round(analysisResults.overlappingViews)}%</div>
                <div className="text-xs text-gray-400 mt-1">View Overlap</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-pink-400 h-1.5 rounded-full" style={{ width: `${analysisResults.overlappingViews}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">{Math.round(analysisResults.reconstructionQuality)}%</div>
                <div className="text-xs text-gray-400 mt-1">Expected Quality</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${analysisResults.reconstructionQuality}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{Math.round(analysisResults.coverage)}%</div>
                <div className="text-xs text-gray-400 mt-1">Angular Coverage</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${analysisResults.coverage}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{Math.round(analysisResults.verticalCoverage)}%</div>
                <div className="text-xs text-gray-400 mt-1">Vertical Coverage</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${analysisResults.verticalCoverage}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{analysisResults.density.toFixed(1)}</div>
                <div className="text-xs text-gray-400 mt-1">Photo Density</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, analysisResults.density * 25)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {analysisResults.recommendations.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3 text-yellow-300">Optimization Recommendations</h4>
              <ul className="text-xs text-gray-300 space-y-2">
                {analysisResults.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details */}
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Technical Requirements Check</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Minimum 20 photos</span>
                <span className={captures.length >= 20 ? 'text-green-400' : 'text-red-400'}>
                  {captures.length >= 20 ? '✓' : '✗'} ({captures.length})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>360° coverage</span>
                <span className={analysisResults.coverage >= 90 ? 'text-green-400' : analysisResults.coverage >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                  {analysisResults.coverage >= 90 ? '✓' : analysisResults.coverage >= 70 ? '~' : '✗'} ({Math.round(analysisResults.coverage)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Multi-level capture</span>
                <span className={analysisResults.verticalCoverage >= 75 ? 'text-green-400' : 'text-yellow-400'}>
                  {analysisResults.verticalCoverage >= 75 ? '✓' : '~'} ({Math.round(analysisResults.verticalCoverage)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sufficient overlap</span>
                <span className={analysisResults.overlappingViews >= 60 ? 'text-green-400' : 'text-yellow-400'}>
                  {analysisResults.overlappingViews >= 60 ? '✓' : '~'} ({Math.round(analysisResults.overlappingViews)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : captures.length > 0 ? (
        <div className="text-center py-8">
          <div className="animate-pulse p-6 bg-purple-600/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <BrainIcon size={32} className="text-purple-400" />
          </div>
          <div className="text-gray-400">Analyzing capture quality for Gaussian Splatting...</div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="p-6 bg-gray-600/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CameraIcon size={32} className="text-gray-400" />
          </div>
          <div className="text-gray-400">Start capturing photos to see Gaussian Splatting analysis</div>
        </div>
      )}
    </div>
  );
};

// Enhanced Photo Scan Tab with Gaussian Splatting
const Enhanced3DPhotoScanTab = ({ onSwitchToViewer }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [captures, setCaptures] = useState([]);
  const [stream, setStream] = useState(null);
  const [torch, setTorch] = useState(false);
  const [grid, setGrid] = useState(true);
  const [burst, setBurst] = useState(false);
  const [lowLight, setLowLight] = useState(false);
  const [overExp, setOverExp] = useState(false);
  
  // Enhanced 3D Guide states
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetAngle, setTargetAngle] = useState(0);
  const [targetLevel, setTargetLevel] = useState(1);
  const [distance, setDistance] = useState('perfect');
  const [objectDetected, setObjectDetected] = useState(true);
  const [framePosition, setFramePosition] = useState({ x: 25, y: 25, width: 50, height: 50 });
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [lightingQuality, setLightingQuality] = useState('good');
  const [objectConfidence, setObjectConfidence] = useState(0.85);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Gaussian Splatting specific states
  const [gaussianConfig, setGaussianConfig] = useState({
    iterations: 15000,
    densificationInterval: 100,
    opacityResetInterval: 3000,
    densifyFromIteration: 500,
    densifyUntilIteration: 15000,
    densifyGradThreshold: 0.0002,
    percentDense: 0.01,
    lambdaDssim: 0.2,
    learningRate: {
      position: 0.00016,
      rotation: 0.001,
      scaling: 0.005,
      opacity: 0.05,
      shHarmonics: 0.0025
    }
  });
  const [gaussianProgress, setGaussianProgress] = useState({
    stage: 'preprocessing',
    iteration: 0,
    totalIterations: 15000,
    loss: 0.5,
    psnr: 25.0,
    ssim: 0.85,
    lpips: 0.15,
    estimatedTimeRemaining: 1800,
    memoryUsage: 45,
    gpuUtilization: 78
  });
  const [showGaussianProgress, setShowGaussianProgress] = useState(false);
  const [gaussianOptimized, setGaussianOptimized] = useState(false);

  // 36 angles (every 10 degrees) and 4 levels
  const requiredAngles = Array.from({ length: 36 }, (_, i) => i * 10);
  const levels = [
    { level: 1, name: 'Low', description: 'Below object level', color: '#ef4444', minPhotos: 18 },
    { level: 2, name: 'Middle', description: 'Object center level', color: '#3b82f6', minPhotos: 36 },
    { level: 3, name: 'High', description: 'Above object level', color: '#10b981', minPhotos: 18 },
    { level: 4, name: 'Top', description: 'Top-down view', color: '#f59e0b', minPhotos: 12 }
  ];

  const calculateStats = () => {
    const totalRequired = levels.reduce((sum, level) => sum + level.minPhotos, 0);
    const totalCaptured = captures.length;
    const completedLevels = levels
      .filter(level => captures.filter(c => c.level === level.level).length >= level.minPhotos)
      .map(l => l.level);
    
    // Calculate quality score based on coverage and distribution
    let qualityScore = 0;
    let gaussianCompatibility = 0;
    
    if (totalCaptured > 0) {
      const coverageScore = Math.min((totalCaptured / totalRequired) * 60, 60);
      const distributionScore = Math.min((completedLevels.length / levels.length) * 30, 30);
      const consistencyScore = lightingQuality === 'excellent' ? 10 : lightingQuality === 'good' ? 7 : 3;
      qualityScore = coverageScore + distributionScore + consistencyScore;
      
      // Calculate Gaussian Splatting compatibility
      const anglesCovered = [...new Set(captures.map(c => c.angle))].length;
      const angularCoverage = (anglesCovered / 36) * 100;
      const verticalCoverage = (completedLevels.length / 4) * 100;
      const density = totalCaptured / Math.max(1, anglesCovered);
      const overlappingViews = Math.min(100, density * 15);
      
      gaussianCompatibility = Math.min(100, (angularCoverage + verticalCoverage + overlappingViews) / 3);
    }

    return {
      totalRequired,
      totalCaptured,
      currentLevel,
      completedLevels,
      qualityScore,
      gaussianCompatibility
    };
  };

  const processWithGaussianSplatting = () => {
    const stats = calculateStats();
    if (stats.totalCaptured === 0) return alert('Take photos first!');
    
    if (stats.gaussianCompatibility < 60) {
      const proceed = window.confirm(
        `Gaussian Splatting compatibility is ${Math.round(stats.gaussianCompatibility)}%. This may result in lower quality 3D model. Proceed anyway?`
      );
      if (!proceed) return;
    }
    
    setShowGaussianProgress(true);
    setGaussianProgress(prev => ({ 
      ...prev, 
      totalIterations: gaussianConfig.iterations 
    }));
    
    // Simulate Gaussian Splatting process
    const stages = ['preprocessing', 'feature_extraction', 'point_cloud', 'training', 'optimization', 'complete'];
    let stageIndex = 0;
    let iteration = 0;
    
    const progressInterval = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        if (stages[stageIndex] === 'training' || stages[stageIndex] === 'optimization') {
          iteration += Math.floor(Math.random() * 50) + 25;
          
          setGaussianProgress(prev => ({
            ...prev,
            stage: stages[stageIndex],
            iteration: Math.min(iteration, gaussianConfig.iterations),
            loss: Math.max(0.001, prev.loss - Math.random() * 0.01),
            psnr: Math.min(45, prev.psnr + Math.random() * 0.5),
            ssim: Math.min(0.99, prev.ssim + Math.random() * 0.005),
            lpips: Math.max(0.01, prev.lpips - Math.random() * 0.002),
            estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - 30),
            memoryUsage: 45 + Math.random() * 30,
            gpuUtilization: 70 + Math.random() * 25
          }));
          
          if (iteration >= gaussianConfig.iterations) {
            stageIndex++;
            iteration = 0;
          }
        } else {
          setTimeout(() => {
            stageIndex++;
            setGaussianProgress(prev => ({
              ...prev,
              stage: stages[stageIndex]
            }));
          }, 2000);
        }
      } else {
        setGaussianProgress(prev => ({
          ...prev,
          stage: 'complete'
        }));
        clearInterval(progressInterval);
        
        setTimeout(() => {
          setShowGaussianProgress(false);
          
          // Generate a unique model
          const modelId = `model_${Date.now()}`;
          const newModel = { 
            id: modelId,
            name: `3D Model ${ModelStorage.getModels().length + 1}`,
            type: 'gaussian_splatting',
            date: new Date().toLocaleDateString(),
            thumbnail: captures[0]?.dataUrl || 'https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            captures: captures.map(c => c.dataUrl),
            config: gaussianConfig,
            metadata: {
              totalPhotos: captures.length,
              levels: levels.map(l => ({
                level: l.level,
                name: l.name,
                captured: captures.filter(c => c.level === l.level).length,
                required: l.minPhotos
              })),
              qualityScore: stats.qualityScore,
              gaussianCompatibility: stats.gaussianCompatibility,
              captureAngles: captures.map(c => ({ angle: c.angle, level: c.level })),
              finalMetrics: {
                psnr: gaussianProgress.psnr,
                ssim: gaussianProgress.ssim,
                lpips: gaussianProgress.lpips
              }
            },
            vertices: 124532 + Math.floor(Math.random() * 50000),
            faces: 248964 + Math.floor(Math.random() * 100000),
            textureResolution: '4K',
            fileSize: '24.6 MB',
            tags: ['3D Scan', 'Gaussian Splatting', 'High Quality']
          };
          
          // Add to model storage
          ModelStorage.addModel(newModel);
          
          // Show success and option to view
          setTimeout(() => {
            if (window.confirm('Gaussian Splatting complete! Would you like to view the 3D model now?')) {
              onSwitchToViewer();
            }
          }, 500);
        }, 3000);
      }
    }, 200);
  };

  // Enhanced camera activation with better mobile support
  const enableCam = async () => {
    try {
      // Try environment camera first for mobile devices
      const constraints = {
        video: { 
          facingMode: { exact: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30 },
          ...(torch && { torch: true })
        }
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to any camera if environment camera fails
        console.log('Environment camera not available, trying any camera...');
        const fallbackConstraints = {
          video: { 
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            frameRate: { ideal: 30 }
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }
      
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure video plays on mobile
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current.play().catch(console.error);
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera could not be activated: ' + err.message + '\n\nFor mobile browsers, please make sure:\n1. Camera permissions are granted\n2. Using HTTPS connection\n3. Camera is not used by other apps');
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    setCaptures(prev => [...prev, {
      angle: currentAngle,
      level: currentLevel,
      dataUrl,
      timestamp: Date.now()
    }]);
    
    // Move to next target
    const nextAngle = (currentAngle + 10) % 360;
    setCurrentAngle(nextAngle);
    if (nextAngle === 0) {
      setCurrentLevel(prev => Math.min(4, prev + 1));
    }
  };

  const toggleTorch = async () => {
    try {
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities && track.getCapabilities().torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torch }]
          });
          setTorch(!torch);
        } else {
          alert('Torch not supported on this device');
        }
      }
    } catch (err) {
      console.error('Torch error:', err);
      alert('Could not toggle torch: ' + err.message);
    }
  };

  const stats = calculateStats();

  return (
    <div className="space-y-8">
      {/* Gaussian Splatting Progress Modal */}
      <GaussianSplattingProgress 
        progress={gaussianProgress} 
        isVisible={showGaussianProgress} 
      />
      
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Camera Section */}
        <div className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold flex items-center">
              <CameraIcon size={24} className="mr-3 text-blue-400" />
              Smart Camera
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAssistantEnabled(!assistantEnabled)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  assistantEnabled 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}
              >
                <Eye size={14} className="inline mr-2" />
                AI Assistant {assistantEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setGaussianOptimized(!gaussianOptimized)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  gaussianOptimized 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}
              >
                <SparklesIcon size={14} className="inline mr-2" />
                GS Mode {gaussianOptimized ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          <div className="relative bg-black rounded-xl aspect-[3/4] max-w-lg mx-auto overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!stream ? (
              <div className="flex flex-col items-center justify-center h-full text-white space-y-6">
                <div className="p-8 bg-blue-600/10 rounded-full">
                  <CameraIcon size={80} className="text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Start Gaussian Splatting Capture</h3>
                  <p className="text-gray-400 mb-6">Enable camera for intelligent guided capture optimized for Gaussian Splatting</p>
                  <button 
                    onClick={enableCam} 
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Enable Camera
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover" 
                />
                
                {/* Grid overlay */}
                {grid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="grid grid-cols-3 grid-rows-3 h-full opacity-30">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/20"></div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Capture button */}
                {stream && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={capture}
                      className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-purple-400 transition-all duration-200 shadow-lg flex items-center justify-center active:scale-95"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                    </button>
                  </div>
                )}
                
                {/* Camera Controls */}
                {stream && (
                  <div className="absolute top-4 right-4 space-y-2">
                    <button
                      onClick={toggleTorch}
                      className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                        torch 
                          ? 'bg-yellow-500/30 border-yellow-400/50 text-yellow-300'
                          : 'bg-gray-900/50 border-gray-600 text-gray-300'
                      }`}
                    >
                      <ZapIcon size={20} />
                    </button>
                    <button
                      onClick={() => setGrid(!grid)}
                      className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                        grid 
                          ? 'bg-blue-500/30 border-blue-400/50 text-blue-300'
                          : 'bg-gray-900/50 border-gray-600 text-gray-300'
                      }`}
                    >
                      <Grid2x2Icon size={20} />
                    </button>
                  </div>
                )}
                
                {/* Capture counter */}
                {captures.length > 0 && (
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2 text-white">
                    <span className="text-sm font-medium">{captures.length} photos</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Capture Stats */}
          {captures.length > 0 && (
            <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Capture Progress</h4>
                <span className="text-sm text-gray-400">{stats.totalCaptured} / {stats.totalRequired} photos</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.totalCaptured / stats.totalRequired) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {levels.map(level => (
                  <div key={level.level} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{level.name}</div>
                    <div 
                      className="text-sm font-bold"
                      style={{ color: level.color }}
                    >
                      {captures.filter(c => c.level === level.level).length} / {level.minPhotos}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gaussian Splatting Analysis Panel */}
        <div className="xl:w-1/3">
          <GaussianSplattingCameraAnalysis stats={stats} captures={captures} />
        </div>
      </div>

      {/* Gaussian Splatting Configuration */}
      <GaussianSplattingConfigPanel 
        config={gaussianConfig}
        onConfigChange={setGaussianConfig}
        isProcessing={showGaussianProgress}
      />

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-800">
        <button 
          onClick={() => setCaptures([])}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium"
        >
          Reset Capture
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {stats.totalCaptured > 0 && (
              <div className="flex items-center space-x-4">
                <span>{stats.totalCaptured} photos captured</span>
                <span className="text-purple-400">
                  GS Compatibility: {Math.round(stats.gaussianCompatibility)}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={processWithGaussianSplatting}
            disabled={stats.totalCaptured === 0 || showGaussianProgress}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            {showGaussianProgress ? 'Processing...' : 'Process with Gaussian Splatting'}
            <SparklesIcon size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 3D Viewer Component with Model Integration
const Viewer3D = () => {
  const [models, setModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(null);

  // Listen for model updates
  useEffect(() => {
    const handleModelAdded = (event) => {
      setModels(ModelStorage.getModels());
      setActiveModelId(event.detail.id);
    };

    const handleModelChanged = (event) => {
      setActiveModelId(event.detail);
    };

    window.addEventListener('modelAdded', handleModelAdded);
    window.addEventListener('modelChanged', handleModelChanged);

    // Initialize with existing models
    setModels(ModelStorage.getModels());
    const activeModel = ModelStorage.getActiveModel();
    if (activeModel) {
      setActiveModelId(activeModel.id);
    }

    return () => {
      window.removeEventListener('modelAdded', handleModelAdded);
      window.removeEventListener('modelChanged', handleModelChanged);
    };
  }, []);

  const activeModel = models.find(m => m.id === activeModelId) || models[0];

  const ModelCard = ({ model, active, onClick }) => {
    return (
      <div 
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
          active ? 'bg-blue-900/20 border border-blue-900/50' : 'hover:bg-gray-800/70 border border-transparent'
        }`} 
        onClick={onClick}
      >
        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
          <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{model.name}</h3>
          <p className="text-xs text-gray-400">{model.date}</p>
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-blue-400 ml-2"></div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">3D Viewer</h1>
          <p className="text-gray-400">Explore and analyze your 3D models</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center">
            <Share2Icon size={16} className="mr-2" /> Share
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
            <DownloadIcon size={16} className="mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-3 flex justify-between items-center">
              <h2 className="font-medium flex items-center">
                <SparklesIcon size={18} className="mr-2 text-blue-400" />
                {activeModel ? activeModel.name : 'No Model Selected'}
              </h2>
              <div className="flex space-x-1">
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <InfoIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <Maximize2Icon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <FullscreenIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="aspect-[4/3] bg-black relative">
              {activeModel ? (
                <>
                  <img 
                    src={activeModel.thumbnail} 
                    alt={activeModel.name} 
                    className="w-full h-full object-cover opacity-50" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4 py-8 bg-black/70 rounded-lg backdrop-blur-md max-w-md">
                      <SparklesIcon size={48} className="mx-auto mb-4 text-purple-400" />
                      <h3 className="text-xl font-bold mb-2">{activeModel.name}</h3>
                      <p className="text-gray-400 mb-4">
                        {activeModel.type === 'gaussian_splatting' 
                          ? 'Gaussian Splatting 3D Model ready for interactive viewing'
                          : '3D Model ready for viewing'
                        }
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-300">
                          <strong>Quality Score:</strong> {Math.round(activeModel.metadata?.qualityScore || 85)}%
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Photos Used:</strong> {activeModel.metadata?.totalPhotos || 'N/A'}
                        </div>
                        {activeModel.metadata?.finalMetrics && (
                          <div className="text-sm text-gray-300">
                            <strong>PSNR:</strong> {activeModel.metadata.finalMetrics.psnr.toFixed(2)} dB
                          </div>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                        Load Interactive 3D Model
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4 py-8 bg-black/70 rounded-lg backdrop-blur-md max-w-md">
                    <CameraIcon size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">No 3D Model</h3>
                    <p className="text-gray-400 mb-4">
                      Create a 3D model using the capture tool or upload existing model files.
                    </p>
                  </div>
                </div>
              )}
              
              {/* 3D Viewer Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex space-x-2">
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <RotateIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <ZoomInIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <RulerIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <ScissorsIcon size={16} className="text-gray-400" />
                </button>
                <div className="h-5 border-r border-gray-700 mx-1"></div>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <LayersIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <EyeIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <LightIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Model Library Sidebar */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-4">Model Library</h2>
          
          {models.length > 0 ? (
            <div className="space-y-3">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  active={activeModelId === model.id}
                  onClick={() => {
                    setActiveModelId(model.id);
                    ModelStorage.setActiveModel(model.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CameraIcon size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400 text-sm">No 3D models yet</p>
              <p className="text-gray-500 text-xs">Create your first model using the scanner</p>
            </div>
          )}

          {/* Model Details */}
          {activeModel && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Model Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vertices</span>
                  <span>{activeModel.vertices?.toLocaleString() || '124,532'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Faces</span>
                  <span>{activeModel.faces?.toLocaleString() || '248,964'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Texture Resolution</span>
                  <span>{activeModel.textureResolution || '4K'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Size</span>
                  <span>{activeModel.fileSize || '24.6 MB'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span>{activeModel.date}</span>
                </div>
                {activeModel.type === 'gaussian_splatting' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span>Gaussian Splatting</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Iterations</span>
                      <span>{activeModel.config?.iterations?.toLocaleString() || 'N/A'}</span>
                    </div>
                    {activeModel.metadata?.finalMetrics && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">PSNR</span>
                          <span>{activeModel.metadata.finalMetrics.psnr.toFixed(2)} dB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SSIM</span>
                          <span>{activeModel.metadata.finalMetrics.ssim.toFixed(3)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Semantic Tags */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(activeModel.tags || ['3D Model']).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                  {activeModel.type === 'gaussian_splatting' && (
                    <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs">
                      Gaussian Splatting
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center">
                  <Eye size={16} className="mr-2" />
                  View in AR
                </button>
                <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center">
                  <DownloadIcon size={16} className="mr-2" />
                  Export Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI-Generated Description */}
      {activeModel && (
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI Analysis</h2>
            <div className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-xs flex items-center">
              <BrainIcon size={14} className="mr-1" />
              AI Generated
            </div>
          </div>
          
          <p className="text-gray-300 leading-relaxed mb-6">
            {activeModel.type === 'gaussian_splatting' ? (
              `This 3D model was reconstructed using advanced Gaussian Splatting technology from ${activeModel.metadata?.totalPhotos || 'multiple'} high-resolution photographs. 
              The reconstruction achieved a quality score of ${Math.round(activeModel.metadata?.qualityScore || 85)}% with excellent spatial coverage and feature detection. 
              ${activeModel.metadata?.finalMetrics ? 
                `Final metrics show a PSNR of ${activeModel.metadata.finalMetrics.psnr.toFixed(2)} dB and SSIM of ${activeModel.metadata.finalMetrics.ssim.toFixed(3)}, ` : ''}
              indicating high fidelity reproduction of the original object's geometry and appearance.`
            ) : (
              `This 3D model represents a detailed digital reconstruction with high-quality geometry and texture mapping. 
              The model features ${activeModel.vertices?.toLocaleString() || 'numerous'} vertices and demonstrates excellent detail preservation 
              suitable for various applications including visualization, analysis, and digital preservation.`
            )}
          </p>

          {/* Technical Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Reconstruction Quality</h3>
              <p className="text-xs text-gray-400">
                {activeModel.metadata?.qualityScore ? 
                  `${Math.round(activeModel.metadata.qualityScore)}% - ${
                    activeModel.metadata.qualityScore >= 90 ? 'Excellent' :
                    activeModel.metadata.qualityScore >= 70 ? 'Good' : 'Fair'
                  }` : 
                  'High quality reconstruction'
                }
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Coverage Analysis</h3>
              <p className="text-xs text-gray-400">
                {activeModel.metadata?.gaussianCompatibility ? 
                  `${Math.round(activeModel.metadata.gaussianCompatibility)}% compatibility` : 
                  'Complete 360° coverage'
                }
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">Processing Method</h3>
              <p className="text-xs text-gray-400">
                {activeModel.type === 'gaussian_splatting' ? 
                  'Gaussian Splatting with neural optimization' : 
                  'Traditional photogrammetry pipeline'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const ScanCapture = () => {
  const [activeTab, setActiveTab] = useState('photo');

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto text-white bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      {/* Enhanced Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Cureva 3D Capture Studio
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto mb-2">
          Professional 3D model creation with Gaussian Splatting technology for photorealistic results
        </p>
        <div className="flex justify-center items-center mt-3 space-x-6 text-sm text-gray-500">
          <span className="flex items-center"><SparklesIcon size={16} className="mr-1" /> Gaussian Splatting</span>
          <span className="flex items-center"><BrainIcon size={16} className="mr-1" /> AI-Optimized</span>
          <span className="flex items-center"><MonitorIcon size={16} className="mr-1" /> Real-time Preview</span>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-gray-900/60 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="border-b border-gray-700">
          <nav className="flex" aria-label="Tabs">
            {([
              { id: 'photo', name: 'Gaussian Splatting', icon: <SparklesIcon size={18} className="mr-2" /> },
              { id: 'viewer', name: '3D Viewer', icon: <EyeIcon size={18} className="mr-2" /> },
              { id: 'video', name: 'Video Scan', icon: <VideoIcon size={18} className="mr-2" /> },
              { id: 'upload', name: 'Upload Files', icon: <UploadIcon size={18} className="mr-2" /> }
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-8 py-5 text-sm font-medium flex items-center transition-all duration-300 relative ${
                  activeTab === t.id
                    ? 'text-purple-400 bg-gradient-to-b from-purple-600/10 to-pink-600/10'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                {t.icon}
                {t.name}
                {activeTab === t.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'photo' && <Enhanced3DPhotoScanTab onSwitchToViewer={() => setActiveTab('viewer')} />}
          {activeTab === 'viewer' && <Viewer3D />}
          {activeTab === 'video' && (
            <div className="text-center py-12">
              <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Scan</h3>
              <p className="text-gray-400">Coming soon - Video-based 3D scanning with real-time reconstruction</p>
            </div>
          )}
          {activeTab === 'upload' && (
            <div className="text-center py-12">
              <UploadIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
              <p className="text-gray-400">Upload images or existing 3D models for processing and viewing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanCapture;