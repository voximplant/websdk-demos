This demo shows how one can use Voximplant call statistics and analytics to collect and/or display the data one needs.

# Demo setup

- Use an existing Voximplant application that has two users and a scenario forwarding a call from one to another, or create a new one:
  - Create an application in [Voximplant control panel](https://manage.voximplant.com/applications)
  - Create two users in that application
  - Create a scenario called ```callsrv``` (or else) with the following script:
  
    ```VoxEngine.forwardCallToUser((call1, call2) => {}, true);```
  - Add a rule called ```all``` (or else) and assign your ```callsrv``` scenario to that rule
- Clone this repo 
- Change ```MY_APP``` constant in ```main.js``` to your Voximplant application name
- Run ```npm run start```
- Open http://127.0.0.1:3000 in two browser tabs and login two different Voximplant application users
- Call from one browser tab and answer to a call in the second one 
- Enjoy the statistics

Additionally:
- To see all the triggered statistics events, open your browser console
- ```RTCStatsReceived``` and ```CallStatsReceived``` events are triggered at 10 000ms by default. Change [rtcStatsCollectionInterval](https://voximplant.com/docs/references/websdk/voximplant/config#rtcstatscollectioninterval) option in the config you pass to [Client.init()](https://voximplant.com/docs/references/websdk/voximplant/client#init) to set your interval. Minimum interval is 500ms.

# Call statistics 

Voximplant Web SDK provides two types of client side statistics for a call. You get both in the argument of a handler function registered for a specific event.

The first one is raw browser statistics for call RTPs. Its format may vary from one browser to another and change in every new browser version. To receive it, subscribe to the [VoxImplant.CallEvents.RTCStatsReceived](https://voximplant.com/docs/references/websdk/voximplant/callevents#rtcstatsreceived) event related to your call:

```javascript
call.on(VoxImplant.CallEvents.RTCStatsReceived, (e) => console.log(e.stats));
```

The second one is prepared and more reliable Voximplant [CallStats](https://voximplant.com/docs/references/websdk/voximplant/statistic/callstats). We strongly recommend to use this one as it’s stable and wide enough to analyze connection and media streams problems and build graphs. To get it, listen to the [VoxImplant.CallEvents.CallStatsReceived](https://voximplant.com/docs/references/websdk/voximplant/callevents#callstatsreceived) event related to your call:

```javascript
call.on(VoxImplant.CallEvents.CallStatsReceived, (e) => console.log(e.stats));
```

**Note!** Not all fields in the stats dictionary are available in all browsers. Check the [reference](https://voximplant.com/docs/references/websdk/voximplant/statistic) for the fields you need.
 
*If you think some parameters are worth adding to the report CallStats, please create an issue here to request it.*

# Call quality analytics

Voximplant Web SDK analyzes call quality and reports issues occurring during the call. There are 5 issues reported as call events in the Web SDK:

[VoxImplant.CallEvents.QualityIssueCodecMismatch](https://voximplant.com/docs/references/websdk/voximplant/callevents#qualityissuecodecmismatch)

[VoxImplant.CallEvents.QualityIssueHighMediaLatency](https://voximplant.com/docs/references/websdk/voximplant/callevents#qualityissuehighmedialatency)

[VoxImplant.CallEvents.QualityIssueICEDisconnected](https://voximplant.com/docs/references/websdk/voximplant/callevents#qualityissueicedisconnected)

[VoxImplant.CallEvents.QualityIssueLocalVideoDegradation](https://voximplant.com/docs/references/websdk/voximplant/callevents#qualityissuelocalvideodegradation)

[VoxImplant.CallEvents.QualityIssuePacketLoss](https://voximplant.com/docs/references/websdk/voximplant/callevents#qualityissuepacketloss)

There’re [4 severity levels](https://voximplant.com/docs/references/websdk/voximplant/statistic/qualityissuelevel) for quality issues: ```NONE```, ```MINOR```, ```MAJOR``` and ```CRITICAL```.

Subscribe to quality issue events like any other call event:

```javascript
call.on(VoxImplant.CallEvents.QualityIssueCodecMismatch, (e) => {
  console.log(e.level); // ‘NONE’, ‘MAJOR’ or ‘CRITICAL’
  console.log(e.kind); //’audio’, ‘video’ or ‘sharing’
  console.log(e.sendCodec); //audio or video codec name
});

call.on(VoxImplant.CallEvents.QualityIssueHighMediaLatency, (e) => {
  console.log(e.level); // ‘NONE’, ‘MINOR’, ‘MAJOR’ or ‘CRITICAL’
  console.log(e.latency); //average latency for the last 2.5s measured in ms
});

call.on(VoxImplant.CallEvents.QualityIssueICEDisconnected, (e) => {
  console.log(e.level); // ‘NONE’ or ‘CRITICAL’
});

call.on(VoxImplant.CallEvents.QualityIssueLocalVideoDegradation, (e) => {
  console.log(e.level); // ‘NONE’, ‘MINOR’, ‘MAJOR’ or ‘CRITICAL’
  console.log(e.kind); //‘video’ or ‘sharing’

  if (e.kind === ‘video’) {
    console.log(e.targetWidth); //video frame width set in Config.videoConstraints
    console.log(e.targetHeight); //video frame height set in Config.videoConstraints
    console.log(e.actualWidth); //sent video frame width
    console.log(e.actualHeight); //sent video frame height
  } else {
    console.log(e.fps); //sent sharing stream fps
  }
});

call.on(VoxImplant.CallEvents.QualityIssuePacketLoss, (e) => {
  console.log(e.level); // ‘NONE’, ‘MINOR’, ‘MAJOR’ or ‘CRITICAL’
  console.log(e.packetLoss); //average packet loss for the last 2.5s
});
```

**Note!** Some quality issues can be reported only in Chrome. Check the reference for the issues you need.

*If you think any other quality problem is worth reporting, please create an issue here to request it.*
