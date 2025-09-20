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

module.exports = router;
