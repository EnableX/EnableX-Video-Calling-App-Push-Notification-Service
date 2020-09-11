const https = require('https');
require('dotenv').config();

exports.sendToDevice = (
  UUID, deviceToken, message, localPhoneNumber, remotePhoneNumber, roomId, roomToken,
) => {
  const data = JSON.stringify({
    data: {
      notification: {
        title: 'FCM Message',
        body: roomToken,
      },
    },
    to: deviceToken,
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
