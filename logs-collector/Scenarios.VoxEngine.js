require(Modules.PushService);

let webEnginesLogs = null;

VoxEngine.addEventListener(AppEvents.Started, (event) => {
    webEnginesLogs = event.logURL
})

VoxEngine.forwardCallToUser((call1, call2) =>{
    call1.sendMessage(JSON.stringify({action: 'log', data: webEnginesLogs}))
    call2.sendMessage(JSON.stringify({action: 'log', data: webEnginesLogs}))
})
