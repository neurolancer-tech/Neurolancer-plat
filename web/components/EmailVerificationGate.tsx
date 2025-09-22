'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, getProfile, getUser, setProfile } from '@/lib/auth';
import api from '@/lib/api';

// Redirects any authenticated but unverified user to the verify-email page (except Google users)
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
      '/role-selection', // Add role-selection to bypass
    ];

    // Skip if not authenticated
    if (!isAuthenticated()) return;

    // Skip for bypass routes
    if (pathname && bypass.some((p) => pathname === p || pathname.startsWith(p + '/'))) return;

    const localProfile = getProfile();
    const localUser = getUser();

    const isGoogleLocal = !!(
      (localProfile as any)?.auth_provider === 'google' ||
      (localProfile as any)?.avatar_type === 'google' ||
      (localProfile as any)?.google_photo_url ||
      (localProfile as any)?.google_id ||
      (localProfile as any)?.user?.auth_provider === 'google' ||
      (localUser as any)?.auth_provider === 'google' ||
      (localUser as any)?.google_photo_url
    );

    // Google users should NEVER be redirected to verify-email
    if (isGoogleLocal) return;

    const isVerifiedLocal = !!(
      (localProfile as any)?.email_verified === true ||
      (localProfile as any)?.is_verified === true ||
      (localProfile as any)?.verified === true ||
      (localProfile as any)?.user?.is_verified === true
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
          const rprof = (res.data as any).profile || res.data; // support both shapes
          const ruser = (res.data as any).user || null;

          // Persist only the actual profile object in our profile cookie
          if (rprof) {
            try { setProfile(rprof); } catch {}
          }

          const isGoogleRemote = !!(
            rprof?.auth_provider === 'google' ||
            rprof?.avatar_type === 'google' ||
            rprof?.google_photo_url ||
            rprof?.google_id ||
            ruser?.auth_provider === 'google'
          );
          
          // Google users should never be redirected to verify-email
          if (isGoogleRemote) return;
          
          const verified = !!(
            rprof?.email_verified === true ||
            rprof?.is_verified === true ||
            rprof?.verified === true ||
            ruser?.is_verified === true
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

