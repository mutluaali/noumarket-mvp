import { supabase } from './supabase';

export async function getOrCreateConversation({ listingId, buyerId, sellerId }) {
  if (!listingId || !buyerId || !sellerId) {
    throw new Error('Mesajlaşma için ilan, alıcı ve satıcı bilgisi gerekli.');
  }

  if (buyerId === sellerId) {
    throw new Error('Kendi ilanın için mesajlaşma başlatamazsın.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('*, listings(title, image_url)')
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
    .select('*, listings(title, image_url)')
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
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMyConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, listings(title, image_url, price, currency)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
