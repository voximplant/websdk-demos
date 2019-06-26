//change to your Voximplant application name
const MY_APP = 'call-stats.me.voximplant.com';
//Create Voximplant Web SDK instance
const sdk = VoxImplant.getInstance();

//Connect to the Voximplant cloud
const connectToVoxCloud = () => {
  sdk.connect(false).then(() => {
    console.log('[DEMO]: Connection was established successfully');
    document.getElementById('auth').classList.remove('hidden');
  }).catch(() => {
    console.log('[DEMO]: Connection failed');
  });
};

//Sign in the Voximplant cloud
const signIn = () => {
  const user = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!user || !password) {
    document.getElementById('auth-error').innerText = 'Username and password are required.';
  } else {
    sdk.login(`${user}@${MY_APP}`, password)
      .then(() => {
        console.log(`[DEMO]: Signed in as ${user}`);
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user').innerText = user;
        document.getElementById('number').focus();
      })
      .catch(() => {
        document.getElementById('auth-error').innerText = 'Authorization failed.';
      });
  }
};

/*
* =============================== Essential demo part starts here ===============================
* */
const addCallStatsListeners = (call) => {
  // old raw browser WebRTC statistics
  call.addEventListener(VoxImplant.CallEvents.RTCStatsReceived, (e) => {
    console.log('[DEMO]: RTC stats received', e.stats);
  });

  // new reliable Voximplant CallStats
  // Reference: https://voximplant.com/docs/references/websdk/voximplant/statistic/callstats
  call.addEventListener(VoxImplant.CallEvents.CallStatsReceived, (e) => {
    console.log('[DEMO]: Call stats received', e.stats);
    // local media stats
    const localVideo = e.stats.localVideoStats.values().next().value;
    const localAudio = e.stats.localAudioStats.values().next().value;

    if (localVideo) {
      document.getElementById('local-cur-resolution').innerText = `${localVideo.frameWidth || '?'}x${localVideo.frameHeight || '?'}`;
      document.getElementById('local-rec-resolution').innerText = sdk.videoConstraints ? ` / ${sdk.videoConstraints.width}x${sdk.videoConstraints.height}` : '';
      document.getElementById('local-video-codec').innerText = localVideo.codec || '?';
    }

    if (localAudio) {
      document.getElementById('local-audio-codec').innerText = localAudio.codec || '?';
    }

    document.getElementById('local-viewport').innerText = document.getElementById('local-video').lastChild && document.getElementById('local-video').lastChild.nodeName === 'VIDEO'
      ? `${document.getElementById('local-video').lastChild.width}x${document.getElementById('local-video').lastChild.height}`
      : '0x0';
    document.getElementById('local-connection-speed').innerText = e.stats.availableOutgoingBitrate ? `${Number(e.stats.availableOutgoingBitrate).toLocaleString()} bps` : '?';
    document.getElementById('local-packets').innerText = `${Number(e.stats.totalPacketsSent).toLocaleString()} sent`;

    // inbound media stats
    if (call.getEndpoints().length) {
      //there's only one endpoint in this demo. But if you have many in your app, just iterate over them and get stats for each
      const endpointId = call.getEndpoints()[0].id;

      if (e.stats.endpointStats.has(endpointId)) {
        const inboundVideoStats = Object.entries(e.stats.endpointStats.get(endpointId).remoteVideoStats)[0];
        const inboundAudioStats = Object.entries(e.stats.endpointStats.get(endpointId).remoteAudioStats)[0];

        if (inboundVideoStats) {
          document.getElementById('inbound-video-rtp-id').innerText = inboundVideoStats[0];
          document.getElementById('inbound-resolution').innerText = `${inboundVideoStats[1].frameWidth || '?'}x${inboundVideoStats[1].frameHeight || '?'}`;
          document.getElementById('inbound-video-codec').innerText = inboundVideoStats[1].codec || '?';
        }

        if (inboundAudioStats) {
          document.getElementById('inbound-audio-codec').innerText = inboundAudioStats[1].codec || '?';
        }

        document.getElementById('inbound-viewport').innerText = document.getElementById('inbound-video').lastChild && document.getElementById('inbound-video').lastChild.nodeName === 'VIDEO'
          ? `${document.getElementById('inbound-video').lastChild.width}x${document.getElementById('inbound-video').lastChild.height}`
          : '0x0';
        document.getElementById('inbound-packets').innerText = `${e.stats.totalPacketsLost} of ${Number(e.stats.totalPacketsReceived).toLocaleString()} lost`;
        document.getElementById('inbound-packets-loss').innerText = `${(e.stats.totalLoss * 100).toFixed(4)}%`;
        document.getElementById('inbound-packets-loss').setAttribute('style', `width: ${Math.ceil(e.stats.totalLoss * 100)}%`);
        document.getElementById('inbound-packets-loss').classList.remove('red');
        document.getElementById('inbound-packets-loss').classList.remove('orange');
        document.getElementById('inbound-packets-loss').classList.remove('yellow');

        if (e.stats.totalLoss > .05) {
          document.getElementById('inbound-packets-loss').classList.add(e.stats.totalLoss > .15 ? 'red' : e.stats.totalLoss > .1 ? 'orange' : 'yellow');
        }

        document.getElementById('inbound-rtt').innerText = e.stats.rtt ? `${e.stats.rtt * 1000}ms` : '?';
      }
    }
  });

  //call quality issues listeners
  call.addEventListener(VoxImplant.CallEvents.QualityIssueCodecMismatch, e => {
    console.log('[DEMO]: Codec mismatch issue', e);
    document.getElementById('codec-mismatch').innerText = e.level;
    document.getElementById('codec-mismatch').parentElement.setAttribute('data-level', e.level);
  });
  call.addEventListener(VoxImplant.CallEvents.QualityIssueHighMediaLatency, e => {
    console.log('[DEMO]: High media latency issue', e);
    document.getElementById('latency').innerText = e.level;
    document.getElementById('latency').parentElement.setAttribute('data-level', e.level);

    //display on bar chart too
    document.getElementById('inbound-latency').innerText = `${e.latency}ms`;
    document.getElementById('inbound-latency').setAttribute('style', `width: ${Math.ceil(e.latency / 3)}%`);
    document.getElementById('inbound-latency').classList.remove('red');
    document.getElementById('inbound-latency').classList.remove('orange');
    document.getElementById('inbound-latency').classList.remove('yellow');

    if (e.latency > 100) {
      document.getElementById('inbound-latency').classList.add(e.latency > 300 ? 'red' : e.latency > 200 ? 'orange' : 'yellow');
    }
  });
  call.addEventListener(VoxImplant.CallEvents.QualityIssueICEDisconnected, e => {
    console.log('[DEMO]: ICE Disconnected issue', e);
    document.getElementById('ice-disconnected').innerText = e.level;
    document.getElementById('ice-disconnected').parentElement.setAttribute('data-level', e.level);
  });
  call.addEventListener(VoxImplant.CallEvents.QualityIssueLocalVideoDegradation, e => {
    console.log('[DEMO]: Local video degradation issue', e);
    document.getElementById('video-degradation').innerText = e.level;
    document.getElementById('video-degradation').parentElement.setAttribute('data-level', e.level);
  });
  call.addEventListener(VoxImplant.CallEvents.QualityIssuePacketLoss, e => {
    console.log('[DEMO]: Packer loss issue', e);
    document.getElementById('packet-loss').innerText = e.level;
    document.getElementById('packet-loss').parentElement.setAttribute('data-level', e.level);

    //display on bar chart too
    document.getElementById('inbound-packets-loss').innerText = `${(e.packetLoss * 100).toFixed(4)}%`;
    document.getElementById('inbound-packets-loss').setAttribute('style', `width: ${Math.ceil(e.packetLoss * 100)}%`);
    document.getElementById('inbound-packets-loss').classList.remove('red');
    document.getElementById('inbound-packets-loss').classList.remove('orange');
    document.getElementById('inbound-packets-loss').classList.remove('yellow');

    if (e.packetLoss > .05) {
      document.getElementById('inbound-packets-loss').classList.add(e.packetLoss > .15 ? 'red' : e.packetLoss > .1 ? 'orange' : 'yellow');
    }
  });
};
/*
* ================================ Essential demo part ends here ================================
* */

