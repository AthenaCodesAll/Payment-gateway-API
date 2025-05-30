import request from "supertest";
import { Payment, PaymentStatus } from "../models/Payment.js";
const connection = require("../utils/database");
const app = require("../index");

// Mock Paystack API service to simulate external API responses during test
jest.mock('../api/paystackApi', () => ({
  __esModule: true,
  default: {
    initializePayment: jest.fn().mockResolvedValue({
      authorizationUrl: 'https://checkout.paystack.com/test123',
      accessCode: 'test_access_code',
      reference: 'test_reference_123',
    }),
    verifyPayment: jest.fn().mockResolvedValue({
      data: {
        status: 'success',
        reference: 'test_reference_123',
        amount: 5000,
        metadata: {
          email: 'john@example.com',
          name: 'John Doe',
          amount: 50.0,
        },
      },
    }),
  },
}));

describe('Payment Gateway API', () => {
  // Set up database connection and synchronize models before running tests
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connection.authenticate();
    await connection.sync({ force: true });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    await Payment.destroy({ where: {} });
  });

   // Tests for payment initialization endpoint
  describe('POST /api/paystack/initialize', () => {
    const validPaymentData = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',  
      amount: 50.0,
      callbackUrl: 'http://localhost:5000/api/paystack/verify'
    };

    it('should initiate a payment successfully', async () => {
      const res = await request(app)
        .post('/api/paystack/initialize')
        .send(validPaymentData)
        .expect(201);

      // Validate response structure and key fields
        expect(res.body).toMatchObject({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          payment: {
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            amount: 50.0,
            status: 'pending',
            authorization_url: 'https://checkout.paystack.com/test123', // Fixed: field name
          },
        },
      });

      expect(res.body.data.payment.id).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      // Amount less than or equal to zero is invalid
      const res = await request(app)
        .post('/api/paystack/initialize')
        .send({ customer_name: 'John Doe' })
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Customer name, email, and amount are required',
      });
    });

    it('should return 400 if amount is invalid', async () => {
      // Invalid email format triggers validation error
      const res = await request(app)
        .post('/api/paystack/initialize')
        .send({ ...validPaymentData, amount: -10 })
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Amount must be a positive number',
      });
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/api/paystack/initialize')
        .send({ ...validPaymentData, customer_email: 'invalid-email' })
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Invalid email format',
      });
    });

    // Test with alternative email field name
    it('should work with email field instead of customer_email', async () => {
      const altPaymentData = {
        customer_name: 'John Doe',
        email: 'john@example.com',
        amount: 50.0,
        callbackUrl: 'http://localhost:5000/api/paystack/verify'
      };

      const res = await request(app)
        .post('/api/paystack/initialize')
        .send(altPaymentData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/paystack/verify', () => {
    let paymentReference: string;

    beforeEach(async () => {
      const payment = await Payment.create({
        id: 'test_reference_123',
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        amount: 100.0,
        status: PaymentStatus.PENDING,
        paystack_reference: 'test_reference_123',
        authorization_url: 'https://checkout.paystack.com/test123',
        access_code: 'test_access_code',
      });
      paymentReference = payment.paymentReference!;
    });

    it('should verify payment successfully', async () => {
      const res = await request(app)
        .get(`/api/paystack/verify?reference=${paymentReference}`)
        .expect(200);

      expect(res.body).toMatchObject({
        success: true, 
        message: 'Payment verified successfully',
        data: {
          payment: {
            id: paymentReference,
            customer_name: 'Jane Doe', 
            customer_email: 'jane@example.com',
            amount: 100.0,
            status: 'completed',
          },
        },
      });
    });

    it('should return error for missing reference', async () => {
      const res = await request(app)
        .get('/api/paystack/verify')
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Missing transaction reference',
      });
    });

    it('should return error for invalid reference', async () => {
      const res = await request(app)
        .get('/api/paystack/verify?reference=invalid_reference')
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Payment not found',
      });
    });
  });

  describe('GET /api/paystack/status/:id', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await Payment.create({
        id: 'PAY-test-123',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        amount: 75.0,
        status: PaymentStatus.PENDING,
        paystack_reference: 'test_reference_123',
        authorization_url: 'https://checkout.paystack.com/test123',
        access_code: 'test_access_code',
      });
      paymentId = payment.id;
    });

    it('should retrieve payment status successfully', async () => {
      const res = await request(app)
        .get(`/api/paystack/status/${paymentId}`)
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          payment: {
            id: paymentId,
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            amount: 75.0,
            status: expect.any(String),
          },
        },
      });
    });

    it('should return 400 for non-existent payment', async () => {
      const res = await request(app)
        .get('/api/paystack/status/PAY-nonexistent')
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        message: 'Payment not found',
      });
    });
  });

  // Test for the additional verifyPaymentByReference endpoint
  describe('GET /api/paystack/verify-by-reference', () => {
    let paymentReference: string;

    beforeEach(async () => {
      const payment = await Payment.create({
        id: 'PAY-verify-by-ref',
        customer_name: 'Reference Test User',
        customer_email: 'reftest@example.com',
        amount: 25.0,
        status: PaymentStatus.PENDING,
        paystack_reference: 'test_reference_verify',
        authorization_url: 'https://checkout.paystack.com/test123',
        access_code: 'test_access_code',
      });
      paymentReference = payment.paymentReference!;
    });

    it('should verify payment by reference successfully', async () => {
      const res = await request(app)
        .get(`/api/paystack/verify-by-reference?reference=${paymentReference}`)
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment: {
            id: expect.any(String),
            status: 'completed',
          },
        },
      });
    });
  });

  // Test for getAllPayments endpoint
  describe('GET /api/paystack/payments', () => {
    beforeEach(async () => {
      // Create multiple payments for testing
      await Payment.bulkCreate([
        {
          id: 'PAY-1',
          customer_name: 'User 1',
          customer_email: 'user1@example.com',
          amount: 100,
          status: PaymentStatus.COMPLETED,
          paystack_reference: 'ref1',
          authorization_url: 'https://checkout.paystack.com/test1',
          access_code: 'access1',
        },
        {
          id: 'PAY-2',
          customer_name: 'User 2',
          customer_email: 'user2@example.com',
          amount: 200,
          status: PaymentStatus.PENDING,
          paystack_reference: 'ref2',
          authorization_url: 'https://checkout.paystack.com/test2',
          access_code: 'access2',
        },
      ]);
    });

    it('should retrieve all payments successfully', async () => {
      const res = await request(app)
        .get('/api/paystack/payments')
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Payments retrieved successfully',
        data: {
          payments: expect.any(Array),
          total: 2,
          pagination: {
            limit: 10,
            offset: 0,
            total: 2,
          },
        },
      });

      expect(res.body.data.payments).toHaveLength(2);
    });

    it('should filter payments by status', async () => {
      const res = await request(app)
        .get('/api/paystack/payments?status=completed')
        .expect(200);

      expect(res.body.data.payments).toHaveLength(1);
      expect(res.body.data.payments[0].status).toBe('completed');
    });
  });
});