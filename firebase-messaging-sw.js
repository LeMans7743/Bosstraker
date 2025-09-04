// firebase-messaging-sw.js
// 引入 Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.8/firebase-messaging.js');

// 初始化 Firebase
// 請注意，這裡的設定必須與 index.html 中的相同
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

// 監聽背景通知
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // 取得通知標題和內容
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
