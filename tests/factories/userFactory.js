const User = require("../../models/User");

module.exports = async () => {
  return new User().save();
};
