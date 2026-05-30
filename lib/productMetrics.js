export function startOfLocalDay(offsetDays = 0) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  if (offsetDays) day.setDate(day.getDate() - offsetDays);
  return day;
}

export const TOP_RANKINGS_MAX_ROWS = 5000;
export const DAU_MAX_ROWS = 5000;
export const METRICS_GROUP_TIMEOUT_MS = 6000;

export function emptyProductInsights(errorMessage = null) {
  return {
    generatedAt: new Date().toISOString(),
    dailyActiveUsers: null,
    registrations: null,
    listings: null,
    messages: null,
    reports: null,
    favorites: null,
    topCategories: [],
    topLocations: [],
    rankingsTruncated: false,
    partialFailures: errorMessage ? ['all'] : [],
    errors: errorMessage ? [errorMessage] : [],
  };
}

export async function fetchTableCount(supabase, table, filters = []) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const filter of filters) {
    if (filter.op === 'eq') query = query.eq(filter.column, filter.value);
    if (filter.op === 'gte') query = query.gte(filter.column, filter.value);
  }
  const { count, error } = await query;
  return { count: count ?? 0, error: error?.message || null };
}

export async function fetchPremiumListingCount(supabase) {
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .or('is_featured.eq.true,is_premium.eq.true');
  return { count: count ?? 0, error: error?.message || null };
}

