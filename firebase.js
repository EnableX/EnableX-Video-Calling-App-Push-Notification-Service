const admin = require('firebase-admin');
require('dotenv').config();
const logger = require('./logger');
// eslint-disable-next-line import/no-dynamic-require
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const payload = {};

const options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

// send push notification to android devices using firebase
exports.sendToDevice = (
  deviceToken, message, localphoneNumber, remotephoneNumber, roomId,
) => {
  payload.data.localphoneNumber = localphoneNumber;
  payload.data.remotephoneNumber = remotephoneNumber;
  payload.data.message = message;
  payload.data.roomId = roomId;
  admin.messaging().sendToDevice(deviceToken, payload, options)
    .then((response) => {
      logger.info(JSON.stringify(payload));
      logger.info('Successfully sent message:', response);
    })
    .catch((error) => {
      logger.info('Error sending message:', error);
    });
};
