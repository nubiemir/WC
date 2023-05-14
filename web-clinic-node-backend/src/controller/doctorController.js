const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Review = require("../models/Review");
const Prescription = require("../models/Prescription");
const Util = require("../utils/util");
const Chat = require("../models/Chat");

exports.getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.doctor._id })
      .populate("patientId")
      .exec();
    const result = appointments.map((appt) => {
      return {
        id: appt._id,
        date: appt.date,
        time: appt.startTime,
        patientName: appt.patientId.name,
        status: appt.status,
        patientId: appt.patientId._id,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    Util.errorStatment("Appointments not found", next);
  }
};

exports.getTodayAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      date: {
        $gte: new Date(new Date().setHours(00, 00, 00)),
        $lte: new Date(new Date().setHours(23, 59, 59)),
      },
      doctorId: req.doctor._id,
    })
      .populate("patientId")
      .exec();
    const result = appointments.map((appt) => {
      return {
        id: appt._id,

        date: appt.date,
        time: appt.startTime,
        patientName: appt.patientId.name,
        status: appt.status,
        patientId: appt.patientId._id,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    Util.errorStatment("Could not query appointments", next);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) Util.errorStatment("Doctor not found", next);
    const { name, email, imageUrl } = doctor;
    res.status(200).json({ name, email, imageUrl, id: doctor._id });
  } catch (error) {
    Util.errorStatment("Profile not found", next);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ doctorId: req.doctor._id });
    const reviews_count = {
      excellent: 0,
      good: 0,
      satisfactory: 0,
      poor: 0,
      veryPoor: 0,
    };
    reviews.map((review) => {
      if (review.rating === 5) reviews_count.excellent++;
      else if (review.rating === 4) reviews_count.good++;
      else if (review.rating === 3) reviews_count.satisfactory++;
      else if (review.rating === 2) reviews_count.poor++;
      else reviews_count.veryPoor++;
    });

    if (!reviews) {
      res.status(200).json({});
      return;
    }
    res.status(200).json(reviews_count);
  } catch (error) {
    Util.errorStatment("Failed Retrieving Reviews", next);
  }
};

exports.writePrescription = async (req, res, next) => {
  try {
    const { medicine, dosage, duration, appId, patient } = req.body;

    if (!medicine || !dosage || !duration || !appId || !patient)
      throw new Error("Please provide neccessary details");

    const prescription = await Prescription.find({ appointmentId: appId });

    if (prescription.length)
      throw new Error("Prescription for mentioned appointment already exists");

    const newPrescription = new Prescription({
      appointmentId: appId,
      patientId: patient,
      doctorId: req.doctor._id,
      medicine,
      dosage,
      duration,
    });
    await newPrescription.save();
    res
      .status(200)
      .json({ success: true, message: "Prescription successfully created" });
  } catch (error) {
    console.log(error);
    Util.errorStatment("Failed Retrieving Prescriptions", next);
  }
};

exports.getNearestAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      date: {
        $gte: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
        $lte: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      doctorId: req.doctor._id,
      status: {
        $nin: ["Completed", "Cancelled"],
      },
    })
      .populate("patientId")
      .exec();
    const result = appointments.map((appt) => {
      return {
        id: appt._id,

        date: appt.date,
        time: appt.startTime,
        patientName: appt.patientId.name,
        status: appt.status,
        patientId: appt.patientId._id,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    Util.errorStatment("Could not query appointments", next);
  }
};

exports.getFutureAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      date: {
        $gte: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      doctorId: req.doctor._id,
      status: {
        $nin: ["Completed", "Cancelled"],
      },
    })
      .populate("patientId")
      .exec();
    const result = appointments.map((appt) => {
      return {
        id: appt._id,

        date: appt.date,
        time: appt.startTime,
        patientName: appt.patientId.name,
        status: appt.status,
        patientId: appt.patientId._id,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    Util.errorStatment("Could not query appointments", next);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) throw new Error("No such appointment");

    if (appointment.date >= new Date())
      throw new Error("Appointment is not completed yet");

    appointment.status = "Completed";
    await appointment.save();
    res.status(200).json({ success: true });
  } catch (error) {
    Util.errorStatment("Failed Updating Status", next);
  }
};

exports.getTobeCompleted = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      date: {
        $lte: new Date(),
      },
      doctorId: req.doctor._id,
      status: {
        $eq: "Pending",
      },
    })
      .populate("patientId")
      .exec();
    const result = appointments.map((appt) => {
      return {
        id: appt._id,
        date: appt.date,
        time: appt.startTime,
        patientName: appt.patientId.name,
        status: appt.status,
        patientId: appt.patientId._id,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    Util.errorStatment("Could not query appointments", next);
  }
};

exports.getChats = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;
    console.log(patientId, doctorId, "print");
    if (!patientId || !doctorId) throw new Error("no");
    const chat = await Chat.find({ patientId, doctorId });
    console.log(chat);
    res.status(200).json({ chat });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
