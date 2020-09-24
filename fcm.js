const https = require('https');
require('dotenv').config();

exports.sendToDevice = (
  deviceToken, fcmPayload,
) => {
  const {
    callId, message, localNumber, remoteNumber, roomId, roomToken,
  } = fcmPayload;

  const data = JSON.stringify({
    to: deviceToken,
    data: {
      UUID: callId,
      message,
      localPhoneNumber: localNumber,
      remotePhoneNumber: remoteNumber,
      roomId,
      roomToken,
    },
    notification: {
      title: 'Video Call',
      body: `Video Call from ${localNumber}`,
      click_action: `${process.env.ENABLX_VIDEO_WEBAPP}/confo.html?token=${roomToken}`,
      icon: 'img/enablex-logo.png',
    },
  });

  const options = {
    hostname: 'fcm.googleapis.com',
    port: 443,
    path: '/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(data);
  req.end();
};
