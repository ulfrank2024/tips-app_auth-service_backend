// models/authModel.js
const { createClient } = require("@supabase/supabase-js");

// On initialise Supabase ici pour que tous les modèles puissent l'utiliser
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AuthModel = {
    /**
     * @description Envoie une invitation par email via un lien magique de Supabase.
     * @param {string} email
     */
    inviteUserByEmail: async (email) => {
        return supabase.auth.signInWithOtp({ email });
    },

    /**
     * @description Authentifie un utilisateur avec son email et mot de passe.
     * @param {string} email
     * @param {string} password
     */
    signInWithPassword: async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    },

    /**
     * @description Récupère le profil d'un utilisateur par son ID.
     * @param {string} userId
     */
    getProfileById: async (userId) => {
        return supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
    },

    /**
     * @description Envoie un email de réinitialisation de mot de passe à l'utilisateur.
     * @param {string} email
     */
    sendPasswordResetEmail: async (email) => {
        return supabase.auth.resetPasswordForEmail(email);
    },

    /**
     * @description Met à jour le mot de passe d'un utilisateur.
     * Cette fonction est appelée après la vérification via le lien.
     * @param {string} newPassword
     */
    updatePassword: async (newPassword) => {
        return supabase.auth.updateUser({ password: newPassword });
    },

    //-----------------------------------------------------
    // Nouvelles méthodes ajoutées pour les fonctionnalités avancées
    //-----------------------------------------------------

    /**
     * @description Crée un nouvel utilisateur.
     * @param {string} email
     * @param {string} password
     */
    signUp: async (email, password) => {
        return supabase.auth.signUp({ email, password });
    },

    /**
     * @description Vérifie un code à usage unique (OTP) pour l'email.
     * @param {string} email
     * @param {string} token
     */
    verifyOtp: async (email, token) => {
        return supabase.auth.verifyOtp({ email, token, type: "email" });
    },

    /**
     * @description Génère un lien d'invitation d'administrateur.
     * @param {string} email
     */
    generateInvitationLink: async (email) => {
        return supabase.auth.admin.generateLink({
            type: "invite",
            email: email,
        });
    },

    /**
     * @description Génère un lien de réinitialisation de mot de passe.
     * @param {string} email
     */
    generatePasswordResetLink: async (email) => {
        return supabase.auth.admin.generateLink({
            type: "password_reset",
            email: email,
        });
    },

    /**
     * @description Génère un lien de vérification d'email pour l'inscription.
     * @param {string} email
     */
    generateEmailVerificationLink: async (email) => {
        return supabase.auth.admin.generateLink({
            type: "signup",
            email: email,
        });
    },
};

module.exports = AuthModel;
