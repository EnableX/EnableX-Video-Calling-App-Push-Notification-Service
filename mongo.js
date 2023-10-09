const { MongoClient } = require('mongodb');
require('dotenv').config();
const logger = require('./logger');

let database;
let connString;
if (process.env.MONGO_CONN_STRING) {
  connString = process.env.MONGO_CONN_STRING;
} else if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
  connString = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;
} else {
  connString = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;
}

MongoClient
  .connect(`${connString}`, {
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
exports.saveCustomer = (customerName, phoneNumber, deviceToken, devicePlatform) => new Promise((resolve, reject) => {
  const query = { phone_number: phoneNumber };
  const update = { $set: { name: customerName, token: deviceToken, platform: devicePlatform } };
  const options = { upsert: true }; // This option creates a new document if it doesn't exist

  database
    .collection('customers')
    .updateOne(query, update, options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
});

// get device token to the server
exports.getCustomerByNumber = (phoneNumber) => new Promise((resolve, reject) => {
  database
    .collection('customers')
    .find({ phone_number: phoneNumber })
    // .limit(1)
    .toArray((err, result) => (err ? reject(err) : resolve(result)));
});

// get device token to the server
exports.getCustomerByTokenNumber = (phoneNumber, deviceToken) => new Promise((resolve, reject) => {
  database
    .collection('customers')
    .find({ phone_number: phoneNumber, token: deviceToken })
    .limit(1)
    .toArray((err, result) => (err ? reject(err) : resolve(result)));
});

// get all customer to the server
exports.getCustomers = () => new Promise((resolve, reject) => {
  database
    .collection('customers')
    .find({})
    // .limit(1)
    .toArray((err, result) => (err ? reject(err) : resolve(result)));
});
