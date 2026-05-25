NouMarket temizlenmiş düzeltme paketi

Yapılan ana düzeltmeler:
1. app/page.jsx içindeki bozuk Header prop satırı düzeltildi.
   - Bildirim ikonunun modal açma bağlantısı tekrar bağlandı.
   - Giriş yapılmamışsa bildirim yerine giriş modalı açılır.

2. Bildirim altyapısı güvenli hale getirildi.
   - components/NotificationsModal.jsx mevcut safe async yapısıyla çalışır.
   - supabase/notifications_rls_fix.sql güncellendi.
   - is_read kolonu, indexler ve RLS policy eklendi.

3. Eksik helper/export problemi giderilmiş durumda.
   - lib/safeAsync.js içinde getErrorMessage, withTimeout, safeAsync exportları mevcut.

4. Gereksiz patch/back-up dosyaları temizlendi.
   - apply-*.cjs gibi geçici scriptler kaldırıldı.
   - .bak dosyaları kaldırıldı.

Kurulum:
1. Bu zip içindeki noumarket-mvp klasöründeki dosyaları mevcut proje klasörünün üzerine kopyala.
2. Supabase > SQL Editor içinde şunu çalıştır:
   supabase/notifications_rls_fix.sql
3. Terminal:
   npm install
   npm run build
4. Build başarılıysa:
   git add .
   git commit -m "Clean project and fix notifications"
   git push

Not:
Bu pakette node_modules, .next ve .git klasörleri özellikle yoktur.
Bunlar projeye dahil edilmez; npm install ve Vercel build sırasında yeniden oluşur.
.env.local dosyana dokunma; mevcut proje klasöründe kalmalı.
