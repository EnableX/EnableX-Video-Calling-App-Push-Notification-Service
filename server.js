// npm core modules
const path = require('path');
const { readFileSync } = require('fs');
const https = require('https');
const http = require('http');
// npm installed modules
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// application modules
const logger = require('./logger');

const app = express();

// Create https server
let server;
if (process.env.LISTEN_SSL === true) {
  const options = {
    key: readFileSync(process.env.CERT_KEY).toString(),
    cert: readFileSync(process.env.CERT_CRT).toString(),
  };
  if (process.env.CERT_CA_CERTS) {
    options.ca = [];
    options.ca.push(readFileSync(process.env.CERT_CA_CERTS).toString());
  }
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files such as images, CSS files, and JavaScript files in the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes'));

const port = process.env.SERVICE_PORT || 3001;

server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