const endCall = () => {
  document.getElementById('with-video').disabled = false;
  document.getElementById('hangup').classList.add('hidden');
  document.getElementById('answer').classList.add('hidden');
  document.getElementById('call').classList.remove('hidden');
  document.getElementById('call-number').classList.remove('hidden');
  document.getElementById('status').classList.add('hidden');
  document.getElementById('codec-mismatch').parentElement.setAttribute('data-level', 'NONE');
  document.getElementById('latency').parentElement.setAttribute('data-level', 'NONE');
  document.getElementById('ice-disconnected').parentElement.setAttribute('data-level', 'NONE');
  document.getElementById('video-degradation').parentElement.setAttribute('data-level', 'NONE');
  document.getElementById('packet-loss').parentElement.setAttribute('data-level', 'NONE');
  document.getElementById('codec-mismatch').innerText = 'NONE';
  document.getElementById('latency').innerText = 'NONE';
  document.getElementById('ice-disconnected').innerText = 'NONE';
  document.getElementById('video-degradation').innerText = 'NONE';
  document.getElementById('packet-loss').innerText = 'NONE';
  Array.from(document.getElementsByClassName('stval')).forEach(el => {
    el.innerText = '';
  });
  Array.from(document.getElementsByClassName('metric-chart-percent')).forEach(el => {
    el.setAttribute('style', '');
  });

  if (VoxImplant.Hardware.StreamManager.get().getLocalMediaRenderers().length) {
    VoxImplant.Hardware.StreamManager.get().hideLocalVideo();
  }
};

