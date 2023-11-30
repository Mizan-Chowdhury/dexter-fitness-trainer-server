require("dotenv").config();
const config = {
    CLIENT : process.env.CLIENT,
    LOCAL_CLIENT:process.env.LOCAL_CLIENT
}
module.exports = config;