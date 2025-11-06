import React, { useState, useRef, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { CloudConnectionStatus } from "../../components/ui/CloudConnectionStatus";
import { FirebaseConnectionModal } from "../../components/ui/FirebaseConnectionModal";
import { signOut } from "firebase/auth";
import { createDataset, addPhoto, getDataset } from "../../lib/simpleDB";
import { storage } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  MobileScanWrapper,
  MobileScanHeader,
  MobileScanTabs,
  MobileScanContent,
} from "../../components/ui/MobileScanWrapper";
import {
  CameraIcon,
  VideoIcon,
  UploadIcon,
  ArrowRightIcon,
  CheckIcon,
  PlayIcon,
  StopCircleIcon,
  HelpCircleIcon,
  ZapIcon,
  Grid2x2Icon,
  SunIcon,
  TimerIcon,
  RotateCwIcon,
  Eye,
  Target,
  ArrowUpIcon,
  ArrowDownIcon,
  MessageCircleIcon,
  LightbulbIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarChart3Icon,
  MapPinIcon,
  CpuIcon,
  ZapIcon as GpuIcon,
  HardDriveIcon,
  Settings2Icon,
  MonitorIcon,
  SparklesIcon,
  BrainIcon,
  DatabaseIcon,
  CloudIcon,
  RotateCwIcon as RotateIcon,
  ZoomInIcon,
  RulerIcon,
  ScissorsIcon,
  DownloadIcon,
  Share2Icon,
  FullscreenIcon,
  EyeIcon,
  LayersIcon,
  SunIcon as LightIcon,
  InfoIcon,
  Maximize2Icon,
  FolderIcon,
  ImageIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  CalendarIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  XIcon,
  WifiIcon,
  CloudUploadIcon,
  ServerIcon,
  KeyIcon,
  LinkIcon,
} from "lucide-react";

// ========= TYPES =========
type Capture = {
  angle: number;
  level: 1 | 2 | 3 | 4;
  dataUrl: string;
  timestamp: number;
  caption: string;
};

type Dataset = {
  id: string;
  name: string;
  description: string;
  photos: Capture[];
  createdAt: string;
  tags: string[];
  metadata: {
    totalPhotos: number;
    levels: { level: 1 | 2 | 3 | 4; captured: number }[];
    angles: number[];
  };
};

type Model3D = {
  id: string;
  name: string;
  type: "gaussian_splatting" | string;
  date: string;
  thumbnail: string;
  captures: string[];
  metadata: {
    totalPhotos: number;
    qualityScore: number;
    gaussianCompatibility: number;
  };
  vertices?: number;
  faces?: number;
  fileSize?: string;
};

// limit to Firebase and GDrive for this app
type CloudProvider = "Firebase" | "GDrive";
type CloudStatus = "connected" | "disconnected" | "connecting";

// ========== GLOBAL STATE MANAGEMENT ==========
const loadFromStorage = (key: string, defaultValue: any): any => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveToStorage = (key: string, value: any): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

let globalModels: Model3D[] = loadFromStorage("models", []);
let globalActiveModel: string | null = loadFromStorage("activeModel", null);
let globalDatasets: Dataset[] = loadFromStorage("datasets", []);

const ModelStorage = {
  addModel: (model: Model3D) => {
    globalModels.unshift(model);
    globalActiveModel = model.id;
    saveToStorage("models", globalModels);
    saveToStorage("activeModel", globalActiveModel);
    window.dispatchEvent(new CustomEvent("modelAdded", { detail: model }));
  },

  getModels: (): Model3D[] => globalModels,
  getActiveModel: (): Model3D | undefined => globalModels.find((m) => m.id === globalActiveModel),
  setActiveModel: (id: string) => {
    globalActiveModel = id;
    saveToStorage("activeModel", globalActiveModel);
    window.dispatchEvent(new CustomEvent("modelChanged", { detail: id }));
  },
};

// ========== FIREBASE DATASET FUNCTIONS ==========
const createNewDataset = async (userId: string, name: string, description: string): Promise<Dataset> => {
  try {
    const datasetId = Date.now().toString();
    const dataset: Dataset = {
      id: datasetId,
      name,
      description,
      photos: [],
      createdAt: new Date().toISOString(),
      tags: [],
      metadata: {
        totalPhotos: 0,
        levels: [
          { level: 1, captured: 0 },
          { level: 2, captured: 0 },
          { level: 3, captured: 0 },
          { level: 4, captured: 0 },
        ],
        angles: [],
      },
    };
    return dataset;
  } catch (error) {
    console.error("Error creating dataset:", error);
    throw error;
  }
};

