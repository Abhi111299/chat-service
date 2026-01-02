const { User, RefreshToken } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { Op } = require('sequelize');

class AuthService {
    async register(email, password, name, role = 'user') {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Create user (password is hashed in model hook)
        const user = await User.create({
            email,
            password,
            name,
            role
        });

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            ...tokens
        };
    }

    async login(email, password) {
        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Clean up expierd tokens
        await this.cleanupExpiredTokens(user.id);

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            ...tokens
        };
    }

    async refreshToken(refreshToken) {
        // Verify re fresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Check if token exitss in database
        const refreshTokenRecord = await RefreshToken.findOne({
            where: {
                token: refreshToken,
                userId: decoded.userId,
                expiresAt: { [ Op.gt ]: new Date() }
            },
            include: [ { model: User, as: 'user' } ]
        });

        if (!refreshTokenRecord) {
            throw new Error('Invalid or expired refresh token');
        }

        const user = refreshTokenRecord.user;
        if (!user) {
            throw new Error('User not found');
        }

        // Delete old refresh token
        await RefreshToken.destroy({
            where: { id: refreshTokenRecord.id }
        });

        // Generate new tokens
        const tokens = await this.generateTokens(user);

        return tokens;
    }

    async logout(refreshToken) {
        // Delete refresh token
        await RefreshToken.destroy({
            where: { token: refreshToken }
        });
    }

    async generateTokens(user) {
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        const refreshToken = generateRefreshToken({ userId: user.id });

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await RefreshToken.create({
            userId: user.id,
            token: refreshToken,
            expiresAt
        });

        return {
            accessToken,
            refreshToken
        };
    }

    async cleanupExpiredTokens(userId) {
        // Delete expired refresh tokens for this user
        await RefreshToken.destroy({
            where: {
                userId,
                expiresAt: { [ Op.lt ]: new Date() }
            }
        });
    }
}

module.exports = new AuthService();

