# V32 Auth Session Hotfix

Bu sürüm production ortamında görülen giriş modalının kapanmaması ve sayfa geçişlerinde session kaybı problemini düzeltir.

## Değişiklikler

- Supabase client auth ayarları production persistence için güçlendirildi.
- `getStableSession()` helper eklendi.
- Login sonrası full page reload yerine doğrudan app state güncelleniyor.
- Auth işlemlerine timeout eklendi; giriş ekranı sonsuz `İşleniyor...` durumunda kalmaz.
- App açılışında session birkaç kısa retry ile okunuyor.

## Kurulum

```bash
npm install
npm run dev
```

## Deploy

```bash
git add .
git commit -m "fix production auth session persistence"
git push
```
