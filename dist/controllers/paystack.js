"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const paystackApi_1 = __importDefault(require("../api/paystackApi"));
const Payment_1 = require("../models/Payment");
const ApiError_1 = require("../utils/ApiError");
const asyncWrapper_1 = require("../utils/asyncWrapper");
class PaystackController {
    constructor() {
        // Start payment process
        this.initializePayment = (0, asyncWrapper_1.asyncWrapper)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { customerName, customerEmail, amount, callbackUrl } = req.body;
            const finalEmail = customerEmail;
            // Validate required fields
            if (!customerName || !finalEmail || !amount) {
                throw new ApiError_1.BadRequestError('Customer name, email, and amount are required');
            }
            // Validate amount value
            if (amount <= 0 || isNaN(amount)) {
                throw new ApiError_1.BadRequestError('Amount must be a positive number');
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(finalEmail)) {
                throw new ApiError_1.BadRequestError('Invalid email format');
            }
            // Normalize inputs
            const normalizedEmail = finalEmail.toLowerCase().trim();
            const normalizedName = customerName.trim();
            // Prepare payment details for API
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
                // Call Paystack to initialize payment
                const paystackResponse = yield paystackApi_1.default.initializePayment(paymentDetails);
                if (!paystackResponse || !paystackResponse.reference) {
                    throw new Error('Invalid response from Paystack');
                }
                // Save payment record
                payment = yield Payment_1.Payment.create({
                    customerName: normalizedName,
                    customerEmail: normalizedEmail,
                    amount: Number(amount),
                    status: Payment_1.PaymentStatus.PENDING,
                    paymentReference: paystackResponse.reference, // corrected field name here
                    authorizationUrl: paystackResponse.authorizationUrl,
                    accessCode: paystackResponse.accessCode,
                });
                // Respond with created payment info
                return res.status(http_status_codes_1.StatusCodes.CREATED).json({
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
                // Mark payment as failed if error occurs
                if (payment) {
                    yield payment.update({ status: Payment_1.PaymentStatus.FAILED });
                }
                throw new ApiError_1.BadRequestError(`Failed to initialize payment: ${paystackError.message}`);
            }
        }));
        // Verify payment from callback or manual check
        this.verifyPayment = (0, asyncWrapper_1.asyncWrapper)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const reference = req.query.reference;
            if (!reference) {
                throw new ApiError_1.BadRequestError('Missing transaction reference');
            }
            const payment = yield Payment_1.Payment.findByPk(reference);
            if (!payment) {
                throw new ApiError_1.BadRequestError('Payment not found');
            }
            // Verify payment status from Paystack
            const verificationResponse = yield paystackApi_1.default.verifyPayment(reference);
            if (!(verificationResponse === null || verificationResponse === void 0 ? void 0 : verificationResponse.data)) {
                throw new ApiError_1.BadRequestError('Invalid payment verification response');
            }
            const { data: { metadata, reference: paymentReference, status: transactionStatus }, } = verificationResponse;
            if (transactionStatus === 'success') {
                // Mark payment as completed
                yield payment.update({
                    status: Payment_1.PaymentStatus.COMPLETED,
                    verified_at: new Date(),
                });
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: {
                        payment: {
                            id: payment.id,
                            customerName: payment.customerName,
                            customerEmail: payment.customerEmail,
                            amount: payment.amount,
                            status: Payment_1.PaymentStatus.COMPLETED,
                        },
                    },
                });
            }
            else {
                // Mark payment as failed if not successful
                yield payment.update({ status: Payment_1.PaymentStatus.FAILED });
                throw new ApiError_1.BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
            }
        }));
        // Get current payment status by payment ID
        this.getPaymentStatus = (0, asyncWrapper_1.asyncWrapper)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!id) {
                throw new ApiError_1.BadRequestError('Payment ID is required');
            }
            const payment = yield Payment_1.Payment.findByPk(id);
            if (!payment) {
                throw new ApiError_1.BadRequestError('Payment not found');
            }
            // If still pending, try to verify status with Paystack
            if (payment.paymentReference && payment.status === Payment_1.PaymentStatus.PENDING) {
                try {
                    const verificationResponse = yield paystackApi_1.default.verifyPayment(payment.paymentReference);
                    if (verificationResponse === null || verificationResponse === void 0 ? void 0 : verificationResponse.data) {
                        if (verificationResponse.data.status === 'success') {
                            yield payment.update({
                                status: Payment_1.PaymentStatus.COMPLETED,
                                verified_at: new Date(),
                            });
                        }
                        else if (verificationResponse.data.status === 'failed') {
                            yield payment.update({ status: Payment_1.PaymentStatus.FAILED });
                        }
                    }
                }
                catch (verifyError) {
                    console.error('Failed to verify payment with Paystack:', verifyError);
                }
            }
            yield payment.reload();
            // Return payment details
            return res.status(http_status_codes_1.StatusCodes.OK).json({
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
        }));
        // Get all payments with optional filtering & pagination
        this.getAllPayments = (0, asyncWrapper_1.asyncWrapper)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { status, limit = 10, offset = 0 } = req.query;
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            const payments = yield Payment_1.Payment.findAndCountAll({
                where: whereClause,
                limit: Number(limit),
                offset: Number(offset),
                order: [['createdAt', 'DESC']],
            });
            // Return payments with pagination info
            return res.status(http_status_codes_1.StatusCodes.OK).json({
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
        }));
        // Verify payment by reference query param
        this.verifyPaymentByReference = (0, asyncWrapper_1.asyncWrapper)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const reference = req.query.reference;
            if (!reference) {
                throw new ApiError_1.BadRequestError('Missing transaction reference');
            }
            // Find payment by paymentReference
            const payment = yield Payment_1.Payment.findOne({
                where: { paymentReference: reference },
            });
            if (!payment) {
                throw new ApiError_1.BadRequestError('Payment not found');
            }
            // Verify payment status
            const verificationResponse = yield paystackApi_1.default.verifyPayment(reference);
            if (!(verificationResponse === null || verificationResponse === void 0 ? void 0 : verificationResponse.data)) {
                throw new ApiError_1.BadRequestError('Invalid payment verification response');
            }
            const { data: { status: transactionStatus }, } = verificationResponse;
            if (transactionStatus === 'success') {
                yield payment.update({
                    status: Payment_1.PaymentStatus.COMPLETED,
                    verified_at: new Date(),
                });
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: {
                        payment: {
                            id: payment.id,
                            status: Payment_1.PaymentStatus.COMPLETED,
                        },
                    },
                });
            }
            else {
                yield payment.update({ status: Payment_1.PaymentStatus.FAILED });
                throw new ApiError_1.BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
            }
        }));
    }
}
const paystackController = new PaystackController();
exports.default = paystackController;
