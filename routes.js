const router = require('express').Router();

const firebase = require('./firebase');
const apn = require('./apn');
const fcm = require('./fcm');
const mongo = require('./mongo');
const vcxroom = require('./vcxroom');
const logger = require('./logger');

// push notification to devices as per platform
const pushNotification = (appPlatform, deviceToken, payload) => {
  logger.info('pushNotification');
  logger.info(JSON.stringify(payload));
  const devicePlatform = appPlatform.toLowerCase();
  if (devicePlatform === 'android') {
    firebase.sendToDevice(deviceToken, payload);
  }
  if (devicePlatform === 'web') {
    fcm.sendToDevice(deviceToken, payload);
  }
  if (devicePlatform === 'ios') {
    apn.sendNotification(deviceToken, payload);
  }
};

// get user details by user provided identity.
const validateCustomerUnicity = async (phoneNumber, deviceToken) => {
  const result = await (mongo.getCustomerByTokenNumber(phoneNumber, deviceToken));
  logger.info('validateCustomerUnicity');
  logger.info(JSON.stringify(result));
  return result;
};

// get user details by user provided identity.
const registerDevice = async (customerName, phoneNumber, deviceToken, devicePlatform) => {
  const result = await (mongo.saveCustomer(customerName, phoneNumber, deviceToken, devicePlatform));
  logger.info('registerDevice');
  logger.info(JSON.stringify(result));
  return result;
};

// get user details by user provided identity.
const getCustomerDetails = async (remotePhoneNumber) => {
  const result = await (mongo.getCustomerByNumber(remotePhoneNumber));
  logger.info('getCustomerDetails');
  logger.info(JSON.stringify(result));
  return result;
};

// get all customer / devices
const getAllDevices = async () => {
  const result = await (mongo.getCustomers());
  logger.info('getAllDevices');
  logger.info(JSON.stringify(result));
  return result;
};

// initiate call
router.post('/call', (req, res) => {
  logger.info('/call req params');
  logger.info(JSON.stringify(req.body));
  // @todo - input validation
  const callId = req.body.call_id;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          const messageText = 'call-initiated';
          const payload = {
            callId, messageText, localNumber, remoteNumber, roomId: '', roomToken: '',
          };
          // there can be more than one record (device registered) for a user
          for (let i = 0; i < remoteDeviceToken.length; i += 1) {
            // send data to remote device using push notification
            pushNotification(remoteDeviceToken[i].platform, remoteDeviceToken[i].token, payload);
          }
          // send response to caller by http response
          res.send({ call_id: callId, message: messageText, result: '0' });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({ call_id: callId, message: `Record not found for the number ${remoteNumber}` });
        }
      });
  } catch (error) {
    res.status(500).send({ call_id: callId, message: 'Error processing request', error });
  }
});

// add others in the call
router.put('/call/:callId/invite', (req, res) => {
  logger.info('/call/:callId/invite req params');
  logger.info(req.params.callId);
  logger.info(JSON.stringify(req.body));
  const { callId } = req.params;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  const roomId = req.body.room_id;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          const messageText = 'call-invited';

          const payload = {
            callId, messageText, localNumber, remoteNumber, roomId, roomToken: '',
          };
          for (let i = 0; i < remoteDeviceToken.length; i += 1) {
            // send data to remote device using push notification
            pushNotification(remoteDeviceToken[i].platform, remoteDeviceToken[i].token, payload);
          }
          // send response to caller by http response
          res.send({ call_id: callId, message: messageText, result: '0' });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({ call_id: callId, message: `Record not found for the number ${remoteNumber}` });
        }
      });
  } catch (error) {
    res.status(500).send({ call_id: callId, message: 'Error processing request', error });
  }
});

// reject call
router.put('/call/:callId/unavailable', (req, res) => {
  logger.info('/call/:callId/unavailable req params');
  logger.info(req.params.callId);
  logger.info(JSON.stringify(req.body));
  const { callId } = req.params;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          const messageText = 'unavailable';
          const payload = {
            callId, messageText, localNumber, remoteNumber, roomId: '', roomToken: '',
          };
          for (let i = 0; i < remoteDeviceToken.length; i += 1) {
            // send data to remote device using push notification
            pushNotification(remoteDeviceToken[i].platform, remoteDeviceToken[i].token, payload);
          }
          // send response to caller by http response
          res.send({ call_id: callId, message: messageText, result: '0' });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({ call_id: callId, message: `Record not found for the number ${remoteNumber}` });
        }
      });
  } catch (error) {
    res.status(500).send({ call_id: callId, message: 'error processing request' });
  }
});

