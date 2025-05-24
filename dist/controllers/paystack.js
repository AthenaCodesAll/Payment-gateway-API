"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const paystackApi_js_1 = __importDefault(require("../api/paystackApi.js"));
const Payment_js_1 = require("../models/Payment.js");
const ApiError_js_1 = require("../utils/ApiError.js");
const asyncWrapper_js_1 = require("../utils/asyncWrapper.js");
class PaystackController {
    constructor() {
        this.initializePayment = (0, asyncWrapper_js_1.asyncWrapper)(async (req, res) => {
            const { customerName, customerEmail, amount, callbackUrl } = req.body;
            const finalEmail = customerEmail;
            if (!customerName || !finalEmail || !amount) {
                throw new ApiError_js_1.BadRequestError('Customer name, email, and amount are required');
            }
            if (amount <= 0 || isNaN(amount)) {
                throw new ApiError_js_1.BadRequestError('Amount must be a positive number');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(finalEmail)) {
                throw new ApiError_js_1.BadRequestError('Invalid email format');
            }
            const normalizedEmail = finalEmail.toLowerCase().trim();
            const normalizedName = customerName.trim();
            const paymentDetails = {
                email: normalizedEmail,
                amount: Math.round(Number(amount) * 100),
                callback_url: callbackUrl || `${req.protocol}://${req.get('host')}/api/v1/payments/verify`,
                metadata: {
                    email: normalizedEmail,
                    name: normalizedName,
                    amount: Number(amount),
                },
            };
            let payment;
            try {
                const paystackResponse = await paystackApi_js_1.default.initializePayment(paymentDetails);
                if (!paystackResponse || !paystackResponse.reference) {
                    throw new Error('Invalid response from Paystack');
                }
                payment = await Payment_js_1.Payment.create({
                    customerName: normalizedName,
                    customerEmail: normalizedEmail,
                    amount: Number(amount),
                    status: Payment_js_1.PaymentStatus.PENDING,
                    paymentReference: paystackResponse.reference,
                    authorizationUrl: paystackResponse.authorizationUrl,
                    accessCode: paystackResponse.accessCode,
                });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    success: true,
                    message: 'Payment initialized successfully',
                    data: {
                        payment: {
                            id: payment.id,
                            customerName: payment.customerName,
                            customerEmail: payment.customerEmail,
                            amount: payment.amount,
                            status: payment.status,
                            authorizationUrl: paystackResponse.authorizationUrl,
                        },
                    },
                });
            }
            catch (paystackError) {
                if (payment) {
                    await payment.update({ status: Payment_js_1.PaymentStatus.FAILED });
                }
                throw new ApiError_js_1.BadRequestError(`Failed to initialize payment: ${paystackError.message || 'Unknown error'}`);
            }
        });
        this.verifyPayment = (0, asyncWrapper_js_1.asyncWrapper)(async (req, res) => {
            const reference = req.query.reference;
            if (!reference) {
                throw new ApiError_js_1.BadRequestError('Missing transaction reference');
            }
            const payment = await Payment_js_1.Payment.findByPk(reference);
            if (!payment) {
                throw new ApiError_js_1.BadRequestError('Payment not found');
            }
            const verificationResponse = await paystackApi_js_1.default.verifyPayment(reference);
            if (!verificationResponse?.data) {
                throw new ApiError_js_1.BadRequestError('Invalid payment verification response');
            }
            const { data: { status: transactionStatus } } = verificationResponse;
            if (transactionStatus === 'success') {
                await payment.update({
                    status: Payment_js_1.PaymentStatus.COMPLETED,
                    verified_at: new Date(),
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: {
                        payment: {
                            id: payment.id,
                            customerName: payment.customerName,
                            customerEmail: payment.customerEmail,
                            amount: payment.amount,
                            status: Payment_js_1.PaymentStatus.COMPLETED,
                        },
                    },
                });
            }
            else {
                await payment.update({ status: Payment_js_1.PaymentStatus.FAILED });
                throw new ApiError_js_1.BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
            }
        });
        this.getPaymentStatus = (0, asyncWrapper_js_1.asyncWrapper)(async (req, res) => {
            const { id } = req.params;
            if (!id) {
                throw new ApiError_js_1.BadRequestError('Payment ID is required');
            }
            const payment = await Payment_js_1.Payment.findByPk(id);
            if (!payment) {
                throw new ApiError_js_1.BadRequestError('Payment not found');
            }
            if (payment.paymentReference && payment.status === Payment_js_1.PaymentStatus.PENDING) {
                try {
                    const verificationResponse = await paystackApi_js_1.default.verifyPayment(payment.paymentReference);
                    if (verificationResponse?.data) {
                        if (verificationResponse.data.status === 'success') {
                            await payment.update({
                                status: Payment_js_1.PaymentStatus.COMPLETED,
                                verified_at: new Date(),
                            });
                        }
                        else if (verificationResponse.data.status === 'failed') {
                            await payment.update({ status: Payment_js_1.PaymentStatus.FAILED });
                        }
                    }
                }
                catch (verifyError) {
                    console.error('Failed to verify payment with Paystack:', verifyError.message || 'Unknown error');
                }
            }
            await payment.reload();
            res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                message: 'Payment status retrieved successfully',
                data: {
                    payment: {
                        id: payment.id,
                        customerName: payment.customerName,
                        customerEmail: payment.customerEmail,
                        amount: payment.amount,
                        status: payment.status,
                    },
                },
            });
        });
        this.getAllPayments = (0, asyncWrapper_js_1.asyncWrapper)(async (req, res) => {
            const { status, limit = 10, offset = 0 } = req.query;
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            const payments = await Payment_js_1.Payment.findAndCountAll({
                where: whereClause,
                limit: Number(limit),
                offset: Number(offset),
                order: [['createdAt', 'DESC']],
            });
            res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                message: 'Payments retrieved successfully',
                data: {
                    payments: payments.rows,
                    total: payments.count,
                    pagination: {
                        limit: Number(limit),
                        offset: Number(offset),
                        total: payments.count,
                    },
                },
            });
        });
        this.verifyPaymentByReference = (0, asyncWrapper_js_1.asyncWrapper)(async (req, res) => {
            const reference = req.query.reference;
            if (!reference) {
                throw new ApiError_js_1.BadRequestError('Missing transaction reference');
            }
            const payment = await Payment_js_1.Payment.findOne({
                where: { paymentReference: reference },
            });
            if (!payment) {
                throw new ApiError_js_1.BadRequestError('Payment not found');
            }
            const verificationResponse = await paystackApi_js_1.default.verifyPayment(reference);
            if (!verificationResponse?.data) {
                throw new ApiError_js_1.BadRequestError('Invalid payment verification response');
            }
            const { data: { status: transactionStatus } } = verificationResponse;
            if (transactionStatus === 'success') {
                await payment.update({
                    status: Payment_js_1.PaymentStatus.COMPLETED,
                    verified_at: new Date(),
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: {
                        payment: {
                            id: payment.id,
                            status: Payment_js_1.PaymentStatus.COMPLETED,
                        },
                    },
                });
            }
            else {
                await payment.update({ status: Payment_js_1.PaymentStatus.FAILED });
                throw new ApiError_js_1.BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
            }
        });
    }
}
const paystackController = new PaystackController();
exports.default = paystackController;
