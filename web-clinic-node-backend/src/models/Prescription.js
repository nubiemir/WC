const mongoose = require("mongoose");

const PresecriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  medicine: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  }
},{timestamps:true});

module.exports = mongoose.model("Prescription", PresecriptionSchema);
