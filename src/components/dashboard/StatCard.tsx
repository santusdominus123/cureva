import React, { ReactNode } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  timeframe: string;
  icon: ReactNode;
  changeType?: 'positive' | 'negative';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  timeframe,
  icon,
  changeType = 'negative'
}) => {
  const isPositive = changeType === 'positive' ? true : change.startsWith('+') ? false : true;
  
  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-gray-600/50 hover:shadow-2xl hover:shadow-blue-900/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg">
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUpIcon size={14} className="mr-1" /> : <TrendingDownIcon size={14} className="mr-1" />}
            {change}
          </span>
        </div>
        <span className="text-gray-500 text-xs font-medium">{timeframe}</span>
      </div>
    </div>
  );
};
export default StatCard;