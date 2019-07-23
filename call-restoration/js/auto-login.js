class TokenAuth {
    constructor() {
        this.vox = VoxImplant.getInstance();
        this.accessToken = '';
        this.refreshToken = '';
        this.loginName = '';
        this.fromLogin = false;
        this.errMessages = {
            404: 'Invalid username or password',
            401: 'Invalid token',
            500: 'Internal sever error',
            701: 'Invalid token'
        };
        this.getTokens();
        this.onAuth()
    }

    getTokens() {
        this.accessToken = localStorage.getItem('vox_token_a');
        this.refreshToken = localStorage.getItem('vox_token_r');
        this.loginName = localStorage.getItem('vox_login');
        this.fromLogin = localStorage.getItem('from_login');
        localStorage.removeItem('from_login');
    }

    setTokens(auth_token, login='') {
        localStorage.setItem('vox_token_a', auth_token.accessToken);
        localStorage.setItem('vox_token_r', auth_token.refreshToken);
        localStorage.setItem('vox_login', login);
    }


    removeTokens() {
        localStorage.removeItem('vox_token_a');
        localStorage.removeItem('vox_token_r');
        localStorage.removeItem('vox_login');

        if (this.fromLogin) {
            localStorage.removeItem('from_login');
            return;
        }

        this.returnToIndex()
    }

    returnToIndex() {
        let location = window.location.href.replace('/reconnect.html', '');
        window.location.href = location;
    }

    clearInfo() {
        this.accessToken= '';
        this.refreshToken= '';
        this.loginName = '';
        this.removeTokens()
    }
    makeAuth() {
        this.vox.loginWithToken(this.loginName, this.accessToken).then( info => {
            this.onLogin(info, this.loginName, true);
        })
            .catch((error) => {
                if (error.code == 701) {
                    this.tryRefreshTokens()
                }
                else if (error.code == 404 ) {
                    this.loginName = '';
                    this.onError(error, false);
                }
                else {
                    this.onError(error);
                }
            })
    }
    onLogin(info, loginStr) {
        if (this.fromLogin) {
            this.removeTokens();
            return;
        }
        this.setTokens(info.tokens, loginStr);
    }

    tryRefreshTokens() {
        this.vox.tokenRefresh(this.loginName, this.refreshToken)
            .then(response => {
                if (response.result) {
                    this.accessToken = response.tokens.accessToken;
                    this.refreshToken = response.tokens.refreshToken;
                    this.setTokens(response.tokens);
                    this.makeAuth();
                }
                else {
                    this.onError(response);
                }
            })
            .catch(error => {
                this.onError(error);
            })
    }

    onError(error, isClear=true) {
        if (isClear)
            this.clearInfo();

        this.vox.disconnect();
        console.error('Login error', this.errMessages[error.code]);

        this.returnToIndex()

    }


    onAuth() {

        let clientState = this.vox.getClientState();


        let initObject = {
            micRequired: false,
            remoteVideoContainerId:'js__remoteVideoContainer'
        };


        if (clientState !== "CONNECTED" || clientState !== "LOGGIN_IN") {
            this.vox.init(initObject).then(_ => {
                return this.vox.connect();
            }).then(_ => {
                this.makeAuth()
            }, _ => {
                alert('Can\'t connect to the Voximplant cloud');
                console.warn('Cannot connect', _)
            })
        }
        else {
            alert('Already logged in!');
        }
    }

}

window['TokenAuth'] =  new TokenAuth;
