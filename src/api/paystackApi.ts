import config from '../config/config';
import { convertObjectFromSnakeToCamelCase } from '../utils/snakeToCamelCase';
import BaseApi from './baseApi';

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
}

interface VerifyPaymentResponse {
  amount: number;
  reference: string;
  status: string;
  metadata: Metadata;
}

class PaystackApi extends BaseApi {
  // Set headers for requests
  requestInit = {
    headers: {
      'Content-Type': 'application/json', // Fixed: lowercase 'application'
      authorization: `Bearer ${config.paystackSecret}`,
    },
  };

  // Initialize with Paystack base URL
  constructor() {
    super(config.paystackUrl as string);
  }

   // Start payment process
  initializePayment = async (paymentDetails: InitializePaymentArgs) => {
    try {
      const response = await this.post<
        PaystackAPIResponse<InitializePaymentResponse>
      >('/transaction/initialize', paymentDetails, undefined, this.requestInit);

      // Add validation for response
      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

       // Convert keys from snake_case to camelCase
      return convertObjectFromSnakeToCamelCase<InitializePaymentResponse>(
        response.data
      );
    } catch (error: any) {
      console.error('Paystack initialization error:', error);
      throw new Error(`Failed to initialize payment: ${error.message}`);
    }
  };

   // Verify payment status by reference
  verifyPayment = async (paymentReference: string) => {
    try {
      if (!paymentReference) {
        throw new Error('Payment reference is required');
      }

      const response = await this.get<PaystackAPIResponse<VerifyPaymentResponse>>(
        `/transaction/verify/${paymentReference}`,
        undefined,
        this.requestInit
      );

      // Add validation for response
      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

      return response;
    } catch (error: any) {
      console.error('Paystack verification error:', error);
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  };
}

// Create and export instance
const paystackApi = new PaystackApi();

export default paystackApi;