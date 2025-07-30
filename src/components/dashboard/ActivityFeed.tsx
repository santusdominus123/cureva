import React from 'react';
import { CameraIcon, UserIcon, ShareIcon, TagIcon, DownloadIcon } from 'lucide-react';
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
    icon: <div size={14} className="text-blue-400" />
  }, {
    id: 3,
    type: 'user_comment',
    user: 'Sarah',
    action: 'added a comment on',
    object: 'Keris Artifact',
    time: '2 days ago',
    icon: <UserIcon size={14} className="text-purple-400" />
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
  return <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
      {activities.map(activity => <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-800 last:border-0">
          <div className="p-1.5 rounded-full bg-gray-800 flex-shrink-0">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.user}</span>{' '}
              <span className="text-gray-400">{activity.action}</span>{' '}
              <span className="text-blue-400">{activity.object}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
          </div>
        </div>)}
    </div>;
};
export default ActivityFeed;