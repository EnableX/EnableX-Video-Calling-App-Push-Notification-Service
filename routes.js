const router = require('express').Router();

const firebase = require('./firebase');
const apn = require('./apn');
const mongo = require('./mongo');
const vcxroom = require('./vcxroom');
const logger = require('./logger');

const getDeviceDetails = async (phoneNumber, platform) => {
  const result = await (mongo.getRemoteDeviceToken(phoneNumber, platform));
  logger.info(result);
  return result;
};

// endpoint to send messages for various actions
router.post('/sendMessage', (req, res) => {
  try {
    const { type } = req.body;
    if (type === 'answer') {
      getDeviceDetails(req.body.phone_number, req.body.platform).then((remoteDeviceToken) => {
        if (remoteDeviceToken) {
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
                name: req.body.phone_number,
                role: 'moderator',
                user_ref: req.body.phone_number,
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
                    name: req.body.localPhonenumber,
                    role: 'participant',
                    user_ref: req.body.localPhonenumber,
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
                          remoteDeviceToken[0].token,
                          moderatorToken,
                          req.body.phone_number,
                          req.body.localPhonenumber,
                          roomId,
                        );
                      } else if (remoteDeviceToken[0].platform === 'ios') {
                        apn.sendNotification(
                          remoteDeviceToken[0].token,
                          moderatorToken,
                          req.body.localPhonenumber,
                          req.body.phone_number,
                          roomId,
                        );
                      }
                      // send roomId & token to local device by http response
                      res.status(200);
                      res.send({
                        roomId,
                        token: participantToken,
                      });
                    } else if (status === 'error') {
                      // inform to remote android device using push notification
                      const message = 'Error while creating token for participant';
                      if (remoteDeviceToken[0].platform === 'android') {
                        firebase.sendToDevice(
                          remoteDeviceToken[0].token,
                          message,
                          req.body.localPhonenumber,
                          req.body.phone_number,
                          roomId,
                        );
                      } else if (remoteDeviceToken[0].platform === 'ios') {
                        apn.sendNotification(
                          remoteDeviceToken[0].token,
                          message,
                          req.body.localPhonenumber,
                          req.body.phone_number,
                          roomId,
                        );
                      }
                      // inform to local device by http response
                      res.status(500);
                      res.send('Error while creating token for participant');
                    }
                  });
                } else if (tokenStatus === 'error') {
                  // inform to remote android device using push notification
                  const message = 'Error while creating token for moderator';
                  if (remoteDeviceToken[0].platform === 'android') {
                    firebase.sendToDevice(
                      remoteDeviceToken[0].token,
                      message,
                      req.body.localPhonenumber,
                      req.body.phone_number,
                      roomId,
                    );
                  } else if (remoteDeviceToken[0].platform === 'ios') {
                    apn.sendNotification(
                      remoteDeviceToken[0].token,
                      message,
                      req.body.localPhonenumber,
                      req.body.phone_number,
                      roomId,
                    );
                  }
                  // inform to local device by http response
                  res.status(500);
                  res.send('Error while creating token for moderator');
                }
              });
            } else if (roomStatus === 'error') {
              logger.info('Error while creating room');
              // inform to remote android device using push notification
              const message = 'Error while creating room';
              if (remoteDeviceToken[0].platform === 'android') {
                firebase.sendToDevice(
                  remoteDeviceToken[0].token,
                  message,
                  req.body.localPhonenumber,
                  req.body.phone_number,
                  '',
                );
              } else if (remoteDeviceToken[0].platform === 'ios') {
                apn.sendNotification(
                  remoteDeviceToken[0].token,
                  message,
                  req.body.localPhonenumber,
                  req.body.phone_number,
                  '',
                );
              }
              // inform to local device by http response
              res.status(500);
              res.send('Error while creating room');
            }
          });
        } else {
          logger.info('Error receiving response from device');
          // inform to remote device using push notification
          const message = 'Error receiving response from device';
          if (remoteDeviceToken[0].platform === 'android') {
            firebase.sendToDevice(
              remoteDeviceToken[0].token,
              message,
              req.body.localPhonenumber,
              req.body.phone_number,
              '',
            );
          } else if (remoteDeviceToken[0].platform === 'ios') {
            apn.sendNotification(
              remoteDeviceToken[0].token,
              message,
              req.body.localPhonenumber,
              req.body.phone_number,
              '',
            );
          }

          // inform to local device by http response
          res.status(404);
          res.send('Device token not found for the given number');
        }
      });
    }

    if (type === 'reject') {
      mongo.getRemoteDeviceToken(req.body.phone_number, req.body.platform);
      getDeviceDetails(req.body.phone_number, req.body.platform).then((remoteDeviceToken) => {
        if (remoteDeviceToken) {
          if (remoteDeviceToken[0].platform === 'android') {
            firebase.sendToDevice(
              remoteDeviceToken[0].token,
              'call rejected',
              req.body.phone_number,
              req.body.localPhonenumber,
              '',
            );
          } else if (remoteDeviceToken[0].platform === 'ios') {
            apn.sendNotification(
              remoteDeviceToken[0].token,
              'call rejected',
              req.body.localPhonenumber,
              req.body.phone_number,
              '',
            );
          }
          res.send({
            message: 'rejection success',
            result: '0',
          });
        }
      });
    }

    if (type === 'not_available') {
      mongo.getRemoteDeviceToken(req.body.phone_number, req.body.platform);
      getDeviceDetails(req.body.phone_number, req.body.platform).then((remoteDeviceToken) => {
        if (remoteDeviceToken) {
          if (remoteDeviceToken[0].platform === 'android') {
            firebase.sendToDevice(
              remoteDeviceToken[0].token,
              'not_available',
              req.body.phone_number,
              req.body.localPhonenumber,
              '',
            );
          } else if (remoteDeviceToken[0].platform === 'ios') {
            apn.sendNotification(
              remoteDeviceToken[0].token,
              'not_available',
              req.body.localPhonenumber,
              req.body.phone_number,
              '',
            );
          }
          res.send({
            message: 'not_available success',
            result: '0',
          });
        }
      });
    }
    // else {
    //   mongo.getRemoteDeviceToken(req.body.localPhonenumber, req.body.phone_number, req.body.message);
    //   res.send({
    //     message: 'id success',
    //     result: '0',
    //   });
    // }
  } catch (error) {
    res.status(500).send('message did not send');
  }
});

// endpoint to register devices
router.post('/registerDevice', (req, res) => {
  try {
    mongo.registerDevice(req.body.phone_number, req.body.token, req.body.platform);
    res.send('Device is registered successfully');
  } catch (error) {
    res.status(500).send('Device is not registered');
  }
});

module.exports = router;
