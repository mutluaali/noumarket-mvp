'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, XCircle, Trash2, Crown, Eye, Search, ShieldAlert, BarChart3, Clock, UserRound, Filter, AlertTriangle, Flag, RefreshCw, Wallet, LayoutDashboard, ChevronRight } from 'lucide-react';
import { fetchAdminReports, REPORT_REASON_LABELS, REPORT_STATUS_LABELS, updateReportStatus } from '@/lib/reports';
import { fetchAdminUsers, suspendAdminUser, unsuspendAdminUser } from '@/lib/adminUsers';
import { fetchAdminRevenue, fetchPendingAdminPayments, reviewAdminPayment } from '@/lib/monetization';
import { supabase } from '@/lib/supabase';
import ProductInsightsPanel from '@/components/ProductInsightsPanel';

const listingStatusLabels = {
  all: 'Tümü',
  pending: 'Onay bekliyor',
  approved: 'Yayında',
  rejected: 'Reddedildi',
  passive: 'Pasif',
  inactive: 'Pasif',
  sold: 'Satıldı',
};

const roleLabels = {
  admin: 'Yönetici',
  moderator: 'Moderatör',
  user: 'Kullanıcı',
};

const providerLabels = {
  bank_transfer: 'Banka havalesi',
  epaync: 'EpayNC',
  stripe: 'Stripe',
};

const productTypeLabels = {
  featured_listing: 'Öne çıkan ilan',
  premium_seller: 'Premium Satıcı',
  standard_listing: 'Standart ilan',
};

function formatProvider(value) {
  return providerLabels[String(value || '').toLowerCase()] || value || 'Belirtilmedi';
}

function formatProductType(value) {
  return productTypeLabels[String(value || '').toLowerCase()] || value || 'Belirtilmedi';
}

function formatRole(value) {
  return roleLabels[String(value || '').toLowerCase()] || value || 'Kullanıcı';
}

