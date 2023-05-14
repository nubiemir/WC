const express = require("express");
const router = express.Router();
const doctorController = require("../controller/doctorController");
const isAuth = require("../middlewares/doctroAuthMiddleware");

// GET ---> appointments for a specific doctor
router.get("/appointments", isAuth, doctorController.getAppointments);

//Get ---> completed appointments
router.get(
  "/incompleted-appointments",
  isAuth,
  doctorController.getTobeCompleted
);

// GET ---> appointments for today
router.get("/today", isAuth, doctorController.getTodayAppointments);

// GET ---> appointments nearest
router.get("/nearest", isAuth, doctorController.getNearestAppointments);

// GET ---> appointment future
router.get("/future", isAuth, doctorController.getFutureAppointments);

// Update ---> appointment status
router.put(
  "/appointment/:id",
  isAuth,
  doctorController.updateAppointmentStatus
);

// GET ---> profile
router.get("/profile", isAuth, doctorController.getProfile);

// GET ---> reviews
router.get("/reviews", isAuth, doctorController.getReviews);

// POST ---> prescription
router.post("/prescription", isAuth, doctorController.writePrescription);

router.get("/chat", isAuth, doctorController.getChats);

module.exports = router;
