import React, { ReactNode } from 'react';

interface MobileScanWrapperProps {
  children: ReactNode;
}

export const MobileScanWrapper: React.FC<MobileScanWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Mobile-optimized container */}
      <div className="pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
};

interface MobileScanHeaderProps {
  title?: string;
  subtitle?: string;
  badges?: Array<{
    icon: ReactNode;
    text: string;
    color: 'blue' | 'purple' | 'green' | 'pink';
  }>;
}

export const MobileScanHeader: React.FC<MobileScanHeaderProps> = ({
  title = 'Cureva 3D Studio',
  subtitle = 'Professional 3D model creation powered by AI and Gaussian Splatting technology',
  badges = [],
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20',
    green: 'bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20',
  };

  return (
    <div className="text-center mb-4 md:mb-8 px-4 pt-4 md:pt-6 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-3xl pointer-events-none"></div>

      <div className="relative">
        {/* Main Title with Animation */}
        <div className="relative inline-block mb-2 md:mb-4">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-sm opacity-50 animate-pulse pointer-events-none"></div>
        </div>

        <p className="text-gray-300 max-w-xs md:max-w-md mx-auto mb-3 md:mb-6 text-xs md:text-sm leading-relaxed px-2">
          {subtitle}
        </p>

        {/* Interactive Feature Badges */}
        {badges.length > 0 && (
          <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap px-2">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className={`flex items-center backdrop-blur-sm border rounded-full px-2 md:px-3 py-1 md:py-1.5 transition-all cursor-pointer group active:scale-95 ${colorClasses[badge.color]}`}
              >
                <div className="mr-1.5 md:mr-2 group-hover:scale-110 transition-transform">
                  {badge.icon}
                </div>
                <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MobileScanTabsProps {
  tabs: Array<{
    id: string;
    name: string;
    icon: ReactNode;
    shortName: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileScanTabs: React.FC<MobileScanTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl mx-3 md:mx-4 mb-4">
      <nav className="flex" role="tablist" aria-label="Capture Navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 px-2 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium
              flex items-center justify-center transition-all duration-300 relative group
              ${
                activeTab === tab.id
                  ? 'text-white bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-pink-500/20 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30 active:scale-95'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            {/* Icon with hover animations */}
            <div
              className={`mr-1.5 md:mr-2 transition-transform duration-200 ${
                activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
              }`}
            >
              {tab.icon}
            </div>

            {/* Text - responsive */}
            <span className="hidden md:inline">{tab.name}</span>
            <span className="md:hidden text-[10px] font-semibold">{tab.shortName}</span>

            {/* Active indicator with animation */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-full animate-pulse opacity-75"></div>
              </div>
            )}

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
          </button>
        ))}
      </nav>
    </div>
  );
};

interface MobileScanContentProps {
  children: ReactNode;
  className?: string;
}

export const MobileScanContent: React.FC<MobileScanContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-3 md:px-4 lg:px-6 ${className}`}>
      {children}
    </div>
  );
};

interface MobileScanCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const MobileScanCard: React.FC<MobileScanCardProps> = ({
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`
        bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl
        ${noPadding ? '' : 'p-4 md:p-6'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface MobileScanButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const MobileScanButton: React.FC<MobileScanButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs md:text-sm',
    md: 'px-4 py-2.5 md:py-3 text-sm md:text-base',
    lg: 'px-6 py-3 md:py-4 text-base md:text-lg',
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
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default MobileScanWrapper;
