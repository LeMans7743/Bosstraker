importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js');

// 初始化 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC6mq6ukjzpNmaIy5dLewwHqrJTTpaB2jA",
  authDomain: "bosstrackerweb.firebaseapp.com",
  projectId: "bosstrackerweb",
  storageBucket: "bosstrackerweb.firebasestorage.app",
  messagingSenderId: "620047423570",
  appId: "1:620047423570:web:2d1881a9edc1a1b6cba78b"
};
firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 取得 Messaging 實例
const messaging = firebase.messaging();

// 處理背景通知
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 收到背景訊息:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
