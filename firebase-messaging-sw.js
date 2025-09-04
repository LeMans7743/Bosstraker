// firebase-messaging-sw.js (放在網站根目錄)
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js');

// 下面填你的 firebaseConfig（與 index.html 一樣）
const firebaseConfig = {
  apiKey: "AIzaSyC6mq6ukjzpNmaIy5dLewwHqrJTTpaB2jA",
  authDomain: "bosstrackerweb.firebaseapp.com",
  projectId: "bosstrackerweb",
  storageBucket: "bosstrackerweb.firebasestorage.app",
  messagingSenderId: "620047423570",
  appId: "1:620047423570:web:2d1881a9edc1a1b6cba78b"
};

firebase.initializeApp(firebaseConfig);

/** @type {import('@firebase/messaging').FirebaseMessaging} */
const messaging = firebase.messaging();

// 當 Service Worker 在背景收到 FCM Push 時會被觸發
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'BOSS通知';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
