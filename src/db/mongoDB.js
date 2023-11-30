const mongoose = require("mongoose");
require("dotenv").config();

const getConnectionString = () => {
  let connectionUri;
  if (process.env.NODE_ENV === 'development') {
    connectionUri = process.env.DATABASE_LOCAL;
    connectionUri = connectionUri.replace("<username>", process.env.DB_USER);
    connectionUri = connectionUri.replace("<password>", process.env.DB_PASS);
  } else {
    connectionUri = process.env.DATABASE_PROD;
  }
  console.log(connectionUri);
  return connectionUri;
};

const connectDB = async () => {
  console.log('connecting to database ....');

  const uri = getConnectionString();
  await mongoose.connect(uri, { dbName: process.env.DB_NAME });

  console.log('connected to database');
};

module.exports = connectDB;
