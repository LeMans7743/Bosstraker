importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js");

// TODO: 換成你的 firebaseConfig
firebase.initializeApp({
  apiKey: "AIzaSyC6mq6ukjzpNmaIy5dLewwHqrJTTpaB2jA",
  authDomain: "bosstrackerweb.firebaseapp.com",
  projectId: "bosstrackerweb",
  storageBucket: "bosstrackerweb.firebasestorage.app",
  messagingSenderId: "620047423570",
  appId: "1:620047423570:web:2d1881a9edc1a1b6cba78b",
  measurementId: "G-9Y5MM0C4Y8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] 背景收到:", payload);
  const title = payload.notification?.title || "BOSS 通知";
  const options = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico"
  };
  self.registration.showNotification(title, options);
});
