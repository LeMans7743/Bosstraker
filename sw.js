<script type="text/plain" id="sw-code">
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('push', e => {
  const data = e.data ? e.data.text() : 'BOSS通知';
  e.waitUntil(
    self.registration.showNotification('BOSS提醒', { body: data })
  );
});
</script>