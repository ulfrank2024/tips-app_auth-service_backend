// controllers/authController.js
const AuthModel = require("../models/authModel");

const AuthController = {
    invite: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email est requis" });
        }

        try {
            const { error } = await AuthModel.inviteUserByEmail(email);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.status(200).json({
                message: "Lien d'invitation envoyé avec succès.",
            });
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

            // On récupère le rôle de l'utilisateur via le modèle
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
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email est requis." });
        }

        try {
            const { error } = await AuthModel.sendPasswordResetEmail(email);

            if (error) {
                console.error(error);
                return res
                    .status(400)
                    .json({ error: "Échec de l'envoi de l'email." });
            }

            res.status(200).json({
                message:
                    "Un lien de réinitialisation a été envoyé à votre email.",
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur interne." });
        }
    },

    resetPassword: async (req, res) => {
        const { password, accessToken } = req.body;

        // Le accessToken est le token de la session temporaire récupéré du lien de réinitialisation
        if (!password || !accessToken) {
            return res
                .status(400)
                .json({
                    error: "Le nouveau mot de passe et le jeton d'accès sont requis.",
                });
        }

        try {
            // Superbase utilise le jeton temporaire pour mettre à jour le mot de passe
            // et crée une nouvelle session pour l'utilisateur.
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
};

module.exports = AuthController;
