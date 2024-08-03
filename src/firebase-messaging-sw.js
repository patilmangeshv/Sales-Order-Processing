// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.15.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "",
  authDomain: "mvp-ops-d.firebaseapp.com",
  databaseURL: "https://mvp-ops-d.firebaseio.com",
  projectId: "mvp-ops-d",
  storageBucket: "mvp-ops-d.appspot.com",
  messagingSenderId: "508214365781",
  appId: "1:508214365781:web:12086c5b9f17c342938edc",
  measurementId: "G-3R45Y64P02"
})
// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// // Handle incoming messages. Called when:
// // - a message is received while the app has focus
// // - the user clicks on an app notification created by a service worker
// //   `messaging.setBackgroundMessageHandler` handler.
// messaging.onMessage((payload) => {
//   console.log('Message received in SW. ', payload);
// });

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Order is created';
  const notificationOptions = {
    body: 'Your order Id:.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});