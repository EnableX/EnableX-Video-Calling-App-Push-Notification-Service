// npm installed modules
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// application modules
const logger = require('./logger');

const app = express();

app.use(bodyParser.json());
app.use('/', require('./routes'));

const port = process.env.SERVICE_PORT || 3001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
