import { supabase } from './supabase';

export async function createFeedbackReport(payload) {
  const safePayload = {
    user_id: payload.userId || null,
    type: payload.type || 'feedback',
    severity: payload.severity || 'normal',
    message: String(payload.message || '').trim(),
    page_url: payload.pageUrl || null,
    user_agent: payload.userAgent || null,
    metadata: payload.metadata || {},
    status: 'open',
  };

  if (!safePayload.message || safePayload.message.length < 8) {
    throw new Error('Geri bildirim en az 8 karakter olmalı.');
  }

  const { data, error } = await supabase
    .from('feedback_reports')
    .insert(safePayload)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function getFeedbackReports(limit = 50) {
  const { data, error } = await supabase
    .from('feedback_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
