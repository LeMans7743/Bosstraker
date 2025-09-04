importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyC6mq6ukjzpNmaIy5dLewwHqrJTTpaB2jA",
  authDomain: "bosstrackerweb.firebaseapp.com",
  projectId: "bosstrackerweb",
  storageBucket: "bosstrackerweb.firebasestorage.app",
  messagingSenderId: "620047423570",
  appId: "1:620047423570:web:2d1881a9edc1a1b6cba78b",
  measurementId: "G-9Y5MM0C4Y8"
});
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
