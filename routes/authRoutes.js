// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

// Route for a manager to sign up and create a company
router.post("/signup", AuthController.signup);

// Route for a manager to invite an employee
router.post("/invite-employee", AuthController.inviteEmployee);

// Route for an employee to set up their password
router.post("/setup-password", AuthController.setupPassword);

// Route to create a company (for admins)
router.post("/companies", AuthController.createCompany);

// Route for user login
router.post("/login", AuthController.login);

// Route for forgot password
router.post('/forgot-password', AuthController.forgotPassword);

// Route for reset password
router.post('/reset-password', AuthController.resetPassword);

// Route for OTP verification
router.post("/verify-otp", AuthController.verifyOtp);

// Route for resending OTP
router.post("/resend-otp", AuthController.resendOtp);

module.exports = router;
