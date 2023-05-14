const Appointments = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Review = require("../models/Review");
const Prescription = require("../models/Prescription");
const Util = require("../utils/util");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { default: mongoose } = require("mongoose");
const Chat = require("../models/Chat");

// cancell an appointement

exports.cancelAppointment = async (req, res, next) => {
  const userId = req.user._id;
  Util.userExistFromRequest(userId, next);
  try {
    const hour = 1000 * 60 * 60;
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    const todaysDate = new Date().getTime();
    const appointmentDate = new Date(appointment.date).getTime();
    if (appointment.status !== "Cancelled") {
      if ((appointmentDate - todaysDate) / hour > 24) {
        appointment.status = "Cancelled";
        await appointment.save();
        res.send({ success: true });
      } else {
        Util.errorStatment(
          "You can't cancel less than 24hrs to the meeting",
          next
        );
      }
    } else {
      Util.errorStatment("appointment already cancelled", next);
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//post an appointement
exports.postAppointement = async (req, res, next) => {
  const userId = req.user._id;
  Util.userExistFromRequest(userId, next);
  try {
    const { date, doctorId } = req.body;
    const d = new Date(date);

    const appointement = await Appointment.find({ doctorId, date: d });
    if (appointement.length)
      throw new Error("Doctor is already booked at this slot");
    const bookedPatient = await Appointment.find({
      patientId: req.user._id,
      date: d,
    });
    if (bookedPatient.length)
      throw new Error("You already have appointment on picked slot");

    const patient = await User.findById(req.user._id);
    const doctor = await Doctor.findById(doctorId);
    const appointment = new Appointment({
      startTime: date.split("T")[1].split(":")[0] + ":00",
      date: d,
      doctorId,
      patientId: req.user._id,
    });
    patient.appointments = [...patient.appointments, appointment._id];
    doctor.appointments = [...doctor.appointments, appointment._id];
    await appointment.save();
    await patient.save();
    await doctor.save();
    res.send({ success: true, patient });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get all appointments of specific user
exports.getAppointments = async (req, res, next) => {
  const userId = req.user._id;
  Util.userExistFromRequest(userId, next);
  try {
    const nearestResults = await getNearestAppointments(req);
    const futureResults = await getFutureAppointments(req);
    const result = {
      nearestAppointments: nearestResults,
      futureAppointments: futureResults,
    };
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get a single appointment of a specific user
exports.getAppointment = async (req, res, next) => {
  const appointmentId = req.params.appointmentId;

  if (!appointmentId) {
    // check this might have a bug (error throwed not next(error))
    const error = new Error("Appointment Number required");
    error.statusCode = 404;
    throw error;
  }

  try {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: req.user._id,
    }).populate("doctorId");
    if (!appointment) {
      const error = new Error("No appointment with such number");
      error.statusCode = 404;
      throw error;
    }

    const result = {
      ...appointment,
      doctorId: appointment.doctorId._id,
      doctorName: appointment.doctorId.name,
    };
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get single doctor

exports.getDoctor = async (req, res, next) => {
  const { doctorId } = req.params;
  try {
    const doctor = await Doctor.findById(doctorId).populate("reviews").exec();
    if (!doctor) {
      const error = new Error("Something went wrong");
      error.statusCode = 500;
      throw error;
    }
    const result = {
      doctorId: doctor._id,
      speciality: doctor.speciality,
      availability: doctor.availability,
      name: doctor.name,
      img: doctor.imageUrl,
      numberOfVotes: doctor.reviews.length,
      rating: Util.calculateTotalRatings(doctor.reviews),
    };

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get all doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate("reviews");

    if (!doctors) {
      const error = new Error("Something went wrong");
      error.statusCode = 500;
      throw error;
    }
    const result = doctors.map((doctor) => {
      return {
        doctorId: doctor._id,
        speciality: doctor.speciality,
        availability: doctor.availability,
        name: doctor.name,
        img: doctor.imageUrl,
        numberOfVotes: doctor.reviews.length,
        rating: Util.calculateTotalRatings(doctor.reviews),
      };
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("No user found");
      error.statusCode = 404;
      throw error;
    }
    const result = {
      name: user.name,
      email: user.email,
      patientId: req.user._id,
    };
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("No user found");
      error.statusCode = 404;
      throw error;
    }
    user.name = name;
    user.email = email;
    await user.save();
    res.status(201).json({ success: true });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getTopDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate("reviews");
    if (!doctors) {
      const error = new Error("Something went wrong");
      error.statusCode = 500;
      throw error;
    }
    const result = doctors
      .filter((doctor) => {
        if (Util.calculateTotalRatings(doctor.reviews) >= 4) {
          return doctor;
        }
      })
      .map((results) => {
        return {
          doctorId: results._id,
          speciality: results.speciality,
          name: results.name,
          img: results.imageUrl,
          numberOfVotes: results.reviews.length,
          rating: Util.calculateTotalRatings(results.reviews),
        };
      });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.checkPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findOne({ appointmentId: id });
    if (!prescription) return res.status(200).json({ success: false });
    res.status(200).json({ success: true });
  } catch (error) {
    Util.errorStatment("Something went wrong", next);
  }
};

exports.getPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findOne({ appointmentId: id })
      .populate([{ path: "patientId" }, { path: "doctorId" }])
      .exec();
    if (!prescription)
      throw new Error("Sorry, no prescription for such patient");
    const {
      _id,
      medicine,
      dosage,
      duration,
      patientId: { name },
      doctorId,
      createdAt,
    } = prescription;
    const medicine_array = medicine.split(",");
    const dosage_array = dosage.split(",");
    const duration_array = duration.split(",");

    const prescriptionDetails = medicine_array.map((item, index) => {
      return {
        medicine_name: item,
        medicine_duration: duration_array[index],
        medicine_dosage: dosage_array[index],
      };
    });
    const data = {
      number: _id,
      details: prescriptionDetails,
      patient: name,
      doctor: doctorId.name,
      date: createdAt.toLocaleDateString(),
    };

    let pdf = new PDFDocument({ size: "A4", margin: 50 });
    const prescriptionName = "prescription-" + data.number + ".pdf";
    const filePath = path.join(
      __dirname,
      "..",
      "data",
      "prescriptions",
      prescriptionName
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline;filename="' + prescriptionName + '"'
    );
    pdf.pipe(fs.createWriteStream(filePath));
    pdf.pipe(res);
    Util.generatePrescription(pdf, data);
    pdf.end();
  } catch (error) {
    console.log(error);
    Util.errorStatment("Failed fetching prescriptions", next);
  }
};

exports.writeReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!rating) throw new Error("No rating provided");
    const review = await Review.findOne({ doctorId: id, userId: req.user._id });
    const doctor = await Doctor.findById(id);
    if (review) {
      review.rating = rating;
      await review.save();
      doctor.reviews = [...doctor.reviews, review._id];
      await doctor.save();
      return res.status(200).json({ success: true });
    }
    const newReview = new Review({
      rating,
      userId: req.user._id,
      doctorId: id,
    });
    console.log(newReview.rating);
    await newReview.save();
    doctor.reviews = [...doctor.reviews, newReview._id];
    await doctor.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    Util.errorStatment("Failed to write review", next);
  }
};

const getNearestAppointments = async (req) => {
  const appointments = await Appointment.find({
    date: {
      $gte: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
      $lte: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    patientId: req.user._id,
    status: {
      $nin: ["Completed", "Cancelled"],
    },
  })
    .populate("doctorId")
    .exec();
  const result = appointments.map((appt) => {
    return {
      appointmentId: appt._id,
      date: appt.date,
      time: appt.startTime,
      name: appt.doctorId.name,
      status: appt.status,
      doctorId: appt.doctorId._id,
      img: appt.doctorId.imageUrl,
      speciality: appt.doctorId.speciality,
    };
  });
  return result;
};

const getFutureAppointments = async (req) => {
  const appointments = await Appointment.find({
    date: {
      $gte: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    patientId: req.user._id,
    status: {
      $nin: ["Completed", "Cancelled"],
    },
  })
    .populate("doctorId")
    .exec();
  const result = appointments.map((appt) => {
    return {
      appointmentId: appt._id,
      date: appt.date,
      time: appt.startTime,
      name: appt.doctorId.name,
      status: appt.status,
      doctorId: appt.doctorId._id,
      img: appt.doctorId.imageUrl,
      speciality: appt.doctorId.speciality,
    };
  });
  return result;
};

exports.getCancelledAppointments = async (req, res, next) => {
  try {
    const cancelledAppointments = await Appointment.find({
      patientId: req.user._id,
      status: "Cancelled",
    })
      .populate("doctorId")
      .exec();
    const result = cancelledAppointments.map((appt) => {
      return {
        date: appt.date,
        time: appt.startTime,
        name: appt.doctorId.name,
        status: appt.status,
        doctorId: appt.doctorId._id,
        img: appt.doctorId.imageUrl,
        speciality: appt.doctorId.speciality,
      };
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCompletedAppointments = async (req, res, next) => {
  try {
    const CompletedAppointments = await Appointment.find({
      patientId: req.user._id,
      status: "Completed",
    })
      .populate("doctorId")
      .exec();
    const result = CompletedAppointments.map((appt) => {
      return {
        appointmentId: appt._id,
        date: appt.date,
        time: appt.startTime,
        name: appt.doctorId.name,
        status: appt.status,
        doctorId: appt.doctorId._id,
        img: appt.doctorId.imageUrl,
        speciality: appt.doctorId.speciality,
      };
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getChats = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;
    if (!patientId || !doctorId) throw new Error("no");
    const chat = await Chat.find({ patientId, doctorId });
    res.status(200).json({ chat });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
