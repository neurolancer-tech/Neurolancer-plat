'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Avatar from './Avatar';
import EmailVerificationGate from './EmailVerificationGate';
import { User, UserProfile } from '../types';
import { getUser, getProfile, logout, isAuthenticated } from '../lib/auth';
import NotificationCenter from './NotificationCenter';
import { useTheme } from '../contexts/ThemeContext';

// Load Marko One font
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Marko+One&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  
  // Apply font to headings, buttons, navigation, mobile sidebar, and admin navigation
  const style = document.createElement('style');
  style.textContent = `
    h1, h2, h3, h4, h5, h6,
    button, .btn, .btn-primary, .btn-secondary,
    input[type="button"], input[type="submit"],
    nav a, nav button, nav span,
    .fixed.inset-y-0 a, .fixed.inset-y-0 button, .fixed.inset-y-0 span,
    .fixed.inset-y-0 h3, .fixed.inset-y-0 p,
    .admin-sidebar a, .admin-sidebar button, .admin-sidebar span,
    .admin-nav a, .admin-nav button, .admin-nav span {
      font-family: 'Marko One', cursive !important;
    }
  `;
  document.head.appendChild(style);
}

export default function Navigation() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
      setProfile(getProfile());
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <EmailVerificationGate />
      <nav className="fixed top-0 left-0 right-0 shadow-sm border-b border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200" style={{backgroundColor: '#0D9E86'}}>
        <div className="px-2 sm:px-3 lg:px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              {/* Mobile hamburger button */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 rounded-md text-white hover:text-gray-200 hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <Link href="/" className="flex items-center">
                <Image
                  src="/assets/Neurolancer-logo/vector/default-monochrome-white.svg"
                  alt="Neurolancer"
                  width={120}
                  height={32}
                  priority
                  className="h-5 w-auto sm:h-8"
                  style={{ width: 'auto' }}
                />
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex space-x-6">
              <Link href="/gigs" className="text-white hover:text-gray-200 transition-colors">
                Gigs
              </Link>
              <Link href="/jobs" className="text-white hover:text-gray-200 transition-colors">
                Jobs
              </Link>
              <Link href="/freelancers" className="text-white hover:text-gray-200 transition-colors">
                Freelancers
              </Link>
{(!user || profile?.user_type === 'freelancer') && (
              <Link href="/courses" className="text-white hover:text-gray-200 transition-colors">
                Learn AI
              </Link>
            )}
              {/* Admin Dashboard Button */}
              {user?.email === 'kbrian1237@gmail.com' && (
                <Link href="/admin" className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-red-500 hover:shadow-lg transition-all duration-300 text-sm font-medium">
                  Admin
                </Link>
              )}
              
              {/* Role-based action buttons */}
              {user && profile?.user_type === 'client' && (
                <Link href="/post-job" className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm">
                  Post Job
                </Link>
              )}
{user && profile?.user_type === 'freelancer' && (
                <Link href="/create-gig" className="bg-purple-600 dark:bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors text-sm">
                  Create Gig
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200"
                aria-label="Toggle theme"
              >
                <div className="relative w-5 h-5">
                  {mounted ? (
                    <>
                      <svg
                        className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <svg
                        className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Notifications */}
              {user && <NotificationCenter />}

              {/* Auth Buttons or User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 text-white hover:text-gray-200 transition-colors"
                  >
                    <Avatar
                      src={profile?.profile_picture}
                      avatarType={profile?.avatar_type as 'upload' | 'avatar' | 'google' | undefined}
                      selectedAvatar={profile?.selected_avatar}
                      googlePhotoUrl={profile?.google_photo_url}
                      size="sm"
                      alt="Profile"
                    />
                    <span className="hidden sm:block">{user.first_name || user.username}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-40">
                      <Link href="/dashboard" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Profile
                      </Link>
{profile?.user_type === 'client' && (
                        <>
                          <Link href="/my-jobs" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            My Jobs
                          </Link>
                          <Link href="/post-job" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Post Job
                          </Link>
                        </>
                      )}
{profile?.user_type === 'freelancer' && (
                        <>
                          <Link href="/my-gigs" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            My Gigs
                          </Link>
                          <Link href="/create-gig" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Create Gig
                          </Link>
                          <Link href="/my-proposals" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            My Proposals
                          </Link>
                          <Link href="/my-courses" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            My Courses
                          </Link>
                          <Link href="/create-course" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Create Course
                          </Link>
                        </>
                      )}
                      <Link href="/orders" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Orders
                      </Link>
{profile?.user_type === 'client' && (
                        <Link href="/projects" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Projects
                        </Link>
                      )}
                      <Link href="/messages" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Messages
                      </Link>
                      <Link href="/notifications" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Notifications
                      </Link>
                      {profile?.user_type === 'freelancer' && (
                        <Link href="/skill-assessments" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Skill Tests
                        </Link>
                      )}
                      {user?.email === 'kbrian1237@gmail.com' && (
                        <Link href="/admin" className="block px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                          Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Link href="/auth?tab=login" className="flex items-center px-3 py-2 text-white hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors text-sm sm:text-base">
                    Login
                  </Link>
                  <Link href="/auth?tab=signup" className="flex items-center bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:from-pink-600 hover:to-purple-500 hover:shadow-lg transition-all duration-300 text-sm sm:text-base font-medium">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Navigation spacer - same height as nav but scrolls with page */}
      <div className="h-20 w-full"></div>

      {/* Mobile Sidebar */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform z-[70]">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <Link href="/" onClick={() => setShowMobileMenu(false)}>
                  <div className="px-3 py-2 rounded-lg" style={{backgroundColor: '#0D9E86'}}>
                    <Image
                      src="/assets/Neurolancer-logo/vector/default-monochrome-white.svg"
                      alt="Neurolancer"
                      width={120}
                      height={32}
                      className="h-6"
                      style={{ width: 'auto' }}
                    />
                  </div>
                </Link>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-[#0D9E86] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={profile?.profile_picture}
                      avatarType={profile?.avatar_type as 'upload' | 'avatar' | 'google' | undefined}
                      selectedAvatar={profile?.selected_avatar}
                      googlePhotoUrl={profile?.google_photo_url}
                      size="md"
                      alt="Profile"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.first_name || user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-4">
                  {/* Main Navigation */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Browse</h3>
                    <Link href="/gigs" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                      </svg>
                      Gigs
                    </Link>
                    <Link href="/jobs" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                      </svg>
                      Jobs
                    </Link>
                    <Link href="/freelancers" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Freelancers
                    </Link>
{(!user || profile?.user_type === 'freelancer') && (
                      <Link href="/courses" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Learn AI
                      </Link>
                    )}

                  </div>

                  {/* User-specific links */}
                  {user && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">My Account</h3>
                      <Link href="/dashboard" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Dashboard
                      </Link>
                      <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link href="/messages" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Messages
                      </Link>
                      <Link href="/notifications" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM16 3h5v5h-5V3zM4 3h6v6H4V3z" />
                        </svg>
                        Notifications
                      </Link>
                      {profile?.user_type === 'freelancer' && (
                        <Link href="/skill-assessments" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Skill Tests
                        </Link>
                      )}
                      {user?.email === 'kbrian1237@gmail.com' && (
                        <Link href="/admin" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors font-medium">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Role-specific links */}
                  {user && (profile?.user_type === 'client' || profile?.user_type === 'both') && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Client</h3>
                      <Link href="/my-jobs" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                        </svg>
                        My Jobs
                      </Link>
                      <Link href="/post-job" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Post Job
                      </Link>
                    </div>
                  )}

                  {user && (profile?.user_type === 'freelancer' || profile?.user_type === 'both') && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Freelancer</h3>
                      <Link href="/my-gigs" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                        </svg>
                        My Gigs
                      </Link>
                      <Link href="/create-gig" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Gig
                      </Link>
                      <Link href="/my-proposals" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        My Proposals
                      </Link>
                      <Link href="/my-courses" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        My Courses
                      </Link>
                      <Link href="/create-course" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Course
                      </Link>
                    </div>
                  )}

                  {/* Shared sections */}
                  {user && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Work</h3>
                      <Link href="/orders" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Orders
                      </Link>
                      {(profile?.user_type === 'client' || profile?.user_type === 'both') && (
                        <Link href="/projects" onClick={() => setShowMobileMenu(false)} className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0D9E86] rounded-md transition-colors">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Projects
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-center w-full px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Login
                    </Link>
                    <Link href="/auth?tab=signup" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-md hover:from-pink-600 hover:to-purple-500 hover:shadow-lg transition-all duration-300 font-medium">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}