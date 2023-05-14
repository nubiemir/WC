const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("User");

module.exports = (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new Error("You must Log in first");
    }
    const token = authorization.replace("Bearer ", "");

    if (!token) throw new Error('Not authenticated')

    jwt.verify(
      token,
      `${process.env.MY_SECRET_WEB_TOKEN_KEY}`,
      async (err, payload) => {
        if (err) {
          return res.send({
            success: false,
            error: "Invalid email or password",
          });
        }
        const { userId } = payload;
        const user = await User.findById(userId);
        req.user = user;
        next();
      }
    );
  } catch (err) {
    console.log(err.message);
    const error = new Error(err.message);
    return next(error);
  }
};
