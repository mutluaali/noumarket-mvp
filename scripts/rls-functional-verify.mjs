#!/usr/bin/env node
/**
 * Functional RLS verification against staging Supabase via REST (no DDL).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = { ...loadEnvFile(path.join(root, '.env.local')), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase env vars in .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

const runTag = `rls-verify-${Date.now()}`;
const password = `RlsVerify!${Date.now()}`;

const results = [];

function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`);
}

async function createAuthUser(label, role = 'user') {
  const email = `${label}.${runTag}@noumarket-verify.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { rls_verify: runTag },
  });
  if (error) throw error;

  const userId = data.user.id;
  await admin.from('profiles').upsert({
    id: userId,
    full_name: `${label} ${runTag}`,
    role,
  });

  return { email, userId, password };
}

async function signIn(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function cleanup(ids) {
  const tables = [
    ['messages', 'conversation_id', ids.conversationIds],
    ['conversations', 'id', ids.conversationIds],
    ['listing_reports', 'id', ids.reportIds],
    ['listing_images', 'listing_id', ids.listingIds],
    ['listings', 'id', ids.listingIds],
  ];

  for (const [table, column, values] of tables) {
    if (!values?.length) continue;
    await admin.from(table).delete().in(column, values);
  }

  for (const userId of ids.userIds || []) {
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
  }

  for (const storagePath of ids.storagePaths || []) {
    await admin.storage.from('listing-images').remove([storagePath]);
  }
}

async function main() {
  const ids = { userIds: [], listingIds: [], conversationIds: [], reportIds: [], storagePaths: [] };

  try {
    const userA = await createAuthUser('user-a', 'user');
    const userB = await createAuthUser('user-b', 'user');
    const adminUser = await createAuthUser('staff-admin', 'admin');
    const modUser = await createAuthUser('staff-mod', 'moderator');
    ids.userIds.push(userA.userId, userB.userId, adminUser.userId, modUser.userId);

    const { data: approvedListing, error: approvedErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} approved`,
        description: 'approved listing',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'approved',
        image_url: 'https://example.com/a.jpg',
      })
      .select('id, status')
      .single();
    if (approvedErr) throw approvedErr;
    ids.listingIds.push(approvedListing.id);

    const { data: pendingListing, error: pendingErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} pending`,
        description: 'pending listing',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'pending',
        image_url: 'https://example.com/p.jpg',
      })
      .select('id, status')
      .single();
    if (pendingErr) throw pendingErr;
    ids.listingIds.push(pendingListing.id);

    const { data: rejectedListing, error: rejectedErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} rejected`,
        description: 'rejected listing',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'rejected',
        image_url: 'https://example.com/r.jpg',
      })
      .select('id, status')
      .single();
    if (rejectedErr) throw rejectedErr;
    ids.listingIds.push(rejectedListing.id);

    // Anonymous reads
    const anonApproved = await anon.from('listings').select('id,status').eq('id', approvedListing.id).maybeSingle();
    record('Anonymous can read approved listings', !anonApproved.error && !!anonApproved.data, anonApproved.error?.message);

    const anonPending = await anon.from('listings').select('id').eq('id', pendingListing.id).maybeSingle();
    record('Anonymous cannot read pending listings', !anonPending.data && !anonPending.error, anonPending.error?.message);

    const anonRejected = await anon.from('listings').select('id').eq('id', rejectedListing.id).maybeSingle();
    record('Anonymous cannot read rejected listings', !anonRejected.data && !anonRejected.error, anonRejected.error?.message);

    // Owner create/read
    const clientA = await signIn(userA.email);
    const { data: createdListing, error: createErr } = await clientA
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} owner create`,
        description: 'owner create',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'pending',
      })
      .select('id, status')
      .single();
    record('Owner can create listing', !createErr && createdListing?.status === 'pending', createErr?.message);
    if (createdListing?.id) ids.listingIds.push(createdListing.id);

    const ownPending = await clientA.from('listings').select('id').eq('id', pendingListing.id).maybeSingle();
    record('Owner can read own pending listing', !ownPending.error && !!ownPending.data, ownPending.error?.message);

    const clientB = await signIn(userB.email);
    const otherPending = await clientB.from('listings').select('id').eq('id', pendingListing.id);
    record(
      'Owner cannot read another user pending listing',
      !otherPending.error && (otherPending.data || []).length === 0,
      otherPending.error?.message || `rows=${(otherPending.data || []).length}`
    );

    const { data: approvedForUpdate, error: approvedForUpdateErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} approved-for-update`,
        description: 'approved listing for update test',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'approved',
        image_url: 'https://example.com/u.jpg',
      })
      .select('id, status')
      .single();
    if (approvedForUpdateErr) throw approvedForUpdateErr;
    ids.listingIds.push(approvedForUpdate.id);

    const approvedUpdate = await clientA
      .from('listings')
      .update({ title: `${runTag} hacked approved` })
      .eq('id', approvedForUpdate.id)
      .select('id, title')
      .maybeSingle();
    const { data: approvedAfterUpdate } = await admin
      .from('listings')
      .select('title')
      .eq('id', approvedForUpdate.id)
      .single();
    record(
      'Owner cannot client-update approved listing',
      !approvedUpdate.data && approvedAfterUpdate?.title !== `${runTag} hacked approved`,
      approvedUpdate.data ? 'unexpected update returned row' : `title=${approvedAfterUpdate?.title}`
    );

    const { data: approvedForApi, error: approvedForApiErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} approved-for-api`,
        description: 'approved listing for api test',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'approved',
        image_url: 'https://example.com/api.jpg',
      })
      .select('id, status')
      .single();
    if (approvedForApiErr) throw approvedForApiErr;
    ids.listingIds.push(approvedForApi.id);

    // My Listings API edit -> pending
    const sessionA = (await clientA.auth.getSession()).data.session;
    const patchRes = await fetch(`${appUrl}/api/my-listings/${approvedForApi.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionA.access_token}`,
      },
      body: JSON.stringify({
        action: 'update',
        title: `${runTag} edited via api`,
        description: 'edited',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        seller_phone: '000',
        seller_email: userA.email,
        image_url: 'https://example.com/a.jpg',
      }),
    });
    const patchPayload = await patchRes.json().catch(() => ({}));
    const { data: afterApiEdit } = await admin.from('listings').select('status').eq('id', approvedForApi.id).single();
    record(
      'My Listings API edit sends approved listing back to pending',
      patchRes.ok && afterApiEdit?.status === 'pending',
      patchRes.ok ? `status=${afterApiEdit?.status}` : patchPayload.error || patchRes.status
    );

    // Staff moderation
    const adminClient = await signIn(adminUser.email);
    const modClient = await signIn(modUser.email);
    const normalClient = clientB;

    const adminReject = await adminClient
      .from('listings')
      .update({ status: 'rejected' })
      .eq('id', createdListing.id)
      .select('status')
      .single();
    record('Admin can reject listing', !adminReject.error && adminReject.data?.status === 'rejected', adminReject.error?.message);

    await admin.from('listings').update({ status: 'pending' }).eq('id', createdListing.id);

    const modApprove = await modClient
      .from('listings')
      .update({ status: 'approved' })
      .eq('id', createdListing.id)
      .select('status')
      .single();
    record('Moderator can approve listing', !modApprove.error && modApprove.data?.status === 'approved', modApprove.error?.message);

    const { data: pendingForEscalation, error: pendingForEscalationErr } = await admin
      .from('listings')
      .insert({
        user_id: userA.userId,
        title: `${runTag} pending-for-escalation`,
        description: 'pending listing for escalation test',
        category: 'Test',
        location: 'Noumea',
        seller_name: 'Seller A',
        status: 'pending',
      })
      .select('id')
      .single();
    if (pendingForEscalationErr) throw pendingForEscalationErr;
    ids.listingIds.push(pendingForEscalation.id);

    const userApproveOther = await normalClient
      .from('listings')
      .update({ status: 'approved' })
      .eq('id', pendingForEscalation.id)
      .select('id, status')
      .maybeSingle();
    const { data: escalationAfter } = await admin
      .from('listings')
      .select('status')
      .eq('id', pendingForEscalation.id)
      .single();
    record(
      'Normal user cannot approve another user listing',
      !userApproveOther.data && escalationAfter?.status !== 'approved',
      userApproveOther.data ? 'unexpected update returned row' : `status=${escalationAfter?.status}`
    );

    // Chat
    const { data: conversation, error: convErr } = await clientB
      .from('conversations')
      .insert({
        listing_id: approvedListing.id,
        buyer_id: userB.userId,
        seller_id: userA.userId,
      })
      .select('id')
      .single();
    record('Chat participant can create conversation', !convErr && !!conversation?.id, convErr?.message);
    if (conversation?.id) ids.conversationIds.push(conversation.id);

    const readConv = await clientB.from('conversations').select('id').eq('id', conversation.id).maybeSingle();
    record('Chat participant can read conversation', !readConv.error && !!readConv.data, readConv.error?.message);

    const { data: message, error: msgErr } = await clientB
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userB.userId,
        body: `${runTag} hello`,
      })
      .select('id')
      .single();
    record('Chat participant can send message', !msgErr && !!message?.id, msgErr?.message);

    const outsider = await createAuthUser('outsider', 'user');
    ids.userIds.push(outsider.userId);
    const outsiderClient = await signIn(outsider.email);
    const outsiderRead = await outsiderClient.from('messages').select('id').eq('conversation_id', conversation.id);
    record(
      'Non-participant cannot read messages',
      !outsiderRead.error && (outsiderRead.data || []).length === 0,
      outsiderRead.error?.message
    );

    const outsiderSend = await outsiderClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: outsider.userId,
        body: `${runTag} intruder`,
      })
      .select('id')
      .maybeSingle();
    record(
      'Non-participant cannot send messages',
      !outsiderSend.data && !!outsiderSend.error,
      outsiderSend.error?.message || 'unexpected insert succeeded'
    );

    // Reports
    const { data: report, error: reportErr } = await clientB
      .from('listing_reports')
      .insert({
        reporter_id: userB.userId,
        listing_id: approvedListing.id,
        reason: 'spam',
        details: runTag,
        status: 'open',
      })
      .select('id, reporter_id')
      .single();
    record('User can create report', !reportErr && !!report?.id, reportErr?.message);
    if (report?.id) ids.reportIds.push(report.id);

    const ownReports = await clientB.from('listing_reports').select('id').eq('reporter_id', userB.userId);
    const otherReports = await clientB.from('listing_reports').select('id').eq('reporter_id', userA.userId);
    record(
      'User can read only own reports',
      !ownReports.error && (ownReports.data || []).some((row) => row.id === report.id) && (otherReports.data || []).length === 0,
      ownReports.error?.message
    );

    const staffResolve = await adminClient
      .from('listing_reports')
      .update({ status: 'resolved' })
      .eq('id', report.id)
      .select('status')
      .single();
    record('Staff can resolve report', !staffResolve.error && staffResolve.data?.status === 'resolved', staffResolve.error?.message);

    // Storage
    const ownPath = `listings/${userA.userId}/${runTag}-own.jpg`;
    const otherPath = `listings/${userB.userId}/${runTag}-other.jpg`;
    const jpegBytes = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
      'base64'
    );
    const ownBlob = new Blob([jpegBytes], { type: 'image/jpeg' });
    const otherBlob = new Blob([jpegBytes], { type: 'image/jpeg' });

    const ownUpload = await clientA.storage.from('listing-images').upload(ownPath, ownBlob, { upsert: false });
    record('User can upload to listings/{own_uid}/...', !ownUpload.error, ownUpload.error?.message);
    if (!ownUpload.error) ids.storagePaths.push(ownPath);

    const otherUpload = await clientA.storage.from('listing-images').upload(otherPath, otherBlob, { upsert: false });
    record(
      'User cannot upload to listings/{other_uid}/...',
      !!otherUpload.error,
      otherUpload.error?.message || 'unexpected upload succeeded'
    );

    const passed = results.filter((item) => item.passed).length;
    const failed = results.filter((item) => !item.passed).length;
    console.log(`\nSummary: ${passed} passed, ${failed} failed, ${results.length} total`);

    fs.writeFileSync(path.join(root, 'scripts', 'rls-functional-results.json'), JSON.stringify(results, null, 2));

    if (failed > 0) process.exit(1);
  } finally {
    await cleanup(ids);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
