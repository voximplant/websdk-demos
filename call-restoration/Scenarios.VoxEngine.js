
const schemeStore = {
    firstShoulder: undefined,
    secondShoulder: undefined,
};
const calls = {
    firstShoulder: undefined,
    secondShoulder: undefined,
};

let retryTimer = 0;
const pings = {
    firstShoulder: 0,
    secondShoulder: 0,
};

const ANSWER = {
    pong: { type: 'ping', action: 'pong' },
    disconnect_trying: { type: "disconnect", action: "trying" },
    disconnect_success: { type: "disconnect", action: "success" },
};


VoxEngine.addEventListener(AppEvents.CallAlerting, e => {
    calls.firstShoulder = e.call;
    const video = true;
    schemeStore.firstShoulder = e.scheme;
    calls.secondShoulder = VoxEngine.callUser(e.destination, e.callerid, e.displayName, null, video, e.scheme);

    // Problems with DisplayName
    Logger.write('New displayName:' + calls.secondShoulder.displayName());
    calls.secondShoulder.addEventListener(CallEvents.Connected, function fxConnected(secondEvent) {
        secondEvent.call.removeEventListener(CallEvents.Connected, fxConnected);
        if (secondEvent.scheme) {
            calls.firstShoulder.answer(null, { scheme: secondEvent.scheme });
            schemeStore.secondShoulder = secondEvent.scheme;
        } else {
            calls.firstShoulder.answer();
        }
        
        VoxEngine.sendMediaBetween(calls.firstShoulder, calls.secondShoulder);
        
        watchDisconnect();
    });
    calls.secondShoulder.addEventListener(CallEvents.Failed, function fxFailed(thirdEvent) {
        calls.secondShoulder.removeEventListener(CallEvents.Failed, fxFailed);
        calls.firstShoulder.reject(thirdEvent.code);
        VoxEngine.terminate();
    });
});

function watchDisconnect() {
    Logger.write('Set disconnect watcher');
    calls.secondShoulder.addEventListener(CallEvents.Disconnected, (event) => tryReconnect(event, 'secondShoulder'));
    calls.firstShoulder.addEventListener(CallEvents.Disconnected, (event) => tryReconnect(event, 'firstShoulder'));

    calls.firstShoulder.addEventListener(CallEvents.MessageReceived, (event) => checkPing(event, 'firstShoulder'));
    calls.secondShoulder.addEventListener(CallEvents.MessageReceived, (event) => checkPing(event, 'secondShoulder'));
}

function checkPing(event, label) {
    if (event && event.text === 'ping') {
        event.call.sendMessage(JSON.stringify(ANSWER.pong));
        clearTimeout(pings[label]);
        pings[label] = setTimeout(() => {
            noPing(event, label);
        }, 3000);
    }
}

function noPing(event, label) {
    clearTimeout(pings.firstShoulder);
    clearTimeout(pings.secondShoulder);

    calls.firstShoulder.removeEventListener(CallEvents.Disconnected);
    calls.secondShoulder.removeEventListener(CallEvents.Disconnected);

    event.call.hangup({ 'X-PingTimeout': true });

    tryReconnect(event, label);
}

function makeCallTuple(label) {
    const liveLabel = ['firstShoulder', 'secondShoulder'].find(name => label !== name);
    const problemCall = calls[label];
    const where = problemCall.incoming() ? problemCall.callerid() : problemCall.number();
    const callerid = problemCall.incoming() ? problemCall.number() : problemCall.callerid();
    const displayname = problemCall.displayName();
    Logger.write('Problem call: ' + problemCall);
    Logger.write('Need to call: ' + where);

    // A second leg call should always be active
    const secondShoulder = calls[liveLabel];

    const video = true;
    const scheme = schemeStore[liveLabel];
    // Check push service
    let oldState;
    if (typeof PushServiceState !== 'undefined') {
        oldState = PushServiceState;
        PushServiceState = undefined;
    }
    const firstShoulder = VoxEngine.callUser(where, callerid, callerid, { 'X-Retrying': true }, video, scheme);
    if (typeof oldState !== 'undefined') {
        PushServiceState = oldState;
        oldState = undefined;
    }
    return [firstShoulder, secondShoulder];
}

function reconnectFailed(firstShoulder, secondShoulder) {
    Logger.write(firstShoulder + "\n" + secondShoulder);
    // Remove eventListener to prevent calling from the first leg
    // in case of reconnection failure
    firstShoulder.removeEventListener(CallEvents.Failed);
    // Remove reconnection processing
    firstShoulder.state() !== 'TERMINATED' && firstShoulder.hangup({ 'X-RetryFailed': true });
    secondShoulder.state() !== 'TERMINATED' && secondShoulder.hangup({ 'X-RetryFailed': true });
    VoxEngine.terminate();
}
function tryReconnect(event, label) {
    Logger.write('tryReconnect: ' + JSON.stringify(event));
    // Clear listeners
    calls.firstShoulder.removeEventListener(CallEvents.Disconnected);
    calls.secondShoulder.removeEventListener(CallEvents.Disconnected);

    calls.firstShoulder.removeEventListener(CallEvents.MessageReceived);
    calls.secondShoulder.removeEventListener(CallEvents.MessageReceived);
    // Flag check 
    if (event.headers['X-TerminatedBy']) {
        // If it was a real disconnection
        VoxEngine.terminate();
    } else {
        const [newFirstShoulder, newSecondShoulder] = makeCallTuple(label);
        retryTimer = setTimeout(reconnectFailed, 15000, newFirstShoulder, newSecondShoulder);
        newSecondShoulder.sendMessage(JSON.stringify(ANSWER.disconnect_trying));

        newFirstShoulder.addEventListener(CallEvents.Failed, function fxFailed2() {
            newFirstShoulder.removeEventListener(CallEvents.Failed, fxFailed2);
            clearTimeout(tryReconnectTimer);
            Logger.write("Didn't accept call");
            tryReconnectTimer = setTimeout(() => {
                tryReconnect(event, label);
            }, 3000);
        });
        newFirstShoulder.addEventListener(CallEvents.Connected, function fxConnected2(secondEvent) {
            secondEvent.call.removeEventListener(CallEvents.Connected, fxConnected2);
            clearTimeout(retryTimer);
            retryTimer = 0;
            schemeStore.firstShoulder = secondEvent.scheme;
            schemeStore.secondShoulder = undefined;
            newSecondShoulder.sendMessage(JSON.stringify(ANSWER.disconnect_success));
            VoxEngine.sendMediaBetween(newSecondShoulder, newFirstShoulder);
            calls.firstShoulder = newFirstShoulder;
            calls.secondShoulder = newSecondShoulder;
            watchDisconnect();
        });
    }
}
