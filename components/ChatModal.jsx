'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, MessageCircle, CheckCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { getMessages, markConversationRead, sendMessage, subscribeToConversation } from '@/lib/messages';
import { isSuspensionError, SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';
import { supabase } from '@/lib/supabase';

function formatMessageTime(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return '';
  }
}

function formatPrice(listing) {
  if (!listing) return null;
  const amount = Number(listing.price || 0);
  if (!amount) return null;
  return `${amount.toLocaleString('tr-TR')} ${listing.currency || 'XPF'}`;
}

export default function ChatModal({ user, conversation, onClose }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendNotice, setSendNotice] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const listing = conversation?.listings || null;
  const listingTitle = listing?.title || conversation?.listing_title || 'İlan mesajlaşması';
  const listingPrice = formatPrice(listing);
  const listingImage = listing?.image_url || null;

  const roleHint = useMemo(() => {
    if (!user?.id || !conversation) return 'İlan bağlamında mesajlaşma';
    if (user.id === conversation.buyer_id) return 'Satıcı ile konuşuyorsun';
    if (user.id === conversation.seller_id) return 'Alıcı ile konuşuyorsun';
    return 'İlan bağlamında mesajlaşma';
  }, [conversation, user?.id]);

  async function loadMessages() {
    if (!conversation?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const data = await getMessages(conversation.id);
      setMessages(data);
      if (user?.id) await markConversationRead({ conversationId: conversation.id, userId: user.id });
    } catch (error) {
      setLoadError(error.message || 'Mesajlar yüklenemedi.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading]);

  useEffect(() => {
    if (!sendNotice) return undefined;
    const timer = setTimeout(() => setSendNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [sendNotice]);

  useEffect(() => {
    if (!conversation?.id) return;

    const channel = subscribeToConversation({
      conversationId: conversation.id,
      onMessage: async (message) => {
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });

        if (user?.id && message.sender_id !== user.id) {
          try {
            await markConversationRead({ conversationId: conversation.id, userId: user.id });
          } catch (error) {
            console.warn('mark read warning:', error);
          }
        }
      },
      onChange: (message) => {
        setMessages((current) => current.map((item) => (item.id === message.id ? message : item)));
      },
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversation?.id, user?.id]);

  async function handleSend(event) {
    event?.preventDefault?.();
    if (!body.trim() || sending) return;

    setSending(true);
    setSendError('');
    try {
      const sent = await sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        body: body.trim(),
      });
      setMessages((current) => (current.some((item) => item.id === sent.id) ? current : [...current, sent]));
      setBody('');
      setSendNotice('Mesaj gönderildi');
      inputRef.current?.focus();
    } catch (error) {
      const message = isSuspensionError(error)
        ? SUSPENSION_BLOCK_MESSAGE
        : (error.message || 'Mesaj gönderilemedi.');
      setSendError(message.includes('askıya') ? 'Bu kullanıcıya şu anda mesaj gönderilemez.' : message);
    } finally {
      setSending(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4" onClick={() => onClose?.()}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex h-[100dvh] max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:rounded-3xl"
      >
        <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {listingImage ? (
                <img src={listingImage} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200" />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <MessageCircle size={22} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-cyan-700">Satıcıya mesaj gönder</div>
                <h2 className="mt-0.5 line-clamp-2 text-lg font-black text-slate-950 sm:text-xl">{listingTitle}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{roleHint}{listingPrice ? ` · ${listingPrice}` : ''}</p>
              </div>
            </div>
            <button type="button" onClick={() => onClose?.()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 hover:bg-slate-200" aria-label="Kapat">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
              Mesajlar yükleniyor...
            </div>
          ) : null}

          {!loading && loadError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 ring-1 ring-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <div className="text-sm font-black text-amber-950">Mesajlar yüklenemedi</div>
                  <p className="mt-1 text-sm leading-6 text-amber-800">{loadError}</p>
                  <button type="button" onClick={loadMessages} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-amber-700 px-4 py-2 text-xs font-black text-white">
                    <RefreshCw size={14} /> Yenile
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && !loadError && messages.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center ring-1 ring-slate-200">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <MessageCircle size={20} />
              </div>
              <p className="mt-3 text-sm font-black text-slate-800">Henüz mesaj yok</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Satıcıya ilk mesajını yaz. Yanıtlar burada görünür ve Mesajlar bölümünden devam edebilirsin.</p>
            </div>
          ) : null}

          {messages.map((message) => {
            const mine = message.sender_id === user.id;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%] ${
                  mine ? 'bg-cyan-800 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{message.body}</div>
                  <div className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-cyan-100' : 'text-slate-400'}`}>
                    {formatMessageTime(message.created_at)}
                    {mine && message.read_at ? <CheckCheck size={13} aria-label="Okundu" /> : null}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:p-4">
          {sendNotice ? (
            <div className="mb-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
              {sendNotice}
            </div>
          ) : null}
          {sendError ? (
            <div className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-800 ring-1 ring-rose-100">
              {sendError}
            </div>
          ) : null}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (sendError) setSendError('');
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Mesajınızı yazın"
              rows={1}
              className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
            >
              <Send size={16} />
              <span className="hidden sm:inline">{sending ? 'Mesaj gönderiliyor...' : 'Gönder'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
