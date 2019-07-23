
class Phone {
    constructor() {
        this.sdk = VoxImplant.getInstance();
        this.call = null;
        this.sdk.addEventListener(VoxImplant.Events.IncomingCall, (event) => {
            this.onInc(event);
        });

        this.idCorrectNumber = document.getElementsByClassName('phone-incorrect')[0];
        this.bindQueue();

        this.bindCheckbox();
    }
    bindQueue() {
        document.getElementById('call-button').addEventListener("click", () => {
            this.startCall()
        });
        document.getElementById('decline').addEventListener("click", () => window['currentCall'].decline({'X-TerminatedBy': true }));
        document.getElementById('accept').addEventListener("click", () => {
            window['currentCall'].answer('', {}, {
                sendVideo: true,
                receiveVideo: true
            });
            logger.write(`The call answered with ${JSON.stringify({sendVideo: true,
                receiveVideo: true})}`);

        });

        document.getElementById('hangup').addEventListener("click", () => window['currentCall'].hangup({'X-TerminatedBy': true }));
    }
    bindCheckbox() {
        let checkboxLabel = document.getElementsByClassName('checkbox-label');

        [...document.querySelectorAll('.checkbox-view')].forEach((el, i)=> {
            if (document.getElementById(el.getAttribute('for')).hasAttribute('checked'))
                el.classList.add('checked');

            el.addEventListener('click', () => {
                this.clickCheckbox(el.getAttribute('for'), i)
            });
            checkboxLabel[i].addEventListener('click', () => {
                this.clickCheckbox(el.getAttribute('for'), i)
            })
        })
    }

    clickCheckbox(id, i) {
        let checkbox = document.getElementById(id) ;
        if (checkbox.hasAttribute('checked')) {
            document.getElementsByClassName('checkbox-view')[i].classList.remove('checked');
            checkbox.removeAttribute('checked')
        }
        else {
            document.getElementsByClassName('checkbox-view')[i].classList.add('checked');
            checkbox.setAttribute('checked','')
        }
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
        this.call = this.sdk.call({
            number: number.trim(),
            video: {
                sendVideo: true,
                receiveVideo: true
            },
            H264first: true
        });
        window['currentCall'] = this.call;
        this.bindCall();
    }
    onInc(event) {

        this.call = event.call;
        window['currentCall'] = this.call;
        this.bindCall();

        document.getElementById('call-button').hidden = true;
        document.getElementById('accept').hidden = false;
        document.getElementById('decline').hidden = false;
        document.getElementById('call-settings').hidden = true;

    }


    bindCall() {
        if (!window['currentCall']) {
            return;
        }

        window['currentCall'].on(VoxImplant.CallEvents.Disconnected, () => this.onDis());
        window['currentCall'].on(VoxImplant.CallEvents.Failed, (event) => this.onFail(event));
        window['currentCall'].on(VoxImplant.CallEvents.Connected, (event) => this.onConnect(event));
    }
    onDis() {
        this.call = null;
        window['currentCall'] = this.call;
        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Online).then(() => {
            setTimeout(() => {
                this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.Ready)
            }, 400);
        });
        logger.write('Disconnected');

        document.getElementById('call-button').hidden = false;
        document.getElementById('hangup').hidden = true;
        document.getElementById('accept').hidden = true;
        document.getElementById('decline').hidden = true;
        document.getElementById('call-settings').hidden = false;

    }
    onConnect() {
        this.sdk.setOperatorACDStatus(VoxImplant.OperatorACDStatuses.InService);
        logger.write('Connected');
        document.getElementById('accept').hidden = true;
        document.getElementById('hangup').hidden = false;

        document.getElementById('decline').hidden = true;
        document.getElementById('call-settings').hidden = true;

    }

    onFail(event) {
        if (event.code == 404) {
            this.idCorrectNumber.hidden = false;
        }
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
        logger.write('Failed ' + event.code);

        console.warn('Call failed: ', event);
    }
}

window['Phone'] =  new Phone;
