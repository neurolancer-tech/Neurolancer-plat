'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Order } from '@/types';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/');
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'in_progress'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your orders and deliverables</p>
        </div>

        {/* Tabs */}
        <div className="card mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">You haven&apos;t placed any orders yet</p>
                <Link href="/gigs" className="btn-primary">
                  Browse Gigs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link 
                          href={`/orders/${order.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary"
                        >
                          {order.title}
                        </Link>
                        <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Order #{order.id}</span>
                          <span className="mx-2">•</span>
                          <span>Freelancer: {order.freelancer.first_name} {order.freelancer.last_name}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">${order.price}</div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">{order.description}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600 dark:text-gray-400">
                        <span>Package: {order.package_type}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Delivery: {order.delivery_time} days</span>
                        {order.delivered_at && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>Delivered: {new Date(order.delivered_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-center text-sm"
                        >
                          View Details
                        </Link>
                        <Link 
                          href={`/messages?user=${order.freelancer.id}`}
                          className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-center text-sm"
                        >
                          Message Freelancer
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}