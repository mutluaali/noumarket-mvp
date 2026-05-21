'use client';

import { useEffect, useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { getMessages, sendMessage } from '@/lib/messages';

export default function ChatModal({ user, conversation, onClose }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    if (!conversation?.id) return;
    setLoading(true);
    try {
      const data = await getMessages(conversation.id);
      setMessages(data);
    } catch (error) {
      alert(error.message || 'Mesajlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      const sent = await sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        body: body.trim(),
      });
      setMessages((current) => [...current, sent]);
      setBody('');
    } catch (error) {
      alert(error.message || 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  }

  const listingTitle = conversation?.listings?.title || conversation?.listing_title || 'İlan mesajlaşması';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[92vh] max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <MessageCircle size={16} /> Mesajlaşma
            </div>
            <h2 className="mt-1 text-xl font-black">{listingTitle}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-5">
          {loading && <p className="text-sm text-slate-500">Mesajlar yükleniyor...</p>}
          {!loading && messages.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Henüz mesaj yok. İlk mesajı sen gönder.
            </p>
          )}

          {messages.map((message) => {
            const mine = message.sender_id === user.id;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  mine ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
                }`}>
                  <div>{message.body}</div>
                  <div className={`mt-1 text-[11px] ${mine ? 'text-slate-300' : 'text-slate-400'}`}>
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-4">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mesaj yaz..."
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />
          <button
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            <Send size={16} /> Gönder
          </button>
        </form>
      </div>
    </div>
  );
}
