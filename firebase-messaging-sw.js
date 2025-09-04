importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js");

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

messaging.onBackgroundMessage((payload)=>{
  console.log('[firebase-messaging-sw.js] 背景訊息 ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "https://placehold.co/100x100/ef4444/fff?text=BOSS"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});