const https = require('https');
require('dotenv').config();

exports.sendToDevice = (
  UUID, deviceToken, message, localPhoneNumber, remotePhoneNumber, roomId, roomToken,
) => {
  const data = JSON.stringify({
    to: deviceToken,
    data: {
      UUID,
      message,
      localPhoneNumber,
      remotePhoneNumber,
      roomId,
      roomToken,
    },
    notification: {
      title: 'Video Call',
      body: `Video Call from ${localPhoneNumber}`,
      click_action: `https://localhost/web-1to1-conf-php/client/confo.html?user_ref=${remotePhoneNumber}&token=${roomToken}`,
      icon: 'http://localhost:3001/ab-logo.png',
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
