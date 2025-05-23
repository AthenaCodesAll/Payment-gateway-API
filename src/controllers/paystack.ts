import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import paystackApi, { InitializePaymentArgs } from '../api/paystackApi';
import { Payment, PaymentStatus } from '../models/Payment';
import { BadRequestError } from '../utils/ApiError';
import { asyncWrapper } from '../utils/asyncWrapper';

interface InitiatePaymentRequest {
  customerName: string;
  customerEmail?: string; // Made optional to support both naming conventions
  amount: number;
  callbackUrl?: string;
}

class PaystackController {
   // Start payment process
  initializePayment = asyncWrapper(async (req: Request, res: Response) => {
    const { customerName, customerEmail, amount, callbackUrl }: InitiatePaymentRequest = req.body;

    const finalEmail = customerEmail;

    // Validate required fields
    if (!customerName || !finalEmail || !amount) {
      throw new BadRequestError('Customer name, email, and amount are required');
    }

    // Validate amount value
    if (amount <= 0 || isNaN(amount)) {
      throw new BadRequestError('Amount must be a positive number');
    }

     // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      throw new BadRequestError('Invalid email format');
    }

     // Normalize inputs
    const normalizedEmail = finalEmail.toLowerCase().trim();
    const normalizedName = customerName.trim();

     // Prepare payment details for API
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
      // Call Paystack to initialize payment
      const paystackResponse = await paystackApi.initializePayment(paymentDetails);

      if (!paystackResponse || !paystackResponse.reference) {
        throw new Error('Invalid response from Paystack');
      }

      // Save payment record
      payment = await Payment.create({
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        amount: Number(amount),
        status: PaymentStatus.PENDING,
        paymentReference: paystackResponse.reference,  // corrected field name here
        authorizationUrl: paystackResponse.authorizationUrl,
        accessCode: paystackResponse.accessCode,
      });

      // Respond with created payment info
      return res.status(StatusCodes.CREATED).json({
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
    } catch (paystackError: any) {
       // Mark payment as failed if error occurs
      if (payment) {
        await payment.update({ status: PaymentStatus.FAILED });
      }
      throw new BadRequestError(`Failed to initialize payment: ${paystackError.message}`);
    }
  });

  // Verify payment from callback or manual check
  verifyPayment = asyncWrapper(async (req: Request, res: Response) => {
    const reference = req.query.reference as string;

    if (!reference) {
      throw new BadRequestError('Missing transaction reference');
    }

    const payment = await Payment.findByPk(reference);

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    // Verify payment status from Paystack
    const verificationResponse = await paystackApi.verifyPayment(reference);

    if (!verificationResponse?.data) {
      throw new BadRequestError('Invalid payment verification response');
    }

    const {
      data: { metadata, reference: paymentReference, status: transactionStatus },
    } = verificationResponse;

    if (transactionStatus === 'success') {
       // Mark payment as completed
      await payment.update({
        status: PaymentStatus.COMPLETED,
        verified_at: new Date(),
      });

      return res.status(StatusCodes.OK).json({
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
      // Mark payment as failed if not successful
      await payment.update({ status: PaymentStatus.FAILED });
      throw new BadRequestError(`Payment verification failed with status: ${transactionStatus}`);
    }
  });

  // Get current payment status by payment ID
  getPaymentStatus = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestError('Payment ID is required');
    }

    const payment = await Payment.findByPk(id);

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    // If still pending, try to verify status with Paystack
    if (payment.paymentReference && payment.status === PaymentStatus.PENDING) {
      try {
        const verificationResponse = await paystackApi.verifyPayment(payment.paymentReference);

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
      } catch (verifyError) {
        console.error('Failed to verify payment with Paystack:', verifyError);
      }
    }

    await payment.reload();

     // Return payment details
    return res.status(StatusCodes.OK).json({
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

    // Get all payments with optional filtering & pagination
  getAllPayments = asyncWrapper(async (req: Request, res: Response) => {
    const { status, limit = 10, offset = 0 } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

     // Return payments with pagination info
    return res.status(StatusCodes.OK).json({
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

  // Verify payment by reference query param
  verifyPaymentByReference = asyncWrapper(async (req: Request, res: Response) => {
    const reference = req.query.reference as string;

    if (!reference) {
      throw new BadRequestError('Missing transaction reference');
    }

    // Find payment by paymentReference
    const payment = await Payment.findOne({
      where: { paymentReference: reference },
    });

    if (!payment) {
      throw new BadRequestError('Payment not found');
    }

    // Verify payment status
    const verificationResponse = await paystackApi.verifyPayment(reference);

    if (!verificationResponse?.data) {
      throw new BadRequestError('Invalid payment verification response');
    }

    const {
      data: { status: transactionStatus },
    } = verificationResponse;

    if (transactionStatus === 'success') {
      await payment.update({
        status: PaymentStatus.COMPLETED,
        verified_at: new Date(),
      });

      return res.status(StatusCodes.OK).json({
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

export default paystackController;
