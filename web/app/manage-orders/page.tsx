'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

interface Order {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  package_type: string;
  created_at: string;
  delivery_time: number;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  gig: {
    id: number;
    title: string;
  };
}

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders/freelancer/');
      const ordersData = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      let filteredOrders = ordersData;
      if (filter !== 'all') {
        filteredOrders = ordersData.filter((order: Order) => order.status === filter);
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/update-status/`, { status });
      loadOrders();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'basic': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'standard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Accept', action: 'accepted', color: 'bg-green-600 hover:bg-green-700' },
          { label: 'Decline', action: 'cancelled', color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'accepted':
        return [
          { label: 'Start Work', action: 'in_progress', color: 'bg-purple-600 hover:bg-purple-700' }
        ];
      case 'in_progress':
        return [
          { label: 'Deliver', action: 'delivered', color: 'bg-orange-600 hover:bg-orange-700' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Manage Orders</h1>
              <p className="text-gray-600 dark:text-gray-400">Track and manage your client orders</p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid gap-6">
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all' ? 'You have no orders yet' : `No ${filter} orders found`}
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{order.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPackageColor(order.package_type)}`}>
                          {order.package_type}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{order.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Client:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.client.first_name} {order.client.last_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Price:</span>
                          <p className="font-medium text-[#0D9E86]">${order.price}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Delivery:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{order.delivery_time} days</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        View Details
                      </button>
                      
                      {getAvailableActions(order.status).map((action) => (
                        <button
                          key={action.action}
                          onClick={() => updateOrderStatus(order.id, action.action)}
                          className={`px-4 py-2 text-white rounded-lg text-sm ${action.color}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{selectedOrder.title}</h4>
                <p className="text-gray-600 dark:text-gray-300">{selectedOrder.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {selectedOrder.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Package</span>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedOrder.package_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                  <p className="font-medium text-[#0D9E86]">${selectedOrder.price}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Delivery Time</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.delivery_time} days</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Client</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedOrder.client.first_name} {selectedOrder.client.last_name} (@{selectedOrder.client.username})
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4">
                {getAvailableActions(selectedOrder.status).map((action) => (
                  <button
                    key={action.action}
                    onClick={() => updateOrderStatus(selectedOrder.id, action.action)}
                    className={`px-4 py-2 text-white rounded-lg text-sm ${action.color}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}