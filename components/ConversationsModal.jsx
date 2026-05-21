'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { getMyConversations } from '@/lib/messages';
import ChatModal from './ChatModal';

export default function ConversationsModal({ user, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadConversations() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMyConversations(user.id);
      setConversations(data);
    } catch (error) {
      alert(error.message || 'Konuşmalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-4xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Mesajlarım</h2>
            <p className="mt-1 text-sm text-slate-500">İlanlar için alıcı-satıcı konuşmaları.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Konuşmalar yükleniyor...</p>}
        {!loading && conversations.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz mesajlaşma yok.
          </div>
        )}

        <div className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelected(conversation)}
              className="flex w-full items-center justify-between rounded-3xl bg-slate-50 p-4 text-left ring-1 ring-slate-200 hover:bg-slate-100"
            >
              <div>
                <div className="flex items-center gap-2 font-black">
                  <MessageCircle size={16} /> {conversation.listings?.title || 'İlan konuşması'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {new Date(conversation.updated_at).toLocaleString()}
                </div>
              </div>
              <div className="text-sm font-bold text-slate-500">Aç</div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <ChatModal
          user={user}
          conversation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}