const uploadAndAddPhoto = async (datasetId: string, dataUrl: string, metadata: { angle: number; level: 1 | 2 | 3 | 4; timestamp: number; caption: string }) => {
  try {
    // In a real Firebase implementation, you would upload the image to Firebase Storage
    // For now, we'll store it locally with the dataUrl
    const photo: Capture = {
      angle: metadata.angle,
      level: metadata.level,
      dataUrl: dataUrl,
      timestamp: metadata.timestamp,
      caption: metadata.caption,
    };

    // Update the dataset with the new photo
    const datasetIndex = globalDatasets.findIndex((d) => d.id === datasetId);
    if (datasetIndex !== -1) {
      globalDatasets[datasetIndex].photos.push(photo);
      globalDatasets[datasetIndex].metadata.totalPhotos = globalDatasets[datasetIndex].photos.length;

      // Update level counts
      const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
      const angles = new Set<number>();

      globalDatasets[datasetIndex].photos.forEach((p) => {
        levelCounts[p.level]++;
        angles.add(p.angle);
      });

      globalDatasets[datasetIndex].metadata.levels = [
        { level: 1, captured: levelCounts[1] },
        { level: 2, captured: levelCounts[2] },
        { level: 3, captured: levelCounts[3] },
        { level: 4, captured: levelCounts[4] },
      ];
      globalDatasets[datasetIndex].metadata.angles = Array.from(angles).sort((a, b) => a - b);

      saveToStorage("datasets", globalDatasets);
    }

    return photo;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
};

const DatasetStorage = {
  addDataset: async (dataset: Dataset) => {
    try {
      // Buat dataset baru di Firebase
      const newDataset = await createNewDataset(auth.currentUser?.uid || "anonymous", dataset.name, dataset.description);

      // Copy semua data dari parameter dataset ke newDataset
      newDataset.photos = [...dataset.photos];
      newDataset.tags = [...dataset.tags];
      newDataset.metadata = { ...dataset.metadata };

      // Upload semua foto yang ada
      for (const photo of dataset.photos) {
        await uploadAndAddPhoto(newDataset.id, photo.dataUrl, {
          angle: photo.angle,
          level: photo.level,
          timestamp: photo.timestamp,
          caption: photo.caption,
        });
      }

      globalDatasets.unshift(newDataset);
      saveToStorage("datasets", globalDatasets);
      window.dispatchEvent(new CustomEvent("datasetAdded", { detail: newDataset }));

      return newDataset;
    } catch (error) {
      console.error("Error adding dataset:", error);
      throw error;
    }
  },
  getDatasets: (): Dataset[] => globalDatasets,
  updateDataset: (id: string, updates: Partial<Dataset>) => {
    const index = globalDatasets.findIndex((d) => d.id === id);
    if (index !== -1) {
      globalDatasets[index] = { ...globalDatasets[index], ...updates };
      saveToStorage("datasets", globalDatasets);
      window.dispatchEvent(new CustomEvent("datasetUpdated", { detail: globalDatasets[index] }));
    }
  },
  deleteDataset: (id: string) => {
    globalDatasets = globalDatasets.filter((d) => d.id !== id);
    saveToStorage("datasets", globalDatasets);
    window.dispatchEvent(new CustomEvent("datasetDeleted", { detail: id }));
  },
  saveDataset: (dataset: Dataset) => {
    // Simple synchronous save to localStorage
    const existingIndex = globalDatasets.findIndex((d) => d.id === dataset.id);
    if (existingIndex !== -1) {
      globalDatasets[existingIndex] = dataset;
    } else {
      globalDatasets.unshift(dataset);
    }
    saveToStorage("datasets", globalDatasets);
    window.dispatchEvent(new CustomEvent("datasetAdded", { detail: dataset }));
  },
};

// ========== RECENT PHOTOS GALLERY ==========
const RecentPhotosGallery: React.FC<{ captures: Capture[]; onDelete: (index: number) => void }> = ({ captures, onDelete }) => {
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedPhoto, setSelectedPhoto] = useState<Capture | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCaptures = captures
    .filter((capture: Capture) => filterLevel === "all" || capture.level === (parseInt(filterLevel) as 1 | 2 | 3 | 4))
    .sort((a: Capture, b: Capture) => {
      switch (sortBy) {
        case "recent":
          return b.timestamp - a.timestamp;
        case "angle":
          return a.angle - b.angle;
        case "level":
          return a.level - b.level;
        default:
          return 0;
      }
    });

  const levelColors: Record<1 | 2 | 3 | 4, string> = {
    1: "border-red-500/50 bg-red-900/20",
    2: "border-blue-500/50 bg-blue-900/20",
    3: "border-green-500/50 bg-green-900/20",
    4: "border-yellow-500/50 bg-yellow-900/20",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <ImageIcon size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Galeri Foto</h3>
            <p className="text-sm text-gray-400">{captures.length} foto ditangkap</p>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Level Filter with Visual Indicators */}
          <div className="relative">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500/50 backdrop-blur-sm transition-all appearance-none pr-8 min-w-0"
            >
              <option value="all">Semua Level ({captures.length})</option>
              <option value="1">🔴 Sudut Rendah ({captures.filter((c) => c.level === 1).length})</option>
              <option value="2">🔵 Level Mata ({captures.filter((c) => c.level === 2).length})</option>
              <option value="3">🟢 Sudut Tinggi ({captures.filter((c) => c.level === 3).length})</option>
              <option value="4">🟡 Atas Kepala ({captures.filter((c) => c.level === 4).length})</option>
            </select>
            <ChevronDownIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort Options */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500/50 backdrop-blur-sm transition-all appearance-none pr-8 min-w-0"
            >
              <option value="recent">Terbaru</option>
              <option value="angle">Berdasarkan Sudut (0-360°)</option>
              <option value="level">Berdasarkan Level (1-4)</option>
            </select>
            <ChevronDownIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-white"}`}>
              <GridIcon size={16} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-white"}`}>
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Level Progress Statistics */}
      {captures.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-3 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3Icon size={18} className="text-blue-400" />
              <h4 className="text-sm font-semibold text-white">Progres Pengambilan</h4>
            </div>
            <div className="text-xs text-gray-400">{captures.length} / 144 total (36 per level)</div>
          </div>

          {/* Level Distribution */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {[1, 2, 3, 4].map((level) => {
              const count = captures.filter((c) => c.level === level).length;
              const percentage = (count / 36) * 100; // Progress based on 36 photos per level
              const levelInfo = {
                1: { name: "Sudut Rendah", emoji: "🔴", color: "red", bgColor: "bg-red-500/10", borderColor: "border-red-500/30", textColor: "text-red-400" },
                2: { name: "Level Mata", emoji: "🔵", color: "blue", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
                3: { name: "Sudut Tinggi", emoji: "🟢", color: "green", bgColor: "bg-green-500/10", borderColor: "border-green-500/30", textColor: "text-green-400" },
                4: { name: "Atas Kepala", emoji: "🟡", color: "yellow", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30", textColor: "text-yellow-400" },
              }[level as 1 | 2 | 3 | 4];

              return (
                <div key={level} className={`${levelInfo?.bgColor} ${levelInfo?.borderColor} border rounded-xl p-3 transition-all hover:scale-105`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{levelInfo?.emoji}</span>
                      <span className="text-xs font-medium text-white">L{level}</span>
                    </div>
                    <span className={`text-sm font-bold ${levelInfo?.textColor}`}>{count}</span>
                  </div>
                  <div className="mb-2">
                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          level === 1
                            ? "bg-gradient-to-r from-red-500 to-red-400"
                            : level === 2
                            ? "bg-gradient-to-r from-blue-500 to-blue-400"
                            : level === 3
                            ? "bg-gradient-to-r from-green-500 to-green-400"
                            : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{levelInfo?.name}</p>
                </div>
              );
            })}
          </div>

          {/* Angle Coverage Visualization */}
          <div className="border-t border-gray-700/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target size={16} className="text-purple-400" />
                <span className="text-sm font-medium text-white">Cakupan Sudut</span>
              </div>
              <span className="text-xs text-gray-400">{new Set(captures.map((c) => Math.round(c.angle / 10) * 10)).size}/36 positions</span>
            </div>

            {/* Circular Progress Indicator */}
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-700/50" />
                  {/* Progress circles for each 45-degree sector */}
                  {Array.from({ length: 36 }, (_, i) => i * 10).map((angle, index) => {
                    const hasPhotos = captures.some((c) => Math.abs(c.angle - angle) < 5 || Math.abs(c.angle - angle) > 355);
                    const circumference = 2 * Math.PI * 40;
                    const sectorLength = circumference / 36;
                    const offset = circumference - index * sectorLength - sectorLength;

                    return hasPhotos ? (
                      <circle
                        key={angle}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#angleGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${sectorLength} ${circumference - sectorLength}`}
                        strokeDashoffset={offset}
                        className="transition-all duration-500"
                      />
                    ) : null;
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="angleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-white">{Math.round((new Set(captures.map((c) => Math.round(c.angle / 10) * 10)).size / 36) * 100)}%</span>
                  <span className="text-xs text-gray-400">coverage</span>
                </div>
              </div>
            </div>

            {/* 10-degree sectors indicator */}
            <div className="grid grid-cols-4 gap-0.5 text-xs">
              {Array.from({ length: 12 }, (_, i) => {
                const startAngle = i * 30;
                const endAngle = (i * 30 + 30) % 360;
                const range = `${startAngle}-${endAngle === 0 ? 360 : endAngle}°`;

                const sectorPhotos = captures.filter((c) => c.angle >= startAngle && c.angle < (endAngle === 0 ? 360 : endAngle)).length;

                const maxPhotosInSector = 3; // 3 positions per 30° sector (every 10°)
                const completion = Math.min(100, (sectorPhotos / maxPhotosInSector) * 100);

                return (
                  <div key={range} className="flex flex-col items-center p-1 rounded-md bg-gray-800/30">
                    <div className={`w-3 h-3 rounded-full mb-1 transition-all ${completion > 0 ? "bg-purple-400" : "bg-gray-600"}`} style={{ opacity: completion / 100 }} />
                    <span className="text-xs text-gray-400">{startAngle}°</span>
                    <span className="text-xs text-purple-400">{sectorPhotos}/3</span>
                  </div>
                );
              }).slice(0, 12)}
            </div>
          </div>

          {/* Recommendations */}
          {captures.length < 144 && (
            <div className="border-t border-gray-700/30 pt-4 mt-4">
              <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <LightbulbIcon size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-400 font-medium mb-1">Rekomendasi Pengambilan</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {captures.filter((c) => c.level === 1).length < 36 && <li>• Level 1: Perlu {36 - captures.filter((c) => c.level === 1).length} foto sudut rendah lagi</li>}
                    {captures.filter((c) => c.level === 2).length < 36 && <li>• Level 2: Perlu {36 - captures.filter((c) => c.level === 2).length} foto level mata lagi</li>}
                    {captures.filter((c) => c.level === 3).length < 36 && <li>• Level 3: Perlu {36 - captures.filter((c) => c.level === 3).length} foto sudut tinggi lagi</li>}
                    {captures.filter((c) => c.level === 4).length < 36 && <li>• Level 4: Perlu {36 - captures.filter((c) => c.level === 4).length} foto atas kepala lagi</li>}
                    {new Set(captures.map((c) => Math.round(c.angle / 10) * 10)).size < 36 && <li>• Tambah sudut lagi: {36 - new Set(captures.map((c) => Math.round(c.angle / 10) * 10)).size} posisi tersisa</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredCaptures.length > 0 ? (
        viewMode === "grid" ? (
          <div className="space-y-3">
            {/* Create 2 horizontal rows */}
            {(() => {
              const maxRows = 2;
              const totalItems = filteredCaptures.length;
              const itemsPerRow = totalItems <= maxRows ? 1 : Math.ceil(totalItems / maxRows);
              const actualRows = Math.ceil(totalItems / itemsPerRow);

              return Array.from({ length: actualRows }, (_, rowIndex) => {
                const startIndex = rowIndex * itemsPerRow;
                const endIndex = Math.min(startIndex + itemsPerRow, totalItems);
                const rowCaptures = filteredCaptures.slice(startIndex, endIndex);

                return (
                  <div key={rowIndex} className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                    {rowCaptures.map((capture: Capture, index: number) => {
                      const actualIndex = startIndex + index;
                      return (
                        <div
                          key={`${capture.timestamp}-${actualIndex}`}
                          className={`flex-shrink-0 w-32 sm:w-40 md:w-48 relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                            levelColors[capture.level]
                          } hover:shadow-purple-500/25`}
                          onClick={() => setSelectedPhoto(capture)}
                        >
                          <div className="aspect-square relative">
                            <img src={capture.dataUrl} alt={`Capture ${actualIndex + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" />

                            {/* Level Badge */}
                            <div className="absolute top-1 left-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-sm">L{capture.level}</span>
                            </div>
                          </div>

                          {/* Lightweight Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <div className="absolute bottom-1 left-1 text-white">
                              <div className="text-xs font-bold">{capture.angle}°</div>
                            </div>

                            <div className="absolute top-1 right-1 flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPhoto(capture);
                                }}
                                className="p-1 bg-blue-500/80 hover:bg-blue-500 rounded-md backdrop-blur-sm transition-all hover:scale-110"
                              >
                                <EyeIcon size={10} className="text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(actualIndex);
                                }}
                                className="p-1 bg-red-500/80 hover:bg-red-500 rounded-md backdrop-blur-sm transition-all hover:scale-110"
                              >
                                <TrashIcon size={10} className="text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCaptures.map((capture: Capture, index: number) => (
              <div
                key={`${capture.timestamp}-${index}`}
                className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${levelColors[capture.level]} hover:shadow-purple-500/25`}
                onClick={() => setSelectedPhoto(capture)}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <img src={capture.dataUrl} alt={`Capture ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
                  <div className="absolute top-1 left-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-sm border border-white/20">L{capture.level}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold text-sm">Capture #{index + 1}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-gray-400 text-xs">
                          <span className="font-medium">Sudut:</span> {capture.angle}°
                        </span>
                        <span className="text-gray-400 text-xs">
                          <span className="font-medium">Level:</span> {capture.level}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(capture.timestamp).toLocaleDateString()} • {new Date(capture.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Level Badge */}
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          capture.level === 1 ? "bg-red-500/20 text-red-400" : capture.level === 2 ? "bg-blue-500/20 text-blue-400" : capture.level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {capture.level === 1 ? "🔴 Rendah" : capture.level === 2 ? "🔵 Mata" : capture.level === 3 ? "🟢 Tinggi" : "🟡 Atas"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(capture);
                    }}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-xl transition-all hover:scale-110"
                  >
                    <EyeIcon size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(index);
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl transition-all hover:scale-110"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 relative">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-3xl flex items-center justify-center border border-gray-600/30">
              <ImageIcon size={40} className="text-gray-400" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-blue-600/5 rounded-3xl blur-2xl"></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Siap untuk Menangkap</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Mulai mengambil foto untuk membangun dataset model 3D Anda. Setiap foto membawa Anda lebih dekat ke rekonstruksi sempurna.</p>
        </div>
      )}

      {/* Enhanced Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-5xl w-full mx-2 sm:mx-0 bg-gray-900/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <ImageIcon size={16} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Pratinjau Foto</h3>
                  <p className="text-sm text-gray-400">
                    Level {selectedPhoto.level} • {selectedPhoto.angle}°
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedPhoto(null)} className="p-3 hover:bg-gray-800/50 rounded-2xl transition-all hover:scale-110 active:scale-95">
                <XIcon size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="relative p-6">
              <div className="relative rounded-2xl overflow-hidden bg-black/30">
                <img src={selectedPhoto.dataUrl} alt="Selected capture" className="w-full h-auto max-h-[70vh] object-contain mx-auto" />

                {/* Image Overlay Info */}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                    <div className="text-white text-sm font-medium">
                      {selectedPhoto.angle}° • L{selectedPhoto.level}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 bg-gray-800/30 border-t border-gray-700/50">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CalendarIcon size={16} />
                  <span>{new Date(selectedPhoto.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon size={16} />
                  <span>{new Date(selectedPhoto.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPhoto.level === 1 ? "bg-red-500/20 text-red-400" : selectedPhoto.level === 2 ? "bg-blue-500/20 text-blue-400" : selectedPhoto.level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  Level {selectedPhoto.level}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">Sudut {selectedPhoto.angle}°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== CAPTURE PROGRESS DASHBOARD ==========
const CaptureProgressDashboard: React.FC<{ captures: Capture[] }> = ({ captures }) => {
  const levels = [
    { id: 1, name: "Sudut Rendah", color: "#ef4444", target: 18, description: "Di bawah level objek" },
    { id: 2, name: "Level Mata", color: "#3b82f6", target: 36, description: "Level tengah objek" },
    { id: 3, name: "Sudut Tinggi", color: "#10b981", target: 18, description: "Di atas level objek" },
    { id: 4, name: "Atas Kepala", color: "#f59e0b", target: 12, description: "Tampilan dari atas" },
  ];

  const totalTarget = levels.reduce((sum, level) => sum + level.target, 0);
  const totalCaptured = captures.length;

  const levelStats = levels.map((level) => ({
    ...level,
    captured: captures.filter((c) => c.level === (level.id as 1 | 2 | 3 | 4)).length,
    progress: Math.min(100, (captures.filter((c) => c.level === (level.id as 1 | 2 | 3 | 4)).length / level.target) * 100),
  }));

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-semibold flex items-center">
        <BarChart3Icon size={20} className="mr-2 text-blue-400" />
        Progres Pengambilan
      </h3>

      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progres Keseluruhan</span>
          <span className="text-sm text-gray-400">
            {totalCaptured} / {totalTarget} foto
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalCaptured / totalTarget) * 100)}%` }} />
        </div>
      </div>

      {/* Level Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {levelStats.map((level) => (
          <div key={level.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium" style={{ color: level.color }}>
                  {level.name}
                </span>
                <p className="text-xs text-gray-400">{level.description}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{level.captured}</span>
                <span className="text-xs text-gray-400">/{level.target}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="rounded-full h-2 transition-all duration-500"
                style={{
                  width: `${level.progress}%`,
                  backgroundColor: level.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quality Score */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Skor Kualitas</span>
          <span className="text-lg font-bold text-purple-400">{Math.round(Math.min(100, (totalCaptured / totalTarget) * 100))}%</span>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            {levelStats.filter((l) => l.progress >= 100).length} level selesai
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            {levelStats.filter((l) => l.progress > 0 && l.progress < 100).length} dalam proses
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== CLOUD UPLOAD PROGRESS ==========
type UploadStage = "preparing" | "uploading" | "processing";

const CloudUploadProgress: React.FC<{ isOpen: boolean; onClose: () => void; dataset: Dataset | null }> = ({ isOpen, onClose, dataset }) => {
  const [stage, setStage] = useState<UploadStage>("preparing");
  const [progress, setProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);

  useEffect(() => {
    if (isOpen && dataset) {
      const uploadDataset = async () => {
        try {
          setStage("preparing");
          setTotalPhotos(dataset.photos.length);

          // Create new dataset in Firebase
          const firebaseDataset = await createNewDataset(auth.currentUser?.uid || "anonymous", dataset.name, dataset.description);

          setStage("uploading");
          // Upload each photo
          for (const [index, photo] of dataset.photos.entries()) {
            await uploadAndAddPhoto(firebaseDataset.id, photo.dataUrl, {
              angle: photo.angle,
              level: photo.level,
              timestamp: photo.timestamp,
              caption: photo.caption,
            });
            setUploadedPhotos(index + 1);
            setProgress(((index + 1) / dataset.photos.length) * 100);
          }

          setStage("processing");
          // Allow time for final processing
          setTimeout(() => {
            onClose();
          }, 1000);
        } catch (error) {
          console.error("Error uploading to Firebase:", error);
          // Handle error appropriately
        }
      };

      uploadDataset();
    }
  }, [isOpen, dataset]);

  useEffect(() => {
    if (!isOpen || !dataset) return;

    // Simulate upload process
    const stages: { name: UploadStage; duration: number; progress: number }[] = [
      { name: "preparing", duration: 1000, progress: 10 },
      { name: "uploading", duration: 5000, progress: 80 },
      { name: "processing", duration: 2000, progress: 10 },
    ];

    let currentStageIndex = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      const stage = stages[currentStageIndex];
      currentProgress += stage.progress / (stage.duration / 100);

      setProgress(Math.min(100, currentProgress));
      setStage(stage.name);
      setUploadSpeed(Math.random() * 5 + 2); // 2-7 MB/s
      setBytesUploaded(currentProgress * 1024 * 1024); // 1MB per 1%
      setTotalBytes(100 * 1024 * 1024); // 100MB total

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      }

      if (currentProgress >= (currentStageIndex + 1) * 33.33 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, dataset]);

  if (!isOpen || !dataset) return null;

  const stageInfo: Record<UploadStage, { title: string; description: string; icon: JSX.Element }> = {
    preparing: {
      title: "Mempersiapkan Upload",
      description: "Mengorganisir file dan memeriksa prasyarat...",
      icon: <RotateIcon size={32} className="animate-spin" />,
    },
    uploading: {
      title: "Mengunggah File",
      description: `Mengunggah ${dataset.photos.length} foto ke ${provider}...`,
      icon: <CloudUploadIcon size={32} className="animate-pulse" />,
    },
    processing: {
      title: "Memproses Dataset",
      description: "Menyelesaikan upload dan membuat thumbnail...",
      icon: <CheckCircleIcon size={32} />,
    },
  };

  const currentStageInfo = stageInfo[stage];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2 sm:mx-0">
        <div className="text-center mb-6">
          <div className="mb-4 text-blue-400">{currentStageInfo.icon}</div>
          <h3 className="text-xl font-bold mb-2">{currentStageInfo.title}</h3>
          <p className="text-gray-400 text-sm">{currentStageInfo.description}</p>
        </div>

        <div className="space-y-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{Math.round(progress)}%</div>
              <div className="text-xs text-gray-400">Progres</div>
            </div>
            <div>
              <div className="text-lg font-bold">{uploadSpeed.toFixed(1)} MB/s</div>
              <div className="text-xs text-gray-400">Kecepatan</div>
            </div>
            <div>
              <div className="text-lg font-bold">{Math.round(bytesUploaded / 1024 / 1024)}MB</div>
              <div className="text-xs text-gray-400">Terunggah</div>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Dataset: {dataset.name} ({dataset.photos.length} foto)
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">
          Batalkan Upload
        </button>
      </div>
    </div>
  );
};

// ========== CLOUD INTEGRATION MODAL ==========
const DatasetCardHeader: React.FC<{ dataset: Dataset }> = ({ dataset }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(dataset.name);
  return (
    <div className="flex items-center justify-between mb-1">
      {isEditing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            DatasetStorage.updateDataset(dataset.id, { name });
            setIsEditing(false);
          }}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full mr-2"
          autoFocus
        />
      ) : (
        <h4 className="font-medium truncate" title={dataset.name}>
          {dataset.name}
        </h4>
      )}
      <button className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded border border-gray-700" onClick={() => setIsEditing((v) => !v)}>
        {isEditing ? "Simpan" : "Ganti Nama"}
      </button>
    </div>
  );
};

const CloudIntegration: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onConnectionChange: (provider: CloudProvider, status: CloudStatus) => void;
}> = ({ isVisible, onClose, onConnectionChange }) => {
  if (!isVisible) return null;
  const providers: CloudProvider[] = ["Firebase", "GDrive"];
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-2 sm:mx-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CloudIcon size={18} className="mr-2 text-blue-400" />
          Hubungkan ke Cloud
        </h3>
        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => {
                onConnectionChange(p, "connected");
                onClose();
              }}
              className="w-full px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Hubungkan {p}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          Batal
        </button>
      </div>
    </div>
  );
};

// ========== DATASET MANAGER TAB ==========
const DatasetManagerTab: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "photos">("date");
  const [filterLevel, setFilterLevel] = useState<1 | 2 | 3 | 4 | "all">("all");
  const [groupBy, setGroupBy] = useState<"none" | "level" | "date" | "tags">("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);

  // Load datasets
  useEffect(() => {
    const loadedDatasets = DatasetStorage.getDatasets();
    setDatasets(loadedDatasets);
  }, []);

  // Auto-expand groups when grouping changes
  useEffect(() => {
    if (groupBy !== "none") {
      const allGroupKeys = getGroupedDatasets().map((group) => group.key);
      setExpandedGroups(new Set(allGroupKeys));
    }
  }, [groupBy, datasets]); // Include datasets to recalculate when data changes

  // Filter and sort datasets
  const filteredAndSortedDatasets = datasets
    .filter((dataset) => dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) || dataset.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((dataset) => {
      if (filterLevel === "all") return true;
      return dataset.metadata.levels.some((level) => level.level === filterLevel && level.captured > 0);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "photos":
          return b.photos.length - a.photos.length;
        default:
          return 0;
      }
    });

  // Group datasets based on groupBy setting
  const getGroupedDatasets = () => {
    if (groupBy === "none") {
      return [{ key: "all", title: "", datasets: filteredAndSortedDatasets }];
    }

    const groups: { [key: string]: Dataset[] } = {};

    filteredAndSortedDatasets.forEach((dataset) => {
      let groupKey = "";
      switch (groupBy) {
        case "level":
          const dominantLevel = dataset.metadata.levels.reduce((prev, current) => (prev.captured > current.captured ? prev : current));
          groupKey = `level-${dominantLevel.level}`;
          break;
        case "date":
          const date = new Date(dataset.createdAt);
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
          break;
        case "tags":
          if (dataset.tags.length === 0) {
            groupKey = "untagged";
          } else {
            groupKey = dataset.tags[0]; // Group by first tag
          }
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(dataset);
    });

    return Object.entries(groups).map(([key, datasets]) => ({
      key,
      title: getGroupTitle(key, groupBy),
      datasets: datasets.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "date":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "photos":
            return b.photos.length - a.photos.length;
          default:
            return 0;
        }
      }),
    }));
  };

  const getGroupTitle = (key: string, groupByType: string): string => {
    switch (groupByType) {
      case "level":
        const levelNum = key.split("-")[1];
        return `Level ${levelNum} - ${levelNum === "1" ? "Sudut Rendah" : levelNum === "2" ? "Level Mata" : levelNum === "3" ? "Sudut Tinggi" : "Atas Kepala"}`;
      case "date":
        const [year, month] = key.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      case "tags":
        return key === "untagged" ? "Tanpa Tag" : `#${key}`;
      default:
        return key;
    }
  };

  const groupedDatasets = getGroupedDatasets();

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDeleteDataset = (datasetId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus dataset ini?")) {
      DatasetStorage.deleteDataset(datasetId);
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
      }
    }
  };

  const handleEditDataset = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setShowEditModal(true);
  };

  const handleCreateDataset = (newDataset: Omit<Dataset, "id" | "createdAt">) => {
    const dataset: Dataset = {
      ...newDataset,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    DatasetStorage.saveDataset(dataset);
    setDatasets((prev) => [dataset, ...prev]);
    setShowCreateModal(false);
  };

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    DatasetStorage.saveDataset(updatedDataset);
    setDatasets((prev) => prev.map((d) => (d.id === updatedDataset.id ? updatedDataset : d)));
    setShowEditModal(false);
    setEditingDataset(null);
    if (selectedDataset?.id === updatedDataset.id) {
      setSelectedDataset(updatedDataset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Pengelola Dataset</h2>
          <p className="text-gray-400">
            {datasets.length} dataset • {datasets.reduce((acc, d) => acc + d.photos.length, 0)} total foto
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2">
            <DatabaseIcon size={16} />
            Dataset Baru
          </button>

          {/* Debug button to create sample dataset */}
          <button
            onClick={() => {
              const sampleDataset: Dataset = {
                id: "sample_" + Date.now(),
                name: "Sample Dataset",
                description: "Test dataset with sample photos",
                photos: [
                  {
                    angle: 0,
                    level: 1,
                    dataUrl:
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkwxIDDCsDwvdGV4dD4KPC9zdmc+",
                    timestamp: Date.now(),
                    caption: "L1_Low_000deg",
                  },
                  {
                    angle: 90,
                    level: 2,
                    dataUrl:
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwYjk4MSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkwyIDkwwrA8L3RleHQ+Cjwvc3ZnPg==",
                    timestamp: Date.now() + 1000,
                    caption: "L2_Eye_090deg",
                  },
                ],
                createdAt: new Date().toISOString(),
                tags: ["Test", "Sample"],
                metadata: {
                  totalPhotos: 2,
                  levels: [
                    { level: 1, captured: 1 },
                    { level: 2, captured: 1 },
                    { level: 3, captured: 0 },
                    { level: 4, captured: 0 },
                  ],
                  angles: [0, 90],
                },
              };
              DatasetStorage.saveDataset(sampleDataset);
              setDatasets((prev) => [sampleDataset, ...prev]);
            }}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            Dataset Uji Coba
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dataset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="date">Urutkan Berdasarkan Tanggal</option>
            <option value="name">Urutkan Berdasarkan Nama</option>
            <option value="photos">Urutkan Berdasarkan Foto</option>
          </select>

          {/* Filter by Level */}
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as any)} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Level</option>
            <option value={1}>Level 1 - Sudut Rendah</option>
            <option value={2}>Level 2 - Level Mata</option>
            <option value={3}>Level 3 - Sudut Tinggi</option>
            <option value={4}>Level 4 - Atas Kepala</option>
          </select>

          {/* Group By */}
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="none">Tanpa Pengelompokan</option>
            <option value="level">Kelompokkan Berdasarkan Level</option>
            <option value="date">Kelompokkan Berdasarkan Tanggal</option>
            <option value="tags">Kelompokkan Berdasarkan Tag</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              <GridIcon size={14} />
              Kisi
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              <ListIcon size={14} />
              Daftar
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Grid/List */}
      {filteredAndSortedDatasets.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl">
          <DatabaseIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Tidak Ada Dataset</h3>
          <p className="text-gray-400 mb-6">Buat dataset pertama Anda untuk memulai</p>
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Buat Dataset
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedDatasets.map((group) => (
            <div key={group.key} className="space-y-4">
              {/* Group Header (only show if grouping is enabled) */}
              {groupBy !== "none" && group.title && (
                <div className="flex items-center justify-between">
                  <button onClick={() => toggleGroup(group.key)} className="flex items-center gap-3 text-lg font-semibold text-white hover:text-blue-400 transition-colors">
                    <div className={`transition-transform ${expandedGroups.has(group.key) || groupBy === "none" ? "rotate-90" : "rotate-0"}`}>
                      <ChevronDownIcon size={20} className="rotate-[-90deg]" />
                    </div>
                    <span>{group.title}</span>
                    <span className="text-sm text-gray-400 font-normal">({group.datasets.length})</span>
                  </button>

                  <div className="text-sm text-gray-400">{group.datasets.reduce((acc, d) => acc + d.photos.length, 0)} foto</div>
                </div>
              )}

              {/* Group Content */}
              {(expandedGroups.has(group.key) || groupBy === "none") && (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                  {group.datasets.map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} viewMode={viewMode} onSelect={setSelectedDataset} onEdit={handleEditDataset} onDelete={handleDeleteDataset} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dataset Details Modal */}
      {selectedDataset && (
        <>
          {console.log("Rendering DatasetDetailsModal with:", selectedDataset)}
          <DatasetDetailsModal dataset={selectedDataset} onClose={() => setSelectedDataset(null)} onEdit={handleEditDataset} onDelete={handleDeleteDataset} />
        </>
      )}

      {/* Create Dataset Modal */}
      {showCreateModal && <CreateDatasetModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateDataset} />}

      {/* Edit Dataset Modal */}
      {showEditModal && editingDataset && (
        <EditDatasetModal
          dataset={editingDataset}
          onClose={() => {
            setShowEditModal(false);
            setEditingDataset(null);
          }}
          onUpdate={handleUpdateDataset}
        />
      )}
    </div>
  );
};

// Dataset Card Component
const DatasetCard: React.FC<{
  dataset: Dataset;
  viewMode: "grid" | "list";
  onSelect: (dataset: Dataset) => void;
  onEdit: (dataset: Dataset) => void;
  onDelete: (datasetId: string) => void;
}> = ({ dataset, viewMode, onSelect, onEdit, onDelete }) => {
  const levelStats = [1, 2, 3, 4].map((level) => ({
    level,
    count: dataset.photos.filter((p) => p.level === level).length,
  }));

  const coveragePercentage = Math.round((dataset.photos.length / 144) * 100);

  if (viewMode === "list") {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Preview Grid */}
            <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              {dataset.photos.length > 0 ? (
                <div className="grid grid-cols-2 h-full">
                  {dataset.photos.slice(0, 4).map((photo, idx) => (
                    <img key={idx} src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={20} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Dataset Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{dataset.name}</h3>
              <p className="text-sm text-gray-400 truncate">{dataset.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{dataset.photos.length} foto</span>
                <span>{coveragePercentage}% cakupan</span>
                <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Level Progress */}
            <div className="hidden sm:flex items-center gap-2">
              {levelStats.map(({ level, count }) => (
                <div key={level} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      level === 1 ? "bg-red-500/20 text-red-400" : level === 2 ? "bg-blue-500/20 text-blue-400" : level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {level}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("View dataset clicked:", dataset);
                onSelect(dataset);
              }}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
              title="Lihat Detail"
            >
              <EyeIcon size={16} />
            </button>
            <button onClick={() => onEdit(dataset)} className="p-2 text-gray-400 hover:text-green-400 transition-colors" title="Edit Dataset">
              <EditIcon size={16} />
            </button>
            <button onClick={() => onDelete(dataset.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Hapus Dataset">
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors group">
      {/* Preview */}
      <div className="aspect-video bg-gray-700 relative overflow-hidden">
        {dataset.photos.length > 0 ? (
          <div className="grid grid-cols-3 h-full">
            {dataset.photos.slice(0, 9).map((photo, idx) => (
              <img key={idx} src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
        )}

        {/* Coverage Badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs font-bold text-white">{coveragePercentage}%</span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("View dataset clicked (grid):", dataset);
              onSelect(dataset);
            }}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            title="View Details"
          >
            <EyeIcon size={16} />
          </button>
          <button onClick={() => onEdit(dataset)} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors" title="Edit Dataset">
            <EditIcon size={16} />
          </button>
          <button onClick={() => onDelete(dataset.id)} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/50 transition-colors" title="Delete Dataset">
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-1">{dataset.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{dataset.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{dataset.photos.length} photos</span>
          <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Level Progress */}
        <div className="flex items-center justify-between">
          {levelStats.map(({ level, count }) => (
            <div key={level} className="text-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  level === 1 ? "bg-red-500/20 text-red-400" : level === 2 ? "bg-blue-500/20 text-blue-400" : level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {level}
              </div>
              <div className="text-xs text-gray-400 mt-1">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== ENHANCED 3D PHOTO SCAN TAB ==========
const Enhanced3DPhotoScanTab: React.FC<{ onSwitchToViewer: () => void }> = ({ onSwitchToViewer }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);

  // Check authentication status - REMOVED
  // Authentication is already handled in App.tsx
  // No need to check again here

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear all cloud connection data
      setCloudConnection({ provider: null, status: "disconnected" });
      setGoogleAccessToken(null);
      setConnectedGoogleEmail(null);

      // Clear localStorage
      localStorage.removeItem("cloud_provider");
      localStorage.removeItem("cloud_status");
      localStorage.removeItem("gdrive_token");
      localStorage.removeItem("gdrive_email");
      localStorage.removeItem("upload_folder");

      navigate("/login"); // Fixed: correct login path
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Load existing datasets on mount
  useEffect(() => {
    const loadedDatasets = DatasetStorage.getDatasets();
    setDatasets(loadedDatasets);
  }, []);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torch, setTorch] = useState(false);
  const [grid, setGrid] = useState(true);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [fullMinimize, setFullMinimize] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Auto-minimize on mobile screens and auto-hide after inactivity
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // sm breakpoint
        setControlsMinimized(true);
        setCompactMode(true);
      } else {
        // On larger screens, show level controls by default
        setControlsMinimized(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-hide interface after 3 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      // Show controls when user interacts
      if (fullMinimize) {
        setFullMinimize(false);
        setControlsMinimized(true);
      }

      // Hide after 3 seconds of no interaction
      timer = setTimeout(() => {
        setFullMinimize(true);
      }, 3000);
    };

    // Show interface on any interaction
    document.addEventListener("touchstart", resetTimer);
    document.addEventListener("mousedown", resetTimer);
    document.addEventListener("mousemove", resetTimer);

    resetTimer(); // Start timer initially

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      document.removeEventListener("touchstart", resetTimer);
      document.removeEventListener("mousedown", resetTimer);
      document.removeEventListener("mousemove", resetTimer);
    };
  }, [fullMinimize]);

  // Touch/swipe gestures for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Swipe left to minimize, swipe right to show controls
    if (isLeftSwipe && !fullMinimize) {
      setFullMinimize(true);
    } else if (isRightSwipe && fullMinimize) {
      setFullMinimize(false);
      setControlsMinimized(true);
    }

    if (isLeftSwipe) {
      setCurrentAngle((currentAngle + 10) % 360); // Swipe left = next angle
    } else if (isRightSwipe) {
      setCurrentAngle((currentAngle - 10 + 360) % 360); // Swipe right = prev angle
    }
  };
  const [currentAngle, setCurrentAngle] = useState(0);

  // Helper function to get next recommended angle
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3 | 4>(1);

  const getNextRecommendedAngle = () => {
    const capturedAngles = new Set(captures.filter((c) => c.level === currentLevel).map((c) => c.angle));

    for (let angle = 0; angle < 360; angle += 10) {
      if (!capturedAngles.has(angle)) {
        return angle;
      }
    }
    return 0; // All positions captured
  };

  // Get suggested next angle
  const nextRecommendedAngle = getNextRecommendedAngle();
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [lightingQuality, setLightingQuality] = useState<"good" | "fair" | "poor">("good");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState("capture");
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [cloudConnection, setCloudConnection] = useState<{ provider: CloudProvider | null; status: CloudStatus }>({ provider: null, status: "disconnected" });
  const [uploadDataset, setUploadDataset] = useState<Dataset | null>(null);
  const [showGDriveWizard, setShowGDriveWizard] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [connectedGoogleEmail, setConnectedGoogleEmail] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [deletedDataset, setDeletedDataset] = useState<Dataset | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Cloud connection management
  const handleChangeCloudConnection = () => {
    setShowCloudModal(true);
  };

  const handleDisconnectCloud = () => {
    // Clear cloud connection
    setCloudConnection({ provider: null, status: "disconnected" });
    setGoogleAccessToken(null);
    setConnectedGoogleEmail(null);

    // Clear localStorage
    localStorage.removeItem("cloud_provider");
    localStorage.removeItem("cloud_status");
    localStorage.removeItem("gdrive_token");
    localStorage.removeItem("gdrive_email");
    localStorage.removeItem("upload_folder");
  };

  const handleDeleteDataset = (dataset: Dataset) => {
    setDatasetToDelete(dataset);
    setShowDeleteModal(true);
  };

  const confirmDeleteDataset = () => {
    if (datasetToDelete) {
      // Simpan dataset untuk undo
      setDeletedDataset(datasetToDelete);

      // Hapus dataset
      DatasetStorage.deleteDataset(datasetToDelete.id);
      setDatasets(DatasetStorage.getDatasets());

      // Tutup modal dan tampilkan undo toast
      setShowDeleteModal(false);
      setDatasetToDelete(null);
      setShowUndoToast(true);

      // Auto hide undo toast setelah 10 detik
      setTimeout(() => {
        setShowUndoToast(false);
        setDeletedDataset(null);
      }, 10000);
    }
  };

  const undoDeleteDataset = async () => {
    if (deletedDataset) {
      try {
        // Restore dataset ke localStorage langsung (tanpa upload ulang foto)
        globalDatasets.unshift(deletedDataset);
        saveToStorage("datasets", globalDatasets);
        setDatasets(DatasetStorage.getDatasets());

        // Hide undo toast
        setShowUndoToast(false);
        setDeletedDataset(null);

        // Dispatch event untuk update UI
        window.dispatchEvent(new CustomEvent("datasetAdded", { detail: deletedDataset }));
      } catch (error) {
        console.error("Error restoring dataset:", error);
      }
    }
  };

  const cancelDeleteDataset = () => {
    setShowDeleteModal(false);
    setDatasetToDelete(null);
  };

  // Restore cloud session from localStorage
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem("cloud_provider") as CloudProvider | null;
      const savedStatus = localStorage.getItem("cloud_status") as CloudStatus | null;
      const savedToken = localStorage.getItem("gdrive_token");
      const savedEmail = localStorage.getItem("gdrive_email");
      const savedFolder = localStorage.getItem("upload_folder");
      if (savedProvider && savedStatus) setCloudConnection({ provider: savedProvider, status: savedStatus });
      if (savedToken) setGoogleAccessToken(savedToken);
      if (savedEmail) setConnectedGoogleEmail(savedEmail);
      if (savedFolder) setUploadFolder(savedFolder);
    } catch {}
  }, []);

  const levels = [
    { level: 1, name: "Low", description: "Below object level", color: "#ef4444", minPhotos: 18 },
    { level: 2, name: "Eye", description: "Object center level", color: "#3b82f6", minPhotos: 36 },
    { level: 3, name: "High", description: "Above object level", color: "#10b981", minPhotos: 18 },
    { level: 4, name: "Overhead", description: "Top-down view", color: "#f59e0b", minPhotos: 12 },
  ];

  // Load initial data from localStorage
  useEffect(() => {
    // Load datasets
    const storedDatasets = loadFromStorage("datasets", []);
    if (storedDatasets.length > 0) {
      globalDatasets = storedDatasets;
      setDatasets(storedDatasets);
    }

    // Load models
    const storedModels = loadFromStorage("models", []);
    if (storedModels.length > 0) {
      globalModels = storedModels;
    }

    // Load active model
    const storedActiveModel = loadFromStorage("activeModel", null);
    if (storedActiveModel) {
      globalActiveModel = storedActiveModel;
    }
  }, []);

  // Dataset management
  useEffect(() => {
    const handleDatasetAdded = () => setDatasets(DatasetStorage.getDatasets());
    const handleDatasetUpdated = () => setDatasets(DatasetStorage.getDatasets());
    const handleDatasetDeleted = () => setDatasets(DatasetStorage.getDatasets());

    window.addEventListener("datasetAdded", handleDatasetAdded);
    window.addEventListener("datasetUpdated", handleDatasetUpdated);
    window.addEventListener("datasetDeleted", handleDatasetDeleted);

    return () => {
      window.removeEventListener("datasetAdded", handleDatasetAdded);
      window.removeEventListener("datasetUpdated", handleDatasetUpdated);
      window.removeEventListener("datasetDeleted", handleDatasetDeleted);
    };
  }, []);

  // Enhanced camera activation
  const enableCam = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 480 },
          height: { ideal: 1080, min: 640 },
          frameRate: { ideal: 30, min: 15 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        const fallbackConstraints = {
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
          },
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      setStream(stream);
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = stream;
        videoRef.current.addEventListener("loadedmetadata", () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        });
      }
    } catch (err) {
      alert("Camera access failed. Please check permissions and try again.");
    }
  };

  const capture = () => {
    try {
      console.log("capture() called - debugging click source");
      if (!videoRef.current || !canvasRef.current) {
        console.error("Video or canvas ref not available");
        return;
      }

      const video = videoRef.current as HTMLVideoElement;
      const canvas = canvasRef.current as HTMLCanvasElement;

      // Check if video is ready and playing
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video not ready:", {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
        alert("Camera is not ready. Please wait for video to load.");
        return;
      }

      // Validate and snap to 10-degree intervals
      const snappedAngle = Math.round(currentAngle / 10) * 10;
      const existingCapture = captures.find((c) => c.angle === snappedAngle && c.level === currentLevel);

      if (existingCapture) {
        const proceed = confirm(`A photo already exists at ${snappedAngle}° Level ${currentLevel}. Replace it?`);
        if (!proceed) return;
      }

      // Update current angle to snapped value
      if (snappedAngle !== currentAngle) {
        setCurrentAngle(snappedAngle);
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get 2D context");
        return;
      }

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use JPEG with high quality for better file size management
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      // Check if dataUrl is valid
      if (!dataUrl || dataUrl === "data:,") {
        console.error("Failed to generate image data");
        alert("Gagal menangkap foto. Silakan coba lagi.");
        return;
      }

      // Generate smart filename based on level and angle
      const levelName = currentLevel === 1 ? "Low" : currentLevel === 2 ? "Eye" : currentLevel === 3 ? "High" : "Top";
      const formattedAngle = snappedAngle.toString().padStart(3, "0");
      const photoName = `L${currentLevel}_${levelName}_${formattedAngle}deg`;

      const newCapture: Capture = {
        angle: snappedAngle,
        level: currentLevel,
        dataUrl,
        timestamp: Date.now(),
        caption: photoName,
      };

      setCaptures((prev) => {
        // Remove existing capture if replacing
        const filtered = existingCapture ? prev.filter((c) => !(c.angle === snappedAngle && c.level === currentLevel)) : prev;
        return [...filtered, newCapture];
      });

      console.log("Capture successful:", { angle: snappedAngle, level: currentLevel });
    } catch (error) {
      console.error("Capture failed:", error);
      alert("Gagal menangkap foto. Silakan coba lagi.");
    }

    // Auto-advance to next position
    const nextAngle = (currentAngle + 10) % 360;
    setCurrentAngle(nextAngle);
    if (nextAngle === 0 && currentLevel < 4) {
      setCurrentLevel((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const deleteCapture = (index: number) => {
    setCaptures((prev) => prev.filter((_, i) => i !== index));
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [savedPhotosCount, setSavedPhotosCount] = useState(0);

  const saveCurrentDataset = () => {
    if (captures.length === 0) {
      console.log("No captures to save");
      return;
    }

    try {
      const datasetId = `dataset_${Date.now()}`;
      const dataset: Dataset = {
        id: datasetId,
        name: `Dataset ${datasets.length + 1}`,
        description: `Captured ${captures.length} photos for Gaussian Splatting`,
        photos: [...captures],
        createdAt: new Date().toISOString(),
        tags: ["Gaussian Splatting", "3D Reconstruction"],
        metadata: {
          totalPhotos: captures.length,
          levels: [
            { level: 1, captured: captures.filter((c) => c.level === 1).length },
            { level: 2, captured: captures.filter((c) => c.level === 2).length },
            { level: 3, captured: captures.filter((c) => c.level === 3).length },
            { level: 4, captured: captures.filter((c) => c.level === 4).length },
          ],
          angles: [...new Set(captures.map((c) => c.angle))].sort((a, b) => a - b),
        },
      };

      console.log("Saving dataset...", dataset);

      // Save to global state and localStorage
      DatasetStorage.saveDataset(dataset);

      // Update local state
      setDatasets((prev) => [dataset, ...prev]);
      setCaptures([]);
      setSavedPhotosCount(dataset.photos.length);
      setShowSaveSuccess(true);

      console.log("Dataset saved successfully");
    } catch (error) {
      console.error("Error saving dataset:", error);
      alert("Gagal menyimpan dataset. Silakan coba lagi.");
    }
  };

  const sanitizeFolder = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "_");

  const loadGisScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google script"));
      document.head.appendChild(script);
    });
  };

  const authorizeWithGoogle = async () => {
    try {
      setIsAuthorizing(true);
      setDriveError(null);
      await loadGisScript();
      const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string;
      if (!clientId) {
        throw new Error("Google Client ID belum dikonfigurasi (VITE_GOOGLE_CLIENT_ID)");
      }
      const googleObj = (window as any).google;
      const tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (resp: any) => {
          if (resp.access_token) {
            setGoogleAccessToken(resp.access_token);
            setCloudConnection({ provider: "GDrive", status: "connected" });
            try {
              localStorage.setItem("cloud_provider", "GDrive");
              localStorage.setItem("cloud_status", "connected");
              localStorage.setItem("gdrive_token", resp.access_token);
            } catch {}
            // fetch user info to confirm which Google account is used
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${resp.access_token}` },
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((info) => {
                if (info?.email) setConnectedGoogleEmail(info.email as string);
                try {
                  if (info?.email) localStorage.setItem("gdrive_email", info.email as string);
                } catch {}
              })
              .catch(() => {});
          } else {
            setDriveError("Gagal mendapatkan akses Google Drive");
          }
          setIsAuthorizing(false);
        },
      });
      tokenClient.requestAccessToken({ prompt: "consent select_account" });
    } catch (e: any) {
      setIsAuthorizing(false);
      setDriveError(e?.message || "Authorisasi Google gagal");
    }
  };

  const driveRequest = async (token: string, url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      ...(init || {}),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive API error: ${res.status} ${text}`);
    }
    return res.json();
  };

  const ensureDriveFolder = async (token: string, name: string): Promise<string> => {
    // cari folder
    const q = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
    const found = await driveRequest(token, listUrl);
    if (found.files?.length) return found.files[0].id;
    // buat folder
    const metadata = { name, mimeType: "application/vnd.google-apps.folder" };
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });
    if (!createRes.ok) throw new Error("Gagal membuat folder di Drive");
    const created = await createRes.json();
    return created.id as string;
  };

  const dataURLToBlob = (dataUrl: string): Blob => {
    const [head, b64] = dataUrl.split(",");
    const mime = head.match(/data:(.*);base64/)?.[1] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  const uploadImageToDrive = async (token: string, folderId: string, filename: string, blob: Blob) => {
    // Use FormData untuk upload binary yang benar
    const formData = new FormData();

    // Metadata sebagai JSON
    const metadata = { name: filename, parents: [folderId] };
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));

    // File binary
    formData.append("file", blob, filename);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Jangan set Content-Type, biarkan browser yang set untuk FormData
      },
      body: formData,
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Upload gagal: ${t}`);
    }

    const result = await res.json();

    // Set permission agar file bisa diakses
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      });
    } catch (permError) {
      console.warn("Warning: Gagal set permission file:", permError);
    }

    return {
      ...result,
      viewUrl: `https://drive.google.com/file/d/${result.id}/view`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${result.id}`,
    };
  };

  const uploadToCloud = (dataset: Dataset) => {
    setFormError(null);
    setConnectionError(null);
    if (cloudConnection.status !== "connected") {
      setConnectionError("Cloud belum terhubung. Silakan hubungkan terlebih dahulu.");
      setShowCloudModal(true);
      return;
    }
    if (!uploadFolder.trim()) {
      setFormError("Nama folder tujuan wajib diisi.");
      return;
    }

    setUploadDataset(dataset);
    if (cloudConnection.provider === "GDrive") {
      setShowGDriveWizard(true);
      return;
    }
    setShowUploadProgress(true);

    // Kick off upload depending on provider
    if (cloudConnection.provider === "Firebase") {
      // upload images to Firebase Storage
      dataset.photos.slice(0, 1); // noop to satisfy linter when empty
      (async () => {
        try {
          const folder = sanitizeFolder(uploadFolder || dataset.name);
          for (let i = 0; i < dataset.photos.length; i++) {
            const photo = dataset.photos[i];
            const base64Data = photo.dataUrl.split(",")[1];
            const byteChars = atob(base64Data);
            const byteNumbers = new Array(byteChars.length);
            for (let j = 0; j < byteChars.length; j++) {
              byteNumbers[j] = byteChars.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "image/png" });
            const path = `datasets/${folder}/${dataset.id}/${photo.timestamp}.png`;
            const storageRef = fbRef(storage, path);
            await uploadBytes(storageRef, blob);
          }
        } catch (e) {
          console.error("Firebase upload failed", e);
        }
      })();
    } else if (cloudConnection.provider === "GDrive") {
      // GDrive flow is handled by wizard modal
      setShowGDriveWizard(true);
    }
  };

  const processWithGaussianSplatting = () => {
    if (captures.length === 0) {
      alert("Silakan ambil foto terlebih dahulu!");
      return;
    }

    const incompleteLevels = [1, 2, 3, 4].filter((level) => captures.filter((c) => c.level === level).length < 36);

    if (incompleteLevels.length > 0) {
      const proceed = confirm(
        `Beberapa level belum lengkap:\n${incompleteLevels.map((l) => `Level ${l}: ${captures.filter((c) => c.level === l).length}/36 foto`).join("\n")}\n\nUntuk rekonstruksi 3D optimal, ambil 36 foto per level. Lanjutkan?`
      );
      if (!proceed) return;
    }

    setIsProcessing(true);

    // Save dataset first
    saveCurrentDataset();

    // Simulate processing
    setTimeout(() => {
      const modelId = `model_${Date.now()}`;
      const newModel: Model3D = {
        id: modelId,
        name: `3D Model from Dataset ${datasets.length + 1}`,
        type: "gaussian_splatting",
        date: new Date().toLocaleDateString(),
        thumbnail: captures[0]?.dataUrl || "",
        captures: captures.map((c) => c.dataUrl),
        metadata: {
          totalPhotos: captures.length,
          qualityScore: Math.min(95, 60 + (captures.length / 100) * 35),
          gaussianCompatibility: Math.min(100, captures.length * 2.5),
        },
        vertices: 124532 + Math.floor(Math.random() * 50000),
        faces: 248964 + Math.floor(Math.random() * 100000),
        fileSize: `${(captures.length * 0.3).toFixed(1)} MB`,
      };

      ModelStorage.addModel(newModel);
      setIsProcessing(false);

      if (confirm("Model 3D berhasil dibuat! Lihat sekarang?")) {
        onSwitchToViewer();
      }
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Cloud Integration */}
      <CloudIntegration
        isVisible={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        onConnectionChange={(provider, status) => {
          setCloudConnection({ provider, status });
        }}
      />

      <CloudUploadProgress isOpen={showUploadProgress} onClose={() => setShowUploadProgress(false)} dataset={uploadDataset} provider={cloudConnection.provider} />

      {/* Save Success Modal */}
      {showSaveSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-2 sm:mx-0">
            <div className="flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Dataset Berhasil Disimpan!</h3>
            <p className="text-gray-300 text-center mb-4">{savedPhotosCount} foto telah disimpan ke dataset Anda.</p>
            <button onClick={() => setShowSaveSuccess(false)} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && datasetToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-2 sm:mx-0">
            <h3 className="text-xl font-semibold mb-4 text-red-400">Hapus Dataset</h3>
            <p className="text-gray-300 mb-6">
              Apakah Anda yakin ingin menghapus "<strong>{datasetToDelete.name}</strong>"? Ini akan menghapus {datasetToDelete.photos.length} foto secara permanen dan tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-3">
              <button onClick={cancelDeleteDataset} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                Batal
              </button>
              <button onClick={confirmDeleteDataset} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Wizard (Step-by-step) */}
      {showGDriveWizard && uploadDataset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900/95 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Upload ke Google Drive</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <div>
                  <div className="font-medium">1) Otorisasi Google Drive</div>
                  <div className="text-gray-400 text-xs">Berikan izin agar aplikasi bisa menyimpan ke Drive Anda</div>
                  {connectedGoogleEmail && <div className="text-green-300 text-xs mt-1">Tersambung sebagai: {connectedGoogleEmail}</div>}
                </div>
                <button onClick={authorizeWithGoogle} disabled={isAuthorizing} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {isAuthorizing ? "Mengotorisasi..." : googleAccessToken ? "Terotorisasi" : "Otorisasi"}
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <div>
                  <div className="font-medium">2) Folder Tujuan</div>
                  <div className="text-gray-400 text-xs">Folder akan dibuat jika belum ada</div>
                </div>
                <input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="contoh: produk_kursi_01" className="ml-3 w-40 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
              </div>

              {driveError && <div className="text-xs text-red-300">{driveError}</div>}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setShowGDriveWizard(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                  Tutup
                </button>
                <button
                  onClick={async () => {
                    try {
                      setDriveError(null);
                      if (!googleAccessToken) {
                        setDriveError("Harap authorize Google Drive terlebih dahulu");
                        return;
                      }
                      if (!uploadFolder.trim()) {
                        setDriveError("Nama folder tujuan wajib diisi");
                        return;
                      }
                      const folderName = sanitizeFolder(uploadFolder || uploadDataset.name);
                      const folderId = await ensureDriveFolder(googleAccessToken, folderName);
                      // upload semua foto
                      for (let i = 0; i < uploadDataset.photos.length; i++) {
                        const p = uploadDataset.photos[i];
                        const blob = dataURLToBlob(p.dataUrl);
                        const filename = `${p.timestamp}.png`;
                        await uploadImageToDrive(googleAccessToken, folderId, filename, blob);
                      }
                      setShowGDriveWizard(false);
                      alert("Upload ke Google Drive selesai");
                    } catch (e: any) {
                      setDriveError(e?.message || "Upload gagal");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Notification */}
      {showUndoToast && deletedDataset && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 flex items-center space-x-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-white font-medium">Menghapus "{deletedDataset.name}"</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={undoDeleteDataset} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                Batalkan
              </button>
              <button
                onClick={() => {
                  setShowUndoToast(false);
                  setDeletedDataset(null);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gaussian Splatting 36 Derajat</h2>
          <p className="text-gray-400 text-sm">Pengambilan 3D profesional dengan pendekatan sistematis 4 level</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView(activeView === "capture" ? "datasets" : "capture")}
            className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-all"
          >
            {activeView === "capture" ? (
              <>
                <FolderIcon size={16} className="mr-2 inline" />
                Lihat Dataset
              </>
            ) : (
              <>
                <CameraIcon size={16} className="mr-2 inline" />
                Kembali ke Pengambilan
              </>
            )}
          </button>

          {cloudConnection.status === "connected" ? (
            <div className="flex items-center px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-sm">
              <WifiIcon size={16} className="mr-2" />
              {cloudConnection.provider}
            </div>
          ) : (
            <button onClick={() => setShowCloudModal(true)} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-all">
              <CloudIcon size={16} className="mr-2 inline" />
              Hubungkan Cloud
            </button>
          )}
        </div>
      </div>

      {activeView === "capture" ? (
        <>
          {/* Main Capture Interface */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Camera Section */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-3 sm:p-6">
                <div className="relative bg-black rounded-lg sm:rounded-xl aspect-[9/16] sm:aspect-[3/4] w-full max-w-full sm:max-w-lg mx-auto overflow-hidden">
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {!stream ? (
                    <div className="flex flex-col items-center justify-center h-full text-white space-y-8 p-8 relative">
                      {/* Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-xl"></div>

                      {/* Enhanced Camera Icon */}
                      <div className="relative">
                        <div className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
                          <CameraIcon size={64} className="text-blue-400" />
                        </div>
                        {/* Pulsing rings */}
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping"></div>
                        <div className="absolute inset-2 rounded-full border border-purple-400/20 animate-pulse"></div>
                      </div>

                      <div className="text-center relative z-10">
                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Siap Menangkap</h3>
                        <p className="text-gray-300 mb-6 max-w-sm">Mulai sesi pengambilan 3D profesional Anda dengan sistem pemindaian canggih kami</p>

                        {/* Enhanced Enable Button */}
                        <button
                          onClick={enableCam}
                          className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 active:scale-95"
                        >
                          <span className="relative z-10 flex items-center">
                            <CameraIcon size={20} className="mr-2 group-hover:animate-pulse" />
                            Aktifkan Kamera
                          </span>

                          {/* Animated background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                        </button>

                        {/* Feature indicators */}
                        <div className="flex justify-center items-center gap-6 mt-6 text-xs text-gray-400">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            Kualitas HD
                          </div>
                          <div className="flex items-center">
                            <SparklesIcon size={12} className="mr-2 text-yellow-400" />
                            Ditingkatkan
                          </div>
                          <div className="flex items-center">
                            <BrainIcon size={12} className="mr-2 text-purple-400" />
                            Panduan Otomatis
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover z-0" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />

                      {/* Floating Quick Controls (when minimized) */}
                      {controlsMinimized && !fullMinimize && (
                        <div className="absolute top-2 left-2 flex space-x-2 animate-fade-in">
                          {/* Quick Level Selector */}
                          <div className="flex bg-black/60 backdrop-blur-sm rounded-lg border border-gray-600/50">
                            {[1, 2, 3, 4].map((level) => (
                              <button
                                key={level}
                                onClick={() => setCurrentLevel(level as 1 | 2 | 3 | 4)}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  currentLevel === level
                                    ? level === 1
                                      ? "bg-red-500/90 text-white shadow-lg shadow-red-500/25"
                                      : level === 2
                                      ? "bg-blue-500/90 text-white shadow-lg shadow-blue-500/25"
                                      : level === 3
                                      ? "bg-green-500/90 text-white shadow-lg shadow-green-500/25"
                                      : "bg-yellow-500/90 text-white shadow-lg shadow-yellow-500/25"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/50 bg-gray-800/50"
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>

                          {/* Quick angle indicator with swipe hint */}
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg border border-gray-600/50 px-3 py-2 text-xs text-white font-mono relative">
                            {currentAngle}°
                            {window.innerWidth < 640 && (
                              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 animate-pulse">
                                <ChevronDownIcon size={10} className="rotate-90" />
                                Swipe
                                <ChevronUpIcon size={10} className="-rotate-90" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Swipe Gesture Indicator (when fully minimized) */}
                      {fullMinimize && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <ChevronUpIcon size={14} className="rotate-90" />
                            <span>Swipe right to show controls</span>
                            <ChevronDownIcon size={14} className="-rotate-90" />
                          </div>
                        </div>
                      )}

                      {/* Grid Overlay */}
                      {grid && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="grid grid-cols-3 grid-rows-3 h-full opacity-30">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div key={i} className="border border-white/20"></div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Interactive Controls */}
                      <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col space-y-2 sm:space-y-3 transition-all duration-500 ${fullMinimize ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                        {/* Multi-Level Minimize Toggle */}
                        <div className="self-end flex space-x-1">
                          {/* Hide everything button */}
                          {!fullMinimize && (
                            <button
                              onClick={() => setFullMinimize(true)}
                              className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-gray-700/30 rounded-md transition-all duration-300 hover:scale-110"
                              title="Hide everything"
                            >
                              <XIcon size={10} className="text-gray-400" />
                            </button>
                          )}

                          {/* Main minimize toggle */}
                          <button
                            onClick={() => {
                              if (fullMinimize) {
                                // From fully minimized → show minimized controls
                                setFullMinimize(false);
                                setControlsMinimized(true);
                              } else if (controlsMinimized) {
                                // From minimized → show all controls
                                setControlsMinimized(false);
                              } else {
                                // From expanded → minimize
                                setControlsMinimized(true);
                              }
                            }}
                            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-gray-600/50 rounded-lg transition-all duration-300 hover:scale-110"
                            title={fullMinimize ? "Show controls" : controlsMinimized ? "Show all controls" : "Minimize controls"}
                          >
                            {fullMinimize ? <EyeIcon size={14} className="text-white" /> : <ChevronUpIcon size={14} className={`text-white transition-transform duration-300 ${controlsMinimized ? "rotate-180" : ""}`} />}
                          </button>
                        </div>

                        {/* Integrated Level & Position Control - Show when controls not minimized */}
                        {!controlsMinimized && (
                          <div className="mb-2">
                            {/* Combined Level & Position Control */}
                            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-600/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2">
                              {/* Header */}
                              <div className="mb-2">
                                <div className="text-xs text-gray-400 font-medium text-center">Kontrol Level & Posisi</div>
                              </div>

                              {/* Current Status Display */}
                              <div className="flex items-center space-x-2 sm:space-x-4 mb-2 sm:mb-3">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <LayersIcon size={14} className="sm:w-4 sm:h-4 text-purple-400" />
                                  <span className="text-white font-bold text-xs sm:text-sm">L{currentLevel}</span>
                                </div>
                                <div className="w-px h-3 sm:h-4 bg-gray-600"></div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <Target size={14} className="sm:w-4 sm:h-4 text-blue-400" />
                                  <span className="text-white font-bold text-xs sm:text-sm">{currentAngle}°</span>
                                </div>
                              </div>

                              {/* Level Selector */}
                              <div className="mb-2 sm:mb-3">
                                <div className="text-xs text-gray-400 mb-1 sm:mb-2">Pilihan Level</div>
                                <div className="grid grid-cols-2 gap-0.5 sm:gap-1">
                                  {[1, 2, 3, 4].map((level) => (
                                    <button
                                      key={level}
                                      onClick={() => setCurrentLevel(level as 1 | 2 | 3 | 4)}
                                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-300 hover:scale-110 active:scale-95 ${
                                        currentLevel === level
                                          ? level === 1
                                            ? "bg-gradient-to-br from-red-500/80 to-red-600/80 text-white shadow-lg shadow-red-500/25"
                                            : level === 2
                                            ? "bg-gradient-to-br from-blue-500/80 to-blue-600/80 text-white shadow-lg shadow-blue-500/25"
                                            : level === 3
                                            ? "bg-gradient-to-br from-green-500/80 to-green-600/80 text-white shadow-lg shadow-green-500/25"
                                            : "bg-gradient-to-br from-yellow-500/80 to-yellow-600/80 text-white shadow-lg shadow-yellow-500/25"
                                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-gray-600/30"
                                      }`}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 text-center">{currentLevel === 1 ? "Sudut Rendah" : currentLevel === 2 ? "Level Mata" : currentLevel === 3 ? "Sudut Tinggi" : "Atas Kepala"}</div>
                              </div>

                              {/* Angle Adjustment - Always visible */}
                              <div className="mb-2 sm:mb-3">
                                <div className="text-xs text-gray-400 mb-1 sm:mb-2">Penyesuaian Sudut</div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <button
                                    onClick={() => setCurrentAngle((currentAngle - 10 + 360) % 360)}
                                    className="p-0.5 sm:p-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-md sm:rounded-lg transition-all hover:scale-110"
                                    title="Posisi 10° sebelumnya"
                                  >
                                    <ChevronDownIcon size={10} className="sm:w-3 sm:h-3 text-gray-400 rotate-90" />
                                  </button>
                                  <div className="flex-1 bg-gray-700/50 rounded-md sm:rounded-lg px-1 py-0.5 sm:px-2 sm:py-1 text-center">
                                    <span className="text-white text-xs font-mono font-bold">{currentAngle}°</span>
                                  </div>
                                  <button
                                    onClick={() => setCurrentAngle((currentAngle + 10) % 360)}
                                    className="p-0.5 sm:p-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-md sm:rounded-lg transition-all hover:scale-110"
                                    title="Posisi 10° selanjutnya"
                                  >
                                    <ChevronUpIcon size={10} className="sm:w-3 sm:h-3 text-gray-400 -rotate-90" />
                                  </button>
                                </div>
                              </div>

                              {/* Smart Recommendations */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="text-gray-500">36 positions × 4 levels = 144 total</div>
                                {nextRecommendedAngle !== currentAngle && (
                                  <button
                                    onClick={() => setCurrentAngle(nextRecommendedAngle)}
                                    className="px-2 py-1 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded-md transition-all hover:scale-110 flex items-center gap-1"
                                    title="Lompat ke posisi yang dibutuhkan"
                                  >
                                    <Target size={10} />
                                    {nextRecommendedAngle}°
                                  </button>
                                )}
                              </div>

                              {/* Level Progress indicator */}
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                      level === currentLevel
                                        ? level === 1
                                          ? "bg-gradient-to-r from-red-500 to-red-400"
                                          : level === 2
                                          ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                          : level === 3
                                          ? "bg-gradient-to-r from-green-500 to-green-400"
                                          : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                        : "bg-gray-600/50"
                                    }`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Collapsible Controls Container */}
                        <div className={`transition-all duration-300 overflow-hidden ${controlsMinimized ? "max-h-0 opacity-0" : "max-h-96 opacity-100"}`}>
                          {/* Torch Control */}
                          <button
                            onClick={() => setTorch(!torch)}
                            aria-label="Toggle flashlight"
                            className={`group p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-110 active:scale-95 ${
                              torch
                                ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400/50 text-yellow-300 shadow-lg shadow-yellow-500/25"
                                : "bg-gray-900/60 border-gray-600/50 text-gray-300 hover:bg-gray-800/70 hover:border-gray-500"
                            }`}
                          >
                            <ZapIcon size={16} className={`sm:w-[18px] sm:h-[18px] ${torch ? "animate-pulse" : "group-hover:rotate-12 transition-transform"}`} />
                            {torch && <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl animate-pulse"></div>}
                          </button>

                          {/* Grid Control */}
                          <button
                            onClick={() => setGrid(!grid)}
                            aria-label="Toggle grid overlay"
                            className={`group p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-110 active:scale-95 ${
                              grid
                                ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/25"
                                : "bg-gray-900/60 border-gray-600/50 text-gray-300 hover:bg-gray-800/70 hover:border-gray-500"
                            }`}
                          >
                            <Grid2x2Icon size={16} className="sm:w-[18px] sm:h-[18px] group-hover:rotate-12 transition-transform" />
                            {grid && <div className="absolute inset-0 bg-blue-400/20 rounded-2xl animate-pulse"></div>}
                          </button>
                        </div>
                      </div>

                      {/* Enhanced Capture Button - Responsive positioning */}
                      <div
                        className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${controlsMinimized ? "bottom-2" : "bottom-4 sm:bottom-8"}`}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="relative z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("capture button clicked - preventing navigation");
                              e.nativeEvent.stopImmediatePropagation();
                              capture();
                            }}
                            disabled={isProcessing}
                            aria-label="Capture photo"
                            className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 border-white/20 hover:border-blue-400/50 disabled:opacity-50 transition-all duration-300 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 disabled:cursor-not-allowed z-50 pointer-events-auto"
                          >
                            {/* Outer ring animation */}
                            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping opacity-75 group-hover:opacity-100"></div>

                            {/* Inner capture circle */}
                            <div
                              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full transition-all duration-200 ${
                                isProcessing ? "bg-yellow-500 animate-pulse" : "bg-gradient-to-br from-red-500 to-pink-600 group-hover:from-blue-500 group-hover:to-purple-600"
                              }`}
                            ></div>

                            {/* Processing indicator */}
                            {isProcessing && <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 animate-spin"></div>}
                          </button>

                          {/* Capture count indicator - Enhanced for 360° system */}
                          {captures.length > 0 && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white animate-bounce">
                              {captures.length}
                              {compactMode && <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/60 rounded px-1">L{currentLevel}</div>}
                            </div>
                          )}

                          {/* Quick progress indicator for mobile */}
                          {(controlsMinimized || compactMode) && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-white whitespace-nowrap">
                              L{currentLevel}: {captures.filter((c) => c.level === currentLevel).length}/36 • {currentAngle}°
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Photos */}
              <section aria-label="Recent photos">
                <RecentPhotosGallery captures={captures} onDelete={deleteCapture} />
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assistant */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center">
                    <BrainIcon size={20} className="mr-2 text-green-400" />
                    Panduan
                  </h4>
                  <button
                    onClick={() => setAssistantEnabled(!assistantEnabled)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${assistantEnabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}
                  >
                    {assistantEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {assistantEnabled && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-300">
                        {captures.length === 0
                          ? "Posisikan objek Anda di tengah. Mulai dari Level 1 pada 0°."
                          : captures.length < 36
                          ? `Sempurna! Pindah ${10}° searah jarum jam untuk cakupan optimal.`
                          : "Cakupan sangat baik! Siap untuk rekonstruksi berkualitas tinggi."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Pencahayaan</span>
                        <span className={`font-medium ${lightingQuality === "good" ? "text-green-400" : "text-yellow-400"}`}>{lightingQuality === "good" ? "Baik" : "Kurang"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Cakupan</span>
                        <span className="font-medium text-purple-400">{Math.round(Math.min(100, (captures.length / 84) * 100))}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Settings Form */}
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3">
                <h4 className="font-medium">Pengaturan Upload</h4>
                <label className="block text-sm text-gray-300 mb-1" htmlFor="upload-folder">
                  Folder Tujuan
                </label>
                <input
                  id="upload-folder"
                  value={uploadFolder}
                  onChange={(e) => {
                    setUploadFolder(e.target.value);
                    try {
                      localStorage.setItem("upload_folder", e.target.value);
                    } catch {}
                  }}
                  placeholder="contoh: aset_proyek_saya"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                {formError && <div className="text-xs text-red-300">{formError}</div>}
              </div>

              {/* Cloud Connection Status */}
              <CloudConnectionStatus provider={cloudConnection.provider} status={cloudConnection.status} onChangeConnection={handleChangeCloudConnection} onDisconnect={handleDisconnectCloud} />

              {/* Progress Dashboard */}
              <CaptureProgressDashboard captures={captures} />

              {/* Actions */}
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                <h4 className="font-medium">Aksi Cepat</h4>
                <button
                  onClick={saveCurrentDataset}
                  disabled={captures.length === 0}
                  className="w-full px-4 py-3 sm:py-3.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Simpan dataset saat ini"
                >
                  <FolderIcon size={16} className="mr-2 inline" />
                  Simpan Dataset ({captures.length} foto)
                </button>

                <button
                  onClick={() => setCaptures([])}
                  disabled={captures.length === 0}
                  className="w-full px-4 py-3 sm:py-3.5 bg-gray-600/20 text-gray-400 border border-gray-500/30 rounded-lg font-medium hover:bg-gray-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Reset sesi pengambilan"
                >
                  Reset Sesi
                </button>
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-5 sm:pt-6 border-t border-gray-800">
            <div className="text-gray-400 mb-3 sm:mb-0 text-sm sm:text-base">
              {captures.length > 0 && (
                <>
                  {captures.length} foto ditangkap • Skor Kualitas: {Math.round(Math.min(100, (captures.length / 84) * 100))}%
                </>
              )}
            </div>

            <button
              onClick={processWithGaussianSplatting}
              disabled={captures.length === 0 || isProcessing}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              aria-label="Create 3D Model"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  Buat Model 3D
                  <SparklesIcon size={18} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Dataset Manager */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <FolderIcon size={20} className="mr-2 text-purple-400" />
              Dataset Foto
              <span className="ml-2 px-2 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-sm">{datasets.length}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {datasets.map((dataset: Dataset) => (
                <div key={dataset.id} className="bg-gray-900/60 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors">
                  <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    <div className="grid grid-cols-3 h-full gap-0.5">
                      {dataset.photos.slice(0, 9).map((photo: Capture, index: number) => (
                        <div
                          key={index}
                          className="bg-gray-700"
                          style={{
                            backgroundImage: `url(${photo.dataUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <DatasetCardHeader dataset={dataset} />
                  <p className="text-sm text-gray-400 mb-2">{dataset.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <ImageIcon size={14} className="mr-1" />
                      {dataset.photos.length} foto
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon size={14} className="mr-1" />
                      {new Date(dataset.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button onClick={() => uploadToCloud(dataset)} className="flex-1 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-all">
                      <CloudUploadIcon size={14} className="mr-1 inline" />
                      Upload
                    </button>
                    <button onClick={() => setSelectedDatasetId(dataset.id)} className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-all">
                      Lihat
                    </button>
                    <button onClick={() => handleDeleteDataset(dataset)} className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-sm font-medium hover:bg-red-600/30 transition-all" title="Hapus dataset">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {datasets.length === 0 && (
              <div className="text-center py-12">
                <FolderIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Dataset</h3>
                <p className="text-gray-400">Mulai mengambil foto untuk membuat dataset pertama Anda</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== VIEWER 3D COMPONENT ==========
const Viewer3D: React.FC = () => {
  const [models, setModels] = useState<Model3D[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("3d");

  useEffect(() => {
    const handleModelAdded = (event: Event) => {
      setModels(ModelStorage.getModels());
      const detail = (event as CustomEvent<Model3D>).detail;
      setActiveModelId(detail.id);
    };

    const handleModelChanged = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setActiveModelId(detail);
    };

    window.addEventListener("modelAdded", handleModelAdded);
    window.addEventListener("modelChanged", handleModelChanged);

    setModels(ModelStorage.getModels());
    const activeModel = ModelStorage.getActiveModel();
    if (activeModel) {
      setActiveModelId(activeModel.id);
    }

    return () => {
      window.removeEventListener("modelAdded", handleModelAdded);
      window.removeEventListener("modelChanged", handleModelChanged);
    };
  }, []);

  const activeModel: Model3D | undefined = models.find((m) => m.id === activeModelId) || models[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">3D Viewer</h1>
          <p className="text-gray-400 text-sm">Explore and analyze your 3D models</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center text-sm">
            <Share2Icon size={16} className="mr-2" /> Share
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center text-sm">
            <DownloadIcon size={16} className="mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-3 sm:p-4 flex justify-between items-center">
              <h2 className="font-medium flex items-center">
                <SparklesIcon size={18} className="mr-2 text-blue-400" />
                {activeModel ? activeModel.name : "No Model Selected"}
              </h2>
              <div className="flex space-x-2">
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" aria-label="Model info">
                  <InfoIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" aria-label="Fullscreen">
                  <FullscreenIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="aspect-[4/3] bg-black relative">
              {activeModel ? (
                <>
                  <img src={activeModel.thumbnail} alt={activeModel.name} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-8 py-12 bg-black/70 rounded-lg backdrop-blur-md">
                      <SparklesIcon size={48} className="mx-auto mb-4 text-purple-400" />
                      <h3 className="text-xl font-bold mb-2">{activeModel.name}</h3>
                      <p className="text-gray-400 mb-4">{activeModel.type === "gaussian_splatting" ? "Gaussian Splatting 3D Model ready for viewing" : "3D Model ready for viewing"}</p>
                      <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">Load Interactive 3D Model</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-8 py-12 bg-black/70 rounded-lg backdrop-blur-md">
                    <CameraIcon size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold mb-2">No 3D Model</h3>
                    <p className="text-gray-400 mb-4">Create a 3D model using the Gaussian Splatting capture tool.</p>
                  </div>
                </div>
              )}

              {/* 3D Controls */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 flex space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Rotate">
                  <RotateIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Zoom in">
                  <ZoomInIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Measure">
                  <RulerIcon size={16} className="text-gray-400" />
                </button>
                <div className="h-6 border-r border-gray-700 mx-1"></div>
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="View options">
                  <EyeIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Lighting">
                  <LightIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Model Library</h2>

          {models.length > 0 ? (
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${activeModelId === model.id ? "bg-blue-900/20 border border-blue-900/50" : "hover:bg-gray-800/70 border border-transparent"}`}
                  onClick={() => {
                    setActiveModelId(model.id);
                    ModelStorage.setActiveModel(model.id);
                  }}
                >
                  <div className="w-12 h-12 rounded overflow-hidden">
                    <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-sm">{model.name}</h3>
                    <p className="text-xs text-gray-400">{model.date}</p>
                  </div>
                  {activeModelId === model.id && <div className="w-2 h-2 rounded-full bg-blue-400 ml-2"></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CameraIcon size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400 text-sm">No 3D models yet</p>
              <p className="text-gray-500 text-xs">Create using the scanner</p>
            </div>
          )}

          {/* Model Details */}
          {activeModel && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-medium mb-3">Model Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vertices</span>
                  <span>{activeModel.vertices?.toLocaleString() || "124,532"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Faces</span>
                  <span>{activeModel.faces?.toLocaleString() || "248,964"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Size</span>
                  <span>{activeModel.fileSize || "24.6 MB"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span>{activeModel.date}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center text-sm">
                  <Eye size={16} className="mr-2" />
                  View in AR
                </button>
                <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center text-sm">
                  <DownloadIcon size={16} className="mr-2" />
                  Export Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== MAIN APP COMPONENT ==========
const ScanCapture = () => {
  // Component lifecycle logging
  useEffect(() => {
    console.log("ScanCapture mounted");
    return () => console.log("ScanCapture unmounted");
  }, []);

  const [activeTab, setActiveTab] = useState("photo");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "photo", name: "Tangkapan 36-Derajat", icon: <SparklesIcon size={18} className="mr-2" />, shortName: "Tangkap" },
    { id: "datasets", name: "Pengelola Dataset", icon: <DatabaseIcon size={18} className="mr-2" />, shortName: "Dataset" },
    { id: "video", name: "Pindai Video", icon: <VideoIcon size={18} className="mr-2" />, shortName: "Video" },
  ];

  return (
    <MobileScanWrapper>
      {/* Mobile-Optimized Header */}
      <MobileScanHeader
        title="Cureva Studio 3D"
        subtitle="Pembuatan model 3D profesional dengan teknologi Gaussian Splatting"
        badges={[
          {
            icon: <SparklesIcon size={14} className="text-blue-400" />,
            text: "Sistem 46-Derajat",
            color: "blue",
          },
          {
            icon: <BrainIcon size={14} className="text-purple-400" />,
            text: "Ditingkatkan",
            color: "purple",
          },
          {
            icon: <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>,
            text: "Pratinjau Langsung",
            color: "green",
          },
        ]}
      />

      {/* Mobile-Optimized Tab Navigation */}
      <MobileScanTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <MobileScanContent>
        <div className="max-w-7xl mx-auto">
          {activeTab === "photo" && <Enhanced3DPhotoScanTab onSwitchToViewer={() => setActiveTab("viewer")} />}
          {activeTab === "datasets" && <DatasetManagerTab />}
          {activeTab === "viewer" && <Viewer3D />}
          {activeTab === "video" && (
            <div className="text-center py-12">
              <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pindai Video</h3>
              <p className="text-gray-400">Segera hadir - Pemindaian 3D berbasis video dengan rekonstruksi real-time</p>
            </div>
          )}
          {activeTab === "upload" && (
            <div className="text-center py-12">
              <UploadIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Unggah File</h3>
              <p className="text-gray-400 max-w-prose mx-auto">Unggah gambar atau model 3D yang ada untuk diproses dan ditampilkan</p>
            </div>
          )}
        </div>
      </MobileScanContent>
    </MobileScanWrapper>
  );
};

// ========== DATASET MODALS ==========

// Dataset Details Modal
const DatasetDetailsModal: React.FC<{
  dataset: Dataset;
  onClose: () => void;
  onEdit: (dataset: Dataset) => void;
  onDelete: (datasetId: string) => void;
}> = ({ dataset, onClose, onEdit, onDelete }) => {
  console.log("DatasetDetailsModal rendered with dataset:", dataset);
  console.log("Dataset photos:", dataset.photos.length);

  const [selectedPhoto, setSelectedPhoto] = useState<Capture | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "metadata">("grid");

  const levelStats = [1, 2, 3, 4].map((level) => ({
    level,
    photos: dataset.photos.filter((p) => p.level === level),
    count: dataset.photos.filter((p) => p.level === level).length,
  }));

  const angleStats = Array.from({ length: 36 }, (_, i) => {
    const angle = i * 10;
    return {
      angle,
      photos: dataset.photos.filter((p) => p.angle === angle),
      count: dataset.photos.filter((p) => p.angle === angle).length,
    };
  });

  const getImageMetadata = (photo: Capture) => {
    const img = new Image();
    img.src = photo.dataUrl;

    return {
      size: Math.round((photo.dataUrl.length * 0.75) / 1024), // Approximate size in KB
      format: photo.dataUrl.split(";")[0].split(":")[1],
      timestamp: new Date(photo.timestamp).toISOString(),
      level: photo.level,
      angle: photo.angle,
      caption: photo.caption,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{dataset.name}</h2>
            <p className="text-gray-400 mt-1">{dataset.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{dataset.photos.length} photos</span>
              <span>{Math.round((dataset.photos.length / 144) * 100)}% coverage</span>
              <span>Created {new Date(dataset.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(dataset)} className="p-2 text-gray-400 hover:text-green-400 transition-colors" title="Edit Dataset">
              <EditIcon size={18} />
            </button>
            <button onClick={() => onDelete(dataset.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete Dataset">
              <TrashIcon size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          <button onClick={() => setViewMode("grid")} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === "grid" ? "text-blue-400 border-blue-400" : "text-gray-400 border-transparent hover:text-white"}`}>
            <GridIcon size={16} className="mr-2 inline" />
            Photo Grid
          </button>
          <button
            onClick={() => setViewMode("metadata")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === "metadata" ? "text-blue-400 border-blue-400" : "text-gray-400 border-transparent hover:text-white"}`}
          >
            <BarChart3Icon size={16} className="mr-2 inline" />
            Metadata & Stats
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === "grid" ? (
            <div className="space-y-6">
              {/* Level Sections */}
              {levelStats.map(({ level, photos, count }) => (
                <div key={level} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        level === 1 ? "bg-red-500/20 text-red-400" : level === 2 ? "bg-blue-500/20 text-blue-400" : level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {level}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Level {level} - {level === 1 ? "Low Angle" : level === 2 ? "Eye Level" : level === 3 ? "High Angle" : "Overhead"}
                    </h3>
                    <span className="text-gray-400">({count} photos)</span>
                  </div>

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                      {photos.map((photo) => (
                        <div
                          key={`${photo.level}-${photo.angle}-${photo.timestamp}`}
                          className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <img src={photo.dataUrl} alt={`Level ${photo.level} at ${photo.angle}°`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-end p-1 pointer-events-none">
                            <span className="text-xs bg-black/70 text-white px-1 rounded">{photo.angle}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-lg">No photos captured for this level</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Coverage Statistics */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Coverage Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {levelStats.map(({ level, count }) => (
                    <div key={level} className="text-center">
                      <div
                        className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                          level === 1 ? "bg-red-500/20 text-red-400" : level === 2 ? "bg-blue-500/20 text-blue-400" : level === 3 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {level}
                      </div>
                      <div className="text-white font-semibold">{count}/36</div>
                      <div className="text-xs text-gray-400">{Math.round((count / 36) * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Angle Coverage */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Angle Coverage</h3>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                  {angleStats.map(({ angle, count }) => (
                    <div
                      key={angle}
                      className={`aspect-square rounded flex items-center justify-center text-xs font-mono ${
                        count > 0
                          ? count === 4
                            ? "bg-green-500/30 text-green-300"
                            : count === 3
                            ? "bg-yellow-500/30 text-yellow-300"
                            : count >= 2
                            ? "bg-orange-500/30 text-orange-300"
                            : "bg-blue-500/30 text-blue-300"
                          : "bg-gray-700/30 text-gray-500"
                      }`}
                      title={`${angle}°: ${count} photos`}
                    >
                      {angle}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/30 rounded"></div>
                    Complete (4/4)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500/30 rounded"></div>
                    Good (3/4)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500/30 rounded"></div>
                    Partial (2/4)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500/30 rounded"></div>
                    Minimal (1/4)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-700/30 rounded"></div>
                    Missing (0/4)
                  </div>
                </div>
              </div>

              {/* Photo Metadata Table */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Photo Metadata</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-400">Preview</th>
                        <th className="text-left py-2 text-gray-400">Level</th>
                        <th className="text-left py-2 text-gray-400">Angle</th>
                        <th className="text-left py-2 text-gray-400">Size</th>
                        <th className="text-left py-2 text-gray-400">Format</th>
                        <th className="text-left py-2 text-gray-400">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.photos.slice(0, 20).map((photo) => {
                        const metadata = getImageMetadata(photo);
                        return (
                          <tr key={`${photo.level}-${photo.angle}-${photo.timestamp}`} className="border-b border-gray-800">
                            <td className="py-2">
                              <img src={photo.dataUrl} alt="" className="w-8 h-8 rounded object-cover cursor-pointer hover:scale-150 transition-transform" onClick={() => setSelectedPhoto(photo)} />
                            </td>
                            <td className="py-2 text-white">L{metadata.level}</td>
                            <td className="py-2 text-white">{metadata.angle}°</td>
                            <td className="py-2 text-gray-300">{metadata.size}KB</td>
                            <td className="py-2 text-gray-300">{metadata.format}</td>
                            <td className="py-2 text-gray-300">{new Date(photo.timestamp).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {dataset.photos.length > 20 && <div className="text-center py-4 text-gray-400">Showing 20 of {dataset.photos.length} photos</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Photo Detail Modal */}
        {selectedPhoto && <PhotoDetailModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      </div>
    </div>
  );
};

// Photo Detail Modal
const PhotoDetailModal: React.FC<{
  photo: Capture;
  onClose: () => void;
}> = ({ photo, onClose }) => {
  const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = dataUrl;
    });
  };

  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    getImageDimensions(photo.dataUrl).then(setImageDimensions);
  }, [photo.dataUrl]);

  const metadata = {
    size: Math.round((photo.dataUrl.length * 0.75) / 1024), // Approximate size in KB
    format: photo.dataUrl.split(";")[0].split(":")[1],
    timestamp: new Date(photo.timestamp).toISOString(),
    level: photo.level,
    angle: photo.angle,
    caption: photo.caption,
    dimensions: imageDimensions,
    compressionRatio: imageDimensions ? Math.round(((photo.dataUrl.length * 0.75) / (imageDimensions.width * imageDimensions.height * 3)) * 100) / 100 : 0,
    qualityScore: photo.dataUrl.length > 50000 ? "High" : photo.dataUrl.length > 25000 ? "Medium" : "Low",
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Photo Details</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <img src={photo.dataUrl} alt={metadata.caption} className="w-full rounded-lg" />
            </div>

            {/* Metadata */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white">
                      L{metadata.level} - {metadata.level === 1 ? "Low Angle" : metadata.level === 2 ? "Eye Level" : metadata.level === 3 ? "High Angle" : "Overhead"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Angle:</span>
                    <span className="text-white">{metadata.angle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white">{metadata.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{metadata.size}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Captured:</span>
                    <span className="text-white">{new Date(photo.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Caption</h4>
                <p className="text-gray-300 text-sm">{metadata.caption}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Technical Info</h4>
                <div className="space-y-2 text-sm">
                  {metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white">
                        {metadata.dimensions.width} × {metadata.dimensions.height}px
                      </span>
                    </div>
                  )}
                  {metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aspect Ratio:</span>
                      <span className="text-white">{(metadata.dimensions.width / metadata.dimensions.height).toFixed(2)}:1</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality Score:</span>
                    <span className={`${metadata.qualityScore === "High" ? "text-green-400" : metadata.qualityScore === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{metadata.qualityScore}</span>
                  </div>
                  {metadata.compressionRatio > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Compression:</span>
                      <span className="text-white">{metadata.compressionRatio}:1</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data URL Length:</span>
                    <span className="text-white">{photo.dataUrl.length.toLocaleString()} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timestamp (Unix):</span>
                    <span className="text-white">{photo.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ISO Timestamp:</span>
                    <span className="text-white">{metadata.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Dataset Modal
const CreateDatasetModal: React.FC<{
  onClose: () => void;
  onCreate: (dataset: Omit<Dataset, "id" | "createdAt">) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      photos: [],
      tags,
      metadata: {
        totalPhotos: 0,
        levels: [
          { level: 1, captured: 0 },
          { level: 2, captured: 0 },
          { level: 3, captured: 0 },
          { level: 4, captured: 0 },
        ],
        angles: [],
      },
    });
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Dataset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Dataset Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter dataset name..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dataset..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput.trim()))}
                placeholder="Add tags..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              <button type="button" onClick={() => addTag(tagInput.trim())} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-white">
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Dataset Modal
const EditDatasetModal: React.FC<{
  dataset: Dataset;
  onClose: () => void;
  onUpdate: (dataset: Dataset) => void;
}> = ({ dataset, onClose, onUpdate }) => {
  const [name, setName] = useState(dataset.name);
  const [description, setDescription] = useState(dataset.description);
  const [tags, setTags] = useState<string[]>(dataset.tags);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdate({
      ...dataset,
      name: name.trim(),
      description: description.trim(),
      tags,
    });
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Dataset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Dataset Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput.trim()))}
                placeholder="Add tags..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              <button type="button" onClick={() => addTag(tagInput.trim())} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-white">
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScanCapture;
