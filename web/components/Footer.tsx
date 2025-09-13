'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isAuthenticated, getUser, getProfile } from '../lib/auth';
import { User, UserProfile } from '../types';



const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUserState(getUser());
      setProfileState(getProfile());
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://neurolancer.onrender.com/api/newsletter/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('Successfully subscribed to newsletter!');
        setEmail('');
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Font Loader */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Marko+One&display=swap');
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Marko One', serif !important;
        }
      `}</style>
      

      
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 mt-auto border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-block">
              <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg">
                <img
                  src="/assets/Neurolancer-logo/vector/default-monochrome-white.svg"
                  alt="Neurolancer"
                  width="140"
                  height="40"
                  className="h-8 w-auto"
                />
              </div>
            </Link>
            <p className="text-gray-300 text-lg leading-relaxed">
              The premier AI freelance marketplace connecting clients with top-tier artificial intelligence experts.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="group p-3 bg-gray-800 rounded-full hover:bg-teal-600 transition-all duration-300 transform hover:scale-110">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="group p-3 bg-gray-800 rounded-full hover:bg-teal-600 transition-all duration-300 transform hover:scale-110">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="group p-3 bg-gray-800 rounded-full hover:bg-teal-600 transition-all duration-300 transform hover:scale-110">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links (role-based) */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-teal-400">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>About Us
                </Link>
              </li>

              {/* Unauthenticated visitors */}
              {!user && (
                <>
                  <li>
                    <Link href="/gigs" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Browse Gigs
                    </Link>
                  </li>
                  <li>
                    <Link href="/jobs" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/freelancers" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Find Experts
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Learn AI
                    </Link>
                  </li>
                </>
              )}

              {/* Client links */}
              {user && profile?.user_type === 'client' && (
                <>
                  <li>
                    <Link href="/post-job" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Post Job
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-jobs" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>My Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Projects
                    </Link>
                  </li>
                  <li>
                    <Link href="/freelancers" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Find Experts
                    </Link>
                  </li>
                </>
              )}

              {/* Freelancer links */}
              {user && profile?.user_type === 'freelancer' && (
                <>
                  <li>
                    <Link href="/create-gig" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Create Gig
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-gigs" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>My Gigs
                    </Link>
                  </li>
                  <li>
                    <Link href="/my-proposals" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>My Proposals
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                      <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Learn AI
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-teal-400">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Contact Us</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>FAQ</Link></li>
              <li><Link href="/support" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Help Center</Link></li>
              <li><Link href="/feedback" className="text-gray-300 hover:text-teal-400 transition-colors duration-200 flex items-center group">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-3 group-hover:bg-teal-400"></span>Feedback</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-teal-400">Stay Connected</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">Get the latest AI trends and opportunities delivered to your inbox.</p>
            <div className="space-y-4">
              <form onSubmit={handleSubscribe} className="flex w-full">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-800 text-white rounded-l-lg border border-gray-700 focus:border-teal-500 focus:outline-none transition-colors text-sm"
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-r-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 font-semibold text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {isLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              <div className="flex space-x-3">
                <Link href="/terms" className="flex-1 text-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors duration-200 border border-gray-700 hover:border-gray-600">
                  Terms
                </Link>
                <Link href="/privacy" className="flex-1 text-center py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors duration-200 border border-gray-700 hover:border-gray-600">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} Neurolancer. All rights reserved. Empowering AI innovation worldwide.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Made with ❤️ by GuruCrafts agency</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
