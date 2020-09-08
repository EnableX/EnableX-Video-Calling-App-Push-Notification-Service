const router = require('express').Router();

const firebase = require('./firebase');
const apn = require('./apn');
const mongo = require('./mongo');
const vcxroom = require('./vcxroom');
const logger = require('./logger');

const getCustomerDetails = async (remotePhoneNumber) => {
  const result = await (mongo.getCustomerByNumber(remotePhoneNumber));
  logger.info(JSON.stringify(result));
  return result;
};

// initiate call
router.post('/call', (req, res) => {
  try {
    getCustomerDetails(req.body.remote_number).then((remoteDeviceToken) => {
      if (remoteDeviceToken.length > 0) {
        if (remoteDeviceToken[0].platform === 'android') {
          firebase.sendToDevice(
            req.body.call_id,
            remoteDeviceToken[0].token,
            'call-initiated',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        } else if (remoteDeviceToken[0].platform === 'ios') {
          apn.sendNotification(
            req.body.call_id,
            remoteDeviceToken[0].token,
            'call-initiated',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        }
        res.send({
          message: 'call-initiated',
          result: '0',
        });
      } else {
        logger.info(`Record not found for the number ${req.body.remote_number}`);
        res.status(404);
        res.send({
          message: `Record not found for the number ${req.body.remote_number}`,
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      message: 'Error processing request',
      error,
    });
  }
});

// reject call
router.put('/call/:callId/unavailable', (req, res) => {
  try {
    getCustomerDetails(req.body.remote_number).then((remoteDeviceToken) => {
      if (remoteDeviceToken.length > 0) {
        if (remoteDeviceToken[0].platform === 'android') {
          firebase.sendToDevice(
            req.params.callId,
            remoteDeviceToken[0].token,
            'unavailable',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        } else if (remoteDeviceToken[0].platform === 'ios') {
          apn.sendNotification(
            req.params.callId,
            remoteDeviceToken[0].token,
            'unavailable',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        }
        res.send({
          call_id: req.params.callId,
          message: 'unavailable',
          result: '0',
        });
      } else {
        logger.info(`Record not found for the number ${req.body.remote_number}`);
        res.status(404);
        res.send({
          call_id: req.params.callId,
          message: `Record not found for the number ${req.body.remote_number}`,
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      call_id: req.params.callId,
      message: 'error processing request',
    });
  }
});

// reject call
router.put('/call/:callId/reject', (req, res) => {
  try {
    getCustomerDetails(req.body.remote_number).then((remoteDeviceToken) => {
      if (remoteDeviceToken.length > 0) {
        if (remoteDeviceToken[0].platform === 'android') {
          firebase.sendToDevice(
            req.params.callId,
            remoteDeviceToken[0].token,
            'call rejected',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        } else if (remoteDeviceToken[0].platform === 'ios') {
          apn.sendNotification(
            req.params.callId,
            remoteDeviceToken[0].token,
            'call rejected',
            req.body.local_number,
            req.body.remote_number,
            '',
            '',
          );
        }
        res.send({
          call_id: req.params.callId,
          message: 'call rejected',
          result: '0',
        });
      } else {
        logger.info(`Record not found for the number ${req.body.remote_number}`);
        res.status(404);
        res.send({
          call_id: req.params.callId,
          message: `Record not found for the number ${req.body.remote_number}`,
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      call_id: req.params.callId,
      message: 'error processing request',
      error,
    });
  }
});

// endpoint to send messages for various actions
router.put('/call/:callId/answer', (req, res) => {
  try {
    getCustomerDetails(req.body.remote_number).then((remoteDeviceToken) => {
      if (remoteDeviceToken.length > 0) {
        // create EnableX room
        let roomId = '';
        logger.info('creating enablex room');
        vcxroom.createRoom((roomStatus, roomData) => {
          logger.info(`roomStatus ${roomStatus}`);
          logger.info(JSON.stringify(roomData));
          if (roomStatus === 'success') {
            // Room Created successfully, create EnableX room token for moderator
            logger.info('creating enablex token for moderator');
            roomId = roomData.room.room_id;
            const createModeratorTokenObj = {
              name: req.body.remote_number,
              role: 'moderator',
              user_ref: req.params.callId,
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
                  name: req.body.local_number,
                  role: 'participant',
                  user_ref: req.params.callId,
                  roomId,
                };

                let participantToken = '';
                logger.info('creating enablex token for participant');
                vcxroom.getToken(createParticipantTokenObj, (status, data) => {
                  logger.info(status);
                  logger.info(JSON.stringify(data));
                  if (status === 'success') {
                    // room created and token created for moderator & participant
                    participantToken = data.token;
                    // send roomId & token to remote device using push notification
                    if (remoteDeviceToken[0].platform === 'android') {
                      firebase.sendToDevice(
                        req.params.callId,
                        remoteDeviceToken[0].token,
                        'call start',
                        req.body.local_number,
                        req.body.remote_number,
                        roomId,
                        moderatorToken,
                      );
                    } else if (remoteDeviceToken[0].platform === 'ios') {
                      apn.sendNotification(
                        req.params.callId,
                        remoteDeviceToken[0].token,
                        'call start',
                        req.body.local_number,
                        req.body.remote_number,
                        roomId,
                        moderatorToken,
                      );
                    }
                    // send roomId & token to local device by http response
                    res.status(200);
                    res.send({
                      call_id: req.params.callId,
                      message: 'call start',
                      roomId,
                      token: participantToken,
                    });
                  } else if (status === 'error') {
                    // inform to remote android device using push notification
                    if (remoteDeviceToken[0].platform === 'android') {
                      firebase.sendToDevice(
                        req.params.callId,
                        remoteDeviceToken[0].token,
                        'Error creating token for participant',
                        req.body.local_number,
                        req.body.remote_number,
                        roomId,
                        '',
                      );
                    } else if (remoteDeviceToken[0].platform === 'ios') {
                      apn.sendNotification(
                        req.params.callId,
                        remoteDeviceToken[0].token,
                        'Error while creating token for participant',
                        req.body.local_number,
                        req.body.remote_number,
                        roomId,
                        '',
                      );
                    }
                    // inform to local device by http response
                    res.status(500);
                    res.send({
                      call_id: req.params.callId,
                      message: 'Error creating token for participant',
                      roomId,
                      token: '',
                    });
                  }
                });
              } else if (tokenStatus === 'error') {
                // inform to remote android device using push notification
                if (remoteDeviceToken[0].platform === 'android') {
                  firebase.sendToDevice(
                    req.params.callId,
                    remoteDeviceToken[0].token,
                    'Error creating token for moderator',
                    req.body.local_number,
                    req.body.remote_number,
                    roomId,
                    '',
                  );
                } else if (remoteDeviceToken[0].platform === 'ios') {
                  apn.sendNotification(
                    req.params.callId,
                    remoteDeviceToken[0].token,
                    'Error creating token for moderator',
                    req.body.local_number,
                    req.body.remote_number,
                    roomId,
                    '',
                  );
                }
                // inform to local device by http response
                res.status(500);
                res.send({
                  call_id: req.params.callId,
                  message: 'Error creating token for moderator',
                  roomId,
                  token: '',
                });
              }
            });
          } else if (roomStatus === 'error') {
            logger.info('Error while creating room');
            // inform to remote android device using push notification
            if (remoteDeviceToken[0].platform === 'android') {
              firebase.sendToDevice(
                req.params.callId,
                remoteDeviceToken[0].token,
                'Error creating room',
                req.body.local_number,
                req.body.remote_number,
                '',
                '',
              );
            } else if (remoteDeviceToken[0].platform === 'ios') {
              apn.sendNotification(
                req.params.callId,
                remoteDeviceToken[0].token,
                'Error creating room',
                req.body.local_number,
                req.body.remote_number,
                '',
                '',
              );
            }
            // inform to local device by http response
            res.status(500);
            res.send({
              call_id: req.params.callId,
              message: 'Error creating room',
              roomId: '',
              token: '',
            });
          }
        });
      } else {
        logger.info(`Record not found for the number ${req.body.remote_number}`);
        res.status(404);
        res.send({
          call_id: req.params.callId,
          message: `Record not found for the number ${req.body.remote_number}`,
          roomId: '',
          token: '',
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      call_id: '',
      message: 'Error processing request',
      roomId: '',
      token: '',
      error,
    });
  }
});

const registerDevice = async (phoneNumber, deviceToken, devicePlatform) => {
  const result = await (mongo.saveCustomer(phoneNumber, deviceToken, devicePlatform));
  logger.info(JSON.stringify(result));
  return result;
};

// endpoint to register devices
router.post('/device', (req, res) => {
  try {
    registerDevice(req.body.phone_number, req.body.device_token, req.body.platform)
      .then((result) => {
        if (result) {
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
  } catch (error) {
    logger.info(error);
    res.status(500).send({
      message: 'Error processing request',
      error,
    });
  }
});

module.exports = router;
