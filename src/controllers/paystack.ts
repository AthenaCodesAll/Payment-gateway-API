import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Payment, PaymentStatus } from '../models/Payment';
import { BadRequestError } from '../utils/ApiError';
import { asyncWrapper } from '../utils/asyncWrapper';
const paystackApi = require('../api/paystackApi');
import type { InitializePaymentArgs } from '../api/paystackApi';

interface InitiatePaymentRequest {
  customerName: string;
  customerEmail?: string;
  amount: number;
  callbackUrl?: string;
}

interface PaystackVerificationData {
  status: 'success' | 'failed' | 'abandoned';
  reference: string;
  metadata?: Record<string, unknown>;
}

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: PaystackVerificationData;
}

class PaystackController {
  initializePayment = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { customerName, customerEmail, amount, callbackUrl }: InitiatePaymentRequest = req.body;

    const finalEmail = customerEmail;

    if (!customerName || !finalEmail || !amount) {
      throw new BadRequestError('Customer name, email, and amount are required');
    }

    if (amount <= 0 || isNaN(amount)) {
      throw new BadRequestError('Amount must be a positive number');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      throw new BadRequestError('Invalid email format');
    }

    const normalizedEmail = finalEmail.toLowerCase().trim();
    const normalizedName = customerName.trim();

    const paymentDetails: InitializePaymentArgs = {
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
      const paystackResponse = await paystackApi.initializePayment(paymentDetails);

      if (!paystackResponse || !paystackResponse.reference) {
        throw new Error('Invalid response from Paystack');
      }

      payment = await Payment.create({
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        amount: Number(amount),
        status: PaymentStatus.PENDING,
        paymentReference: paystackResponse.reference,
        authorizationUrl: paystackResponse.authorizationUrl,
        accessCode: paystackResponse.accessCode,
      });

      res.status(StatusCodes.CREATED).json({
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
    } catch (paystackError: unknown) {
      if (payment) {
        await payment.update({ status: PaymentStatus.FAILED });
      }
      throw new BadRequestError(`Failed to initialize payment: ${(paystackError as Error).message || 'Unknown error'}`);
    }
  });

  verifyPayment = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const reference = req.query.reference as string;

    if (!reference) {
      throw new BadRequestError('Missing transaction reference');
    }

    const payment = await Payment.findByPk(reference);

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    const verificationResponse = await paystackApi.verifyPayment(reference) as unknown as PaystackVerificationResponse;

    if (!verificationResponse?.data) {
      throw new BadRequestError('Invalid payment verification response');
    }

    const { data: { status: transactionStatus } } = verificationResponse;

    if (transactionStatus === 'success') {
      await payment.update({
        status: PaymentStatus.COMPLETED,
        verified_at: new Date(),
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment: {
            id: payment.id,
            customerName: payment.customerName,
            customerEmail: payment.customerEmail,
            amount: payment.amount,
            status: PaymentStatus.COMPLETED,
          },
        },
      });
    } else {
      await payment.update({ status: PaymentStatus.FAILED });
      throw new BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
    }
  });

  getPaymentStatus = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Payment ID is required');
    }

    const payment = await Payment.findByPk(id);

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    if (payment.paymentReference && payment.status === PaymentStatus.PENDING) {
      try {
        const verificationResponse = await paystackApi.verifyPayment(payment.paymentReference) as unknown as PaystackVerificationResponse;

        if (verificationResponse?.data) {
          if (verificationResponse.data.status === 'success') {
            await payment.update({
              status: PaymentStatus.COMPLETED,
              verified_at: new Date(),
            });
          } else if (verificationResponse.data.status === 'failed') {
            await payment.update({ status: PaymentStatus.FAILED });
          }
        }
      } catch (verifyError: unknown) {
        console.error('Failed to verify payment with Paystack:', (verifyError as Error).message || 'Unknown error');
      }
    }

    await payment.reload();

    res.status(StatusCodes.OK).json({
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

  getAllPayments = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const { status, limit = 10, offset = 0 } = req.query;

    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    res.status(StatusCodes.OK).json({
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

  verifyPaymentByReference = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    const reference = req.query.reference as string;

    if (!reference) {
      throw new BadRequestError('Missing transaction reference');
    }

    const payment = await Payment.findOne({
      where: { paymentReference: reference },
    });

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    const verificationResponse = await paystackApi.verifyPayment(reference) as unknown as PaystackVerificationResponse;

    if (!verificationResponse?.data) {
      throw new BadRequestError('Invalid payment verification response');
    }

    const { data: { status: transactionStatus } } = verificationResponse;

    if (transactionStatus === 'success') {
      await payment.update({
        status: PaymentStatus.COMPLETED,
        verified_at: new Date(),
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment: {
            id: payment.id,
            status: PaymentStatus.COMPLETED,
          },
        },
      });
    } else {
      await payment.update({ status: PaymentStatus.FAILED });
      throw new BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
    }
  });
}

const paystackController = new PaystackController();

module.exports = paystackController;