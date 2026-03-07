"use strict";
/**
 * Password Utilities
 * Hashing and verification using bcrypt
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordService {
    constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }
    /**
     * Hash a password
     */
    async hash(password) {
        const salt = await bcryptjs_1.default.genSalt(this.saltRounds);
        const hash = await bcryptjs_1.default.hash(password, salt);
        return hash;
    }
    /**
     * Compare password with hash
     */
    async compare(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Validate password strength
     */
    validateStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PasswordService = PasswordService;
