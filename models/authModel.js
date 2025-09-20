// models/authModel.js
const { createClient } = require("@supabase/supabase-js");

// On initialise Superbase ici pour que tous les modèles puissent l'utiliser
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AuthModel = {
    /**
     * Envoie une invitation par email via un lien magique de Superbase.
     * @param {string} email
     */
    inviteUserByEmail: async (email) => {
        return supabase.auth.signInWithOtp({ email });
    },

    /**
     * Authentifie un utilisateur avec son email et mot de passe.
     * @param {string} email
     * @param {string} password
     */
    signInWithPassword: async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    },

    /**
     * Récupère le profil d'un utilisateur par son ID.
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
     * Envoie un email de réinitialisation de mot de passe à l'utilisateur.
     * @param {string} email
     */
    sendPasswordResetEmail: async (email) => {
        return supabase.auth.resetPasswordForEmail(email);
    },

    /**
     * Met à jour le mot de passe d'un utilisateur.
     * Cette fonction est appelée après la vérification via le lien.
     * @param {string} newPassword
     */
    updatePassword: async (newPassword) => {
        return supabase.auth.updateUser({ password: newPassword });
    },
};



module.exports = AuthModel;
