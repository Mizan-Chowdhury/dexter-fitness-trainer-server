const generateToken = require("../../../../utils/generateToken");



const createToken = async (req, res) => {
  const user = req.body;
  console.log(user, 'user from createToken');
  const token = generateToken(user);
  res.send({ token });
};

module.exports = createToken;
