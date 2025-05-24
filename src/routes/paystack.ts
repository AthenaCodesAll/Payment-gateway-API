import express from 'express';
import { body, query } from 'express-validator';
import paystackController from '../controllers/paystack.js';
import { 
  paymentInitLimiter, 
  paymentVerifyLimiter, 
  paymentStatusLimiter 
} from '../middlewares/rateLimiting.js'; 

const paystackRoute = express.Router();

// Payment initialization with strict rate limiting 
paystackRoute.post(
  '/initialize',
  paymentInitLimiter, 
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('amount').isInt({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('customer_name').notEmpty().withMessage('Customer name is required'),
  ],
  paystackController.initializePayment
);

// Payment verification with moderate rate limiting
paystackRoute.get(
  '/verify',
  paymentVerifyLimiter, 
  [
    query('reference').notEmpty().withMessage('Reference is required'),
  ],
  paystackController.verifyPayment
);

// Payment status check with lenient rate limiting
paystackRoute.get(
  '/status/:id',
  paymentStatusLimiter,
  [
    query('id').notEmpty().withMessage('Payment ID is required'),
  ],
  paystackController.getPaymentStatus
);

export default paystackRoute;