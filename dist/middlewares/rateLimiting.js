"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.paymentStatusLimiter = exports.paymentVerifyLimiter = exports.paymentInitLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Limit all API requests: max 100 requests per 15 mins per IP
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Limit payment initialization: max 5 tries per 5 mins per IP
exports.paymentInitLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many payment attempts from this IP, please try again in 5 minutes.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all attempts for payments
});
// Limit payment status checks: max 30 per 5 mins per IP
exports.paymentVerifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: {
        error: 'Too many verification attempts from this IP, please try again later.',
        retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Payment status check rate limiting
exports.paymentStatusLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 30,
    message: {
        error: 'Too many status check requests from this IP, please try again later.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Strict rate limiting for sensitive operations
exports.strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        error: 'Too many attempts from this IP, account temporarily locked.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
