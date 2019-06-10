
class Auth {
    constructor() {
        this.vox = VoxImplant.getInstance();

        this.loginForm = {
            user: '',
            password: '',
        };
        this.rememberData = false;
        this.accessToken = '';
        this.refreshToken = '';
        this.loginName = '';
        this.button = document.getElementsByClassName("form-submit")[0];
        this.form = document.getElementsByClassName("demo-ruleForm")[0];
        this.tokenClear = document.getElementsByClassName('token-clear')[0];
        this.formItems = document.getElementsByClassName('form-item');
        this.errorLabel = document.getElementsByClassName('login-failed')[0];
        this.errMessages = {
            404: 'Invalid username or password',
            401: 'Invalid token',
            500: 'Internal sever error',
            701: 'Invalid token'
        };

        this.getTokens();
        if (this.accessToken) {
            this.rememberData = true;
        }
        if (this.loginName) {
            this.onAuth()
        }

        this.showElements();

        const inputs = document.getElementsByClassName("form-input");

        for (let i=0; i < inputs.length; i++) {
            let input = inputs[i];

            input.addEventListener("keyup", (event) => {
                if (event.key === "Enter") {
                    this.onAuth();
                }
            })
        }

        this.button.addEventListener("click", (event) => {
            event.preventDefault();
            this.onAuth();
        })
    }


    getTokens() {
        this.accessToken = localStorage.getItem('vox_token_a');
        this.refreshToken = localStorage.getItem('vox_token_r');
        this.loginName = localStorage.getItem('vox_login');
    }

    showElements() {
        if (!this.loginName) {
            this.form.hidden = false;
        }
        if (!this.accessToken) {
            this.formItems[1].hidden = false;
        }
        else {
            this.tokenClear.hidden = false;
        }
    }


    setTokens(auth_token, login='') {
        console.log('auth_token', auth_token);
        localStorage.setItem('vox_token_a', auth_token.accessToken);
        localStorage.setItem('vox_login', login);
        localStorage.setItem('vox_token_r', auth_token.refreshToken);
    }

    removeTokens(bool) {
        localStorage.removeItem('vox_token_a');
        localStorage.removeItem('vox_token_r');
        localStorage.removeItem('vox_login');
        if (bool)  {
            window.location.reload();
        }
    }

    clearInfo() {
        this.accessToken= '';
        this.refreshToken= '';
        this.loginName = '';
        this.removeTokens()
    }


    onLogin(info, loginStr, fromToken) {


        this.button.disabled = false;
        this.button.innerText = 'Log In';

        this.errorLabel.hidden = true;

            this.rememberData = fromToken ? true : document.getElementById('rememberData').checked;
            if (this.rememberData)
                this.setTokens(info.tokens, loginStr);
            else
                this.removeTokens();

            this.tokenClear.hidden = false;
            this.form.hidden = true;
            document.getElementsByClassName('login-successful')[0].hidden = false;

    }

    onError(error, isClear=true) {
        this.button.disabled = false;
        this.button.innerText = 'Log In';

        this.loginForm['password'] = '';
        if (isClear)
            this.clearInfo();

        this.vox.disconnect();
        this.showElements();
        console.error('Login error', this.errMessages[error.code]);
        this.errorLabel.hidden = false;
    }

    tryRefreshTokens(login) {
        this.vox.tokenRefresh(login, this.refreshToken)
            .then(response => {
                if (response.result) {
                    this.accessToken = response.tokens.accessToken;
                    this.refreshToken = response.tokens.refreshToken;
                    this.setTokens(response.tokens, login);
                    this.selectAuth(login);
                }
                else {
                    this.onError(response);
                }
            })
            .catch(error => {
                this.onError(error);
                this.tokenClear.hidden = true;
                this.showElements();
            })
    }

    selectAuth(loginStr) {
        if (!this.accessToken) {

            this.loginForm.password = document.getElementById('password').value;

            this.vox.login(loginStr, this.loginForm.password).then( info => {
                this.onLogin(info, loginStr, false);
            })
                .catch((error) => {
                    this.onError(error);
                })
        }
        else {
            this.vox.loginWithToken(loginStr, this.accessToken, ).then( info => {
                this.onLogin(info, loginStr, true);
            })
                .catch((error) => {
                    if (error.code == 701) {
                        this.tryRefreshTokens(loginStr)
                    }
                    else if (error.code == 404 ) {
                        this.loginName = '';
                        this.onError(error, false);
                        document.getElementsByClassName('form-checkbox')[0].hidden = true;
                        this.showElements();
                    }
                    else {
                        this.onError(error);
                    }
                })
        }
    }
    onAuth (){
        this.button.disabled = true;
        this.button.innerText = 'Wait...';

        let userName = document.getElementById('user').value;
        const loginStr = this.loginName ? this.loginName : userName;

        let clientState = this.vox.getClientState();

        if (clientState !== "CONNECTED" || clientState !== "LOGGIN_IN") {
            this.vox.init({micRequired: false}).then(_ => {
                return this.vox.connect();
            }).then(_ => {
                this.selectAuth(loginStr)
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
window['Auth'] =  new Auth;
