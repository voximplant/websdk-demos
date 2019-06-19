#  Voximplant logger collector


This module allows to collect logs about calls state and send it to your backend server.

### How to use

1. Clone this repo.
1. Go to the [Applications section](https://manage.voximplant.com/applications) of the Voximplant control panel and click your application.
1. Switch to the __Scenarios__ tab and create a new scenario. Paste here the code from the `Scenarios.VoxEngine.js` file, then save your scenario.
1. Go to the repo folder, open `logger.js`, and paste your backend server's hostname on the line 43. Save the file.
1. Open `index.html` in any browser.
1. Fill in the `username` and `password` fields, e.g.:
    * username: `username@appname.account.voximplant.com`
    * password: `12345`
1. Start an outgoing call or answer an incoming one.
1. When you need to send your logs, push the `Report` button.