// reject call
router.put('/call/:callId/reject', (req, res) => {
  logger.info('/call/:callId/reject req params');
  logger.info(req.params.callId);
  logger.info(JSON.stringify(req.body));
  const { callId } = req.params;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          const messageText = 'call rejected';
          const payload = {
            callId, messageText, localNumber, remoteNumber, roomId: '', roomToken: '',
          };
          for (let i = 0; i < remoteDeviceToken.length; i += 1) {
            // send data to remote device using push notification
            pushNotification(remoteDeviceToken[i].platform, remoteDeviceToken[i].token, payload);
          }
          // send response to caller by http response
          res.send({ call_id: callId, message: messageText, result: '0' });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({ call_id: callId, message: `Record not found for the number ${remoteNumber}` });
        }
      });
  } catch (error) {
    res.status(500).send({ call_id: callId, message: 'error processing request', error });
  }
});

// endpoint to send messages for various actions
router.put('/call/:callId/answer', (req, res) => {
  logger.info('/call/:callId/answer req params');
  logger.info(req.params.callId);
  logger.info(JSON.stringify(req.body));
  const { callId } = req.params;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          // create EnableX room
          let roomId = '';
          logger.info('creating enablex room');
          vcxroom.createRoom((roomStatus, roomData) => {
            logger.info(`roomStatus ${roomStatus}`);
            if (roomStatus === 'success') {
            // Room Created successfully, create EnableX room token for moderator
              logger.info('creating enablex token for moderator');
              roomId = roomData.room.room_id;
              const createModeratorTokenObj = {
                name: remoteNumber,
                role: 'moderator',
                user_ref: callId,
                roomId,
              };

              let moderatorToken = '';
              vcxroom.getToken(createModeratorTokenObj, (tokenStatus, tokenData) => {
                logger.info(tokenStatus);
                logger.info(JSON.stringify(tokenData));
                if (tokenStatus === 'success') {
                // moderator token created successfully, now create room token for participant
                  moderatorToken = tokenData.token;
                  const createParticipantTokenObj = {
                    name: localNumber,
                    role: 'participant',
                    user_ref: callId,
                    roomId,
                  };

                  let participantToken = '';
                  logger.info('creating enablex token for participant');
                  vcxroom.getToken(createParticipantTokenObj, (status, data) => {
                    logger.info(status);
                    if (status === 'success') {
                    // room created and token created for moderator & participant
                      participantToken = data.token;
                      // send roomId & token to remote device using push notification
                      const messageText = 'call start';
                      const payload = {
                        callId,
                        messageText,
                        localNumber,
                        remoteNumber,
                        roomId,
                        roomToken: moderatorToken,
                      };
                      for (let i = 0; i < remoteDeviceToken.length; i += 1) {
                        // send data to remote device using push notification
                        pushNotification(
                          remoteDeviceToken[i].platform,
                          remoteDeviceToken[i].token,
                          payload,
                        );
                      }

                      // send roomId & token to local device by http response
                      res.send({
                        call_id: callId,
                        message: messageText,
                        roomId,
                        token: participantToken,
                      });
                    } else if (status === 'error') {
                      const messageText = 'Error creating token for participant';
                      const payload = {
                        callId, messageText, localNumber, remoteNumber, roomId, roomToken: '',
                      };
                      for (let i = 0; i < remoteDeviceToken.length; i += 1) {
                        // send data to remote device using push notification
                        pushNotification(
                          remoteDeviceToken[i].platform,
                          remoteDeviceToken[i].token,
                          payload,
                        );
                      }

                      // send roomId & token to local device by http response
                      res.status(500).send({
                        call_id: callId,
                        message: messageText,
                        roomId,
                        token: '',
                      });
                    }
                  });
                } else if (tokenStatus === 'error') {
                  const messageText = 'Error creating token for moderator';
                  const payload = {
                    callId, messageText, localNumber, remoteNumber, roomId, roomToken: '',
                  };
                  for (let i = 0; i < remoteDeviceToken.length; i += 1) {
                    // send data to remote device using push notification
                    pushNotification(
                      remoteDeviceToken[i].platform,
                      remoteDeviceToken[i].token,
                      payload,
                    );
                  }
                  // send roomId & token to local device by http response
                  res.status(500).send({
                    call_id: callId,
                    message: messageText,
                    roomId,
                    token: '',
                  });
                }
              });
            } else if (roomStatus === 'error') {
              logger.info('Error while creating room');
              const messageText = 'Error creating room';
              const payload = {
                callId, messageText, localNumber, remoteNumber, roomId: '', roomToken: '',
              };
              for (let i = 0; i < remoteDeviceToken.length; i += 1) {
                // send data to remote device using push notification
                pushNotification(
                  remoteDeviceToken[i].platform,
                  remoteDeviceToken[i].token,
                  payload,
                );
              }
              // send roomId & token to local device by http response
              res.status(500).send({
                call_id: callId,
                message: messageText,
                roomId: '',
                token: '',
              });
            }
          });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({
            call_id: callId,
            message: `Record not found for the number ${remoteNumber}`,
            roomId: '',
            token: '',
          });
        }
      });
  } catch (error) {
    logger.error(error);
    res.status(500).send({
      call_id: callId,
      message: 'Error processing request',
      roomId: '',
      token: '',
      error,
    });
  }
});

