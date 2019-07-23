class Project {

    constructor() {
        this.sdk = VoxImplant.getInstance();
        this.call = null;
        this.isDisconnect = false;
        clearInterval(this.timerOffline);
        clearTimeout(this.startTimeResponse);
        this.sdk.addEventListener(VoxImplant.Events.IncomingCall, () => {
            if (this.isDisconnect) {
                window['currentCall'].answer('', {},{
                        sendVideo: true,
                        recieveVideo: true
                    });
                this.isDisconnect = false;
            }
            this.bindCall();
        });
        document.getElementById('call-button').addEventListener("click", () => {
            this.bindCall()
        });
    }

    bindCall() {
        window['currentCall'].on(VoxImplant.CallEvents.Disconnected, (event) => this.onDis(event));


        window['currentCall'].on(VoxImplant.CallEvents.Connected, () => {
            window['currentCall'].on(VoxImplant.CallEvents.Failed, (event) => this.onFail(event));
            this.clearTimers();
            if (this.isDisconnect) {
                this.isDisconnect = false;
                document.getElementById('try-reconnect').hidden = true;
            }

            this.timerOffline = setInterval(() => {
                window['currentCall'].sendMessage('ping');
                this.startTimeResponse = setTimeout(() =>             this.offlineTryCall(), 2000)
            }, 2500);

            window['currentCall'].on(VoxImplant.CallEvents.MessageReceived, (event)=> {
                if (JSON.parse(event.text).type === 'ping')
                    this.stopReconnectCall();

                this.showInterruptedCall(event);
            });
        });
    }

    stopReconnectCall() {
        clearTimeout(this.startTimeResponse);
        this.isDisconnect = false;
        document.getElementById('try-reconnect').hidden = true;
    }

    offlineTryCall() {
        if (this.isDisconnect) {
            return;
        }
        this.isDisconnect = true;
        document.getElementById('try-reconnect').hidden = false;

    }
    clearTimers() {
        clearInterval(this.timerOffline);
        clearTimeout(this.startTimeResponse);
    }
    showInterruptedCall(event) {
        let eventText =  JSON.parse(event.text);
        if (eventText.type === 'disconnect' && eventText.action === 'trying') {
            document.getElementById('try-reconnect').hidden = false;
        }
        if (eventText.type === 'disconnect' && eventText.action === 'success') {
            document.getElementById('try-reconnect').hidden = true;
        }
    }
    tryToConnect() {
        document.getElementById('try-reconnect').hidden = false;
        this.isDisconnect = true;
    }
    showFailedCallMessage() {
        document.getElementById('try-reconnect').hidden = true;
        document.getElementById('fail-reconnect').hidden = false;
        setTimeout(() => document.getElementById('fail-reconnect').hidden = true, 3000)
    }

    hideReconnectCallMessages() {
        document.getElementById('try-reconnect').hidden = true;
        document.getElementById('fail-reconnect').hidden = true;
    }
    onDis(event) {
        if (event.headers['X-PingTimeout'] === "true")
            return;

        if (event.headers['X-TerminatedBy'] === 'true' || event.headers['X-VI-Hangup-Cause'] === "Normal termination") {
            this.hideReconnectCallMessages();
            this.clearTimers();
            return;
        }
        else {
            if (!this.isDisconnect) {
                this.tryToConnect();
            }
            else {
                this.showFailedCallMessage();
                this.clearTimers();

            }
        }
        if (event.headers['X-RetryFailed'] === 'true' ) {
            this.showFailedCallMessage();
            this.clearTimers();

        }
    }
    onFail(event) {
        if (event.code === 409 || event.code === 499) {
            this.showFailedCallMessage();
            this.clearTimers();

        }
    }
}

window['Project'] =  new Project;