function canSuspendUser(userRow) {
  return !userRow?.is_suspended && !['admin', 'moderator'].includes(String(userRow?.role || '').toLowerCase());
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (value === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (value === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (value === 'passive' || value === 'inactive') return 'bg-slate-100 text-slate-700 ring-slate-200';
  if (value === 'sold') return 'bg-cyan-50 text-cyan-700 ring-cyan-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

function listingStatusLabel(status) {
  const value = String(status || '').toLowerCase();
  return listingStatusLabels[value] || listingStatusLabels[status] || status || '-';
}

async function fetchAdminDashboardMetrics() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');
  const response = await fetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Panel verileri yüklenemedi.');
  return {
    metrics: payload.metrics || null,
    productInsights: payload.productInsights || null,
  };
}

function AdminStat({ icon: Icon, label, value, hint, onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 ${onClick ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-slate-100 p-3"><Icon size={18} /></div>
        <div className="text-right">
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p>}
    </Wrapper>
  );
}

function reportStatusClass(status) {
  if (status === 'open') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (status === 'reviewing') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'resolved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'dismissed') return 'bg-slate-100 text-slate-600 ring-slate-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

const userFilterLabels = {
  all: 'Tüm kullanıcılar',
  active: 'Aktif',
  suspended: 'Askıda',
};

function userStatusClass(isSuspended) {
  return isSuspended ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}

const reportFilterLabels = {
  open: 'Açık şikayetler',
  all: 'Tüm şikayetler',
  reviewing: 'İnceleniyor',
  resolved: 'Çözüldü',
  dismissed: 'Geçersiz sayıldı',
};

export default function AdminPanel({ listings = [], onApprove, onReject, onDelete, onFeature, onClose }) {
  const [section, setSection] = useState('overview');
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [productInsights, setProductInsights] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('open');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportActionId, setReportActionId] = useState(null);
  const [users, setUsers] = useState([]);
  const [suspendedUsersCount, setSuspendedUsersCount] = useState(0);
  const [userFilter, setUserFilter] = useState('all');
  const [userQuery, setUserQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActionId, setUserActionId] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [paymentActionId, setPaymentActionId] = useState(null);
  const [rejectPaymentTarget, setRejectPaymentTarget] = useState(null);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');

  const stats = useMemo(() => {
    const total = listings.length;
    const pending = listings.filter((item) => item.status === 'pending').length;
    const approved = listings.filter((item) => item.status === 'approved').length;
    const rejected = listings.filter((item) => item.status === 'rejected').length;
    const premium = listings.filter((item) => item.isFeatured).length;
    const risky = listings.filter((item) => Number(item.trustScore || 0) < 55).length;
    const views = listings.reduce((sum, item) => sum + Number(item.views || 0), 0);
    const openReports = reports.filter((item) => item.status === 'open' || item.status === 'reviewing').length;
    const suspendedUsers = suspendedUsersCount;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayListings = listings.filter((item) => {
      const created = new Date(item.created_at || 0);
      return created >= todayStart;
    }).length;
    const pendingPaymentsCount = pendingPayments.length || dashboardMetrics?.pendingPayments || 0;
    return { total, pending, approved, rejected, premium, risky, views, openReports, suspendedUsers, todayListings, pendingPaymentsCount };
  }, [listings, reports, users, pendingPayments, dashboardMetrics, suspendedUsersCount]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const data = await fetchAdminReports({ status: reportFilter });
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      setReports([]);
      setReportsError(error.message || 'Şikayetler yüklenemedi.');
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await fetchAdminUsers({ query: userQuery, status: userFilter });
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
      setUsersError(error.message || 'Kullanıcılar yüklenemedi.');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter, userQuery]);

  const loadRevenue = useCallback(async () => {
    setRevenueLoading(true);
    setRevenueError('');
    try {
      const data = await fetchAdminRevenue();
      setRevenue(data);
    } catch (error) {
      setRevenue(null);
      setRevenueError(error.message || 'Gelir verileri yüklenemedi.');
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const loadPendingPayments = useCallback(async () => {
    setPendingLoading(true);
    setPendingError('');
    try {
      const payload = await fetchPendingAdminPayments();
      setPendingPayments(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      setPendingPayments([]);
      setPendingError(error.message || 'Bekleyen ödemeler yüklenemedi.');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const refreshSuspendedCount = useCallback(async () => {
    try {
      const data = await fetchAdminUsers({ status: 'suspended' });
      setSuspendedUsersCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setSuspendedUsersCount(0);
    }
  }, []);

  async function handleApprovePayment(orderId) {
    if (!confirm('Ödendi olarak işaretlensin mi? Bu işlem öne çıkarma veya Premium Satıcı hakkını aktive eder.')) return;
    setPaymentActionId(orderId);
    setPendingError('');
    try {
      await reviewAdminPayment(orderId, 'approve');
      setToast({ type: 'success', message: 'İşlem tamamlandı. Ödeme onaylandı.' });
      await Promise.all([loadPendingPayments(), loadRevenue(), loadDashboard()]);
    } catch (error) {
      setPendingError(error.message || 'Bir hata oluştu.');
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    } finally {
      setPaymentActionId(null);
    }
  }

  async function handleRejectPayment() {
    if (!rejectPaymentTarget?.id) return;
    setPaymentActionId(rejectPaymentTarget.id);
    setPendingError('');
    try {
      await reviewAdminPayment(rejectPaymentTarget.id, 'reject', rejectPaymentReason);
      setRejectPaymentTarget(null);
      setRejectPaymentReason('');
      setToast({ type: 'success', message: 'Ödeme reddedildi. Herhangi bir hak aktive edilmedi.' });
      await Promise.all([loadPendingPayments(), loadRevenue(), loadDashboard()]);
    } catch (error) {
      setPendingError(error.message || 'Bir hata oluştu.');
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    } finally {
      setPaymentActionId(null);
    }
  }

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const payload = await fetchAdminDashboardMetrics();
      setDashboardMetrics(payload.metrics);
      setProductInsights(payload.productInsights);
    } catch {
      setDashboardMetrics(null);
      setProductInsights(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSuspendedCount();
  }, [refreshSuspendedCount]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadDashboard();
    loadPendingPayments();
  }, [loadDashboard, loadPendingPayments]);

  useEffect(() => {
    if (section !== 'reports') return undefined;
    loadReports();
  }, [section, loadReports]);

  useEffect(() => {
    if (section !== 'users') return undefined;
    loadUsers();
  }, [section, loadUsers]);

  useEffect(() => {
    fetchAdminReports({ status: 'open' })
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (section !== 'revenue') return undefined;
    loadRevenue();
  }, [section, loadRevenue]);

  async function handleSuspendUser() {
    if (!suspendTarget?.id) return;
    if (!suspendReason.trim()) {
      setUsersError('Askıya alma sebebi yazmalısın.');
      return;
    }
    setUserActionId(suspendTarget.id);
    setUsersError('');
    try {
      await suspendAdminUser(suspendTarget.id, suspendReason);
      setSuspendTarget(null);
      setSuspendReason('');
      setToast({ type: 'success', message: 'İşlem tamamlandı. Kullanıcı askıya alındı.' });
      await Promise.all([loadUsers(), refreshSuspendedCount()]);
    } catch (error) {
      setUsersError(error.message || 'Bir hata oluştu.');
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    } finally {
      setUserActionId(null);
    }
  }

  async function handleUnsuspendUser(userId) {
    setUserActionId(userId);
    setUsersError('');
    try {
      await unsuspendAdminUser(userId);
      setToast({ type: 'success', message: 'İşlem tamamlandı. Askı kaldırıldı.' });
      await Promise.all([loadUsers(), refreshSuspendedCount()]);
    } catch (error) {
      setUsersError(error.message || 'Bir hata oluştu.');
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    } finally {
      setUserActionId(null);
    }
  }

  async function handleReportStatus(reportId, nextStatus) {
    setReportActionId(reportId);
    setReportsError('');
    try {
      await updateReportStatus(reportId, nextStatus);
      setToast({ type: 'success', message: 'İşlem tamamlandı.' });
      await loadReports();
    } catch (error) {
      setReportsError(error.message || 'Bir hata oluştu.');
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    } finally {
      setReportActionId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings
      .filter((item) => status === 'all' || item.status === status)
      .filter((item) => !q || [item.title, item.category, item.categoryLabel, item.location, item.seller, item.email, item.phone].filter(Boolean).join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [listings, status, query]);

  async function rejectSelected() {
    if (!selected) return;
    if (!rejectNote.trim()) {
      setToast({ type: 'error', message: 'Red nedeni yazmalısın.' });
      return;
    }
    if (!confirm('Bu ilan reddedilsin mi? Satıcı red nedenini görebilir.')) return;
    try {
      await onReject(selected.id, rejectNote);
      setToast({ type: 'success', message: 'İşlem tamamlandı. İlan reddedildi.' });
      setSelected(null);
      setRejectNote('');
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    }
  }

  async function approveListing(id) {
    try {
      await onApprove(id);
      setToast({ type: 'success', message: 'İşlem tamamlandı. İlan onaylandı.' });
      if (selected?.id === id) setSelected(null);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Bir hata oluştu.' });
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Yönetim paneli</h2>
              <p className="text-sm text-slate-500">İlan moderasyonu, şikayetler, kullanıcılar ve ödeme onayları</p>
            </div>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 hover:bg-slate-200" aria-label="Kapat"><X size={20} /></button>
          </div>
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { key: 'overview', label: 'Genel bakış', icon: LayoutDashboard },
              { key: 'listings', label: 'İlan moderasyonu', icon: Filter, badge: stats.pending },
              { key: 'reports', label: 'Şikayet kutusu', icon: Flag, badge: stats.openReports },
              { key: 'users', label: 'Kullanıcılar', icon: UserRound, badge: stats.suspendedUsers },
              { key: 'payments', label: 'Bekleyen ödemeler', icon: Wallet, badge: stats.pendingPaymentsCount },
              { key: 'revenue', label: 'Gelir özeti', icon: BarChart3 },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ${section === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                <Icon size={16} /> {label}
                {badge > 0 ? <span className={`rounded-full px-2 py-0.5 text-[11px] ${section === key ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>{badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-7">
          {section === 'overview' ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black">Pazar özeti</div>
                  <p className="mt-1 text-xs text-slate-500">Operasyon önceliği gerektiren kalemler.</p>
                </div>
                <button onClick={() => { loadDashboard(); loadPendingPayments(); }} disabled={dashboardLoading} className="inline-flex min-h-[44px] items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60">
                  <RefreshCw size={14} className={dashboardLoading ? 'animate-spin' : ''} /> Yenile
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AdminStat icon={Clock} label="Onay bekleyen ilanlar" value={stats.pending} hint="Bekleyen ilanları inceleyip onayla veya reddet." onClick={() => { setSection('listings'); setStatus('pending'); }} />
                <AdminStat icon={Flag} label="Açık şikayetler" value={stats.openReports} hint="Şikayet çözümü ilanı otomatik silmez." onClick={() => setSection('reports')} />
                <AdminStat icon={UserRound} label="Askıdaki kullanıcılar" value={stats.suspendedUsers} onClick={() => { setSection('users'); setUserFilter('suspended'); }} />
                <AdminStat icon={Wallet} label="Bekleyen ödemeler" value={stats.pendingPaymentsCount} hint="Ödendi olarak işaretleme hak aktive eder." onClick={() => setSection('payments')} />
                <AdminStat icon={Crown} label="Aktif öne çıkan ilanlar" value={dashboardMetrics?.premiumListings ?? stats.premium} />
                <AdminStat icon={BarChart3} label="Bugünkü yeni ilanlar" value={stats.todayListings} hint="Bugün oluşturulan ilan sayısı." onClick={() => setSection('listings')} />
              </div>
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
                <strong>Hızlı yönlendirme:</strong> Onay bekleyen ilan {stats.pending}, açık şikayet {stats.openReports}, bekleyen ödeme {stats.pendingPaymentsCount}.
                <button type="button" onClick={() => { setSection('listings'); setStatus('pending'); }} className="mt-3 inline-flex min-h-[44px] items-center gap-1 rounded-2xl bg-cyan-700 px-4 py-2 text-xs font-black text-white">
                  İlan moderasyonuna git <ChevronRight size={14} />
                </button>
              </div>
              <ProductInsightsPanel insights={productInsights} loading={dashboardLoading} />
            </section>
          ) : null}

          {section !== 'overview' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStat icon={Clock} label="Onay bekliyor" value={stats.pending} />
            <AdminStat icon={Flag} label="Açık şikayet" value={stats.openReports} />
            <AdminStat icon={Wallet} label="Bekleyen ödeme" value={stats.pendingPaymentsCount} />
            <AdminStat icon={Crown} label="Öne çıkan" value={stats.premium} />
          </div>
          ) : null}

          {section === 'users' ? (
            <section className="mt-6 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black">Kullanıcı yönetimi</div>
                  <p className="mt-1 text-xs text-slate-500">Askıya alma ilan silmez; riskli aksiyonları engeller.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(userFilterLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setUserFilter(key)} className={`rounded-2xl px-3 py-2 text-xs font-black ${userFilter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="border-b border-slate-200 p-4">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Ad, mağaza, rol veya kullanıcı ID ara" className="w-full bg-transparent text-sm outline-none" />
                  <button onClick={loadUsers} disabled={usersLoading} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Ara</button>
                </div>
              </div>

              {usersError && <div className="mx-4 mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{usersError}</div>}

              <div className="divide-y divide-slate-100">
                {usersLoading ? (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Kullanıcılar yükleniyor...</div>
                ) : users.map((userRow) => (
                  <div key={userRow.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${userStatusClass(userRow.is_suspended)}`}>{userRow.is_suspended ? 'Askıda' : 'Aktif'}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{formatRole(userRow.role)}</span>
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-950">{userRow.displayName}</div>
                      <div className="mt-1 text-xs font-bold text-slate-400">ID: {userRow.id}</div>
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        <div><strong>Kayıt:</strong> {formatDate(userRow.created_at)}</div>
                        <div><strong>İlan:</strong> {userRow.listingCount} • <strong>Şikayet:</strong> {userRow.reportCount}</div>
                        {userRow.is_suspended && userRow.suspension_reason ? <div className="mt-2 rounded-2xl bg-rose-50 p-3 text-sm leading-6 text-rose-800"><strong>Sebep:</strong> {userRow.suspension_reason}</div> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {userRow.is_suspended ? (
                        <button disabled={userActionId === userRow.id} onClick={() => handleUnsuspendUser(userRow.id)} className="min-h-[44px] rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Askıyı kaldır</button>
                      ) : canSuspendUser(userRow) ? (
                        <button disabled={userActionId === userRow.id} onClick={() => { setSuspendTarget(userRow); setSuspendReason(''); }} className="min-h-[44px] rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Askıya al</button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Bu hesap askıya alınamaz</span>
                      )}
                    </div>
                  </div>
                ))}

                {!usersLoading && users.length === 0 && (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Bu filtrede kullanıcı yok.</div>
                )}
              </div>
            </section>
          ) : section === 'payments' ? (
            <section className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black">Bekleyen ödemeler</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Ödendi olarak işaretle öne çıkarma veya Premium Satıcı hakkını aktive eder. Reddedilen ödeme hiçbir hak açmaz.</p>
                </div>
                <button onClick={loadPendingPayments} disabled={pendingLoading} className="inline-flex min-h-[44px] items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60">
                  <RefreshCw size={14} className={pendingLoading ? 'animate-spin' : ''} /> Yenile
                </button>
              </div>
              {pendingError && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{pendingError}</div>}
              <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="divide-y divide-slate-100">
                  {(pendingPayments || []).map((payment) => (
                    <div key={payment.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="space-y-2 text-sm">
                        <div className="font-black text-slate-950">{payment.reference || payment.id}</div>
                        <div className="grid gap-1 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                          <div><strong>Kullanıcı:</strong> {payment.userName}</div>
                          <div><strong>Sağlayıcı:</strong> {formatProvider(payment.provider)}</div>
                          <div><strong>Ürün:</strong> {formatProductType(payment.product_type)}</div>
                          <div><strong>Durum:</strong> Onay bekliyor</div>
                          {payment.listingTitle ? <div className="sm:col-span-2"><strong>İlan:</strong> {payment.listingTitle}</div> : null}
                          <div><strong>Tutar:</strong> {Number(payment.amount || 0).toLocaleString('tr-TR')} {payment.currency || 'XPF'}</div>
                          <div><strong>Tarih:</strong> {formatDate(payment.created_at)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button type="button" disabled={paymentActionId === payment.id} onClick={() => handleApprovePayment(payment.id)} className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">
                          <CheckCircle2 size={14} /> Ödendi olarak işaretle
                        </button>
                        <button type="button" disabled={paymentActionId === payment.id} onClick={() => setRejectPaymentTarget(payment)} className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-2xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-60">
                          <XCircle size={14} /> Reddet
                        </button>
                      </div>
                    </div>
                  ))}
                  {!pendingPayments?.length && !pendingLoading && <div className="py-10 text-center text-sm font-bold text-slate-400">Onay bekleyen ödeme yok.</div>}
                  {pendingLoading && !pendingPayments?.length && <div className="py-10 text-center text-sm font-bold text-slate-400">Yükleniyor...</div>}
                </div>
              </div>
              {rejectPaymentTarget && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-black text-rose-900">{rejectPaymentTarget.reference || rejectPaymentTarget.id} reddedilsin mi?</div>
                  <p className="mt-1 text-xs text-rose-800">Reddedilen ödeme herhangi bir premium/öne çıkarma hakkı açmaz.</p>
                  <textarea value={rejectPaymentReason} onChange={(event) => setRejectPaymentReason(event.target.value)} placeholder="Red sebebi (isteğe bağlı)" className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none" rows={3} />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={handleRejectPayment} disabled={paymentActionId === rejectPaymentTarget.id} className="min-h-[44px] rounded-2xl bg-rose-700 px-4 py-2 text-xs font-black text-white disabled:opacity-60">Reddetmeyi onayla</button>
                    <button type="button" onClick={() => { setRejectPaymentTarget(null); setRejectPaymentReason(''); }} className="min-h-[44px] rounded-2xl border border-rose-200 px-4 py-2 text-xs font-black text-rose-700">İptal</button>
                  </div>
                </div>
              )}
            </section>
          ) : section === 'revenue' ? (
            <section className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black">Gelir özeti</div>
                  <p className="mt-1 text-xs text-slate-500">Havale, EpayNC, Stripe ödemeleri ve aktif premium abonelikler.</p>
                </div>
                <button onClick={loadRevenue} disabled={revenueLoading} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60">
                  <RefreshCw size={14} className={revenueLoading ? 'animate-spin' : ''} /> Yenile
                </button>
              </div>

              {revenueError && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{revenueError}</div>}

              {revenueLoading && !revenue ? (
                <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">Gelir verileri yükleniyor...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <AdminStat icon={Crown} label="Aktif Premium Satıcı" value={revenue?.metrics?.activePremiumSellers ?? 0} />
                    <AdminStat icon={Eye} label="Aktif öne çıkan ilan" value={revenue?.metrics?.activeFeaturedListings ?? 0} />
                    <AdminStat icon={Wallet} label="Bu ay gelir" value={`${Number(revenue?.metrics?.revenueThisMonth || 0).toLocaleString('tr-TR')} ${revenue?.metrics?.currency || 'XPF'}`} />
                    <AdminStat icon={BarChart3} label="Toplam gelir" value={`${Number(revenue?.metrics?.revenueAllTime || 0).toLocaleString('tr-TR')} ${revenue?.metrics?.currency || 'XPF'}`} hint={`${revenue?.metrics?.pendingPayments || 0} ödeme onay bekliyor`} onClick={() => setSection('payments')} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <div className="border-b border-slate-100 pb-3 text-sm font-black">Son ödemeler</div>
                      <div className="divide-y divide-slate-100">
                        {(revenue?.recentPayments || []).slice(0, 12).map((payment) => (
                          <div key={payment.id} className="grid gap-1 py-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-black text-slate-950">{formatProductType(payment.product_type) || payment.plan || 'Ödeme'}</span>
                              <span className="font-black text-emerald-700">{Number(payment.amount || 0).toLocaleString('tr-TR')} {payment.currency || 'XPF'}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-500">{formatDate(payment.paid_at || payment.created_at)} • {formatProductType(payment.product_type)} • {formatProvider(payment.provider)}{payment.reference ? ` • ${payment.reference}` : ''}</div>
                          </div>
                        ))}
                        {!revenue?.recentPayments?.length && <div className="py-8 text-center text-sm font-bold text-slate-400">Henüz ödeme kaydı yok.</div>}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <div className="border-b border-slate-100 pb-3 text-sm font-black">Aktif Premium Satıcı</div>
                      <div className="divide-y divide-slate-100">
                        {(revenue?.activePremiumSellers || []).map((seller) => (
                          <div key={seller.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                            <span className="font-black text-slate-950">{seller.displayName}</span>
                            <span className="text-xs font-bold text-slate-500">{formatDate(seller.premiumEndsAt)}</span>
                          </div>
                        ))}
                        {!revenue?.activePremiumSellers?.length && <div className="py-8 text-center text-sm font-bold text-slate-400">Aktif abonelik yok.</div>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : section === 'reports' ? (
            <section className="mt-6 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black">Şikayet kutusu</div>
                  <p className="mt-1 text-xs text-slate-500">Şikayet çözümü ilanı silmez. Gerekirse ayrı moderasyon adımı uygula.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reportFilterLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setReportFilter(key)} className={`rounded-2xl px-3 py-2 text-xs font-black ${reportFilter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
                  ))}
                  <button onClick={loadReports} disabled={reportsLoading} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
                    <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} /> Yenile
                  </button>
                </div>
              </div>

              {reportsError && <div className="mx-4 mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{reportsError}</div>}

              <div className="divide-y divide-slate-100">
                {reportsLoading ? (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Şikayetler yükleniyor...</div>
                ) : reports.map((report) => (
                  <div key={report.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${reportStatusClass(report.status)}`}>{REPORT_STATUS_LABELS[report.status] || report.status}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{REPORT_REASON_LABELS[report.reason] || report.reason}</span>
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-950">{report.listingTitle}</div>
                      <div className="mt-1 text-xs font-bold text-slate-400">İlan ID: {report.listing_id}</div>
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        <div><strong>Bildiren:</strong> {report.reporterName}</div>
                        <div><strong>Tarih:</strong> {formatDate(report.created_at)}</div>
                        {report.details ? <div className="mt-2 whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{report.details}</div> : <div className="text-slate-400">Ek açıklama yok.</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {report.status === 'open' && (
                        <button disabled={reportActionId === report.id} onClick={() => handleReportStatus(report.id, 'reviewing')} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">İncelemeye al</button>
                      )}
                      {(report.status === 'open' || report.status === 'reviewing') && (
                        <>
                          <button disabled={reportActionId === report.id} onClick={() => handleReportStatus(report.id, 'resolved')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Çözüldü</button>
                          <button disabled={reportActionId === report.id} onClick={() => handleReportStatus(report.id, 'dismissed')} className="min-h-[44px] rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Geçersiz say</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {!reportsLoading && reports.length === 0 && (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Bu filtrede şikayet yok.</div>
                )}
              </div>
            </section>
          ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="mb-3 flex items-center gap-2 text-sm font-black"><Filter size={17} /> Filtreler</div>
                <div className="grid gap-2">
                  {Object.entries(listingStatusLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setStatus(key)} className={`min-h-[44px] rounded-2xl px-4 py-3 text-left text-sm font-bold ${status === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık, satıcı, kategori ara" className="w-full bg-transparent text-sm outline-none" />
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-black"><AlertTriangle size={18} /> Operasyon notu</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">Onay bekleyen ilan detayına girilemiyorsa admin panel işlevsizdir. Bu sürümde her ilan tek tıkla detay/önizleme açar.</p>
              </div>
            </aside>

            <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 p-4">
                <div className="text-sm font-black">{filtered.length} ilan listeleniyor</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <div key={item.id} className="grid gap-4 p-4 md:grid-cols-[92px_1fr_auto] md:items-center">
                    <button onClick={() => setSelected(item)} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(item.status)}`}>{listingStatusLabel(item.status)}</span>
                        {item.isFeatured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">Öne çıkan</span>}
                        {(item.premiumSeller || item.sellerPlan === 'premium_seller') && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">Premium Satıcı</span>}
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Güven: {item.trustScore || 0}/100</span>
                      </div>
                      <button onClick={() => setSelected(item)} className="mt-2 block text-left text-lg font-black hover:underline">{item.title}</button>
                      <div className="mt-1 text-sm text-slate-500">{item.categoryLabel || item.category} • {item.location} • {item.priceText}</div>
                      {item.status === 'rejected' && item.rejected_reason ? <div className="mt-2 text-xs font-semibold text-rose-600">Red nedeni: {item.rejected_reason}</div> : null}
                      <div className="mt-1 text-xs text-slate-400">{formatDate(item.created_at)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button onClick={() => setSelected(item)} className="min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">Detay</button>
                      {item.status !== 'approved' && <button onClick={() => approveListing(item.id)} className="min-h-[44px] rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Onayla</button>}
                      {item.status !== 'rejected' && <button onClick={() => { setSelected(item); setRejectNote(''); }} className="min-h-[44px] rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white">Reddet</button>}
                      <button onClick={() => onFeature(item.id)} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white">Öne çıkar</button>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Bu filtrede ilan yok.</div>
                )}
              </div>
            </section>
          </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-xl font-black">İlan detay / moderasyon</h3>
                <p className="text-sm text-slate-500">Yönetim panelinde ilanın tamamını görür ve karar verirsin.</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 p-2"><X size={20} /></button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
              <div className="p-5">
                <div className="overflow-hidden rounded-3xl bg-slate-100">
                  <img src={selected.image} alt={selected.title} className="max-h-[420px] w-full object-cover" />
                </div>
                <div className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(selected.status)}`}>{listingStatusLabel(selected.status)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{selected.categoryLabel || selected.category}</span>
                  </div>
                  <h4 className="mt-3 text-2xl font-black">{selected.title}</h4>
                  <div className="mt-2 text-2xl font-black text-slate-900">{selected.priceText}</div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{selected.description || 'Açıklama yok.'}</p>
                </div>

                {selected.attributes && Object.keys(selected.attributes).length > 0 && (
                  <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="mb-3 text-sm font-black">Kategori alanları</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(selected.attributes).filter(([, value]) => Boolean(value)).map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-100">
                          <div className="text-xs font-bold text-slate-400">{key}</div>
                          <div className="font-bold text-slate-700">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-2 text-sm font-black"><UserRound size={18} /> Satıcı</div>
                    <div className="mt-3 text-sm text-slate-600">
                      <div><strong>Ad:</strong> {selected.seller || '-'}</div>
                      <div><strong>Telefon:</strong> {selected.phone || '-'}</div>
                      <div><strong>E-posta:</strong> {selected.email || '-'}</div>
                      <div><strong>Konum:</strong> {selected.location || '-'}</div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black">Güven / Risk skoru</div>
                      <div className="text-xl font-black">{selected.trustScore || 0}</div>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${selected.trustScore || 0}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">55 altı skorlar manuel kontrol gerektirir.</p>
                  </div>

                  {selected.status === 'rejected' && selected.rejected_reason ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                      <strong>Red nedeni:</strong> {selected.rejected_reason}
                    </div>
                  ) : null}

                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">Red nedeni</span>
                    <textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={3} placeholder="Eksik fotoğraf, şüpheli fiyat, yasaklı içerik..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </label>

                  <div className="grid gap-2">
                    <button onClick={() => approveListing(selected.id)} className="min-h-[48px] rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"><CheckCircle2 className="mr-2 inline" size={17} /> Onayla</button>
                    <button onClick={rejectSelected} className="min-h-[48px] rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white"><XCircle className="mr-2 inline" size={17} /> Reddet</button>
                    <button onClick={async () => { await onFeature(selected.id); setSelected(null); }} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white"><Crown className="mr-2 inline" size={17} /> Öne çıkarmayı değiştir</button>
                    <button onClick={async () => { if (confirm('Bu ilan silinsin mi?')) { await onDelete(selected.id); setSelected(null); } }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Trash2 className="mr-2 inline" size={17} /> Sil</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {toast ? (
        <div className={`fixed bottom-5 left-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-black shadow-xl ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.message}
        </div>
      ) : null}

      {suspendTarget && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">Kullanıcıyı askıya al</h3>
                <p className="mt-1 text-sm text-slate-500">{suspendTarget.displayName} hesabı riskli aksiyonlardan engellenecek.</p>
              </div>
              <button onClick={() => setSuspendTarget(null)} className="rounded-full bg-slate-100 p-2"><X size={20} /></button>
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">Askıya alma sebebi</span>
              <textarea value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} rows={4} placeholder="Spam, dolandırıcılık, tekrarlayan ihlal..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setSuspendTarget(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Vazgeç</button>
              <button onClick={handleSuspendUser} disabled={userActionId === suspendTarget.id} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{userActionId === suspendTarget.id ? 'Kaydediliyor...' : 'Askıya al'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
