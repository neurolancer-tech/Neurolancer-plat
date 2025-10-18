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
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
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
        {/* Curly verification badge with star-like shape */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          {/* Curly star background */}
          <path
            d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"
            fill="#0D9E86"
            stroke="#0D9E86"
            strokeWidth="0.5"
          />
          
          {/* Check mark */}
          <path 
            d="M8 12L10.5 14.5L16 9"
            stroke={theme === 'dark' ? '#ffffff' : '#000000'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      
      {showText && (
        <span 
          className={`${textSizeClasses[size]} font-medium`}
          style={{ color: '#0D9E86' }}
        >
          Verified
        </span>
      )}
    </div>
  );
}