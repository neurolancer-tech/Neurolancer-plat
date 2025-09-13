'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import LikeButton from '@/components/LikeButton';
import { Gig } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MyGigsPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGigLikes, setTotalGigLikes] = useState(0);
  const [totalGigDislikes, setTotalGigDislikes] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile && profile.user_type !== 'freelancer' && profile.user_type !== 'both') {
      toast.error('Only freelancers can manage gigs');
      router.push('/dashboard');
      return;
    }

    loadMyGigs();
  }, [router]);

  const loadMyGigs = async () => {
    try {
      const response = await api.get('/gigs/my/');
      const gigsData = response.data.results || response.data;
      setGigs(gigsData);
      
      // Calculate total likes and dislikes for all gigs
      const totalLikes = gigsData.reduce((sum: number, gig: Gig) => sum + (gig.likes_count || 0), 0);
      const totalDislikes = gigsData.reduce((sum: number, gig: Gig) => sum + (gig.dislikes_count || 0), 0);
      setTotalGigLikes(totalLikes);
      setTotalGigDislikes(totalDislikes);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteGig = async (gigId: number) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;

    try {
      await api.delete(`/gigs/${gigId}/delete/`);
      toast.success('Gig deleted successfully');
      loadMyGigs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete gig');
    }
  };

  const toggleGigStatus = async (gigId: number, isActive: boolean) => {
    try {
      await api.patch(`/gigs/${gigId}/update/`, { is_active: !isActive });
      toast.success(`Gig ${!isActive ? 'activated' : 'deactivated'} successfully`);
      loadMyGigs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update gig status');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Gigs</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your service offerings</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center text-green-600">
                <span className="mr-1">👍</span>
                <span>{totalGigLikes} Gig Likes</span>
              </div>
              <div className="flex items-center text-red-600">
                <span className="mr-1">👎</span>
                <span>{totalGigDislikes} Gig Dislikes</span>
              </div>
            </div>
          </div>
          <Link href="/create-gig" className="btn-primary">
            Create New Gig
          </Link>
        </div>

        {gigs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No gigs yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first gig to start attracting clients</p>
            <Link href="/create-gig" className="btn-primary">
              Create Your First Gig
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map(gig => (
              <div key={gig.id} className="card">
                <div className="relative">
                  <Image
                    src={gig.image || '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'}
                    alt={gig.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg';
                    }}
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                    gig.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {gig.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{gig.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{gig.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="text-sm">{gig.rating} ({gig.total_reviews})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Starting at</div>
                      <div className="text-lg font-bold text-primary">${gig.basic_price}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{gig.category.name}</span>
                      {/* Subcategories */}
                      {((gig as any).subcategories) && ((gig as any).subcategories).length > 0 && (
                        ((gig as any).subcategories).slice(0, 2).map((sub: any) => (
                          <span key={sub.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {sub.name}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Orders: {gig.freelancer_profile?.completed_gigs || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-center mb-4">
                    <LikeButton
                      contentType="gig"
                      objectId={gig.id}
                      initialLikes={gig.likes_count || 0}
                      initialDislikes={gig.dislikes_count || 0}
                      size="sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Link 
                      href={`/gigs/${gig.id}/edit`} 
                      className="flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleGigStatus(gig.id, gig.is_active)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                        gig.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {gig.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteGig(gig.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}