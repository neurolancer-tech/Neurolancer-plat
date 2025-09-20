'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import api from '../../../lib/api';
import { getUser } from '../../../lib/auth';

interface Order {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  delivery_time: number;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  freelancer: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  gig?: {
    id: number;
    title: string;
  };
  task?: {
    id: number;
    title: string;
    project: {
      id: number;
      title: string;
    };
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const user = getUser();

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}/`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${order?.id}/accept/`);
      await loadOrder();
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string, message = '') => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${order?.id}/update-status/`, { status, message });
      // If delivered, remind client to release payment
      if (status === 'delivered' && order) {
        try {
          await createNotification(
            order.client.id,
            'Action Needed: Release Payment',
            `Work for order #${order.id} has been delivered. Please review and release payment to the freelancer.`,
            `/orders/${order.id}`
          );
        } catch {}
      }
      await loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const createNotification = async (userId: number, title: string, message: string, actionUrl: string) => {
    try {
      await api.post('/notifications/create/', {
        user: userId,
        title,
        message,
        notification_type: 'payment',
        action_url: actionUrl
      });
    } catch (e) {
      console.warn('Failed to create notification', e);
    }
  };

  const releaseEscrow = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await api.post('/payments/release-escrow/', { order_id: order.id });
      // Notify freelancer
      const freelancerId = order.freelancer?.id;
      if (freelancerId) {
        await createNotification(
          freelancerId,
          'Payment Released',
          `Payment for order #${order.id} has been released to your available balance (after escrow).`,
          `/orders/${order.id}`
        );
      }
      await loadOrder();
    } catch (e: any) {
      console.error('Release escrow failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  const canTakeAction = user && order && user.id === order.freelancer.id;
  const showAcceptDecline = canTakeAction && order.status === 'pending';
  const showStatusUpdate = canTakeAction && ['accepted', 'in_progress'].includes(order.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86] mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Order Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/orders')}
              className="bg-[#0D9E86] text-white px-6 py-2 rounded-lg hover:opacity-90"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order Details</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{order.title}</h2>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0D9E86]">${order.price}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order #{order.id}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Client</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0D9E86] rounded-full flex items-center justify-center text-white font-medium">
                  {order.client.first_name?.[0] || order.client.username[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.client.first_name} {order.client.last_name} 
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{order.client.username}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Freelancer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0D9E86] rounded-full flex items-center justify-center text-white font-medium">
                  {order.freelancer.first_name?.[0] || order.freelancer.username[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.freelancer.first_name} {order.freelancer.last_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{order.freelancer.username}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Time</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{order.delivery_time} days</p>
            </div>
            {order.gig && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Related Gig</p>
                <p className="font-medium text-[#0D9E86]">{order.gig.title}</p>
              </div>
            )}
            {order.task && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Project Task</p>
                <p className="font-medium text-[#0D9E86]">{order.task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">from {order.task.project.title}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showAcceptDecline && (
            <div className="flex space-x-4 pt-6 border-t mt-6">
              <button
                onClick={handleAcceptOrder}
                disabled={actionLoading}
                className="bg-[#0D9E86] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Accept Order'}
              </button>
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={actionLoading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {showStatusUpdate && (
            <div className="flex space-x-4 pt-6 border-t mt-6">
              {order.status === 'accepted' && (
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={actionLoading}
                  className="bg-[#0D9E86] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Start Work
                </button>
              )}
              {order.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateStatus('delivered')}
                  disabled={actionLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          )}

          {/* Release Payment for client when delivered */}
          {user && order.client.id === user.id && order.status === 'delivered' && (
            <div className="flex pt-6 border-t mt-6">
              <button
                onClick={releaseEscrow}
                disabled={actionLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? 'Releasing...' : 'Release Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}