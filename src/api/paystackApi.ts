const config = require('../config/config');
const { convertObjectFromSnakeToCamelCase } = require('../utils/snakeToCamelCase');
const BaseApi = require('./baseApi'); // ✅ CommonJS-compatible import

// Type imports (for dev-only type checking)
import type { Request, Response } from 'express';

interface Metadata {
  email: string;
  name: string;
  amount: number;
}

export interface InitializePaymentArgs {
  email: string;
  amount: number;
  callback_url?: string;
  metadata: Metadata;
  [key: string]: string | number | boolean | Metadata | undefined;
}

interface PaystackAPIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  [key: string]: string;
}

interface VerifyPaymentResponse {
  amount: number;
  reference: string;
  status: string;
  metadata: Metadata;
}

class PaystackApi extends BaseApi {
  requestInit = {
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${config.paystackSecret}`,
    },
  };

  constructor() {
    super(config.paystackUrl as string);
  }

  initializePayment = async (paymentDetails: InitializePaymentArgs) => {
    try {
      const response = await this.post(
        '/transaction/initialize',
        paymentDetails,
        undefined,
        this.requestInit
      ) as PaystackAPIResponse<InitializePaymentResponse>;

      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

      return convertObjectFromSnakeToCamelCase(response.data) as InitializePaymentResponse;
    } catch (error: unknown) {
      console.error('Paystack initialization error:', error);
      throw new Error(`Failed to initialize payment: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  verifyPayment = async (paymentReference: string) => {
    try {
      if (!paymentReference) {
        throw new Error('Payment reference is required');
      }

      const response = await this.get(
        `/transaction/verify/${paymentReference}`,
        undefined,
        this.requestInit
      ) as PaystackAPIResponse<VerifyPaymentResponse>;

      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

      return response;
    } catch (error: unknown) {
      console.error('Paystack verification error:', error);
      throw new Error(`Failed to verify payment: ${(error as Error).message || 'Unknown error'}`);
    }
  };
}

const paystackApi = new PaystackApi();


module.exports = paystackApi;
