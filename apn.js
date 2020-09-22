const apn = require('apn');
require('dotenv').config();
const logger = require('./logger');

// send push notification to iOS devices using APNs
exports.sendNotification = (
  UUID, deviceToken, message, localPhoneNumber, remotePhoneNumber, roomId, roomToken,
) => {
  const options = {
    cert: process.env.APNS_CERT_PATH,
    key: process.env.APNS_KEY_PATH,
  };
  const apnProvider = new apn.Provider(options);

  const note = new apn.Notification();

  note.expiry = Math.floor(Date.now() / 1000) + 60; // Expires 1 minute from now.
  note.badge = 3;
  note.sound = 'ping.aiff';
  note.alert = '\uD83D\uDCE7 \u2709 You have a new message';
  // define your own payload
  const payload = {
    UUID,
    message,
    roomId,
    roomToken,
    localPhoneNumber: remotePhoneNumber,
    remotePhoneNumber: localPhoneNumber,
  };

  note.payload = payload;
  note.topic = process.env.APNS_VOICE_PUSH;
  note.priority = 10;
  note.pushType = 'alert';
  apnProvider.send(note, deviceToken).then((err, result) => {
    logger.info(JSON.stringify(note.payload));
    logger.info('sent to ios');
    if (err) logger.info(JSON.stringify(err));
    logger.info(JSON.stringify(result));
  });
};
