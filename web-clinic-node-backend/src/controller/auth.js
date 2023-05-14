const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Identifier = require("../models/doctor_identifier");
const Review = require("../models/Review");
const { validationResult } = require("express-validator");

exports.userSignUp = async (req, res, next) => {
  const errors = validationResult(req); // errors in server side validation
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array()[0];
    return next(error);
  }
  try {
    const { name, email, password } = req.body;
    if (!name || !password || !email) {
      throw new Error("sorry but all fields must be field");
    }
    const user = await User.findOne({ email });
    if (user) {
      throw new Error("Sorry but the email is already taken");
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    const token = jwt.sign(
      { userId: newUser._id },
      `${process.env.MY_SECRET_WEB_TOKEN_KEY}`
    );
    res.send({ success: true, token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.userSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Sorry invalid email or password");
    }
    const match = await user.comparePassword(password);
    if (!match) {
      throw new Error("Sorry invalid email or password");
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.MY_SECRET_WEB_TOKEN_KEY.toString()
    );
    res.send({ success: true, token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.doctorSignUp = async (req, res, next) => {
  const errors = validationResult(req); // errors in server side validation
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  if (!req.file) {
    const error = new Error("Image not provided");
    error.statusCode = 422;
    return next(error);
  }
  try {
    const { name, email, password, speciality, key } = req.body;
    const imageUrl = req.file.path;

    const doctor = await Doctor.findOne({
      email,
    });
    const match = await Identifier.findOne({ identifier: key, name });
    if (!match) {
      throw new Error(
        "Only valid doctors can sign up, make sure your identifier and name is correct"
      );
    }
    if (doctor) {
      throw new Error("Sorry, email is already taken ");
    }
    const newDoctor = new Doctor({
      name,
      password,
      email,
      speciality,
      key,
      imageUrl,
    });
    await newDoctor.save();
    const token = jwt.sign(
      { docId: newDoctor._id },
      `${process.env.MY_SECRET_WEB_TOKEN_KEY}`
    );
    res.status(200).json({ success: true, token });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.doctorSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      throw new Error("Sorry invalid email ");
    }
    const match = await doctor.comparePassword(password);
    if (!match) {
      throw new Error("Sorry invalid password");
    }
    const token = jwt.sign(
      { docId: doctor._id },
      process.env.MY_SECRET_WEB_TOKEN_KEY.toString()
    );
    res.send({ success: true, token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
