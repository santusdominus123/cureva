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
  return <div className="space-y-6">
      {quotas.map(quota => {
        const percentage = (quota.used / quota.total) * 100;
        const circumference = 2 * Math.PI * 16; // radius = 16
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        
        return (
          <div key={quota.name} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between">
              {/* Left side - Icon and info */}
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gray-700/50">{quota.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{quota.name}</h3>
                  <p className="text-xs text-gray-400">
                    {quota.used}{quota.unit} / {quota.total}{quota.unit}
                  </p>
                </div>
              </div>
              
              {/* Right side - Circular progress */}
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-700"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={`text-transparent`}
                    style={{
                      stroke: `url(#gradient-${quota.name.replace(' ', '')})`,
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      transition: 'stroke-dashoffset 0.5s ease-in-out'
                    }}
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id={`gradient-${quota.name.replace(' ', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={quota.name === 'GPU Hours' ? 'text-purple-500' : quota.name === 'Storage' ? 'text-blue-500' : 'text-yellow-500'} stopColor="currentColor" />
                      <stop offset="100%" className={quota.name === 'GPU Hours' ? 'text-blue-500' : quota.name === 'Storage' ? 'text-cyan-500' : 'text-orange-500'} stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <button className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-600/30 rounded-xl hover:from-blue-600/30 hover:to-purple-600/30 transition-all text-sm font-semibold">
        Upgrade Plan
      </button>
    </div>;
};
export default QuotaWidget;