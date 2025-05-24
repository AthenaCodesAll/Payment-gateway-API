import config from '../config/config.js';
import { convertObjectFromSnakeToCamelCase } from '../utils/snakeToCamelCase.js';
import BaseApi from './baseApi.js';

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
      const response = await this.post<
        PaystackAPIResponse<InitializePaymentResponse>
      >('/transaction/initialize', paymentDetails, undefined, this.requestInit);

      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

      return convertObjectFromSnakeToCamelCase<InitializePaymentResponse>(
        response.data
      );
    } catch (error: unknown) { // Line 67: Changed 'any' to 'unknown'
      console.error('Paystack initialization error:', error);
      throw new Error(`Failed to initialize payment: ${(error as Error).message || 'Unknown error'}`);
    }
  };

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

      if (!response || !response.data) {
        throw new Error('Invalid response from Paystack API');
      }

      return response;
    } catch (error: unknown) { // Line 92: Changed 'any' to 'unknown'
      console.error('Paystack verification error:', error);
      throw new Error(`Failed to verify payment: ${(error as Error).message || 'Unknown error'}`);
    }
  };
}

const paystackApi = new PaystackApi();

export default paystackApi;