const { MongoClient } = require('mongodb');
require('dotenv').config();
const logger = require('./logger');

let database;

MongoClient
  .connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((db) => {
    logger.info('Connected to the database!');
    database = db.db(process.env.MONGO_DB);
  })
  .catch((err) => {
    logger.info('Cannot connect to the database!', err);
    process.exit();
  });

// register device (token) to the server
exports.registerDevice = (phoneNumber, tokenId, platform) => {
  const myobj = { phone_number: phoneNumber, token: tokenId, platform };
  database.collection('customers').insertOne(myobj, (err) => {
    if (err) throw err;
  });
};

// get device token to the server
exports.getRemoteDeviceToken = (phoneNumber, platform) => new Promise((resolve, reject) => {
  database
    .collection('customers')
    .find({ phone_number: phoneNumber, platform })
    .limit(1)
    .toArray((err, result) => (err ? reject(err) : resolve(result)));
});
