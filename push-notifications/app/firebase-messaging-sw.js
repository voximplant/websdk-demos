/*
* ToDo: replace YOUR_SENDER_ID with the one from your Firebase app - https://console.firebase.google.com/u/0/project/_/settings/cloudmessaging/
* */
const config = {
  YOUR_SENDER_ID: '1111111111111',
};

/*
* Give the service worker access to Firebase Messaging.
* Note that you can only use Firebase Messaging here, other Firebase libraries are not available in the service worker.
* */
importScripts('https://www.gstatic.com/firebasejs/6.1.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/6.1.0/firebase-messaging.js');
/*
* Initialize the Firebase app in the service worker by passing in the messagingSenderId
* */
firebase.initializeApp({
  'messagingSenderId': config.YOUR_SENDER_ID
});

/*
* Retrieve an instance of Firebase Messaging so that it can handle background messages.
* */
const messaging = firebase.messaging();
/*
* Message with the incoming call info
* */
let message = '';

/*
* Handle push notifications when your app is in the background
* */
messaging.setBackgroundMessageHandler((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  if (payload.data.hasOwnProperty('voximplant')) {
    /*
    * ToDo: customize notification here
    * */
    const data = JSON.parse(payload.data.voximplant);
    const notificationOptions = {
      body: `A call from ${data.display_name}`,
      icon: '/firebase-logo.png',
      click_action: `${self.origin}/`
    };
    /*
    * Save incoming call info
    * */
    message = payload;

    /*
    * Show push notifications
    * */
    return self.registration.showNotification('Voximplant app', notificationOptions);
  }
});

/*
* Open your app when notification is clicked
* */
self.addEventListener('notificationclick', (e) => {
  /*
  * Check if your app is opened, then focus its tab or open a new one
  * */
  const promiseChain = clients.matchAll({type: 'window', includeUncontrolled: true})
    .then((tabs) => {
      const appTab = tabs.find((tab) => `${self.origin}/` === tab.url);

      if (appTab) {
        appTab.focus();

        return appTab;
      } else {
        return clients.openWindow(`${self.origin}/`);
      }
    })
    .then((tab) => {
    /*
    * Send the incoming call info to the app page
    * */
      tab.postMessage({message: message});
    });

    e.waitUntil(promiseChain);
});