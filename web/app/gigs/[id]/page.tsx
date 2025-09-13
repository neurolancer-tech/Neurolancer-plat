'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Avatar from '../../../components/Avatar';
import OrderModal from '../../../components/OrderModal';
import api from '../../../lib/api';
import { isAuthenticated, getProfile } from '../../../lib/auth';
import toast from 'react-hot-toast';

interface Gig {
  id: number;
  title: string;
  description: string;
  image?: string;
  basic_price: number;
  basic_description: string;
  basic_delivery_time: number;
  standard_price?: number;
  standard_description?: string;
  standard_delivery_time?: number;
  premium_price?: number;
  premium_description?: string;
  premium_delivery_time?: number;
  rating: number;
  total_reviews: number;
  total_orders: number;
  tags?: string;
  category: {
    id: number;
    name: string;
  };
  freelancer: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  freelancer_profile: {
    rating: number;
    total_reviews: number;
    completed_gigs: number;
    profile_picture?: string;
  };
}

export default function GigDetailPage() {
  const params = useParams();
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const profile = getProfile();
  const canOrder = !profile || profile.user_type !== 'freelancer';

  useEffect(() => {
    if (params.id) {
      loadGig(params.id as string);
    }
  }, [params.id]);

  const loadGig = async (id: string) => {
    try {
      const response = await api.get(`/gigs/${id}/`);
      setGig(response.data);
    } catch (error) {
      console.error('Error loading gig:', error);
    } finally {
      setLoading(false);
    }
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

  const handleContactFreelancer = async () => {
    if (!isAuthenticated()) {
      toast.error('Please sign in to contact freelancers');
      return;
    }
    
    try {
      const response = await api.post('/conversations/start/', {
        user_id: gig.freelancer.id
      });
      
      if (response.data) {
        window.location.href = `/messages?conversation=${response.data.id}`;
      }
    } catch (error) {
      toast.error('Error starting conversation');
    }
  };

  const handleOrderNow = () => {
    if (!isAuthenticated()) {
      toast.error('Please sign in to place an order');
      return;
    }
    setShowOrderModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Gig Image */}
            <div className="card rounded-lg shadow-sm overflow-hidden mb-6">
              <Image
                src={gig.image || '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'}
                alt={gig.title}
                width={600}
                height={400}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg';
                }}
              />
            </div>
            
            {/* Freelancer Info */}
            <div className="card rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={gig.freelancer_profile?.profile_picture}
                  size="lg"
                  alt={gig.freelancer.first_name}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{gig.freelancer.first_name} {gig.freelancer.last_name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">AI Expert</p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-sm">{gig.rating} ({gig.total_reviews} reviews)</span>
                  </div>
                </div>
                <button
                  onClick={handleContactFreelancer}
                  className="ml-auto px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  Contact
                </button>
              </div>
            </div>

            {/* Gig Details */}
            <div className="card rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{gig.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{gig.category.name}</span>
                {/* Subcategories */}
                {((gig as any).subcategories) && ((gig as any).subcategories).length > 0 && (
                  ((gig as any).subcategories).map((sub: any) => (
                    <span key={sub.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {sub.name}
                    </span>
                  ))
                )}
                <span className="text-gray-500 dark:text-gray-400">{gig.freelancer_profile?.completed_gigs || 0} orders completed</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{gig.description}</p>
              
              {gig.tags && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Choose a Package</h2>
              
              <div className="space-y-4">
                {/* Basic Package */}
                <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Basic</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${gig.basic_price}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{gig.basic_description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>🚀 {gig.basic_delivery_time} days delivery</span>
                  </div>
                  {canOrder && (
                    <button
                      onClick={handleOrderNow}
                      className="w-full btn-primary"
                    >
                      Order Basic ($${gig.basic_price})
                    </button>
                  )}
                </div>

                {/* Standard Package */}
                {gig.standard_price && (
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Standard</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">${gig.standard_price}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{gig.standard_description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>🚀 {gig.standard_delivery_time} days delivery</span>
                    </div>
                    {canOrder && (
                      <button
                        onClick={handleOrderNow}
                        className="w-full btn-primary"
                      >
                        Order Standard ($${gig.standard_price})
                      </button>
                    )}
                  </div>
                )}

                {/* Premium Package */}
                {gig.premium_price && (
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Premium</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">${gig.premium_price}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{gig.premium_description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>🚀 {gig.premium_delivery_time} days delivery</span>
                    </div>
                    {canOrder && (
                      <button
                        onClick={handleOrderNow}
                        className="w-full btn-primary"
                      >
                        Order Premium ($${gig.premium_price})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <OrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        gig={gig}
      />
    </div>
  );
}