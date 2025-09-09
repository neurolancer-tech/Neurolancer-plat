'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

interface Gig {
  id: number;
  title: string;
  rating: number;
  total_reviews: number;
}

export default function GigReviewsPage() {
  const params = useParams();
  const [gig, setGig] = useState<Gig | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (params.id) {
      loadGigAndReviews(params.id as string);
    }
  }, [params.id]);

  const loadGigAndReviews = async (id: string) => {
    try {
      const [gigResponse, reviewsResponse] = await Promise.all([
        api.get(`/gigs/${id}/`),
        api.get(`/gigs/${id}/reviews/`)
      ]);
      
      setGig(gigResponse.data);
      setReviews(reviewsResponse.data.results || reviewsResponse.data);
    } catch (error) {
      console.error('Error loading gig reviews:', error);
      // Mock data for demo
      setGig({
        id: parseInt(id),
        title: "AI Chatbot Development",
        rating: 4.8,
        total_reviews: 24
      });
      setReviews([
        {
          id: 1,
          rating: 5,
          comment: "Excellent work! The AI chatbot exceeded my expectations. Very professional and delivered on time.",
          created_at: "2024-01-15T10:30:00Z",
          client: {
            first_name: "Sarah",
            last_name: "Johnson"
          }
        },
        {
          id: 2,
          rating: 4,
          comment: "Good quality work. The chatbot works well but needed some minor adjustments. Overall satisfied.",
          created_at: "2024-01-10T14:20:00Z",
          client: {
            first_name: "Mike",
            last_name: "Chen"
          }
        },
        {
          id: 3,
          rating: 5,
          comment: "Amazing developer! Created exactly what I needed. Great communication throughout the project.",
          created_at: "2024-01-05T09:15:00Z",
          client: {
            first_name: "Emily",
            last_name: "Davis"
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === '5') return review.rating === 5;
    if (filter === '4') return review.rating === 4;
    if (filter === '3') return review.rating === 3;
    if (filter === '2') return review.rating === 2;
    if (filter === '1') return review.rating === 1;
    return true;
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Gig not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews for &quot;{gig.title}&quot;</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {renderStars(Math.round(gig.rating))}
              <span className="ml-2 text-lg font-semibold">{gig.rating}</span>
            </div>
            <span className="text-gray-600">({gig.total_reviews} reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Rating Distribution */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-6">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rating</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Reviews</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">No reviews match your current filter.</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.id} className="card p-6">
                    <div className="flex items-start space-x-4">
                      <Image
                        src={review.client.profile_picture || `https://ui-avatars.com/api/?name=${review.client.first_name}+${review.client.last_name}`}
                        alt={`${review.client.first_name} ${review.client.last_name}`}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {review.client.first_name} {review.client.last_name}
                            </h4>
                            <div className="flex items-center mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination could be added here */}
            {filteredReviews.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}