'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';

interface Newsletter {
  id: number;
  title: string;
  subject: string;
  newsletter_type: string;
  status: string;
  created_by_name: string;
  total_recipients: number;
  total_opened: number;
  open_rate: number;
  created_at: string;
}

const NewsletterAdminPage: React.FC = () => {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNewsletter, setNewNewsletter] = useState({
    title: '',
    subject: '',
    content: '',
    newsletter_type: 'weekly_digest'
  });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const newslettersPerPage = 10;

  const templates = {
    weekly_digest: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Weekly Digest</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FBE1D5;">
    <!-- Header -->
    <div style="background: #0D9E86; padding: 40px 30px; text-align: center;">
        <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 50px; margin-bottom: 15px;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 300;">Weekly Digest</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Your AI Freelance Update</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 40px 30px;">
        <h2 style="color: #0D9E86; margin-top: 0; font-size: 24px;">This Week's Highlights</h2>
        
        <div style="color: #333; font-size: 16px; line-height: 1.7;">
            <p>Here's what happened this week in the AI freelance world. Stay updated with the latest opportunities and insights.</p>
            <p>• Featured gigs and projects</p>
            <p>• Success stories from our community</p>
            <p>• Platform updates and improvements</p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://neurolancer-5jxf.vercel.app" style="background: #0D9E86; color: #FFFFFF; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Explore Opportunities
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #FBE1D5; padding: 30px; text-align: center; color: #666; font-size: 14px;">
        <p style="margin: 0 0 15px 0;">You received this email because you subscribed to Neurolancer updates.</p>
        <p style="margin: 0;">
            <a href="#" style="color: #0D9E86; text-decoration: underline;">Unsubscribe</a> | 
            <a href="https://neurolancer-5jxf.vercel.app" style="color: #0D9E86; text-decoration: underline;">Visit Neurolancer</a>
        </p>
    </div>
</body>
</html>`,
    platform_updates: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Platform Updates</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FBE1D5;">
    <!-- Header with Side Logo -->
    <div style="background: #0D9E86; padding: 30px; display: flex; align-items: center; justify-content: space-between;">
        <div style="flex: 1;">
            <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 40px;">
        </div>
        <div style="flex: 2; text-align: right;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 600;">Platform Updates</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">What's New</p>
        </div>
    </div>
    
    <!-- Content Card -->
    <div style="background: white; margin: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 40px 30px;">
            <div style="border-left: 4px solid #0D9E86; padding-left: 20px; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0; font-size: 22px;">Latest Platform Improvements</h2>
            </div>
            
            <div style="color: #333; font-size: 16px; line-height: 1.8;">
                <p>We're constantly improving Neurolancer to provide you with the best AI freelance experience. Here are our latest updates and new features.</p>
            </div>
            
            <!-- Feature Box -->
            <div style="background: #FBE1D5; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #FBE1D5;">
                <h3 style="color: #0D9E86; margin: 0 0 15px 0; font-size: 18px;">🚀 New Features</h3>
                <p style="color: #333; margin: 0; font-size: 15px;">Enhanced search filters, improved messaging system, and better project management tools.</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="https://neurolancer-5jxf.vercel.app" style="background: #0D9E86; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 15px;">
                    Explore Updates →
                </a>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 30px 20px; color: #666; font-size: 13px;">
        <p style="margin: 0 0 10px 0;">© 2024 Neurolancer. All rights reserved.</p>
        <p style="margin: 0;">
            <a href="#" style="color: #0D9E86; text-decoration: underline;">Unsubscribe</a> | 
            <a href="https://neurolancer-5jxf.vercel.app" style="color: #0D9E86; text-decoration: underline;">Visit Website</a>
        </p>
    </div>
</body>
</html>`,
    featured_gigs: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Featured Gigs</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Minimal Header -->
    <div style="background: white; padding: 30px; border-bottom: 3px solid #0D9E86;">
        <div style="text-align: center;">
            <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 45px; filter: brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(162deg) brightness(118%) contrast(119%);">
        </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #333; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: -0.5px;">Featured Gigs</h1>
            <div style="width: 60px; height: 3px; background: #0D9E86; margin: 20px auto;"></div>
        </div>
        
        <div style="color: #333; font-size: 17px; line-height: 1.8; text-align: left;">
            <p>Discover the most popular AI gigs and opportunities this week. Connect with top talent and exciting projects.</p>
        </div>
        
        <!-- Stats/Numbers Section -->
        <div style="background: #FBE1D5; padding: 30px; border-radius: 8px; margin: 40px 0; text-align: center;">
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                <div style="margin: 10px;">
                    <div style="font-size: 28px; font-weight: bold; color: #0D9E86;">50+</div>
                    <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">New Gigs</div>
                </div>
                <div style="margin: 10px;">
                    <div style="font-size: 28px; font-weight: bold; color: #0D9E86;">200+</div>
                    <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Active Projects</div>
                </div>
                <div style="margin: 10px;">
                    <div style="font-size: 28px; font-weight: bold; color: #0D9E86;">98%</div>
                    <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Success Rate</div>
                </div>
            </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://neurolancer-5jxf.vercel.app/gigs" style="background: #0D9E86; color: #FFFFFF; padding: 16px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500; font-size: 16px; letter-spacing: 0.5px; text-transform: uppercase;">
                Browse Gigs
            </a>
        </div>
        
        <!-- Quote Section -->
        <div style="border-left: 4px solid #FBE1D5; padding-left: 20px; margin: 40px 0; font-style: italic; color: #666;">
            <p style="margin: 0; font-size: 18px; line-height: 1.6;">"Found my perfect AI project within hours of posting."</p>
            <p style="margin: 15px 0 0 0; font-size: 14px; font-weight: 600; color: #333;">— Satisfied Client</p>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #FBE1D5; padding: 30px; text-align: center; border-top: 1px solid #FBE1D5;">
        <div style="color: #666; font-size: 14px;">
            <p style="margin: 0 0 15px 0;">Neurolancer - Connecting AI Talent with Opportunities</p>
            <p style="margin: 0;">
                <a href="#" style="color: #0D9E86; text-decoration: underline;">Unsubscribe</a> | 
                <a href="https://neurolancer-5jxf.vercel.app" style="color: #0D9E86; text-decoration: underline;">neurolancer.com</a> | 
                <a href="mailto:support@neurolancer.com" style="color: #0D9E86; text-decoration: underline;">Contact</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    learning_spotlight: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neurolancer Learning Spotlight</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #FBE1D5;">
    <!-- Modern Header -->
    <div style="background: #0D9E86; padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        
        <img src="https://neurolancer-5jxf.vercel.app/assets/Neurolancer-logo/vector/default-monochrome-white.svg" alt="Neurolancer" style="height: 55px; margin-bottom: 20px; position: relative; z-index: 2;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 700; position: relative; z-index: 2;">Learning Spotlight</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; position: relative; z-index: 2; opacity: 0.9;">AI Skills & Knowledge</p>
    </div>
    
    <!-- Content with Cards -->
    <div style="padding: 30px 20px;">
        <!-- Main Content Card -->
        <div style="background: white; border-radius: 16px; padding: 35px; margin-bottom: 25px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.2);">
            <h2 style="color: #333; margin: 0 0 25px 0; font-size: 24px; font-weight: 600;">Featured Learning Content</h2>
            
            <div style="color: #333; font-size: 16px; line-height: 1.8;">
                <p>Enhance your AI skills with our curated learning resources. From beginner tutorials to advanced techniques, we've got you covered.</p>
            </div>
        </div>
        
        <!-- Feature Cards Grid -->
        <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                <div style="width: 40px; height: 40px; background: #0D9E86; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #FFFFFF; font-size: 20px;">📚</span>
                </div>
                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">New Courses</h3>
                <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">Explore our latest AI and machine learning courses designed for all skill levels.</p>
            </div>
            
            <div style="flex: 1; min-width: 250px; background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                <div style="width: 40px; height: 40px; background: #0D9E86; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #FFFFFF; font-size: 20px;">🏆</span>
                </div>
                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Certifications</h3>
                <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">Earn industry-recognized certifications to boost your AI career prospects.</p>
            </div>
        </div>
        
        <!-- CTA Card -->
        <div style="background: #0D9E86; border-radius: 16px; padding: 35px; text-align: center; color: #FFFFFF; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 600;">Start Learning Today</h3>
            <p style="margin: 0 0 25px 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Join thousands of learners advancing their AI skills</p>
            <a href="https://neurolancer-5jxf.vercel.app/courses" style="background: #FFFFFF; color: #0D9E86; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                Browse Courses
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <div style="background: white; padding: 30px; text-align: center; border-top: 1px solid #FBE1D5;">
        <div style="color: #666; font-size: 14px;">
            <p style="margin: 0 0 15px 0; font-weight: 500;">Stay connected with Neurolancer</p>
            <div style="margin: 15px 0;">
                <a href="#" style="display: inline-block; margin: 0 10px; color: #0D9E86; text-decoration: none;">Twitter</a>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #0D9E86; text-decoration: none;">LinkedIn</a>
                <a href="#" style="display: inline-block; margin: 0 10px; color: #0D9E86; text-decoration: none;">GitHub</a>
            </div>
            <p style="margin: 15px 0 0 0;">
                <a href="#" style="color: #0D9E86; text-decoration: underline;">Unsubscribe</a> | 
                <a href="https://neurolancer-5jxf.vercel.app" style="color: #0D9E86; text-decoration: underline;">Visit Neurolancer</a>
            </p>
        </div>
    </div>
</body>
</html>`
  };

  const loadTemplate = (templateKey: keyof typeof templates) => {
    setNewNewsletter({...newNewsletter, content: templates[templateKey]});
  };

  const loadTemplateForEdit = (templateKey: keyof typeof templates) => {
    if (editingNewsletter) {
      setEditingNewsletter({...editingNewsletter, content: templates[templateKey]});
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const user = getUser();
    if (user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }

    loadNewsletters();
  }, [router]);

  const loadNewsletters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/newsletter/');
      setNewsletters(response.data.results || response.data || []);
      
      // Also load subscriber count
      const subscribersResponse = await api.get('/admin/newsletter/subscribers/');
      const count = subscribersResponse.data.count || subscribersResponse.data.length || 0;
      setSubscriberCount(count);
      
      // Update newsletters with actual subscriber count
      setNewsletters(prev => prev.map(newsletter => ({
        ...newsletter,
        total_recipients: count
      })));
    } catch (error) {
      console.error('Error loading newsletters:', error);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewsletter = async () => {
    try {
      await api.post('/admin/newsletter/', newNewsletter);
      setShowCreateModal(false);
      setNewNewsletter({ title: '', subject: '', content: '', newsletter_type: 'weekly_digest' });
      loadNewsletters();
    } catch (error) {
      console.error('Error creating newsletter:', error);
    }
  };

  const editNewsletter = async () => {
    if (!editingNewsletter) return;
    try {
      await api.put(`/admin/newsletter/${editingNewsletter.id}/`, editingNewsletter);
      setShowEditModal(false);
      setEditingNewsletter(null);
      loadNewsletters();
    } catch (error) {
      console.error('Error updating newsletter:', error);
    }
  };

  const deleteNewsletter = async (newsletterId: number) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    try {
      await api.delete(`/admin/newsletter/${newsletterId}/`);
      loadNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const openEditModal = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setShowEditModal(true);
  };

  const sendNewsletter = async (newsletterId: number) => {
    if (!confirm('Are you sure you want to send this newsletter?')) return;
    
    try {
      const response = await api.post(`/admin/newsletter/${newsletterId}/send/`);
      alert(`Newsletter sent to ${response.data.sent_count} subscribers!`);
      loadNewsletters();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || 'Failed to send newsletter'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Newsletter Management</h1>
          <p className="opacity-90">Create and send newsletters to {subscriberCount} subscribers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{subscriberCount}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Subscribers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newsletters.filter(n => n.status === 'sent').length}</p>
                <p className="text-gray-600 dark:text-gray-400">Sent Newsletters</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newsletters.filter(n => n.status === 'draft').length}</p>
                <p className="text-gray-600 dark:text-gray-400">Draft Newsletters</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Newsletters</h2>
              <p className="text-gray-600 dark:text-gray-400">{newsletters.length} newsletters</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0D9E86] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Newsletter</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Newsletter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Open Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {newsletters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No newsletters found. Create your first newsletter to get started.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalPages = Math.ceil(newsletters.length / newslettersPerPage);
                      const startIndex = (currentPage - 1) * newslettersPerPage;
                      const paginatedNewsletters = newsletters.slice(startIndex, startIndex + newslettersPerPage);
                      return paginatedNewsletters.map((newsletter) => (
                        <tr key={newsletter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{newsletter.title}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{newsletter.subject}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(newsletter.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {newsletter.total_recipients || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {newsletter.open_rate ? newsletter.open_rate.toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button 
                                onClick={() => openEditModal(newsletter)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit Newsletter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {newsletter.status === 'draft' && (
                                <button 
                                  onClick={() => sendNewsletter(newsletter.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Send Newsletter"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNewsletter(newsletter.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete Newsletter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              {newsletter.status === 'sent' && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  ✓ Sent
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={Math.ceil(newsletters.length / newslettersPerPage)} onPageChange={setCurrentPage} />
        </div>

        {/* Create Newsletter Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Newsletter</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newNewsletter.title}
                    onChange={(e) => setNewNewsletter({...newNewsletter, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Newsletter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newNewsletter.subject}
                    onChange={(e) => setNewNewsletter({...newNewsletter, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Email subject line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Templates</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => loadTemplate('weekly_digest')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Weekly Digest</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Weekly highlights & updates</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplate('platform_updates')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Platform Updates</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">New features & improvements</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplate('featured_gigs')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Featured Gigs</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Top gigs & opportunities</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplate('learning_spotlight')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Learning Spotlight</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Courses & certifications</div>
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea
                    value={newNewsletter.content}
                    onChange={(e) => setNewNewsletter({...newNewsletter, content: e.target.value})}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Newsletter content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={newNewsletter.newsletter_type}
                    onChange={(e) => setNewNewsletter({...newNewsletter, newsletter_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="weekly_digest">Weekly Digest</option>
                    <option value="platform_updates">Platform Updates</option>
                    <option value="featured_gigs">Featured Gigs</option>
                    <option value="learning_spotlight">Learning Spotlight</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewsletter}
                  className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90"
                >
                  Create Newsletter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Newsletter Modal */}
        {showEditModal && editingNewsletter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Newsletter</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingNewsletter.title}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={editingNewsletter.subject}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Templates</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => loadTemplateForEdit('weekly_digest')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Weekly Digest</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Weekly highlights & updates</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplateForEdit('platform_updates')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Platform Updates</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">New features & improvements</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplateForEdit('featured_gigs')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Featured Gigs</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Top gigs & opportunities</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplateForEdit('learning_spotlight')}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#0D9E86] hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Learning Spotlight</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Courses & certifications</div>
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea
                    value={editingNewsletter.content || ''}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, content: e.target.value})}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Newsletter content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={editingNewsletter.newsletter_type}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, newsletter_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="weekly_digest">Weekly Digest</option>
                    <option value="platform_updates">Platform Updates</option>
                    <option value="featured_gigs">Featured Gigs</option>
                    <option value="learning_spotlight">Learning Spotlight</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={editNewsletter}
                  className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90"
                >
                  Update Newsletter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NewsletterAdminPage;