const AuthModel = require("../models/authModel");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Configuration de Nodemailer avec les variables d'environnement
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
    /**
     * @description Envoie un lien d'invitation à un utilisateur par e-mail.
     */
    invite: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email est requis" });
        }

        try {
            // Générer le lien d'invitation avec Supabase
            const { data, error } = await AuthModel.generateInvitationLink(
                email
            );

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            const invitationLink = data.properties.email_redirect_to;

            // Envoyer l'e-mail avec Nodemailer
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Vous êtes invité à rejoindre notre équipe!",
                html: `<p>Cliquez sur ce lien pour vous inscrire :</p><a href="${invitationLink}">Rejoindre l'équipe</a>`,
            };
            await transporter.sendMail(mailOptions);

            res.status(200).json({
                message: "Lien d'invitation envoyé avec succès.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    /**
     * @description Gère la connexion d'un utilisateur avec un mot de passe.
     */
    login: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email et mot de passe requis" });
        }

        try {
            const { data, error } = await AuthModel.signInWithPassword(
                email,
                password
            );

            if (error) {
                return res
                    .status(401)
                    .json({ error: "Identifiants invalides." });
            }

            const { data: profile, error: profileError } =
                await AuthModel.getProfileById(data.user.id);
            if (profileError) {
                console.error(profileError);
            }

            res.status(200).json({
                session: data.session,
                user: { ...data.user, role: profile?.role },
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    /**
     * @description Gère la demande de réinitialisation de mot de passe et envoie un e-mail de réinitialisation.
     */
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email est requis." });
        }

        try {
            // Générer le lien de réinitialisation avec Supabase
            const { data, error } = await AuthModel.generatePasswordResetLink(
                email
            );

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            const resetLink = data.properties.action_link;

            // Envoyer l'e-mail avec Nodemailer
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Réinitialisation de votre mot de passe",
                html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><a href="${resetLink}">Réinitialiser le mot de passe</a>`,
            };
            await transporter.sendMail(mailOptions);

            res.status(200).json({
                message:
                    "Un lien de réinitialisation a été envoyé à votre email.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    /**
     * @description Met à jour le mot de passe d'un utilisateur après la réinitialisation.
     */
    resetPassword: async (req, res) => {
        const { password } = req.body;

        if (!password) {
            return res
                .status(400)
                .json({ error: "Le nouveau mot de passe est requis." });
        }

        try {
            const { error } = await AuthModel.updatePassword(password);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.status(200).json({
                message: "Votre mot de passe a été mis à jour avec succès.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    /**
     * @description Gère l'inscription d'un nouvel utilisateur.
     */
    signup: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: "L'email et le mot de passe sont requis.",
            });
        }

        try {
            const { data, error } = await AuthModel.signUp(email, password);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            // Génération du lien de vérification par Supabase
            const { data: linkData, error: linkError } =
                await AuthModel.generateEmailVerificationLink(email);
            if (linkError) {
                throw linkError;
            }

            const verificationLink = linkData.properties.email_redirect_to;

            // Envoi de l'e-mail avec Nodemailer
            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL,
                to: email,
                subject: "Vérification de votre compte",
                html: `
                    <p>Cliquez sur ce lien pour vérifier votre adresse e-mail :</p>
                    <a href="${verificationLink}">Vérifier mon compte</a>
                `,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                message:
                    "Un lien de vérification a été envoyé à votre adresse e-mail.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    /**
     * @description Gère la vérification d'un code OTP ou token pour un utilisateur.
     */
    verifyOtp: async (req, res) => {
        const { email, token } = req.body;
        if (!email || !token) {
            return res.status(400).json({
                error: "L'email et le jeton de vérification sont requis.",
            });
        }

        try {
            const { data, error } = await AuthModel.verifyOtp(email, token);

            if (error) {
                return res.status(400).json({
                    error: "Jeton de vérification invalide ou expiré.",
                });
            }

            res.status(200).json({
                message: "Votre compte a été vérifié avec succès.",
                session: data.session,
                user: data.user,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },
};

module.exports = AuthController;
