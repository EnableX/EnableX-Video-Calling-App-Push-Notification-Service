// npm core modules
const path = require('path');
// npm installed modules
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// application modules
const logger = require('./logger');

const app = express();

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files such as images, CSS files, and JavaScript files in the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes'));

const port = process.env.SERVICE_PORT || 3001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
