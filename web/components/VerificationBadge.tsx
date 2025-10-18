'use client';

import { useTheme } from '../contexts/ThemeContext';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function VerificationBadge({ 
  isVerified, 
  size = 'md', 
  showText = false, 
  className = '' 
}: VerificationBadgeProps) {
  const { theme } = useTheme();
  
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div 
        className={`${sizeClasses[size]} flex items-center justify-center relative`}
        title="Verified User"
      >
        {/* Professional verification badge */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          {/* Shield background */}
          <path
            d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
            fill={theme === 'dark' ? '#3B82F6' : '#1D4ED8'}
            className="drop-shadow-sm"
          />
          
          {/* Check mark */}
          <path 
            d="M9 12L11 14L15 10"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      
      {showText && (
        <span 
          className={`${textSizeClasses[size]} font-medium text-blue-600 dark:text-blue-400`}
        >
          Verified
        </span>
      )}
    </div>
  );
}