export function formatNotificationTime(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün önce`;
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  } catch {
    return '';
  }
}

function normalizeLegacyTitle(title = '') {
  const value = String(title || '').trim();
  if (/^İlanın onaylandı$/i.test(value)) return 'İlanınız onaylandı';
  if (/^İlanın reddedildi$/i.test(value)) return 'İlanınız reddedildi';
  if (/^Yeni mesaj$/i.test(value)) return 'Yeni mesajınız var';
  if (/^Öne çıkan ilan aktif$/i.test(value)) return 'Öne çıkarma aktif edildi';
  if (/^Premium Satıcı aktif$/i.test(value)) return 'Premium Satıcı aktif edildi';
  return value || 'Bildirim';
}

export function normalizeNotification(item = {}) {
  const type = String(item.type || 'info').toLowerCase();
  const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const listingId = item.listing_id || metadata.listing_id || null;
  const conversationId = item.conversation_id || metadata.conversation_id || null;

  let displayTitle = normalizeLegacyTitle(item.title);
  let displayMessage = String(item.body || item.message || '').trim();
  let actionLabel = null;
  let actionTarget = null;

  switch (type) {
    case 'listing_approved':
      displayTitle = 'İlanınız onaylandı';
      displayMessage = displayMessage || 'İlanınız yayına alındı.';
      actionLabel = 'İlanlarım';
      actionTarget = 'my_listings';
      break;
    case 'listing_rejected':
      displayTitle = 'İlanınız reddedildi';
      displayMessage = 'Red nedenini İlanlarım bölümünden görebilirsiniz.';
      actionLabel = 'İlanlarım';
      actionTarget = 'my_listings';
      break;
    case 'new_message':
      displayTitle = 'Yeni mesajınız var';
      displayMessage = displayMessage || 'Bir konuşmada yeni mesaj aldınız.';
      actionLabel = 'Konuşmayı aç';
      actionTarget = 'messages';
      break;
    case 'premium_activated':
      displayTitle = 'Öne çıkarma aktif edildi';
      displayMessage = displayMessage || 'Öne çıkan ilan hakkınız aktif.';
      if (listingId) {
        actionLabel = 'İlanı gör';
        actionTarget = 'listing';
      }
      break;
    case 'premium_seller_activated':
      displayTitle = 'Premium Satıcı aktif edildi';
      displayMessage = displayMessage || 'Premium Satıcı aboneliğiniz başladı.';
      break;
    case 'payment_pending':
    case 'payment_request':
      displayTitle = 'Ödeme talebiniz oluşturuldu';
      displayMessage = displayMessage || 'Manuel ödeme onayı bekleniyor.';
      actionLabel = 'Ödeme durumu';
      actionTarget = 'payment_pending';
      break;
    case 'account_suspended':
    case 'user_suspended':
      displayTitle = 'Hesabınız askıya alındı';
      displayMessage = displayMessage || 'Hesabınız geçici olarak askıya alındı. Destek ile iletişime geçin.';
      break;
    case 'report_received':
    case 'report_submitted':
      displayTitle = 'Şikayetiniz alındı';
      displayMessage = displayMessage || 'Şikayetiniz incelenmek üzere kaydedildi.';
      break;
    case 'report_resolved':
    case 'report_reviewed':
      displayTitle = 'Şikayetiniz incelendi';
      displayMessage = displayMessage || 'Şikayet durumunuz güncellendi.';
      if (listingId) {
        actionLabel = 'İlanı gör';
        actionTarget = 'listing';
      }
      break;
    default:
      if (/onayland/i.test(displayTitle)) {
        actionLabel = 'İlanlarım';
        actionTarget = 'my_listings';
      }
      if (/reddedildi/i.test(displayTitle)) {
        displayMessage = displayMessage || 'Red nedenini İlanlarım bölümünden görebilirsiniz.';
        actionLabel = 'İlanlarım';
        actionTarget = 'my_listings';
      }
      if (/mesaj/i.test(displayTitle)) {
        actionLabel = 'Konuşmayı aç';
        actionTarget = 'messages';
      }
      if (!displayMessage) displayMessage = 'Önemli bir gelişme var.';
      break;
  }

  return {
    ...item,
    type,
    displayTitle,
    displayMessage,
    actionLabel,
    actionTarget,
    listingId,
    conversationId,
  };
}
