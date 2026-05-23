import { supabase, hasSupabase } from './supabase';

export async function getOrCreateConversation({ listingId, buyerId, sellerId }) {
  if (!listingId || !buyerId || !sellerId) {
    throw new Error('Mesajlaşma için ilan, alıcı ve satıcı bilgisi gerekli.');
  }

  if (buyerId === sellerId) {
    throw new Error('Kendi ilanın için mesajlaşma başlatamazsın.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('*, listings(title, image_url, price, currency)')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
    })
    .select('*, listings(title, image_url, price, currency)')
    .single();

  if (error) throw error;
  return data;
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage({ conversationId, senderId, body }) {
  const cleanBody = String(body || '').trim();
  if (!cleanBody) throw new Error('Boş mesaj gönderilemez.');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: cleanBody,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMyConversations(userId) {
  if (!userId) return [];

  if (!hasSupabase || !supabase) return [];

  const withTimeout = (promise, ms = 6500) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('MESSAGES_TIMEOUT')), ms)),
    ]);

  let conversations = [];
  let conversationsError = null;

  try {
    const result = await withTimeout(
      supabase
        .from('conversations')
        .select('*, listings(title, image_url, price, currency)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
    );
    conversations = result.data || [];
    conversationsError = result.error;
  } catch (error) {
    if (error?.message === 'MESSAGES_TIMEOUT') {
      console.warn('Messages query timed out. Returning empty state.');
      return [];
    }
    throw error;
  }

  if (conversationsError) throw conversationsError;
  if (!conversations?.length) return [];

  const conversationIds = conversations.map((conversation) => conversation.id);

  let messages = [];
  const messageColumns = 'id, conversation_id, sender_id, body, read_at, created_at';
  let readAtMessages = [];
  let readAtError = null;
  try {
    const result = await withTimeout(
      supabase
        .from('messages')
        .select(messageColumns)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
    );
    readAtMessages = result.data || [];
    readAtError = result.error;
  } catch (error) {
    if (error?.message === 'MESSAGES_TIMEOUT') return conversations.map((conversation) => ({ ...conversation, last_message: null, unread_count: 0 }));
    throw error;
  }

  if (readAtError) {
    // Eski kurulumlarda read_at kolonu yoksa uygulamayı kilitleme; is_read ile fallback yap.
    if (String(readAtError.message || '').includes('read_at')) {
      const { data: fallbackMessages, error: fallbackError } = await withTimeout(
        supabase
          .from('messages')
          .select('id, conversation_id, sender_id, body, is_read, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      );
      if (fallbackError) throw fallbackError;
      messages = fallbackMessages || [];
    } else {
      throw readAtError;
    }
  } else {
    messages = readAtMessages || [];
  }

  const messagesByConversation = messages.reduce((acc, message) => {
    if (!acc[message.conversation_id]) acc[message.conversation_id] = [];
    acc[message.conversation_id].push(message);
    return acc;
  }, {});

  return conversations.map((conversation) => {
    const conversationMessages = messagesByConversation[conversation.id] || [];
    const lastMessage = conversationMessages[0] || null;
    const unreadCount = conversationMessages.filter((message) => {
      if (message.sender_id === userId) return false;
      if ('read_at' in message) return !message.read_at;
      return !message.is_read;
    }).length;

    return {
      ...conversation,
      last_message: lastMessage,
      unread_count: unreadCount,
    };
  });
}

export async function markConversationRead({ conversationId, userId }) {
  if (!conversationId || !userId) return;

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString(), is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId);

  if (error) {
    if (String(error.message || '').includes('read_at')) {
      const { error: fallbackError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);
      if (fallbackError) throw fallbackError;
      return;
    }
    throw error;
  }
}

export function subscribeToConversation({ conversationId, onMessage, onChange }) {
  if (!conversationId || !hasSupabase || !supabase) return null;

  const channel = supabase
    .channel(`noumarket-conversation-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onChange?.(payload.new)
    )
    .subscribe();

  return channel;
}

export function subscribeToMyConversations({ userId, onChange }) {
  if (!userId || !hasSupabase || !supabase) return null;

  const channel = supabase
    .channel(`noumarket-conversations-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .subscribe();

  return channel;
}
