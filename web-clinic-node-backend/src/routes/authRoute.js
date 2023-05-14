const router = require("express").Router();
const authController = require("../controller/auth");
const { body } = require("express-validator");

// POST --> SIGN IN
router.post(
  "/sign-in",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please Provide valid email"),
    body("password").isLength({ min: 5 }).trim(),
  ],
  authController.userSignIn
);

// POST --> SING UP
router.post(
  "/sign-up",
  [
    body("name").trim().isString().withMessage("Please provide the user name"),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please Provide valid email"),
    body("password").isLength({ ming: 5 }).trim(),
  ],
  authController.userSignUp
);

// POST --> SIGN UP (doctor)
router.post(
  "/doctor/sign-up",
  // [
  //   body("email").isEmail().normalizeEmail(),
  //   body("password").isLength({ min: 5 }).trim(),
  //   body("key")
  //     .isLength({ min: 10, max: 10 })
  //     .withMessage("Invalid identifier"),
  //   body("name").not().isEmpty(),
  //   body("speciality").not().isEmpty(),
  // ],
  authController.doctorSignUp
);

//POST ---> SIGN IN (doctor)
router.post(
  "/doctor/sign-in",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 5 }).trim(),
  ],
  authController.doctorSignIn
);

module.exports = router;
