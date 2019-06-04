Voximplant push notifications for web are based on the Firebase Cloud Messaging (FCM) platform. Using notifications, a client can be informed about incoming calls when an app tab is inactive or closed 

**To make this demo work you need some additional setup**:

    To enable push notifications you need to create a Firebase project:
    - Sign into Firebase using your Google account.
    - In the Firebase console, click Add project, then select an existing or enter a new Project name.
    
    Configure Web Credentials with FCM and add them to your Voximplant application:
    - Generate a new key pair through the Firebase Console (in Cloud Messaging Settings)
    - Open Push Certificates tab in your target application in the Voximplant Control panel and click Add Certificate. 
    - Fill the form with firebase credentials.
    
    To make the Voximplant cloud send push notifications, add a push service to the JavaScript scenario that initiates a call:
    `require(Modules.PushService);`
    
    Then just use the callUser or forwardCallToUser method in the scenario – push notifications will be sent automatically to the app so that it can wake up, connect to Voximplant, log in and accept the call.

    Review all ToDos in main.js and firebase-messaging-sw.js and replace the fake data with your credentials and data.
    
Then run `npm run start` and open your demo on http://127.0.0.1:3000.

Core things for implementing push notifications that you'll find in this demo:
- a manifest.json configuration file with a gcm_sender_id (do not change the value),
- a Firebase Messaging service worker defined in a file called firebase-messaging-sw.js and located in the root of your app domain,
- passing FCM project public key to Firebase Messaging SDK and passing Firebase push notification token to Voximplant Cloud to subscribe for push notifications in your web app,
- handler for messages received from the service worker which notifies the Voximplant cloud that a push notification is received and a user is ready to answer a call.