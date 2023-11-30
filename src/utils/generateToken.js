require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(user, process.env.SECRET_TOKEN, {
    expiresIn: "240h",
  });
};

module.exports = generateToken;
