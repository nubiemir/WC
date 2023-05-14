const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],
});

UserSchema.pre("save", function (next) {
  const user = this;
  if (!user) {
    return next("Sorry something went Wrong");
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next("Sorry something went Wrong");
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next("Sorry something went Wrong");
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = async function (passwordEntered) {
  const user = this;
  const match = await bcrypt.compare(passwordEntered, user.password);
  return match;
};

module.exports = mongoose.model("User", UserSchema);
