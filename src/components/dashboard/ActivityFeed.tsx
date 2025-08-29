import React from 'react';
import { CameraIcon, UserIcon, ShareIcon, TagIcon, DownloadIcon, CheckCircleIcon, PlayCircleIcon, MessageCircleIcon } from 'lucide-react';
const ActivityFeed: React.FC = () => {
  const activities = [{
    id: 1,
    type: 'scan_complete',
    user: 'You',
    action: 'completed scanning',
    object: 'Borobudur Relief',
    time: '2 hours ago',
    icon: <CameraIcon size={14} className="text-green-400" />
  }, {
    id: 2,
    type: 'model_processed',
    user: 'System',
    action: 'finished processing',
    object: 'Wayang Kulit Model',
    time: 'Yesterday',
    icon: <CheckCircleIcon size={14} className="text-blue-400" />
  }, {
    id: 3,
    type: 'user_comment',
    user: 'Sarah',
    action: 'added a comment on',
    object: 'Keris Artifact',
    time: '2 days ago',
    icon: <MessageCircleIcon size={14} className="text-purple-400" />
  }, {
    id: 4,
    type: 'model_shared',
    user: 'You',
    action: 'shared',
    object: 'Temple Gate Model',
    time: '3 days ago',
    icon: <ShareIcon size={14} className="text-yellow-400" />
  }, {
    id: 5,
    type: 'tag_added',
    user: 'Admin',
    action: 'added tags to',
    object: 'Pottery Collection',
    time: '5 days ago',
    icon: <TagIcon size={14} className="text-pink-400" />
  }];
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'scan_complete': return 'bg-green-500/20 border-green-500/30';
      case 'model_processed': return 'bg-blue-500/20 border-blue-500/30';
      case 'user_comment': return 'bg-purple-500/20 border-purple-500/30';
      case 'model_shared': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'tag_added': return 'bg-pink-500/20 border-pink-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative">
          <div className="flex items-start space-x-3">
            {/* Enhanced Icon with proper styling */}
            <div className={`p-2 rounded-xl ${getActivityColor(activity.type)} flex-shrink-0 relative z-10`}>
              {activity.icon}
            </div>
            
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-10 w-px h-6 bg-gradient-to-b from-gray-700 to-transparent"></div>
            )}
            
            {/* Enhanced Content */}
            <div className="flex-1 min-w-0 bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-white">{activity.user}</span>{' '}
                  <span className="text-gray-400">{activity.action}</span>{' '}
                  <span className="font-medium text-blue-400">{activity.object}</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        </div>
      ))}
    </div>;
};
export default ActivityFeed;