import React from 'react';
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
  return <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 p-4 transition-all duration-300 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-900/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className="p-2 rounded-lg bg-gray-800/70">{icon}</div>
      </div>
      <div className="mt-3 flex items-center">
        <span className={`flex items-center text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUpIcon size={12} className="mr-1" /> : <TrendingDownIcon size={12} className="mr-1" />}
          {change}
        </span>
        <span className="text-gray-500 text-xs ml-2">{timeframe}</span>
      </div>
    </div>;
};
export default StatCard;