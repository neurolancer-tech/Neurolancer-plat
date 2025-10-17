'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface LikeButtonProps {
  contentType: 'freelancer' | 'job' | 'gig';
  objectId: number;
  initialLikes?: number;
  initialDislikes?: number;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
}

export default function LikeButton({
  contentType,
  objectId,
  initialLikes = 0,
  initialDislikes = 0,
  size = 'md',
  showCounts = true
}: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [dislikesCount, setDislikesCount] = useState(initialDislikes);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLikeStatus();
  }, [contentType, objectId]);

  const loadLikeStatus = async () => {
    try {
      const response = await api.get(`/likes/${contentType}/${objectId}/`);
      setLikesCount(response.data.likes_count);
      setDislikesCount(response.data.dislikes_count);
      setUserLike(response.data.user_like);
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.post('/likes/toggle/', {
        content_type: contentType,
        object_id: objectId,
        is_like: isLike
      });

      setLikesCount(response.data.likes_count);
      setDislikesCount(response.data.dislikes_count);
      
      if (response.data.action === 'removed') {
        setUserLike(null);
      } else {
        setUserLike(isLike);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center space-x-1 ${sizeClasses[size]} flex-shrink-0`}>
      {/* Like Button */}
      <button
        onClick={() => handleLike(true)}
        disabled={loading}
        className={`flex items-center space-x-1 px-1.5 py-1 rounded transition-colors flex-shrink-0 ${
          userLike === true
            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            : 'text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        {showCounts && <span className="text-xs font-medium min-w-[1rem] text-center">{likesCount}</span>}
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleLike(false)}
        disabled={loading}
        className={`flex items-center space-x-1 px-1.5 py-1 rounded transition-colors flex-shrink-0 ${
          userLike === false
            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
            : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        {showCounts && <span className="text-xs font-medium min-w-[1rem] text-center">{dislikesCount}</span>}
      </button>
    </div>
  );
}