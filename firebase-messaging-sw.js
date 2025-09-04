// 必須在 GitHub Pages 根目錄
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC6mq6ukjzpNmaIy5dLewwHqrJTTpaB2jA",
  authDomain: "bosstrackerweb.firebaseapp.com",
  projectId: "bosstrackerweb",
  storageBucket: "bosstrackerweb.firebasestorage.app",
  messagingSenderId: "620047423570",
  appId: "1:620047423570:web:2d1881a9edc1a1b6cba78b"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 背景推播通知處理
messaging.onBackgroundMessage((payload) => {
  console.log("收到背景訊息: ", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png" // 你可以自訂一張小圖
  });
});
