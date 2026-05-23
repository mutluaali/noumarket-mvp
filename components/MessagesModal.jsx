'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, MessageCircle, Clock3 } from 'lucide-react';
import { getMyConversations, subscribeToMyConversations } from '@/lib/messages';

function formatPrice(listing) {
  if (!listing?.price) return 'Görüşülür';
  return `${Number(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'XPF'}`;
}

export default function MessagesModal({ user, onClose, onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  async function load() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');
    try {
      const data = await getMyConversations(user.id);
      setConversations(data);
    } catch (error) {
      setErrorText(error.message || 'Mesajlar yüklenemedi. Supabase mesaj tablosu/RLS ayarını kontrol et.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToMyConversations({
      userId: user.id,
      onChange: () => load(),
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <MessageCircle size={16} /> Mesajlarım
            </div>
            <h2 className="mt-1 text-2xl font-black">Konuşmalar</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        {errorText && <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">{errorText}</p>}

        {loading && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">Konuşmalar yükleniyor...</p>}

        {!loading && conversations.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz konuşman yok.
          </p>
        )}

        <div className="space-y-3">
          {conversations.map((conversation) => {
            const listing = conversation.listings || {};
            const lastMessage = conversation.last_message;
            const unreadCount = conversation.unread_count || 0;

            return (
              <button
                key={conversation.id}
                onClick={() => onOpenConversation(conversation)}
                className="grid w-full gap-4 rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-200 transition hover:bg-white hover:shadow-sm sm:grid-cols-[72px_1fr_auto]"
              >
                <img
                  src={listing.image_url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80'}
                  alt={listing.title || 'İlan'}
                  className="h-16 w-16 rounded-2xl object-cover"
                />

                <div className="min-w-0">
                  <div className="truncate font-black">{listing.title || 'İlan mesajlaşması'}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{formatPrice(listing)}</div>
                  <div className="mt-2 line-clamp-1 text-sm text-slate-600">
                    {lastMessage?.body || 'Henüz mesaj yok.'}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 size={13} /> {new Date(conversation.updated_at || conversation.created_at).toLocaleString()}
                  </div>
                  {unreadCount > 0 && (
                    <div className="mt-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-emerald-600 px-2 text-xs font-black text-white">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
