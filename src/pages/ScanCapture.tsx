import React, { useState } from 'react';
import { CameraIcon, VideoIcon, UploadIcon, ArrowRightIcon, LayoutGridIcon, CheckIcon } from 'lucide-react';
const ScanCapture: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photo' | 'video' | 'upload'>('photo');
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Capture Data</h1>
        <p className="text-gray-400">
          Create new 3D models by capturing photos or videos
        </p>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800">
          <nav className="flex" aria-label="Tabs">
            <button onClick={() => setActiveTab('photo')} className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'photo' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}>
              <CameraIcon size={16} className="mr-2" />
              Photo Scan
            </button>
            <button onClick={() => setActiveTab('video')} className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'video' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}>
              <VideoIcon size={16} className="mr-2" />
              Video Scan
            </button>
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-3 text-sm font-medium flex items-center ${activeTab === 'upload' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}>
              <UploadIcon size={16} className="mr-2" />
              Upload Files
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'photo' && <PhotoScanTab />}
          {activeTab === 'video' && <VideoScanTab />}
          {activeTab === 'upload' && <UploadFilesTab />}
        </div>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Captures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RecentCaptureCard name="Temple Statue" type="Photo Burst" date="Today, 14:32" count={24} thumbnail="https://images.unsplash.com/photo-1609601546193-41c8eee48111?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" status="Processing" />
          <RecentCaptureCard name="Ceremonial Mask" type="Video Scan" date="Yesterday" count={1} thumbnail="https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" status="Complete" />
          <RecentCaptureCard name="Ancient Pottery" type="Photo Burst" date="3 days ago" count={36} thumbnail="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" status="Complete" />
        </div>
      </div>
    </div>;
};
const PhotoScanTab: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Camera Preview</h3>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-gray-700">
            <div className="text-center px-4">
              <CameraIcon size={48} className="mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">Camera preview will appear here</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Enable Camera
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center">
              <LayoutGridIcon size={16} className="mr-2" />
              Burst Mode
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
              Capture <CameraIcon size={16} className="ml-2" />
            </button>
          </div>
        </div>
        <div className="md:w-1/3 bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Smart Guidance</h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-blue-900/50 mr-3 flex-shrink-0">
                  <CheckIcon size={16} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Front View Captured</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Good lighting and detail
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-yellow-900/50 mr-3 flex-shrink-0">
                  <ArrowRightIcon size={16} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Capture Left Side</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Move 45° to the left
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-gray-800 mr-3 flex-shrink-0">
                  <ArrowRightIcon size={16} className="text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Capture Back Side</h4>
                  <p className="text-xs text-gray-400 mt-1">Pending</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Coverage Map</h4>
              <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full bg-gradient-radial from-green-500/30 via-yellow-500/20 to-red-500/10 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-black rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">Object</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Green areas have good coverage, red areas need more photos
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-800">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
          Process Photos <ArrowRightIcon size={16} className="ml-2" />
        </button>
      </div>
    </div>;
};
const VideoScanTab: React.FC = () => {
  return <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Video Preview</h3>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-gray-700">
            <div className="text-center px-4">
              <VideoIcon size={48} className="mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">Video preview will appear here</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Enable Camera
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div className="flex items-center text-gray-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              00:00
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
              Record <VideoIcon size={16} className="ml-2" />
            </button>
          </div>
        </div>
        <div className="md:w-1/3 bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Recording Guidelines</h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">
                Tips for Best Results
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Move slowly around the object in a circular pattern
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Keep the object centered in frame
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Maintain consistent lighting
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Capture at least 30 seconds of footage
                </li>
              </ul>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Frame Extraction</h4>
              <p className="text-xs text-gray-400">
                The system will automatically extract frames from your video to
                create the 3D model. Higher resolution videos produce better
                results.
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Movement Guide</h4>
              <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center p-4">
                <div className="w-full h-full rounded-full border-2 border-dashed border-gray-700 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">Object</span>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  </div>
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <path d="M50,10 A40,40 0 0,1 90,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-blue-500" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Move camera in a full circle around the object
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-800">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center opacity-50 cursor-not-allowed">
          Process Video <ArrowRightIcon size={16} className="ml-2" />
        </button>
      </div>
    </div>;
};
const UploadFilesTab: React.FC = () => {
  return <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8">
        <div className="text-center">
          <UploadIcon size={48} className="mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
          <p className="text-gray-400 mb-4">
            Support for JPG, PNG, and MP4 files. <br />
            Maximum 500 MB per file.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Browse Files
          </button>
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Upload Settings</h3>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium">Project Name</h4>
              <p className="text-xs text-gray-400">
                Enter a name for this capture set
              </p>
            </div>
            <input type="text" className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:w-1/2" placeholder="Enter project name" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium">Capture Type</h4>
              <p className="text-xs text-gray-400">
                Select the type of content you're uploading
              </p>
            </div>
            <select className="bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:w-1/2">
              <option>Photo Set</option>
              <option>Video</option>
              <option>Mixed Content</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium">Auto-Process</h4>
              <p className="text-xs text-gray-400">
                Automatically process after upload completes
              </p>
            </div>
            <div className="md:w-1/2 flex justify-start md:justify-end">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-gray-800">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center opacity-50 cursor-not-allowed">
          Upload Files <ArrowRightIcon size={16} className="ml-2" />
        </button>
      </div>
    </div>;
};
interface RecentCaptureCardProps {
  name: string;
  type: string;
  date: string;
  count: number;
  thumbnail: string;
  status: 'Processing' | 'Complete' | 'Failed';
}
const RecentCaptureCard: React.FC<RecentCaptureCardProps> = ({
  name,
  type,
  date,
  count,
  thumbnail,
  status
}) => {
  return <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="h-32 relative">
        <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm">
          {type === 'Photo Burst' ? <span className="flex items-center">
              <CameraIcon size={12} className="mr-1" /> {count} photos
            </span> : <span className="flex items-center">
              <VideoIcon size={12} className="mr-1" /> Video
            </span>}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium">{name}</h3>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">{date}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'Processing' ? 'bg-yellow-500/20 text-yellow-300' : status === 'Complete' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {status}
          </span>
        </div>
      </div>
    </div>;
};
export default ScanCapture;