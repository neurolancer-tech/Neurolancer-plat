'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import OnboardingModal from '@/components/OnboardingModal';
import OnboardingReminderModal from '@/components/OnboardingReminderModal';
import { getUser, getProfile, isAuthenticated } from '@/lib/auth';
import { User, UserProfile } from '@/types';
import api from '@/lib/api';
import SimpleChart from '@/components/SimpleChart';
import './dashboard.css';

interface DashboardStats {
  user_type: string;
  total_gigs?: number;
  active_orders: number;
  total_earnings?: number;
  total_spent?: number;
  pending_orders?: number;
  completed_orders: number;
  available_balance?: number;
  total_orders?: number;
  monthly_earnings?: number[];
  monthly_spending?: number[];
  monthly_orders: number[];
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  gradient: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [showOnboardingReminder, setShowOnboardingReminder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasIncompleteOnboarding, setHasIncompleteOnboarding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    setUser(getUser());
    setProfile(getProfile());
    loadDashboardStats();
    loadNotifications();
    loadCompletedCourses();
    checkOnboardingStatus();
    
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setNotifications(data.slice(0, 5));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadCompletedCourses = async () => {
    try {
      const response = await api.get('/learning/dashboard/');
      const learningData = response.data;
      setCompletedCoursesCount(learningData.completed_courses_count || 0);
    } catch (error) {
      console.error('Error loading completed courses:', error);
      setCompletedCoursesCount(0);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const response = await api.get('/onboarding/');
      const onboardingData = response.data;
      
      // Check if onboarding is incomplete (no meaningful data)
      const hasData = onboardingData && (
        onboardingData.company_name || 
        onboardingData.specialization || 
        onboardingData.goals
      );
      
      if (!hasData) {
        setHasIncompleteOnboarding(true);
        // Show reminder after a short delay
        setTimeout(() => setShowOnboardingReminder(true), 2000);
      }
    } catch (error) {
      // No onboarding data found, show reminder
      setHasIncompleteOnboarding(true);
      setTimeout(() => setShowOnboardingReminder(true), 2000);
    }
  };

  const handleCompleteOnboarding = () => {
    setShowOnboardingReminder(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasIncompleteOnboarding(false);
  };

  const handleDismissReminder = () => {
    setShowOnboardingReminder(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const earnings = stats?.monthly_earnings || [100, 150, 200, 180, 250, 300];
    const orders = stats?.monthly_orders || [5, 8, 12, 10, 15, 18];
    
    return {
      earnings: { data: earnings, labels: months },
      orders: { data: orders, labels: months },
      status: { 
        data: [stats?.completed_orders || 0, stats?.active_orders || 0, stats?.pending_orders || 0], 
        labels: ['Completed', 'Active', 'Pending'] 
      }
    };
  };

  const getQuickActions = (): QuickAction[] => isFreelancer ? [
    {
      title: 'Create New Gig',
      description: 'Showcase your skills',
      icon: '🚀',
      href: '/create-gig',
      color: 'from-blue-500 to-purple-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'Manage Orders',
      description: 'Track your progress',
      icon: '📋',
      href: '/orders',
      color: 'from-green-500 to-teal-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'View Analytics',
      description: 'Track performance',
      icon: '📊',
      href: '/analytics',
      color: 'from-purple-500 to-pink-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'Withdrawals',
      description: 'Manage earnings',
      icon: '💰',
      href: '/withdrawals',
      color: 'from-yellow-500 to-amber-600',
      gradient: 'bg-gradient-to-r'
    }
  ] : [
    {
      title: 'Post New Job',
      description: 'Find the right talent',
      icon: '💼',
      href: '/post-job',
      color: 'from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'Browse Gigs',
      description: 'Discover services',
      icon: '🔍',
      href: '/gigs',
      color: 'from-green-500 to-emerald-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'My Orders',
      description: 'Track your projects',
      icon: '📦',
      href: '/orders',
      color: 'from-yellow-500 to-orange-600',
      gradient: 'bg-gradient-to-r'
    },
    {
      title: 'Find Experts',
      description: 'Connect with talent',
      icon: '🎯',
      href: '/freelancers',
      color: 'from-purple-500 to-violet-600',
      gradient: 'bg-gradient-to-r'
    }
  ];

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

  const isFreelancer = profile?.user_type === 'freelancer' || profile?.user_type === 'both';
  const isClient = profile?.user_type === 'client' || profile?.user_type === 'both';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden mt-20" style={{zIndex: 1}}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-green-500 to-purple-500"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">{isFreelancer ? '💼' : '🎯'}</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold">
                    {getGreeting()}, {user?.first_name || user?.username}!
                  </h1>
                  <p className="text-xl opacity-90">Ready to achieve great things today?</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-white opacity-90">Current Time</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm text-white opacity-90">
                  {currentTime.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {isFreelancer && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">🚀</div>
                  <p className="text-blue-100 text-xs">Total Gigs</p>
                  <p className="text-2xl font-bold">{stats?.total_gigs || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient neon-glow">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">💰</div>
                  <p className="text-green-100 text-xs">Earnings</p>
                  <p className="text-2xl font-bold">${stats?.total_earnings || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">💳</div>
                  <p className="text-purple-100 text-xs">Balance</p>
                  <p className="text-2xl font-bold">${stats?.available_balance || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">🎓</div>
                  <p className="text-indigo-100 text-xs">Courses</p>
                  <p className="text-2xl font-bold">{completedCoursesCount}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">👍</div>
                  <p className="text-green-100 text-xs">Likes</p>
                  <p className="text-2xl font-bold">{profile?.likes_count || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">👎</div>
                  <p className="text-red-100 text-xs">Dislikes</p>
                  <p className="text-2xl font-bold">{profile?.dislikes_count || 0}</p>
                </div>
              </div>
            </>
          )}

          {isClient && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">💸</div>
                  <p className="text-white opacity-90 text-xs">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${stats?.total_spent || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">📋</div>
                  <p className="text-white opacity-90 text-xs">Orders</p>
                  <p className="text-2xl font-bold text-white">{stats?.total_orders || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">🎓</div>
                  <p className="text-indigo-100 text-xs">Courses</p>
                  <p className="text-2xl font-bold">{completedCoursesCount}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">👍</div>
                  <p className="text-green-100 text-xs">Likes</p>
                  <p className="text-2xl font-bold">{profile?.likes_count || 0}</p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
                <div className="relative">
                  <div className="text-2xl mb-1 animate-float">👎</div>
                  <p className="text-red-100 text-xs">Dislikes</p>
                  <p className="text-2xl font-bold">{profile?.dislikes_count || 0}</p>
                </div>
              </div>
            </>
          )}

          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
            <div className="relative">
              <div className="text-2xl mb-1 animate-float">🔥</div>
              <p className="text-white opacity-90 text-xs">Active</p>
              <p className="text-2xl font-bold text-white">{stats?.active_orders || 0}</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg card-hover animate-slide-in animate-gradient">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8 animate-float"></div>
            <div className="relative">
              <div className="text-2xl mb-1 animate-float">✅</div>
              <p className="text-white opacity-90 text-xs">Completed</p>
              <p className="text-2xl font-bold text-white">{stats?.completed_orders || 0}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getQuickActions().map((action, index) => (
              <Link key={index} href={action.href} className="group block">
                <div className={`${action.gradient} ${action.color} rounded-xl p-6 text-white shadow-lg card-hover animate-slide-in animate-gradient relative`} style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="text-4xl mb-4 animate-float" style={{animationDelay: `${index * 0.2}s`}}>{action.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium">
                    Get Started
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Earnings Chart */}
          {isFreelancer && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Earnings Trend</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Last 6 months</span>
                </div>
              </div>
              <div className="h-64">
                <SimpleChart 
                  data={getChartData().earnings.data} 
                  labels={getChartData().earnings.labels} 
                  type="line" 
                />
              </div>
            </div>
          )}

          {/* Orders Chart */}
          {isClient && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Spending Trend</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Last 6 months</span>
                </div>
              </div>
              <div className="h-64">
                <SimpleChart 
                  data={getChartData().orders.data} 
                  labels={getChartData().orders.labels} 
                  type="bar" 
                />
              </div>
            </div>
          )}

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 chart-container">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Order Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live Data</span>
              </div>
            </div>
            <div className="h-64">
              <SimpleChart 
                data={getChartData().status.data} 
                labels={getChartData().status.labels} 
                type="doughnut"
                colors={['#22C55E', '#F59E0B', '#EF4444']}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-100 rounded">
                <div className="text-xs text-green-700 font-medium">Completed</div>
                <div className="text-sm font-bold text-green-800">{stats?.completed_orders || 0}</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded">
                <div className="text-xs text-yellow-700 font-medium">Active</div>
                <div className="text-sm font-bold text-yellow-800">{stats?.active_orders || 0}</div>
              </div>
              <div className="p-2 bg-red-100 rounded">
                <div className="text-xs text-red-700 font-medium">Pending</div>
                <div className="text-sm font-bold text-red-800">{stats?.pending_orders || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Notifications</h3>
              <Link href="/notifications" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((notification: any, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-gray-500/5 to-gray-500/10 dark:from-gray-500/10 dark:to-gray-500/20 rounded-lg hover:from-teal-500/10 hover:to-teal-500/20 dark:hover:from-teal-500/20 dark:hover:to-teal-500/30 transition-all duration-300 notification-pulse animate-slide-in border border-gray-200/50 dark:border-gray-700/50" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="w-3 h-3 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full mt-2 flex-shrink-0 animate-pulse shadow-lg"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">{notification.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Just now</p>
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-5xl mb-4 animate-float">🔔</div>
                  <p className="text-lg font-medium mb-2">No recent notifications</p>
                  <p className="text-sm opacity-75">You&apos;re all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-lg card-hover animate-slide-in">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 dark:bg-green-500/30 rounded-full flex items-center justify-center animate-pulse-glow">
                    <span className="text-green-600 dark:text-green-400 font-bold animate-float">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Success Rate</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 gradient-text">98%</p>
                  <div className="w-full bg-green-300 dark:bg-green-600 rounded-full h-1 mt-1">
                    <div className="bg-green-700 dark:bg-green-400 h-1 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-lg card-hover animate-slide-in" style={{animationDelay: '0.1s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 dark:bg-blue-500/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold animate-float">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Response Time</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Average reply time</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">2h</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Excellent</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-lg card-hover animate-slide-in" style={{animationDelay: '0.2s'}}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 dark:bg-purple-500/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-bold animate-float">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rating</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Client satisfaction</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{profile?.rating || 0}/5</p>
                  <div className="flex space-x-1 mt-1">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={`text-xs ${star <= (profile?.rating || 0) ? 'text-yellow-500' : 'text-gray-400'}`}>⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </main>

      {/* Onboarding Reminder Modal */}
      <OnboardingReminderModal
        isOpen={showOnboardingReminder}
        userType={profile?.user_type === 'freelancer' ? 'freelancer' : 'client'}
        onComplete={handleCompleteOnboarding}
        onDismiss={handleDismissReminder}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        userType={profile?.user_type === 'freelancer' ? 'freelancer' : 'client'}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}