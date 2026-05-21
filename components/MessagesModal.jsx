'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { getMyConversations } from '@/lib/messages';

export default function MessagesModal({ user, onClose, onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await getMyConversations(user.id);
        setConversations(data);
      } catch (error) {
        alert(error.message || 'Mesajlar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }

    load();
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

        {loading && <p className="text-sm text-slate-500">Konuşmalar yükleniyor...</p>}

        {!loading && conversations.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz konuşman yok.
          </p>
        )}

        <div className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onOpenConversation(conversation)}
              className="w-full rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-200 hover:bg-white hover:shadow-sm"
            >
              <div className="font-black">
                {conversation.listings?.title || 'İlan mesajlaşması'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {new Date(conversation.updated_at || conversation.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
