// models/authModel.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const AuthModel = {
    // Company methods
    async createCompany(name) {
        const result = await pool.query(
            "INSERT INTO companies (name) VALUES ($1) RETURNING *",
            [name]
        );
        return result.rows[0];
    },

    // User methods
    async createUser(email, password, role, company_id, category) {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const result = await pool.query(
            "INSERT INTO users (email, password, role, company_id, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [email, hashedPassword, role, company_id, category]
        );
        return result.rows[0];
    },

    async findUserByEmail(email) {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);
        return result.rows[0];
    },

    async findUserById(id) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0];
    },

    async updatePassword(userId, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, userId]
        );
        return result.rowCount > 0;
    },

    async validateUserEmail(userId) {
        const result = await pool.query(
            "UPDATE users SET email_validated = true, last_validated_at = NOW() WHERE id = $1",
            [userId]
        );
        return result.rowCount > 0;
    },

    // Password reset token methods
    async createPasswordResetToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 3600000); // 1 hour from now
        await pool.query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordResetToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordResetToken(token) {
        await pool.query("DELETE FROM password_reset_tokens WHERE token = $1", [
            token,
        ]);
    },

    // Password setup token methods
    async createPasswordSetupToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 24 * 3600000); // 24 hours from now
        await pool.query(
            "INSERT INTO password_setup_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordSetupToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_setup_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordSetupToken(token) {
        await pool.query("DELETE FROM password_setup_tokens WHERE token = $1", [
            token,
        ]);
    },

    // Email verification OTP methods
    async createEmailVerificationOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO email_verification_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findEmailVerificationOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM email_verification_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deleteEmailVerificationOtp(userId, otp) {
        await pool.query("DELETE FROM email_verification_otps WHERE user_id = $1 AND otp = $2", [
            userId,
            otp,
        ]);
    },

    // Password reset OTP methods
    async createPasswordResetOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO password_reset_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findPasswordResetOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM password_reset_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deletePasswordResetOtp(userId, otp = null) {
        if (otp) {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1 AND otp = $2", [
                userId,
                otp,
            ]);
        } else {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1", [
                userId,
            ]);
        }
    },
};

module.exports = { AuthModel, pool };