// endpoint to send messages for various actions
router.put('/call/:callId/join', (req, res) => {
  logger.info('/call/:callId/join req params');
  logger.info(req.params.callId);
  logger.info(JSON.stringify(req.body));
  const { callId } = req.params;
  const roomId = req.body.room_id;
  const localNumber = req.body.local_number;
  const remoteNumber = req.body.remote_number;
  try {
    getCustomerDetails(req.body.remote_number)
      .then((remoteDeviceToken) => {
        if (remoteDeviceToken.length > 0) {
          // create room token for participant
          const createParticipantTokenObj = {
            name: localNumber,
            role: 'participant',
            user_ref: callId,
            roomId,
          };

          logger.info('creating enablex token for participant');
          vcxroom.getToken(createParticipantTokenObj, (status, data) => {
            logger.info(status);
            if (status === 'success') {
            // token created for participant
            // send token to caller device by http response
              res.send({
                message: 'call join',
                roomId,
                token: data.token,
              });
            } else if (status === 'error') {
              const messageText = 'Error creating token for participant';
              const payload = {
                callId, messageText, localNumber, remoteNumber, roomId, roomToken: '',
              };
              for (let i = 0; i < remoteDeviceToken.length; i += 1) {
                // send data to remote device using push notification
                pushNotification(
                  remoteDeviceToken[i].platform,
                  remoteDeviceToken[i].token,
                  payload,
                );
              }
              // send roomId & token to local device by http response
              res.status(500).send({
                call_id: callId,
                message: messageText,
                roomId,
                token: '',
              });
            }
          });
        } else {
          logger.info(`Record not found for the number ${remoteNumber}`);
          res.status(404).send({
            call_id: callId,
            message: `Record not found for the number ${remoteNumber}`,
            roomId: '',
            token: '',
          });
        }
      });
  } catch (error) {
    res.status(500).send({
      call_id: callId,
      message: 'Error processing request',
      roomId: '',
      token: '',
      error,
    });
  }
});

// endpoint to register devices
router.post('/device', (req, res) => {
  logger.info('/device req params');
  logger.info(JSON.stringify(req.body));
  try {
    validateCustomerUnicity(req.body.phone_number, req.body.device_token)
      .then((customer) => {
        if (customer.length > 0) {
          res.status(409).send({
            message: 'Device already registered',
            result: '0',
          });
        } else {
          registerDevice(req.body.name, req.body.phone_number, req.body.device_token, req.body.platform)
            .then((device) => {
              if (device) {
                res.status(200).send({
                  message: 'Device registered successfully',
                  result: '0',
                });
              } else {
                res.status(500).send({
                  message: 'Error registering device',
                });
              }
            });
        }
      });
  } catch (error) {
    logger.info(error);
    res.status(500).send({
      message: 'Error processing request',
      error,
    });
  }
});

// endpoint to get all users / devices
router.get('/device', (req, res) => {
  try {
    getAllDevices()
      .then((result) => {
        if (result) {
          logger.info(JSON.stringify(result));
          res.status(200).send({
            message: 'Device found',
            result,
          });
        } else {
          res.status(500).send({
            message: 'Error fetching device',
          });
        }
      });
  } catch (error) {
    logger.info(error);
    res.status(500).send({
      message: 'Error processing request',
      error,
    });
  }
});

// endpoint to get a user / device
router.get('/device/:deviceId', (req, res) => {
  logger.info('/device/deviceId params');
  logger.info(req.params.deviceId);
  try {
    getCustomerDetails(req.params.deviceId)
      .then((result) => {
        if (result) {
          logger.info(JSON.stringify(result));
          res.status(200).send({
            message: 'Device found',
            result,
          });
        } else {
          res.status(500).send({
            message: 'Error fetching device',
          });
        }
      });
  } catch (error) {
    logger.info(error);
    res.status(500).send({
      message: 'Error processing request',
      error,
    });
  }
});

module.exports = router;
