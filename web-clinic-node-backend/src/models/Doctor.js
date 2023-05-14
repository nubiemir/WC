const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// schema
const DoctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trime: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  speciality: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  availability: {
    from: {
      type: String,
      default: "8:00",
      required: true,
    },
    to: {
      type: String,
      default: "17:00",
      required: true,
    },
  },
  key: {
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
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

DoctorSchema.pre("save", function (next) {
  if (!this) return next("Sorry something went Wrong");
  if (!this.isModified("password")) {
    // encrypt only when password is changed or created for the first time
    return next();
  }

  // passwrod encryption
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next("Sorry something went Wrong");
    }
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) {
        return next("Sorry something went Wrong");
      }
      this.password = hash;
      next();
    });
  });
});

DoctorSchema.methods.comparePassword = async function (passwordEntered) {
  // compare hashed passwords
  const user = this;
  const match = await bcrypt.compare(passwordEntered, user.password);
  return match;
};

module.exports = mongoose.model("Doctor", DoctorSchema);
