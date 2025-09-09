'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  title: string;
  description: string;
  price: string;
  status: string;
  package_type: string;
  delivery_time: number;
  created_at: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  project?: {
    id: number;
    title: string;
  };
  task?: {
    id: number;
    title: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 30 seconds to get status updates
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (forceRefresh = false) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = forceRefresh ? `/orders/?t=${timestamp}` : '/orders/';
      const response = await api.get(url);
      const ordersData = response.data.results || response.data;
      console.log('Loaded orders:', ordersData.map((o: any) => ({ id: o.id, title: o.title, status: o.status })));
      setOrders(ordersData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to accept this order?')) return;

    try {
      await api.post(`/orders/${orderId}/accept/`);
      alert('Order accepted successfully!');
      loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Error accepting order. Please try again.');
    }
  };

  const declineOrder = async (orderId: number) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    if (!confirm('Are you sure you want to decline this order?')) return;

    try {
      await api.post(`/orders/${orderId}/update-status/`, {
        status: 'cancelled',
        message: reason ? `Order declined: ${reason}` : 'Order declined by freelancer'
      });
      alert('Order declined.');
      loadOrders();
    } catch (error) {
      console.error('Error declining order:', error);
      alert('Error declining order. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string, message?: string) => {
    try {
      await api.post(`/orders/${orderId}/update-status/`, {
        status,
        message: message || `Order status updated to ${status.replace('_', ' ')}`
      });
      alert('Order status updated successfully!');
      
      // Force refresh after status update
      setTimeout(() => {
        loadOrders(true);
      }, 1000); // Wait 1 second then refresh
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const handleProcessPayment = async (orderId: number) => {
    try {
      const response = await api.post(`/orders/${orderId}/process-payment/`);
      toast.success('Payment processed successfully!');
      loadOrders(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process payment');
    }
  };

  const handleRequestPayment = async (orderId: number) => {
    try {
      const response = await api.post(`/orders/${orderId}/request-payment/`);
      toast.success('Payment request sent to client!');
      loadOrders(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request payment');
    }
  };

  const checkOrderStatus = async (orderId: number) => {
    try {
      const response = await api.get(`/orders/${orderId}/`);
      console.log(`Order ${orderId} current status:`, response.data.status);
      alert(`Order ${orderId} status: ${response.data.status}`);
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    let message = '';
    if (newStatus === 'delivered') {
      message = prompt('Enter delivery message (optional):') || 'Work completed and delivered';
    } else if (newStatus === 'in_progress') {
      message = 'Work has started on your order';
    }
    updateOrderStatus(orderId, newStatus, message);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-cyan-100 text-cyan-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => 
    filter === '' || order.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {lastRefresh && (
                <p>Last updated: {lastRefresh.toLocaleTimeString()}</p>
              )}
              <button 
                onClick={() => {
                  console.log('Manual refresh clicked');
                  loadOrders(true); // Force refresh with timestamp
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1"
              >
                🔄 Force Refresh
              </button>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending Acceptance</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter ? `No orders with status "${filter}"` : 'You have no orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Order #{order.id}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{order.title}</p>
                    {order.task && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        📋 Task Assignment from Project: {order.project?.title || 'Project'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                    </span>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      ${order.price}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                    <p className="font-medium dark:text-white">
                      {order.client.first_name} {order.client.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Package</p>
                    <p className="font-medium dark:text-white">
                      {order.package_type.charAt(0).toUpperCase() + order.package_type.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Time</p>
                    <p className="font-medium dark:text-white">{order.delivery_time} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                    <p className="font-medium dark:text-white">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">{order.description}</p>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`/messages?order=${order.id}`, '_blank')}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      Message Client
                    </button>
                    <button
                      onClick={() => checkOrderStatus(order.id)}
                      className="px-3 py-2 border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 text-sm"
                    >
                      Check Status
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => acceptOrder(order.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => declineOrder(order.id)}
                          className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 text-sm"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    
                    {!['completed', 'cancelled'].includes(order.status) && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStatusChange(order.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Change Status</option>
                        {order.status === 'accepted' && (
                          <option value="in_progress">Start Work</option>
                        )}
                        {order.status === 'in_progress' && (
                          <option value="delivered">Mark as Delivered</option>
                        )}
                        {order.status === 'delivered' && (
                          <option value="in_progress">Request Revision</option>
                        )}
                      </select>
                    )}
                    
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          const message = prompt('Enter a progress update message for the client:');
                          if (message) {
                            updateOrderStatus(order.id, 'in_progress', message);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Update Progress
                      </button>
                    )}
                    
                    {order.status === 'delivered' && order.client.id === getUser()?.id && (
                      <button
                        onClick={() => window.location.href = `/checkout?orderId=${order.id}&amount=${order.price}&type=order_payment`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pay Freelancer
                      </button>
                    )}
                    
                    {order.status === 'completed' && (
                      <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-lg">
                        ✓ Paid
                      </span>
                    )}
                    
                    {order.status === 'completed' && order.client.id !== getUser()?.id && (
                      <button
                        onClick={() => handleRequestPayment(order.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Request Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}