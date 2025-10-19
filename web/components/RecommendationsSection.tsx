'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import api from '@/lib/api';
import { UserProfile } from '@/types';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  category: { name: string };
  subcategories?: { id: number; name: string }[];
  price?: number;
  basic_price?: number;
  budget_min?: number;
  budget_max?: number;
  rating?: number;
  likes_count?: number;
  freelancer?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
    avatar_type: string;
    selected_avatar: string;
    google_photo_url: string;
    rating: number;
  };
  client?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
    avatar_type: string;
    selected_avatar: string;
    google_photo_url: string;
  };
}

interface RecommendationsSectionProps {
  userProfile: UserProfile;
}

export default function RecommendationsSection({ userProfile }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userProfile]);

  const loadRecommendations = async () => {
    try {
      const isFreelancer = userProfile.user_type === 'freelancer' || userProfile.user_type === 'both';
      const endpoint = isFreelancer ? '/jobs/recommendations/' : '/gigs/recommendations/';
      
      const response = await api.get(endpoint);
      setRecommendations(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to regular listings
      try {
        const isFreelancer = userProfile.user_type === 'freelancer' || userProfile.user_type === 'both';
        const endpoint = isFreelancer ? '/jobs/' : '/gigs/';
        const response = await api.get(`${endpoint}?limit=6`);
        setRecommendations(response.data.results || response.data || []);
      } catch (fallbackError) {
        console.error('Error loading fallback recommendations:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFreelancer = userProfile.user_type === 'freelancer' || userProfile.user_type === 'both';
  const title = isFreelancer ? 'Recommended Jobs for You' : 'Recommended Gigs for You';
  const viewAllLink = isFreelancer ? '/jobs' : '/gigs';

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4 animate-float">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No recommendations yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete your profile and start engaging to get personalized recommendations
          </p>
          <Link 
            href={viewAllLink}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Browse All {isFreelancer ? 'Jobs' : 'Gigs'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <Link 
          href={viewAllLink}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
        >
          View All
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.slice(0, 6).map((item, index) => (
          <Link 
            key={item.id} 
            href={isFreelancer ? `/jobs/${item.id}` : `/gigs/${item.id}`}
            className="group block"
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 card-hover animate-slide-in border border-gray-200 dark:border-gray-700"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header with user info */}
              <div className="flex items-center space-x-3 mb-4">
                <Avatar
                  src={isFreelancer ? item.client?.profile_picture : item.freelancer?.profile_picture}
                  avatarType={isFreelancer ? item.client?.avatar_type as any : item.freelancer?.avatar_type as any}
                  selectedAvatar={isFreelancer ? item.client?.selected_avatar : item.freelancer?.selected_avatar}
                  googlePhotoUrl={isFreelancer ? item.client?.google_photo_url : item.freelancer?.google_photo_url}
                  size="sm"
                  alt="User"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {isFreelancer 
                      ? `${item.client?.first_name || ''} ${item.client?.last_name || item.client?.username || 'Client'}`
                      : `${item.freelancer?.first_name || ''} ${item.freelancer?.last_name || item.freelancer?.username || 'Freelancer'}`
                    }
                  </p>
                  {!isFreelancer && item.freelancer?.rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-xs">⭐</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                        {item.freelancer.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {item.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 px-2 py-1 rounded-full text-xs font-medium">
                  {item.category.name}
                </span>
                {item.subcategories && item.subcategories.slice(0, 2).map((sub) => (
                  <span key={sub.id} className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {sub.name}
                  </span>
                ))}
                {item.subcategories && item.subcategories.length > 2 && (
                  <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    +{item.subcategories.length - 2} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Price/Budget */}
                  <span className="text-lg font-bold text-teal-600">
                    {isFreelancer 
                      ? (item.budget_min && item.budget_max 
                          ? `$${item.budget_min}-$${item.budget_max}`
                          : 'Budget TBD')
                      : (item.basic_price && item.basic_price > 0 ? `From $${item.basic_price}` : 
                         item.price && item.price > 0 ? `$${item.price}` : 'Price TBD')
                    }
                  </span>
                </div>

                {/* Likes for gigs */}
                {!isFreelancer && (item.likes_count !== undefined && item.likes_count > 0) && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span className="text-sm">{item.likes_count}</span>
                  </div>
                )}
              </div>

              {/* Hover effect indicator */}
              <div className="mt-4 flex items-center text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Details</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}