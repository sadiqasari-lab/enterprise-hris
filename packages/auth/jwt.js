"use strict";
/**
 * JWT Utilities
 * Token generation and verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    constructor(accessTokenSecret, refreshTokenSecret, accessTokenExpiry = '15m', refreshTokenExpiry = '7d') {
        this.accessTokenSecret = accessTokenSecret;
        this.refreshTokenSecret = refreshTokenSecret;
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }
    /**
     * Generate access and refresh tokens
     */
    generateTokenPair(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry,
        });
        return { accessToken, refreshToken };
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JWTService = JWTService;
