'use client';

import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile, isUserSuspended } from '@/lib/profiles';
import { SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';
import AuthModal from '@/components/AuthModal';
import ReportListingModal from '@/components/ReportListingModal';

export default function ListingPermalinkReportAction({ listingId, listingTitle, sellerId }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hint, setHint] = useState('');

  const listing = { id: listingId, title: listingTitle, user_id: sellerId };

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId) {
      if (!userId) {
        if (mounted) setProfile(null);
        return;
      }
      try {
        const nextProfile = await getCurrentProfile(userId);
        if (mounted) setProfile(nextProfile);
      } catch {
        if (mounted) setProfile(null);
      }
    }

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);
      await loadProfile(sessionUser?.id);
    }

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      loadProfile(sessionUser?.id);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleAuthenticated(nextUser) {
    setUser(nextUser || null);
    if (!nextUser?.id) return;

    try {
      const nextProfile = await getCurrentProfile(nextUser.id);
      setProfile(nextProfile);
      if (isUserSuspended(nextProfile)) {
        setHint(SUSPENSION_BLOCK_MESSAGE);
        return;
      }
      setHint('');
      setShowReport(true);
    } catch {
      setHint('Şikayet gönderilemedi.');
    }
  }

  function handleReportClick() {
    setHint('');
    if (!user?.id) {
      setHint('Bu ilanı şikayet etmek için giriş yapmalısınız.');
      setShowAuth(true);
      return;
    }
    if (isUserSuspended(profile)) {
      setHint(SUSPENSION_BLOCK_MESSAGE);
      return;
    }
    setShowReport(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleReportClick}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50/80 px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-100"
      >
        <Flag size={16} /> İlanı şikayet et
      </button>
      {hint ? (
        <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900 ring-1 ring-amber-100">
          {hint}
        </p>
      ) : null}

      {showAuth ? (
        <AuthModal onClose={() => setShowAuth(false)} onAuthenticated={handleAuthenticated} />
      ) : null}

      {showReport && user?.id ? (
        <ReportListingModal user={user} listing={listing} onClose={() => setShowReport(false)} />
      ) : null}
    </>
  );
}
