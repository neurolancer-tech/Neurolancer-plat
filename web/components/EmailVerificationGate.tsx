'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, getProfile, setProfile } from '@/lib/auth';
import api from '@/lib/api';

// Redirects any authenticated but unverified user to the verify-email page
export default function EmailVerificationGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Paths that should NOT be intercepted by the gate
    const bypass = [
      '/auth',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/newsletter',
      '/payment',
      '/_next',
      '/api',
    ];

    // Skip if not authenticated
    if (!isAuthenticated()) return;

    // Skip for bypass routes
    if (pathname && bypass.some((p) => pathname === p || pathname.startsWith(p + '/'))) return;

    const localProfile = getProfile();

    const isGoogleLocal = !!(
      (localProfile as any)?.auth_provider === 'google' ||
      (localProfile as any)?.avatar_type === 'google' ||
      (localProfile as any)?.google_photo_url ||
      (localProfile as any)?.user?.auth_provider === 'google'
    );

    const isVerifiedLocal = !!(
      (localProfile as any)?.email_verified ||
      (localProfile as any)?.is_verified ||
      (localProfile as any)?.verified ||
      (localProfile as any)?.user?.is_verified ||
      isGoogleLocal
    );

    const redirectToVerify = () => {
      if (pathname !== '/verify-email') {
        router.push('/verify-email');
      }
    };

    if (isVerifiedLocal) return;

    // If we can't tell from local cookie, confirm with backend
    const checkRemote = async () => {
      try {
        const res = await api.get('/auth/profile/');
        if (res?.data) {
          try { setProfile(res.data); } catch {}
          const isGoogleRemote = !!(
            res.data?.auth_provider === 'google' ||
            res.data?.avatar_type === 'google' ||
            res.data?.google_photo_url ||
            res.data?.user?.auth_provider === 'google'
          );
          const verified = !!(
            res.data?.email_verified ||
            res.data?.is_verified ||
            res.data?.verified ||
            res.data?.user?.is_verified ||
            isGoogleRemote
          );
          if (!verified) redirectToVerify();
        } else {
          redirectToVerify();
        }
      } catch {
        // On error, be conservative and redirect
        redirectToVerify();
      }
    };

    checkRemote();
  }, [pathname, router]);

  return null;
}

