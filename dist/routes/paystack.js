"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { body, query } = require('express-validator');
const paystackController = require('../controllers/paystack');
const rateLimiting_1 = require("../middlewares/rateLimiting");
const paystackRoute = express.Router();
// Payment initialization with strict rate limiting 
paystackRoute.post('/initialize', rateLimiting_1.paymentInitLimiter, [
    body('email').isEmail().withMessage('Invalid email'),
    body('amount').isInt({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('customer_name').notEmpty().withMessage('Customer name is required'),
], paystackController.initializePayment);
// Payment verification with moderate rate limiting
paystackRoute.get('/verify', rateLimiting_1.paymentVerifyLimiter, [
    query('reference').notEmpty().withMessage('Reference is required'),
], paystackController.verifyPayment);
// Payment status check with lenient rate limiting
paystackRoute.get('/status/:id', rateLimiting_1.paymentStatusLimiter, [
    query('id').notEmpty().withMessage('Payment ID is required'),
], paystackController.getPaymentStatus);
module.exports = paystackRoute;