const makeCall = () => {
  const number = document.getElementById('number').value;
  const withVideo = document.getElementById('with-video').checked;

  if (!number) {
    document.getElementById('number-error').innerText = 'Number required';
  } else {
    const call = sdk.call({
      number: number,
      video: withVideo,
      H264first: true // if you want to use H264 codec
    });

    console.log(`[DEMO]: A call to ${number}`);

    if (withVideo) {
      //render local video
      VoxImplant.Hardware.StreamManager.get().showLocalVideo();
    }
    //transform ui
    document.getElementById('with-video').disabled = true;
    document.getElementById('call-number').classList.add('hidden');
    document.getElementById('status').classList.remove('hidden');
    document.getElementById('status').innerText = `Calling ${number}...`;
    document.getElementById('call').classList.add('hidden');
    document.getElementById('hangup').classList.remove('hidden');
    //handle hangup
    document.getElementById('hangup').onclick = () => {
      call && call.hangup();
      endCall();
    };
    //handle connection
    call.addEventListener(VoxImplant.CallEvents.Connected, () => {
      console.log(`[DEMO]: Call to ${number} connected successfully`);
      document.getElementById('status').innerText = `Talking with ${number}.`;
    });
    //other call event listeners
    call.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
      console.log('[DEMO]: Call was disconnected');
      endCall();
    });
    call.addEventListener(VoxImplant.CallEvents.Failed, (e) => {
      console.log(`[DEMO]: Call failed: ${e.reason} (${e.code})`);
      endCall();
    });

    //call stats event listeners
    addCallStatsListeners(call);
  }
};

const receiveCall = (e) => {
  const withVideo = document.getElementById('with-video').checked;

  console.log(`[DEMO]: A call from ${e.call.number()}`);
  //transform ui
  document.getElementById('with-video').disabled = true;
  document.getElementById('call-number').classList.add('hidden');
  document.getElementById('status').classList.remove('hidden');
  document.getElementById('status').innerText = `${e.call.number()} is calling...`;
  document.getElementById('answer').classList.remove('hidden');
  document.getElementById('call').classList.add('hidden');
  document.getElementById('hangup').classList.remove('hidden');
  //answer handler
  document.getElementById('answer').onclick = () => {
    e.call && e.call.answer('', {}, {receiveVideo: withVideo, sendVideo: withVideo});

    if (withVideo) {
      //render inbound video
      VoxImplant.Hardware.StreamManager.get().showLocalVideo();
    }

    console.log(`[DEMO]: Call from ${e.call.number()} answered`);
    document.getElementById('status').innerText = `Talking with ${e.call.number()}.`;
    document.getElementById('answer').classList.add('hidden');
  };
  //decline handler
  document.getElementById('hangup').onclick = () => {
    e.call && e.call.hangup();
    endCall();
  };
  //call event listeners
  e.call.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    console.log('[DEMO]: Call was disconnected');
    endCall();
  });
  e.call.addEventListener(VoxImplant.CallEvents.Failed, e => {
    console.log(`[DEMO]: Call failed: ${e.reason} (${e.code})`);
    endCall();
  });

  //call stats event listeners
  addCallStatsListeners(e.call);
};

//Reconnect to the Voximplant cloud when disconnected
sdk.on(VoxImplant.Events.ConnectionClosed, () => {
  console.log('[DEMO]: Connection was closed');
  connectToVoxCloud();
});

//init Voximplant
sdk.init({
  // showDebugInfo: true, // show SDK logs to debug
  // prettyPrint: false, // prettify SDK logs
  localVideoContainerId: 'local-video', // DOM element to render local video
  remoteVideoContainerId: 'inbound-video', // DOM element to render inbound video
  videoConstraints: {width: 640, height: 480}, // preferred video resolution
  rtcStatsCollectionInterval: 5000 //default is 10000 ms, minimum interval is 500 ms
})
  .then(() => {
    console.log('[DEMO]: SDK initialized');
    //connect to the Voximplant cloud
    connectToVoxCloud();

    //login ui handlers
    document.getElementById('login-btn').onclick = signIn;
    document.getElementById('username').onkeydown = (e) => {
      document.getElementById('auth-error').innerText = '';
      if (e.keyCode === 13) {
        signIn();
      }
    };
    document.getElementById('password').onkeydown = (e) => {
      document.getElementById('auth-error').innerText = '';
      if (e.keyCode === 13) {
        signIn();
      }
    };

    //outgoing call ui handlers
    document.getElementById('call').onclick = makeCall;
    document.getElementById('number').onkeydown = (e) => {
      document.getElementById('number-error').innerText = '';
      if (e.keyCode === 13) {
        makeCall();
      }
    };

    //incoming call handler
    sdk.on(VoxImplant.Events.IncomingCall, receiveCall);
  });