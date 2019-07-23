# Automatic call restoration

This module allows to automatically restoring the current call if you're experiencing network issues.

### How to use

1. Clone this repo.
1. Go to the [Applications section](https://manage.voximplant.com/applications) of the Voximplant control panel and click to your application.
1. Switch to the __Scenarios__ tab and create a new scenario. Paste here the code from the `Scenarios.VoxEngine.js` file, then save your scenario.
1. Install and open [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb), click __Choose folder__, and specify the repo folder. Open the suggested __Web Server URL__ in your browser.
1. Fill in the `username` and `password` fields, e.g.:
    * username: `username@appname.account.voximplant.com`
    * password: `12345`
1. Perform the steps 1-6 on another device; log in as  another operator in step 5.
1. Start an outgoing call to the second operator and answer it from the second operator's party.
1. Simulate a problem with the network, e.g., you can turn off your WiFi. 
1. After 3 seconds you will see a notification about problems in the call, and you will have 15 seconds to fix it.
1. If you manage to fix the network issues in 15 seconds, your connection will be restored, otherwise your call will be terminated.
