import React, { useState } from 'react';
import { RotateCwIcon, ZoomInIcon, RulerIcon, ScissorsIcon, DownloadIcon, Share2Icon, FullscreenIcon, EyeIcon, LayersIcon, SunIcon, InfoIcon } from 'lucide-react';
const Viewer3D: React.FC = () => {
  const [activeModel, setActiveModel] = useState('borobudur');
  return <div className="space-y-6">
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
                <div size={18} className="mr-2 text-blue-400" />
                {activeModel === 'borobudur' ? 'Borobudur Relief Panel' : activeModel === 'wayang' ? 'Wayang Kulit Figure' : 'Keris Handle'}
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
              {activeModel === 'borobudur' && <img src="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Borobudur Relief 3D Model" className="w-full h-full object-cover opacity-50" />}
              {activeModel === 'wayang' && <img src="https://images.unsplash.com/photo-1582560475093-ba66accbc424?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Wayang Kulit 3D Model" className="w-full h-full object-cover opacity-50" />}
              {activeModel === 'keris' && <img src="https://images.unsplash.com/photo-1589187832032-3c560480f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Keris 3D Model" className="w-full h-full object-cover opacity-50" />}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4 py-8 bg-black/70 rounded-lg backdrop-blur-md max-w-md">
                  <div size={48} className="mx-auto mb-4 text-blue-400" />
                  <h3 className="text-xl font-bold mb-2">3D Viewer</h3>
                  <p className="text-gray-400 mb-4">
                    This is a placeholder for the WebGL 3D viewer. In a real
                    implementation, this would render an interactive 3D model
                    using Three.js.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Load 3D Model
                  </button>
                </div>
              </div>
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
          <h2 className="text-lg font-semibold mb-4">Model Library</h2>
          <div className="space-y-3">
            <ModelCard id="borobudur" name="Borobudur Relief Panel" date="Today" thumbnail="https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'borobudur'} onClick={() => setActiveModel('borobudur')} />
            <ModelCard id="wayang" name="Wayang Kulit Figure" date="Yesterday" thumbnail="https://images.unsplash.com/photo-1582560475093-ba66accbc424?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'wayang'} onClick={() => setActiveModel('wayang')} />
            <ModelCard id="keris" name="Keris Handle" date="3 days ago" thumbnail="https://images.unsplash.com/photo-1589187832032-3c560480f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" active={activeModel === 'keris'} onClick={() => setActiveModel('keris')} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Model Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Vertices</span>
                <span>124,532</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Faces</span>
                <span>248,964</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Texture Resolution</span>
                <span>4K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">File Size</span>
                <span>24.6 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span>2023-06-15</span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Semantic Tags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs">
                  Stone
                </span>
                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs">
                  Relief
                </span>
                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">
                  8th Century
                </span>
                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs">
                  Buddhist
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center">
                <div size={16} className="mr-2" />
                View in AR
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI-Generated Description</h2>
          <div className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-xs flex items-center">
            <InfoIcon size={14} className="mr-1" />
            Generated by VLM
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">
          This relief panel from Borobudur Temple depicts a scene from Buddhist
          mythology, likely from the Jataka tales. The carving shows multiple
          figures in traditional postures characteristic of 8th-9th century
          Javanese Buddhist art. The relief demonstrates the Sailendra dynasty's
          artistic influence, with its precise stone carving techniques and
          attention to detail in the figures' clothing and ornaments. The panel
          appears to be made from andesite stone, which was commonly used in
          Central Javanese temple construction during this period.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Time Period</h3>
            <p className="text-xs text-gray-400">
              8th-9th century CE (Sailendra dynasty)
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Material</h3>
            <p className="text-xs text-gray-400">
              Andesite stone, volcanic origin
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Cultural Context</h3>
            <p className="text-xs text-gray-400">
              Mahayana Buddhist, Central Javanese period
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
  id,
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