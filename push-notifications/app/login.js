/*
* localStorage keys
* */
const lsTokensKey = 'voximplant_tokens';
const lsDeviceKey = 'voximplant_device_id';

/*
  * Get a Voximplant device ID
  * */
let deviceId = localStorage.getItem(lsDeviceKey);

if (!deviceId) {
  deviceId = sdk.getGUID();
  localStorage.setItem(lsDeviceKey, deviceId);
}
/*
* Get stored Voximplant tokens
* */
const lastTokens = localStorage.getItem(lsTokensKey);

/*
* login and auto login with token
* */
function logIntoVoxCloud() {
  /*
  * Log into Voximplant cloud
  * */
  if (lastTokens) {
    console.log('[VOX] last session tokens found');

    return sdk.loginWithToken(demoUser, JSON.parse(lastTokens).accessToken, {deviceToken: deviceId});
  } else {
    console.log('[VOX] no tokens found. Basic logging in');

    return sdk.login(demoUser, demoPassword, {deviceToken: deviceId});
  }
};

/*
* login error handler
* */
function handleLoginError(err) {
  /*
  * Login with refreshToken if accessToken has expired
  * */
  if (err.code === 701) {
    console.log('[VOX] can`t login with access token. Logging in with refresh token', err);

    sdk.loginWithToken(demoUser, JSON.parse(lastTokens).refreshToken, {deviceToken: deviceId})
      .then((result) => {
      /*
      * Update tokens in localStorage
      * */
      localStorage.setItem(lsTokensKey, JSON.stringify(result.tokens), {deviceToken: deviceId});
    runApp();
  })
  .catch((result) => {
      console.log('[VOX] can`t login with access token. Basic logging in');

    sdk.login(demoUser, demoPassword, {deviceToken: deviceId})
      .then(runApp);
  })
  } else {
    console.log('[VOX] can`t login with access token. Basic logging in');

    sdk.login(demoUser, demoPassword, {deviceToken: deviceId})
      .then(runApp);
  }
};