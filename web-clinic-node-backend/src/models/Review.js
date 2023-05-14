const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  doctorId: {
    type: mongoose.Types.ObjectId,
    ref: "Doctor",
  },
});

module.exports = mongoose.model("Review", ReviewSchema);
