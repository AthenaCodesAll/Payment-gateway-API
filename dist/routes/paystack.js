"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const paystack_js_1 = __importDefault(require("../controllers/paystack.js"));
const rateLimiting_js_1 = require("../middlewares/rateLimiting.js");
const paystackRoute = express_1.default.Router();
// Payment initialization with strict rate limiting 
paystackRoute.post('/initialize', rateLimiting_js_1.paymentInitLimiter, [
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('amount').isInt({ gt: 0 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('customer_name').notEmpty().withMessage('Customer name is required'),
], paystack_js_1.default.initializePayment);
// Payment verification with moderate rate limiting
paystackRoute.get('/verify', rateLimiting_js_1.paymentVerifyLimiter, [
    (0, express_validator_1.query)('reference').notEmpty().withMessage('Reference is required'),
], paystack_js_1.default.verifyPayment);
// Payment status check with lenient rate limiting
paystackRoute.get('/status/:id', rateLimiting_js_1.paymentStatusLimiter, [
    (0, express_validator_1.query)('id').notEmpty().withMessage('Payment ID is required'),
], paystack_js_1.default.getPaymentStatus);
exports.default = paystackRoute;
