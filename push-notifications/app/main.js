/*
* For more information visit Firebase cloud messaging tutorials
* https://firebase.google.com/docs/cloud-messaging/js/client
* */

/*
* ToDo: provide your credentials instead of the demo data
* */
const demoUser = '111@push-notifications.me.voximplant.com';
const demoPassword = '123456';
const FCM_APP_PUBLIC_KEY = '1234567890qwertyuiopasdfghjklzxcvbnm';

/*
* ToDo: fill the firebaseConfig with your web app's Firebase project configuration
* https://console.firebase.google.com/u/0/
* */
const firebaseConfig = {
  apiKey: "AAAAaaaaaaaaaaaaaaaaaaaaaaaaaa",
  authDomain: "voximplant-11111.firebaseapp.com",
  databaseURL: "https://voximplant-11111.firebaseio.com",
  projectId: "voximplant-11111",
  storageBucket: "voximplant-11111.appspot.com",
  messagingSenderId: "1111111111111",
  appId: "1:1111111111111:web:111111111111111"
};

/*
* Initialize Firebase
* */
firebase.initializeApp(firebaseConfig);

/*
* Create Firebase messaging and Voximplant SDK instances
* */
const messaging = firebase.messaging();
const sdk = VoxImplant.getInstance();

/*
* Variable to check if a call from a push notification can be connected
* */
let isLoggedIn = false;

/*
* Incoming call from a push notification waiting for login
* */
let pendingCall = null;

/*
* Handle incoming push notifications
* */
navigator.serviceWorker.onmessage = (payload) => {
  console.log("[VOXPUSH] Message received. ", payload.data.message);

  /*
  * Check that the message you've received is from voximplant
  * */
  if (payload.data.message && payload.data.message.data.hasOwnProperty('voximplant')) {
    if (isLoggedIn) {
      sdk.handlePushNotification(JSON.parse(payload.data.message.data.voximplant));
    } else {
      pendingCall = () => sdk.handlePushNotification(JSON.parse(payload.data.message.data.voximplant));
    }
  }
};

/*
* Initialize Web SDK, connect to the Voximplant cloud and run your app logic
* */
sdk.init()
  .then(() => sdk.connect(false))
  .then(() => {
    console.log('[VOX] SDK connected');
    return logIntoVoxCloud();
  })
  .then(runApp)
  .catch(handleLoginError);

/*
* To call after logging into Voximplant cloud
* */
function runApp(result) {
  console.log('[VOX] logged in');
  isLoggedIn = true;

  /*
  * Receive the incoming call if there is one, then reset it
  * */
  if (pendingCall) {
    pendingCall().then(() => {
      pendingCall = null;
    });
  }

  /*
  * Show application layout
  * */
  document.getElementById('app').hidden = false;

  /*
  * Update Voximplant tokens after login
  * */
  if (result && result.tokens) {
    localStorage.setItem(lsTokensKey, JSON.stringify(result.tokens));
  }

  /*
  * Configure Firebase credentials to authorize send requests to supported web push services
  * Generate a new key pair in your app: https://console.firebase.google.com/u/0/project/_/settings/cloudmessaging/
  * and add a public key in usePublicVapidKey
  * */
  messaging.usePublicVapidKey(FCM_APP_PUBLIC_KEY);

  /*
  * Show push notifications permission request if a user chose to receive them
  * */
  document.getElementById('subscribe').onclick = () => Notification.requestPermission()
    .then(() => {
      /*
      * Get Firebase Instance ID token
      * */
      messaging.getToken()
        .then((currentToken) => {
        if (currentToken) {
          return sdk.registerForPushNotifications(currentToken);
        } else {
          console.log('[VOXPUSH] No Instance ID token available.');
      }
    })
    .then((result) => {
        console.log('[VOXPUSH] Token register success');
    })
    .catch((err) => {
        console.log('[VOXPUSH] An error occurred while registering token. ', err);
    });
  });

  /*
  * Handle Firebase Instance ID token refresh
  * */
  messaging.onTokenRefresh(() => {
    messaging.getToken()
      .then((refreshedToken) => {
        console.log('[VOXPUSH] New token arrived ', refreshedToken);

        return sdk.registerForPushNotifications(refreshedToken);
      })
      .then(() => {
          console.log('[VOXPUSH] New token register success');
      })
      .catch((err) => {
          console.log('[VOXPUSH] Unable to refresh token', err);
      });
  });

  /*
  * Handle incoming calls
  * */
  sdk.addEventListener(VoxImplant.Events.IncomingCall, (e) => {
    receiveCall(e.call);
    /*
    * Add handlers for call events
    * */
    e.call.addEventListener(VoxImplant.CallEvents.Connected, (ev) => {
      console.log('[VOXCALL] Call was connected succesfully');
      document.getElementById('status').innerText = `Ongoing call with ${e.call.number()}`;
    });
    e.call.addEventListener(VoxImplant.CallEvents.Disconnected, (ev) => {
      console.log('[VOXCALL] Call was disconnected');
      document.getElementById('status').innerText = 'No ongoing calls';
    });
    e.call.addEventListener(VoxImplant.CallEvents.Failed, (ev) => {
      console.log('[VOXCALL] Call failed:', ev.reason, `(${ev.code})`);
      document.getElementById('status').innerText = 'No ongoing calls';
    });
  });
};

function receiveCall(call) {
  console.log('[VOXCALL] A call from', call.number());
  document.getElementById('status').innerText = `Incomming call from ${call.number()}`;
  document.getElementById('answer').disabled = false;
  document.getElementById('hangup').disabled = false;
  document.getElementById('answer').onclick = () => {
    call.answer('', {}, true);
    document.getElementById('answer').disabled = true;
  }
  document.getElementById('hangup').onclick = () => {
    call.hangup();
    document.getElementById('answer').disabled = true;
    document.getElementById('hangup').disabled = true;
  }
}