const vcxutil = require('./vcxutil');

const vcxroom = {};

// HTTP Request Header Creation
const options = {
  host: 'api.enablex.io',
  port: 443,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${vcxutil.getBasicAuthToken()}`,
  },
};

// Function: To create Token for a Room
vcxroom.getToken = function getToken(details, callback) {
  options.path = `/v1/rooms/${details.roomId}/tokens`;
  options.method = 'POST';

  vcxutil.connectServer(options, JSON.stringify(details), (status, data) => {
    if (status === 'success') {
      callback(status, data);
    } else if (status === 'error') {
      callback(status, data);
    }
  });
};

// Function: To create Room
vcxroom.createRoom = function createRoom(callback) {
  const roomMeta = {
    name: 'test Room',
    owner_ref: 'xdada',
    settings: {
      description: '',
      scheduled: false,
      scheduled_time: '',
      adhoc: false,
      participants: '2',
      duration: '60',
      auto_recording: false,
      active_talker: true,
      wait_moderator: false,
      quality: 'SD',
      mode: 'group',
    },
    sip: {
      enabled: false,
    },
  };

  options.path = '/v1/rooms/';
  options.method = 'POST';

  vcxutil.connectServer(options, JSON.stringify(roomMeta), (status, data) => {
    if (status === 'success') {
      callback(status, data);
    } else if (status === 'error') {
      callback(status, data);
    }
  });
};

module.exports = vcxroom;
