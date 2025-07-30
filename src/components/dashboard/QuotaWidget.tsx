import React from 'react';
import { CpuIcon, CloudIcon, ZapIcon } from 'lucide-react';
const QuotaWidget: React.FC = () => {
  const quotas = [{
    name: 'GPU Hours',
    icon: <CpuIcon size={16} className="text-purple-400" />,
    used: 76.2,
    total: 100,
    color: 'from-purple-500 to-blue-500'
  }, {
    name: 'Storage',
    icon: <CloudIcon size={16} className="text-blue-400" />,
    used: 48.7,
    total: 100,
    unit: 'GB',
    color: 'from-blue-500 to-cyan-500'
  }, {
    name: 'API Tokens',
    icon: <ZapIcon size={16} className="text-yellow-400" />,
    used: 3450,
    total: 5000,
    color: 'from-yellow-500 to-orange-500'
  }];
  return <div className="space-y-4">
      {quotas.map(quota => <div key={quota.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-1 rounded bg-gray-800 mr-2">{quota.icon}</div>
              <span className="text-sm">{quota.name}</span>
            </div>
            <span className="text-sm font-medium">
              {quota.used}
              {quota.unit} / {quota.total}
              {quota.unit}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className={`bg-gradient-to-r ${quota.color} h-2 rounded-full`} style={{
          width: `${quota.used / quota.total * 100}%`
        }}></div>
          </div>
        </div>)}
      <button className="w-full mt-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm">
        Upgrade Plan
      </button>
    </div>;
};
export default QuotaWidget;