# V21 Performance Checklist

## Production kontrolü

- Vercel build başarılı mı?
- Supabase env değişkenleri Production ve Preview ortamlarında var mı?
- Ana sayfa mobilde 3 saniye altında açılıyor mu?
- İlan fotoğrafları lazy loading çalışıyor mu?
- Büyük görsel upload engelleniyor mu?
- Modal açılışlarında sonsuz loading kalıyor mu?
- Admin panel hataları kullanıcıya görünür ve anlaşılır dönüyor mu?
- Chat ve profil modalı production'da takılmadan sonuç veriyor mu?

## Sonraki teknik borç

- API route'larda standart response formatına geç
- Supabase sorgularını tek data-access layer altında topla
- Gerçek distributed rate limit ekle
- Sentry veya Vercel Observability ile runtime error tracking kur
