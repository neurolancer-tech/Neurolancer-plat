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
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative`}
        style={{ backgroundColor: '#0D9E86' }}
        title="Verified User"
      >
        {/* Flower-like background pattern */}
        <div className="absolute inset-0 rounded-full opacity-20">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73C13.6 6.07 14 6.62 14 7.36C14 8.46 13.1 9.36 12 9.36C10.9 9.36 10 8.46 10 7.36C10 6.62 10.4 6.07 11 5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2M12 10.64C13.1 10.64 14 11.54 14 12.64C14 13.74 13.1 14.64 12 14.64C10.9 14.64 10 13.74 10 12.64C10 11.54 10.9 10.64 12 10.64M12 16C13.1 16 14 16.9 14 18C14 18.74 13.6 19.39 13 19.73C13.6 20.07 14 20.62 14 21.36C14 22.46 13.1 23.36 12 23.36C10.9 23.36 10 22.46 10 21.36C10 20.62 10.4 20.07 11 19.73C10.4 19.39 10 18.74 10 18C10 16.9 10.9 16 12 16Z"
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* Check mark */}
        <svg 
          className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'} relative z-10`}
          fill="none" 
          stroke={theme === 'dark' ? '#1f2937' : '#ffffff'} 
          viewBox="0 0 24 24"
          strokeWidth={3}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M5 13l4 4L19 7" 
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