require("dotenv").config();
const express = require("express");
const applyMiddleWare = require("./middlewares/applyMiddleware");
const connectDB = require("./db/mongoDB");
const app = express();
const port = process.env.PORT || 5000;

const authenticationRouters = require('./routers/authentication/index')


applyMiddleWare(app);
app.use(authenticationRouters)





app.get("/health", async (req, res) => {
  res.send("server is running on UI");
});

app.all("*", (req, res, next) => {
  const error = new Error(`the requested url is invalid : [${req.url}]`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.status(err.status || 5000).json({
    message: err.message,
  });
});

const main = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log("server is running on port :", port);
  });
};

main();