
class Logger {
    constructor() {
        this.sdk = VoxImplant.getInstance();
        this.call = null;
        this.sdk.addEventListener(VoxImplant.Events.IncomingCall, (event) => {
            this.onInc(event);
        });
        this.recordCallback = [];
        this.recordCallsInfo = [];
        this.sdk.setLoggerCallback((log) => {
            this.recordCallback.push(log);
        });

        this.idCorrectNumber = document.getElementsByClassName('phone-incorrect')[0];
        this.bindQueue();

    }
    bindQueue() {
        document.getElementById('call-button').addEventListener("click", () => this.startCall());
        document.getElementById('decline').addEventListener("click", () => window['currentCall'].decline());
        document.getElementById('accept').addEventListener("click", () => window['currentCall'].answer());
        document.getElementById('hangup').addEventListener("click", () => window['currentCall'].hangup());
        document.getElementById('report').addEventListener("click", () => this.reportInfo());
        document.getElementById('overlay').addEventListener('click', () => {
            document.getElementById('overlay').hidden = true;
            document.getElementsByClassName('popup-logger')[0].hidden = true;
        });
        document.getElementById('exit-popup').addEventListener('click', () => {
            document.getElementById('overlay').hidden = true;
            document.getElementsByClassName('popup-logger')[0].hidden = true;
        })
    }

    reportInfo() {
        let logInfo = {
            sdkLogs: this.recordCallback,
            listLogs: this.recordCallsInfo,
            userLogin: localStorage.getItem('vox_login') || Auth.loginName
        };
        // Specify your server's hostname
        fetch('https://example.com/report', {
            method: 'POST',
            body: JSON.stringify(logInfo)
        })
            .catch((e)=>{});

        console.log('%cLog Info ', "background-color: skyblue; color: white; padding: 2px 5px;", logInfo);

        document.getElementById('overlay').hidden = false;
        document.getElementsByClassName('popup-logger')[0].hidden = false;
    }

    startCall() {
        let number = document.getElementById('call-number').value;

        if (!number) {
            this.idCorrectNumber.hidden = false;
            return;
        }
        document.getElementById('call-button').hidden = true;
        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.InService);
        this.idCorrectNumber.hidden = true;
        document.getElementById('hangup').hidden = false;
        this.call = this.sdk.call({number: number.trim()});
        window['currentCall'] = this.call;
        document.getElementById('report').hidden = false;

        this.bindCall();
    }
    onInc(event) {
        this.call = event.call;
        window['currentCall'] = this.call;
        this.bindCall();
        this.call.on(VoxImplant.CallEvents.MessageReceived, (event)=> {
            this.serializeMessage(event)
        });
        document.getElementById('call-button').hidden = true;
        document.getElementById('report').hidden = false;
        document.getElementById('accept').hidden = false;
        document.getElementById('decline').hidden = false;
    }
    serializeMessage(data) {
        try {
            let callInfo = JSON.parse(data.text);
            if (callInfo.action === 'log') {
                this.recordCallsInfo.push(callInfo.data);
            }
        }
        catch (error) {
            console.warn('serialize Error: ', error)
        }
    }

    bindCall() {
        if (!this.call) {
            return;
        }

        this.call.on(VoxImplant.CallEvents.Disconnected, (event) => this.onDis(event));
        this.call.on(VoxImplant.CallEvents.Failed, (event) => this.onFail(event));
        this.call.on(VoxImplant.CallEvents.Connected, (event) => this.onConnect(event));
    }
    onDis() {
        this.call = null;
        window.currentCall = this.call;
        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Online).then(() => {
            setTimeout(() => {
                this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Ready)
            }, 400);
        });

        document.getElementById('call-button').hidden = false;
        document.getElementById('hangup').hidden = true;
        document.getElementById('accept').hidden = true;
        document.getElementById('decline').hidden = true;

    }
    onConnect() {
        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.InService);

        document.getElementById('accept').hidden = true;
        document.getElementById('hangup').hidden = false;
        document.getElementById('decline').hidden = true;
    }

    onFail(event) {
        this.idCorrectNumber.hidden = false;
        this.call = null;

        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Online).then(() => {
            setTimeout(() => {
                this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Ready)
            }, 400);
        });

        document.getElementById('call-button').hidden = false;
        document.getElementById('hangup').hidden = true;
        document.getElementById('accept').hidden = true;
        document.getElementById('decline').hidden = true;

        console.warn('Call failed: ', event);
    }



}

window['Logger'] =  new Logger;
