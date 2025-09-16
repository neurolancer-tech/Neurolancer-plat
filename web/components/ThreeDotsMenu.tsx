'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Flag, Share2, Bookmark, Eye, MessageCircle } from 'lucide-react';

interface ThreeDotsMenuProps {
  onReport: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onView?: () => void;
  onContact?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThreeDotsMenu({ 
  onReport, 
  onShare, 
  onSave, 
  onView, 
  onContact,
  className = '',
  size = 'md'
}: ThreeDotsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Three dots button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${buttonSizeClasses[size]} rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
        title="More options"
      >
        <MoreVertical className={sizeClasses[size]} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {/* Report option - always present */}
          <button
            onClick={() => handleMenuAction(onReport)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
          >
            <Flag className="w-4 h-4" />
            <span>Report</span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Optional actions */}
          {onView && (
            <button
              onClick={() => handleMenuAction(onView)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
          )}

          {onContact && (
            <button
              onClick={() => handleMenuAction(onContact)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact</span>
            </button>
          )}

          {onSave && (
            <button
              onClick={() => handleMenuAction(onSave)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}

          {onShare && (
            <button
              onClick={() => handleMenuAction(onShare)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}