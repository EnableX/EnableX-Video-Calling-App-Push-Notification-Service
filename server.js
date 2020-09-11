const path = require('path');
// const { readFileSync } = require('fs');
// const { createServer } = require('https');
// npm installed modules
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// application modules
const logger = require('./logger');

const app = express();

// Create https server
// const server = createServer({
//   key: readFileSync(process.env.CERT_KEY).toString(),
//   cert: readFileSync(process.env.CERT_CRT).toString(),
// }, app);

// server.listen(port, () => {
//   logger.info(`Server is running on port ${port}`);
// });

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true,
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes'));

const port = process.env.SERVICE_PORT || 3001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
