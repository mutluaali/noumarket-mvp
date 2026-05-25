const fs = require('fs');
const path = require('path');

const pagePath = path.join(process.cwd(), 'app', 'page.jsx');

if (!fs.existsSync(pagePath)) {
  console.error('app/page.jsx bulunamadı. Bu scripti proje ana klasöründe çalıştırmalısın.');
  process.exit(1);
}

let src = fs.readFileSync(pagePath, 'utf8');

// Fix broken Header prop produced by previous patch:
// onAuth={(_) onNotifications...  -> onAuth={() => setShowAuth(true)}\n        onNotifications...
src = src.replace(
  /onAuth=\{\(\_\)\s+onNotifications=\{\(\)\s*=>\s*user\s*\?\s*setShowNotifications\(true\)\s*:\s*setShowAuth\(true\)\}\}/g,
  'onAuth={() => setShowAuth(true)}\n        onNotifications={() => user ? setShowNotifications(true) : setShowAuth(true)}'
);

// If Header has no onNotifications prop but has notificationCount, inject before notificationCount.
if (!/onNotifications=\{/.test(src) && /notificationCount=\{/.test(src)) {
  src = src.replace(
    /(\s+)notificationCount=\{/,
    '$1onNotifications={() => user ? setShowNotifications(true) : setShowAuth(true)}$1notificationCount={'
  );
}

// Ensure NotificationsModal is mounted once if imports/component exists. We keep this conservative.
if (/showNotifications/.test(src) && /NotificationsModal/.test(src) && !/isOpen=\{showNotifications\}/.test(src)) {
  src = src.replace(
    /(\s*<\/main>)/,
    `\n      <NotificationsModal\n        isOpen={showNotifications}\n        onClose={() => setShowNotifications(false)}\n        user={user}\n      />\n$1`
  );
}

fs.writeFileSync(pagePath, src, 'utf8');
console.log('Bildirim syntax fix uygulandı. Şimdi npm run build çalıştır.');
