import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  fullHeight?: boolean;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  noPadding = false,
  fullHeight = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-md
        rounded-2xl border border-gray-800/50 shadow-xl
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${fullHeight ? 'h-full' : ''}
        ${className}
      `}
    >
      {(title || subtitle || Icon) && (
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 md:p-6'}>
        {children}
      </div>
    </div>
  );
};

interface MobileGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  gap?: 2 | 3 | 4 | 6;
  className?: string;
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  cols = 1,
  gap = 4,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  const gridGap = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
  };

  return (
    <div className={`grid ${gridCols[cols]} ${gridGap[gap]} ${className}`}>
      {children}
    </div>
  );
};

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon: Icon,
  className = '',
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg',
    ghost: 'bg-transparent hover:bg-gray-800/50 text-gray-300 border border-gray-700/50',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-medium
        transition-all active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

interface MobileStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  const colors = {
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700',
    red: 'from-red-600 to-red-700',
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-md rounded-2xl border border-gray-800/50 p-4 shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">{value}</p>
          {trend && (
            <div className={`text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r ${colors[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

export default MobileCard;
