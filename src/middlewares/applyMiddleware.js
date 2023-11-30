const cors = require("cors");
const express = require("express");
const { LOCAL_CLIENT, CLIENT } = require("../config/default");
// const cookieParser = require("cookie-parser");

const applyMiddleWare = (app) => {
  app.use(express.json());
  app.use(cors());
  // {
  //   origin: [
  //     CLIENT,
  //     LOCAL_CLIENT
  //   ],
  //   credentials: true,
  //   optionsSuccessStatus: 200
  // }
  // app.use(cookieParser());
};

module.exports = applyMiddleWare;
