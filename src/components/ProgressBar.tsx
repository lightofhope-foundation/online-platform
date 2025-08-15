import React from 'react';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'md', 
  showPercentage = false,
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const percentageSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-white/10 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="bg-gradient-to-r from-[#63eca9] to-[#53e0b6] h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <span className={`text-white/70 font-medium ${percentageSize[size]}`}>
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};
