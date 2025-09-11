'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getProfile } from '../lib/auth';

interface RoleGuardProps {
  children: React.ReactNode;
}

export default function RoleGuard({ children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip role check for public pages
    const publicPages = [
      '/',
      '/auth',
      '/role-selection',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
      '/faq'
    ];

    // Check if current path is public or starts with public path
    const isPublicPage = publicPages.some(page => 
      pathname === page || pathname.startsWith(page + '/')
    );

    if (isPublicPage) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      return; // Let the page handle auth redirect
    }

    // Check if user has selected a role
    const profile = getProfile();
    if (!profile?.user_type || profile.user_type === '') {
      console.log('User has no role selected, redirecting to role selection');
      router.push('/role-selection');
    }
  }, [pathname, router]);

  return <>{children}</>;
}