import React, { useState, useEffect } from 'react';
import { RotateCwIcon, ZoomInIcon, RulerIcon, ScissorsIcon, DownloadIcon, Share2Icon, FullscreenIcon, EyeIcon, LayersIcon, SunIcon, InfoIcon, Upload } from 'lucide-react';
import ThreeJS3DViewer from '../../components/viewers/ThreeJS3DViewer';
import GaussianSplatViewer from '../../components/viewers/GaussianSplatViewer';
import FileUpload3D from '../../components/features/FileUpload3D';
import DebugViewer from '../../components/viewers/DebugViewer';
import AIChatbox from '../../components/features/AIChatbox';
import Viewer3DMobile from './Viewer3DMobile';
import { saveUploadedFile } from '../utils/gaussianFileStorage';

const Viewer3D: React.FC = () => {
  const [activeModel, setActiveModel] = useState('borobudur');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <Viewer3DMobile />;
  }

  // Desktop view
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Penampil 3D</h1>
          <p className="text-gray-400">Jelajahi dan analisis model 3D Anda</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center">
            <Share2Icon size={16} className="mr-2" /> Bagikan
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
            <DownloadIcon size={16} className="mr-2" /> Ekspor
          </button>
        </div>
      </div>

      {/* Mobile: Floating AI Chatbox */}
      <div className="lg:hidden">
        <AIChatbox
          initialMessage="Halo! 👋 Saya AI Assistant untuk model 3D Anda. Upload gambar untuk analisis atau tanya apapun tentang Gaussian Splatting!"
          modelContext={{
            name: selectedFile?.name || (activeModel === 'borobudur' ? 'Panel Relief Borobudur' : activeModel === 'wayang' ? 'Figur Wayang Kulit' : 'Pegangan Keris'),
            type: selectedFile?.name.toLowerCase().includes('splat') || selectedFile?.name.toLowerCase().includes('gaussian') ? 'Gaussian Splat' : 'Regular 3D Model',
            metadata: selectedFile ? {
              size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
              type: selectedFile.type || 'unknown'
            } : null
          }}
          position="floating"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-3 flex justify-between items-center">
              <h2 className="font-medium flex items-center">
                <div size={18} className="mr-2 text-blue-400" />
                {activeModel === 'borobudur' ? 'Panel Relief Borobudur' : activeModel === 'wayang' ? 'Figur Wayang Kulit' : 'Pegangan Keris'}
              </h2>
              <div className="flex space-x-1">
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <InfoIcon size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <div size={16} className="text-gray-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <FullscreenIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="aspect-[4/3] bg-black relative">
              {selectedFile ? (
                // Enhanced detection for Gaussian Splat files
                selectedFile.name.toLowerCase().includes('gaussian') ||
                selectedFile.name.toLowerCase().includes('splat') ||
                selectedFile.name.toLowerCase().endsWith('.ksplat') ||
                selectedFile.name.toLowerCase().endsWith('.splat') ||
                (selectedFile.name.toLowerCase().endsWith('.ply') && selectedFile.size > 50 * 1024 * 1024) ? ( // Large PLY files are likely Gaussian Splats
                  <GaussianSplatViewer
                    modelFile={selectedFile}
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <ThreeJS3DViewer
                    modelFile={selectedFile}
                    width="100%"
                    height="100%"
                  />
                )
              ) : !showUpload ? (
                <>
                  {activeModel === 'borobudur' && <img src="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Model 3D Relief Borobudur" className="w-full h-full object-cover opacity-50" />}
                  {activeModel === 'wayang' && <img src="https://images.unsplash.com/photo-1582560475093-ba66accbc424?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Model 3D Wayang Kulit" className="w-full h-full object-cover opacity-50" />}
                  {activeModel === 'keris' && <img src="https://images.unsplash.com/photo-1589187832032-3c560480f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Model 3D Keris" className="w-full h-full object-cover opacity-50" />}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4 py-8 bg-black/70 rounded-lg backdrop-blur-md max-w-md">
                      <Upload size={48} className="mx-auto mb-4 text-blue-400" />
                      <h3 className="text-xl font-bold mb-2">Penampil 3D</h3>
                      <p className="text-gray-400 mb-4">
                        Unggah model 3D Anda (PLY, OBJ) atau Gaussian Splats (PLY, SPLAT, KSPLAT) untuk rendering 3D real-time dengan akselerasi GPU tingkat lanjut.
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3 mb-4">
                        <p className="font-medium text-yellow-400 mb-1">💡 Tips Pro untuk Loading Lebih Cepat:</p>
                        <ul className="space-y-1 text-left">
                          <li>• Gunakan format .ksplat untuk loading tercepat</li>
                          <li>• File di bawah 50MB akan load jauh lebih cepat</li>
                          <li>• Progressive loading menampilkan hasil parsial terlebih dahulu</li>
                          {!(typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated) && (
                            <li className="text-yellow-400">• Berjalan dalam mode kompatibilitas (lebih lambat)</li>
                          )}
                        </ul>
                        {!(typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated) && (
                          <div className="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-700/50">
                            <p className="text-yellow-300 font-medium mb-1">⚡ Aktifkan Akselerasi GPU:</p>
                            <p className="text-xs">Untuk loading lebih cepat, sajikan melalui HTTPS dengan header yang tepat atau gunakan Chrome dengan flag --enable-features=SharedArrayBuffer.</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowUpload(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mr-2"
                      >
                        Unggah Model 3D
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <FileUpload3D
                      onFileSelect={(file) => {
                        setSelectedFile(file);
                        setShowUpload(false);
                        // Save to localStorage for Dashboard
                        saveUploadedFile(file, 'completed');
                      }}
                      onFileRemove={() => {
                        setSelectedFile(null);
                        setShowUpload(false);
                      }}
                      selectedFile={selectedFile}
                      acceptedFormats={['.ply', '.obj', '.splat', '.ksplat']}
                      maxFileSize={500}
                    />
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowUpload(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex space-x-2">
                <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                  <RotateCwIcon size={16} className="text-gray-400" />
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
                  <SunIcon size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pustaka Model</h2>
            <button
              onClick={() => setShowUpload(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center"
            >
              <Upload size={16} className="mr-2" />
              Unggah
            </button>
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm text-blue-400">Model yang Diunggah</h3>
                  <p className="text-xs text-gray-400">{selectedFile.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setShowUpload(false);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <ModelCard id="borobudur" name="Panel Relief Borobudur" date="Hari ini" thumbnail="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'borobudur' && !selectedFile} onClick={() => { setActiveModel('borobudur'); setSelectedFile(null); }} />
            <ModelCard id="wayang" name="Figur Wayang Kulit" date="Kemarin" thumbnail="https://images.unsplash.com/photo-1582560475093-ba66accbc424?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'wayang' && !selectedFile} onClick={() => { setActiveModel('wayang'); setSelectedFile(null); }} />
            <ModelCard id="keris" name="Pegangan Keris" date="3 hari lalu" thumbnail="https://images.unsplash.com/photo-1589187832032-3c560480f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'keris' && !selectedFile} onClick={() => { setActiveModel('keris'); setSelectedFile(null); }} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Detail Model</h3>
            <div className="space-y-2 text-sm">
              {selectedFile ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nama File</span>
                    <span className="truncate ml-2">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ukuran File</span>
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipe File</span>
                    <span>{selectedFile.name.split('.').pop()?.toUpperCase() || 'Tidak Diketahui'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-green-400">Rendering 3D</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Terakhir Diubah</span>
                    <span>{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vertices</span>
                    <span>124,532</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Faces</span>
                    <span>248,964</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolusi Tekstur</span>
                    <span>4K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ukuran File</span>
                    <span>24.6 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dibuat</span>
                    <span>2023-06-15</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Tag Semantik</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs">
                  Batu
                </span>
                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs">
                  Relief
                </span>
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">
                  Abad ke-8
                </span>
                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs">
                  Buddha
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center">
                <div size={16} className="mr-2" />
                Lihat dalam AR
              </button>
            </div>
          </div>
        </div>

        {/* AI Chatbox - col-span-2 */}
        <div className="lg:col-span-2">
          <AIChatbox
            initialMessage="Halo! 👋 Saya AI Assistant untuk model 3D Anda. Upload gambar untuk analisis atau tanya apapun tentang Gaussian Splatting!"
            modelContext={{
              name: selectedFile?.name || (activeModel === 'borobudur' ? 'Panel Relief Borobudur' : activeModel === 'wayang' ? 'Figur Wayang Kulit' : 'Pegangan Keris'),
              type: selectedFile?.name.toLowerCase().includes('splat') || selectedFile?.name.toLowerCase().includes('gaussian') ? 'Gaussian Splat' : 'Regular 3D Model',
              metadata: selectedFile ? {
                size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
                type: selectedFile.type || 'unknown'
              } : null
            }}
            position="sidebar"
            className="h-[600px]"
          />
        </div>

        {/* Debug Panel - only show when file is selected */}
        {selectedFile && (
          <div className="lg:col-span-6 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4">
            <DebugViewer modelFile={selectedFile} />
          </div>
        )}
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Deskripsi yang Dihasilkan AI</h2>
          <div className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-xs flex items-center">
            <InfoIcon size={14} className="mr-1" />
            Dihasilkan oleh VLM
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">
          Panel relief dari Candi Borobudur ini menggambarkan adegan dari mitologi
          Buddha, kemungkinan dari kisah Jataka. Ukiran menampilkan beberapa figur
          dalam postur tradisional yang khas dari seni Buddha Jawa abad ke-8 hingga ke-9.
          Relief ini menunjukkan pengaruh artistik dinasti Sailendra, dengan teknik
          ukiran batu yang presisi dan perhatian terhadap detail pada pakaian dan ornamen
          para figur. Panel ini tampaknya terbuat dari batu andesit, yang umum digunakan
          dalam pembangunan candi Jawa Tengah selama periode ini.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Periode Waktu</h3>
            <p className="text-xs text-gray-400">
              Abad ke-8 hingga ke-9 M (dinasti Sailendra)
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Material</h3>
            <p className="text-xs text-gray-400">
              Batu andesit, asal vulkanik
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Konteks Budaya</h3>
            <p className="text-xs text-gray-400">
              Buddha Mahayana, periode Jawa Tengah
            </p>
          </div>
        </div>
      </div>
    </div>;
};
interface ModelCardProps {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  active: boolean;
  onClick: () => void;
}
const ModelCard: React.FC<ModelCardProps> = ({
  name,
  date,
  thumbnail,
  active,
  onClick
}) => {
  return <div className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${active ? 'bg-blue-900/20 border border-blue-900/50' : 'hover:bg-gray-800/70 border border-transparent'}`} onClick={onClick}>
      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
        <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{name}</h3>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      {active && <div className="w-2 h-2 rounded-full bg-blue-400 ml-2"></div>}
    </div>;
};
export default Viewer3D;