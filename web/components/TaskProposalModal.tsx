'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import api from '../lib/api';

interface Gig {
  id: number;
  title: string;
  description: string;
  image?: string;
  image_url?: string;
  basic_price: number;
  standard_price?: number;
  premium_price?: number;
  basic_description: string;
  standard_description?: string;
  premium_description?: string;
  rating: number;
  total_reviews: number;
  freelancer: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
}

interface Task {
  id: number;
  title: string;
  description: string;
  budget: number;
  skills_required?: string;
}

interface TaskProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTaskAssigned: () => void;
}

export default function TaskProposalModal({ isOpen, onClose, task, onTaskAssigned }: TaskProposalModalProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGig, setSelectedGig] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [orderRequirements, setOrderRequirements] = useState('');
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGigs();
      setOrderRequirements(`Task: ${task.title}\n\n${task.description}`);
      setSelectedGig(null);
      setSelectedPackage('basic');
    }
  }, [isOpen]);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/gigs/');
      setGigs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedGig) return;

    const selectedGigData = gigs.find(g => g.id === selectedGig);
    if (!selectedGigData) return;

    setOrdering(true);
    try {
      const orderData = {
        gig_id: selectedGig,
        package_type: selectedPackage,
        requirements: orderRequirements,
        task_id: task.id
      };

      console.log('Placing order with data:', orderData);
      const response = await api.post('/orders/create/', orderData);
      console.log('Order response:', response.data);
      alert('Order placed successfully! The freelancer will be notified.');
      onTaskAssigned();
      onClose();
    } catch (error: any) {
      console.error('Order creation error:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          JSON.stringify(error.response?.data) || 
                          'Failed to place order';
      alert(errorMessage);
    } finally {
      setOrdering(false);
    }
  };

  const getPackagePrice = (gig: Gig) => {
    switch (selectedPackage) {
      case 'standard': return gig.standard_price || gig.basic_price;
      case 'premium': return gig.premium_price || gig.basic_price;
      default: return gig.basic_price;
    }
  };

  const getPackageDescription = (gig: Gig) => {
    switch (selectedPackage) {
      case 'standard': return gig.standard_description || gig.basic_description;
      case 'premium': return gig.premium_description || gig.basic_description;
      default: return gig.basic_description;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl flex flex-col" style={{height: '500px'}}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Task</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Select a gig and place an order for this task</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium text-[#0D9E86]">Budget: ${task.budget}</span>
              {task.skills_required && (
                <span className="text-gray-600 dark:text-gray-300">Skills: {task.skills_required}</span>
              )}
            </div>
          </div>

          {/* Gig Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Gig</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9E86] mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {gigs.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => setSelectedGig(gig.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedGig === gig.id
                        ? 'border-[#0D9E86] bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Image
                        src={gig.image || gig.image_url || '/default-gig.jpg'}
                        alt={gig.title}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{gig.title}</h4>
                          <div className="text-right">
                            <div className="font-semibold text-[#0D9E86]">From ${gig.basic_price}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ★ {gig.rating} ({gig.total_reviews} reviews)
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{gig.description}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          by {gig.freelancer.first_name} {gig.freelancer.last_name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Package Selection & Order Requirements */}
          {selectedGig && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Type
                </label>
                <div className="flex space-x-2">
                  {['basic', 'standard', 'premium'].map((pkg) => {
                    const gig = gigs.find(g => g.id === selectedGig);
                    const isAvailable = pkg === 'basic' || (pkg === 'standard' && gig?.standard_price) || (pkg === 'premium' && gig?.premium_price);
                    if (!isAvailable) return null;
                    return (
                      <button
                        key={pkg}
                        onClick={() => setSelectedPackage(pkg as any)}
                        className={`px-3 py-2 text-sm rounded-lg border ${
                          selectedPackage === pkg
                            ? 'bg-[#0D9E86] text-white border-[#0D9E86]'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#0D9E86]'
                        }`}
                      >
                        {pkg.charAt(0).toUpperCase() + pkg.slice(1)} - ${getPackagePrice(gig!)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Requirements
                </label>
                <textarea
                  value={orderRequirements}
                  onChange={(e) => setOrderRequirements(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your requirements for this task..."
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={placeOrder}
              disabled={!selectedGig || ordering}
              className="flex-1 px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {ordering ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}