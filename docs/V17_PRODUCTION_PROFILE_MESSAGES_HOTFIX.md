# V17 Production Profile & Messages Hotfix

Bu paket production ortamında görülen iki sorunu hedefler:

1. Profil modalının `Profil yükleniyor...` ekranında kalması.
2. Mesajlar modalında timeout/RLS/realtime uyarısı görünmesi.

## Yapılacaklar

1. Paketi projeye çıkar.
2. Terminal:

```bash
npm install
npm run dev
```

3. Supabase SQL Editor'da çalıştır:

```sql
sql/v17-production-profile-messages-hotfix.sql
```

4. Git commit + push:

```bash
git add .
git commit -m "fix production profile and messages"
git push
```

5. Vercel otomatik deploy tamamlandıktan sonra production URL'de profil ve mesajlar modallarını tekrar test et.
