const { AuthModel } = require("../models/authModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const AuthController = {
    // Only admins should be able to create companies
    createCompany: async (req, res) => {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "COMPANY_NAME_REQUIRED" });
        }

        try {
            const company = await AuthModel.createCompany(name);
            res.status(201).json({ message: "Company created successfully.", company });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    signup: async (req, res) => {
        const { email, password, companyName } = req.body;
        if (!email || !password || !companyName) {
            return res.status(400).json({ error: "SIGNUP_FIELDS_REQUIRED" });
        }

        try {
            let user = await AuthModel.findUserByEmail(email);
            if (user && user.email_validated) {
                return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
            }

            const company = await AuthModel.createCompany(companyName);
            user = await AuthModel.createUser(email, password, 'manager', company.id, null);

            const otp = await AuthModel.createEmailVerificationOtp(user.id);

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Verify your account",
                html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(201).json({
                message: "Manager account created. A verification code has been sent to your email.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    verifyOtp: async (req, res) => {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "EMAIL_OTP_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }

            const otpData = await AuthModel.findEmailVerificationOtp(user.id, otp);
            if (!otpData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_OTP" });
            }

            await AuthModel.validateUserEmail(user.id);
            await AuthModel.deleteEmailVerificationOtp(user.id, otp);

            // Send welcome email
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Bienvenue !",
                html: `<p>Bienvenue sur notre plateforme ! Votre compte est maintenant activé.</p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Email vérifié avec succès !" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    resendOtp: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "EMAIL_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }

            const otp = await AuthModel.createEmailVerificationOtp(user.id);

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Nouveau code de vérification",
                html: `<p>Votre nouveau code de vérification est : <strong>${otp}</strong></p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Un nouveau code a été envoyé." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "LOGIN_FIELDS_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res
                    .status(401)
                    .json({ error: "INVALID_CREDENTIALS" });
            }

            if (!user.email_validated) {
                return res.status(401).json({ error: "EMAIL_NOT_VALIDATED" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res
                    .status(401)
                    .json({ error: "INVALID_CREDENTIALS" });
            }

            // In a real app, you would generate a JWT here
            res.status(200).json({ message: "Connexion réussie.", user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "EMAIL_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                // Don't reveal that the user doesn't exist
                return res.status(200).json({
                    message:
                        "Si un compte avec cet email existe, un code de réinitialisation a été envoyé.",
                });
            }

            // Delete any existing OTPs for this user to ensure only one is active
            await AuthModel.deletePasswordResetOtp(user.id);

            const otp = await AuthModel.createPasswordResetOtp(user.id);

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Code de réinitialisation de votre mot de passe",
                html: `<p>Votre code de réinitialisation de mot de passe est : <strong>${otp}</strong></p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                message:
                    "Si un compte avec cet email existe, un code de réinitialisation a été envoyé.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    resetPassword: async (req, res) => {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res
                .status(400)
                .json({ error: "EMAIL_OTP_PASSWORD_REQUIRED" });
        }

        try {
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({ error: "USER_NOT_FOUND" });
            }

            const otpData = await AuthModel.findPasswordResetOtp(user.id, otp);
            if (!otpData) {
                return res
                    .status(400)
                    .json({ error: "INVALID_OR_EXPIRED_OTP" });
            }

            await AuthModel.updatePassword(user.id, password);
            await AuthModel.deletePasswordResetOtp(user.id, otp); // Delete specific OTP after use

            res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    inviteEmployee: async (req, res) => {
        // This assumes the manager is authenticated and req.user is populated.
        // const manager = req.user;
        const manager = { company_id: 'some-company-id' }; // Placeholder

        const { email, category } = req.body;
        if (!email || !category) {
            return res.status(400).json({ error: "INVITE_FIELDS_REQUIRED" });
        }

        try {
            let user = await AuthModel.findUserByEmail(email);
            if (user) {
                return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
            }

            user = await AuthModel.createUser(email, null, 'employee', manager.company_id, category);
            const token = await AuthModel.createPasswordSetupToken(user.id);

            const setupLink = `http://localhost:3000/setup-password?token=${token}`;

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "You have been invited to join the team!",
                html: `<p>Click this link to set up your account and password:</p><a href="${setupLink}">Set up account</a>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Invitation sent successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },

    setupPassword: async (req, res) => {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: "TOKEN_PASSWORD_REQUIRED" });
        }

        try {
            const tokenData = await AuthModel.findPasswordSetupToken(token);
            if (!tokenData) {
                return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
            }

            await AuthModel.updatePassword(tokenData.user_id, password);
            await AuthModel.validateUserEmail(tokenData.user_id);
            await AuthModel.deletePasswordSetupToken(token);

            res.status(200).json({ message: "Password set up successfully." });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    },
};

module.exports = AuthController;