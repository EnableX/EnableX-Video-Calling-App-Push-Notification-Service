const btoa = require('btoa');
const https = require('https');
require('dotenv').config();
const logger = require('./logger');

const vcxutil = {};

// Function: To create basic authentication header using APP ID and APP KEY
vcxutil.getBasicAuthToken = function getBasicAuthToken() {
  return btoa(`${process.env.ENABLEX_APP_ID}:${process.env.ENABLEX_APP_KEY}`);
};

// Function: To connect to Enablex Server API Service
vcxutil.connectServer = function connectServer(options, data, callback) {
  logger.info(`REQ URI:- ${options.method} ${options.host}:${options.port}${options.path}`);
  logger.info(`REQ PARAM:- ${data}`);
  const request = https.request(options, (res) => {
    res.on('data', (chunk) => {
      logger.info(`RESPONSE DATA:- ${chunk}`);
      logger.info(JSON.parse(chunk).result);
      if (JSON.parse(chunk).result === 0) {
        callback('success', JSON.parse(chunk));
      } else {
        callback('error', JSON.parse(chunk));
      }
    });
  });
  request.on('error', (err) => {
    logger.info(`RESPONSE ERROR:- ${JSON.stringify(err)}`);
  });
  if (data == null) {
    request.end();
  } else {
    request.end(data);
  }
};

module.exports = vcxutil;
