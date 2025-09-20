// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

// Route POST pour l'invitation d'un employé
router.post("/invite", AuthController.invite);

// Route POST pour la connexion des utilisateurs
router.post("/login", AuthController.login);
// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', AuthController.forgotPassword);

// Route pour la réinitialisation du mot de passe
router.post('/reset-password', AuthController.resetPassword);
// Route pour l'inscription d'un nouvel utilisateur
router.post("/signup", AuthController.signup);

// Route pour la vérification de l'email avec le jeton (token)
router.post("/verify-otp", AuthController.verifyOtp);

module.exports = router;
