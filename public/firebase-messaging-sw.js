/* eslint-disable no-var */
/*
Give the service worker access to Firebase Messaging.
Note that you can only use Firebase Messaging here, other Firebase libraries are not available in the service worker.
*/
importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.13.0/firebase-messaging.js');

/*
Initialize the Firebase app in the service worker by passing in the messagingSenderId.
*/
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
  apiKey: 'AIzaSyD6O3FYY3Ja39ADixqOeElZu3_1ZIaxUgU',
  authDomain: 'enablex-web-push.firebaseapp.com',
  databaseURL: 'https://enablex-web-push.firebaseio.com',
  projectId: 'enablex-web-push',
  storageBucket: 'enablex-web-push.appspot.com',
  messagingSenderId: '370738563393',
  appId: '1:370738563393:web:5f8ca3f10a15aaba0639c0',
  measurementId: 'G-VB9KBKQ5EV',
};
// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
firebase.initializeApp({ messagingSenderId: '370738563393' });

/*
Retrieve an instance of Firebase Messaging so that it can handle background messages.
*/
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', JSON.stringify(payload));
  const notification = JSON.parse(payload.data.notification);
  // Customize notification here
  const notificationTitle = notification.title;
  const notificationOptions = {
    body: notification.body,
    icon: notification.icon,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