export function aggregateTopValues(rows, field, { limit = 10, filter } = {}) {
  const source = filter ? rows.filter(filter) : rows;
  const counts = source.reduce((acc, row) => {
    const key = String(row?.[field] || '').trim() || 'Belirtilmedi';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function countUniqueActiveUsers(rowsByField) {
  const ids = new Set();
  for (const rows of rowsByField) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const id = row?.user_id || row?.sender_id || row?.reporter_id || row?.id;
      if (id) ids.add(id);
    }
  }
  return ids.size;
}

async function runMetricsGroup(label, fn, timeoutMs = METRICS_GROUP_TIMEOUT_MS) {
  let timer;
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} zaman aşımı`)), timeoutMs);
      }),
    ]);
    return { ok: true, data: result, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error?.message || String(error) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchCoreCounts(supabaseAdmin, periods) {
  const { todayStart, last7Start, last30Start } = periods;
  const [
    registrationsTotal,
    registrationsToday,
    registrationsLast7,
    registrationsLast30,
    listingsCreatedTotal,
    listingsCreatedToday,
    listingsCreatedLast7,
    listingsCreatedLast30,
    listingsApproved,
    listingsRejected,
    listingsPending,
    messagesTotal,
    messagesToday,
    messagesLast7,
    reportsTotal,
    reportsToday,
    favoritesTotal,
    favoritesToday,
    favoritesLast7,
  ] = await Promise.all([
    fetchTableCount(supabaseAdmin, 'profiles'),
    fetchTableCount(supabaseAdmin, 'profiles', [{ op: 'gte', column: 'created_at', value: todayStart }]),
    fetchTableCount(supabaseAdmin, 'profiles', [{ op: 'gte', column: 'created_at', value: last7Start }]),
    fetchTableCount(supabaseAdmin, 'profiles', [{ op: 'gte', column: 'created_at', value: last30Start }]),
    fetchTableCount(supabaseAdmin, 'listings'),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'gte', column: 'created_at', value: todayStart }]),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'gte', column: 'created_at', value: last7Start }]),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'gte', column: 'created_at', value: last30Start }]),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'eq', column: 'status', value: 'approved' }]),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'eq', column: 'status', value: 'rejected' }]),
    fetchTableCount(supabaseAdmin, 'listings', [{ op: 'eq', column: 'status', value: 'pending' }]),
    fetchTableCount(supabaseAdmin, 'messages'),
    fetchTableCount(supabaseAdmin, 'messages', [{ op: 'gte', column: 'created_at', value: todayStart }]),
    fetchTableCount(supabaseAdmin, 'messages', [{ op: 'gte', column: 'created_at', value: last7Start }]),
    fetchTableCount(supabaseAdmin, 'listing_reports'),
    fetchTableCount(supabaseAdmin, 'listing_reports', [{ op: 'gte', column: 'created_at', value: todayStart }]),
    fetchTableCount(supabaseAdmin, 'favorites'),
    fetchTableCount(supabaseAdmin, 'favorites', [{ op: 'gte', column: 'created_at', value: todayStart }]),
    fetchTableCount(supabaseAdmin, 'favorites', [{ op: 'gte', column: 'created_at', value: last7Start }]),
  ]);

  const errors = [
    registrationsTotal.error,
    listingsCreatedTotal.error,
    messagesTotal.error,
    reportsTotal.error,
    favoritesTotal.error,
  ].filter(Boolean);

  return {
    errors,
    registrations: {
      total: registrationsTotal.count,
      today: registrationsToday.count,
      last7Days: registrationsLast7.count,
      last30Days: registrationsLast30.count,
    },
    listings: {
      createdTotal: listingsCreatedTotal.count,
      createdToday: listingsCreatedToday.count,
      createdLast7Days: listingsCreatedLast7.count,
      createdLast30Days: listingsCreatedLast30.count,
      approved: listingsApproved.count,
      rejected: listingsRejected.count,
      pending: listingsPending.count,
    },
    messages: {
      total: messagesTotal.count,
      today: messagesToday.count,
      last7Days: messagesLast7.count,
    },
    reports: {
      total: reportsTotal.count,
      today: reportsToday.count,
    },
    favorites: {
      total: favoritesTotal.count,
      today: favoritesToday.count,
      last7Days: favoritesLast7.count,
    },
  };
}

async function fetchDailyActiveUsers(supabaseAdmin, todayStart) {
  const [
    dauRegistrationsRes,
    dauMessagesRes,
    dauFavoritesRes,
    dauListingsRes,
    dauReportsRes,
    dauAnalyticsRes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id').gte('created_at', todayStart).limit(DAU_MAX_ROWS),
    supabaseAdmin.from('messages').select('sender_id').gte('created_at', todayStart).limit(DAU_MAX_ROWS),
    supabaseAdmin.from('favorites').select('user_id').gte('created_at', todayStart).limit(DAU_MAX_ROWS),
    supabaseAdmin.from('listings').select('user_id').gte('created_at', todayStart).limit(DAU_MAX_ROWS),
    supabaseAdmin.from('listing_reports').select('reporter_id').gte('created_at', todayStart).limit(DAU_MAX_ROWS),
    supabaseAdmin.from('analytics_events').select('user_id').gte('created_at', todayStart).not('user_id', 'is', null).limit(DAU_MAX_ROWS),
  ]);

  const errors = [
    dauRegistrationsRes.error?.message,
    dauMessagesRes.error?.message,
    dauFavoritesRes.error?.message,
    dauListingsRes.error?.message,
    dauReportsRes.error?.message,
    dauAnalyticsRes.error?.message,
  ].filter(Boolean);

  if (errors.length) throw new Error(errors.join('; '));

  const dailyActiveUsers = countUniqueActiveUsers([
    (dauRegistrationsRes.data || []).map((row) => ({ id: row.id })),
    (dauMessagesRes.data || []).map((row) => ({ sender_id: row.sender_id })),
    (dauFavoritesRes.data || []).map((row) => ({ user_id: row.user_id })),
    (dauListingsRes.data || []).map((row) => ({ user_id: row.user_id })),
    (dauReportsRes.data || []).map((row) => ({ reporter_id: row.reporter_id })),
    (dauAnalyticsRes.data || []).map((row) => ({ user_id: row.user_id })),
  ]);

  return { dailyActiveUsers, errors: [] };
}

async function fetchTopRankings(supabaseAdmin, approvedCount = 0) {
  const maxRows = approvedCount > 0 ? Math.min(TOP_RANKINGS_MAX_ROWS, approvedCount) : 0;
  if (maxRows === 0) {
    return { topCategories: [], topLocations: [], rankingsTruncated: false, errors: [] };
  }

  const rows = [];
  const pageSize = 500;
  let errorMessage = null;

  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const limit = Math.min(pageSize, maxRows - offset);
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('category, location')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      errorMessage = error.message;
      break;
    }

    rows.push(...(data || []));
    if ((data || []).length < limit) break;
  }

  if (errorMessage) throw new Error(errorMessage);

  const rankingsTruncated = approvedCount > rows.length;

  return {
    topCategories: aggregateTopValues(rows, 'category', { limit: 10 }),
    topLocations: aggregateTopValues(rows, 'location', { limit: 10 }),
    rankingsTruncated,
    errors: [],
  };
}

export async function buildProductInsights(supabaseAdmin) {
  const todayStart = startOfLocalDay().toISOString();
  const last7Start = startOfLocalDay(6).toISOString();
  const last30Start = startOfLocalDay(29).toISOString();
  const periods = { todayStart, last7Start, last30Start };

  const countsGroup = await runMetricsGroup('counts', () => fetchCoreCounts(supabaseAdmin, periods));
  const approvedCount = countsGroup.ok ? countsGroup.data.listings.approved : 0;

  const [dauGroup, rankingsGroup] = await Promise.all([
    runMetricsGroup('dau', () => fetchDailyActiveUsers(supabaseAdmin, todayStart)),
    runMetricsGroup('rankings', () => fetchTopRankings(supabaseAdmin, approvedCount)),
  ]);

  const partialFailures = [];
  const errors = [];

  if (!countsGroup.ok) {
    partialFailures.push('counts');
    errors.push(countsGroup.error);
  } else if (countsGroup.data.errors.length) {
    errors.push(...countsGroup.data.errors);
  }

  if (!dauGroup.ok) {
    partialFailures.push('dau');
    errors.push(dauGroup.error);
  } else if (dauGroup.data.errors.length) {
    errors.push(...dauGroup.data.errors);
  }

  if (!rankingsGroup.ok) {
    partialFailures.push('rankings');
    errors.push(rankingsGroup.error);
  } else if (rankingsGroup.data.errors.length) {
    errors.push(...rankingsGroup.data.errors);
  }

  const counts = countsGroup.ok ? countsGroup.data : null;
  const dau = dauGroup.ok ? dauGroup.data : null;
  const rankings = rankingsGroup.ok ? rankingsGroup.data : null;

  return {
    generatedAt: new Date().toISOString(),
    dailyActiveUsers: dau?.dailyActiveUsers ?? null,
    registrations: counts?.registrations ?? null,
    listings: counts?.listings ?? null,
    messages: counts?.messages ?? null,
    reports: counts?.reports ?? null,
    favorites: counts?.favorites ?? null,
    topCategories: rankings?.topCategories ?? [],
    topLocations: rankings?.topLocations ?? [],
    rankingsTruncated: rankings?.rankingsTruncated ?? false,
    partialFailures,
    errors,
  };
}
