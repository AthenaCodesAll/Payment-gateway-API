"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require('../config/config');
const { convertObjectFromSnakeToCamelCase } = require('../utils/snakeToCamelCase');
const BaseApi = require('./baseApi');
class PaystackApi extends BaseApi {
    constructor() {
        super(config.paystackUrl);
        this.requestInit = {
            headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${config.paystackSecret}`,
            },
        };
        this.initializePayment = async (paymentDetails) => {
            try {
                const response = await this.post('/transaction/initialize', paymentDetails, undefined, this.requestInit);
                if (!response || !response.data) {
                    throw new Error('Invalid response from Paystack API');
                }
                return convertObjectFromSnakeToCamelCase(response.data);
            }
            catch (error) {
                console.error('Paystack initialization error:', error);
                throw new Error(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
            }
        };
        this.verifyPayment = async (paymentReference) => {
            try {
                if (!paymentReference) {
                    throw new Error('Payment reference is required');
                }
                const response = await this.get(`/transaction/verify/${paymentReference}`, undefined, this.requestInit);
                if (!response || !response.data) {
                    throw new Error('Invalid response from Paystack API');
                }
                return response;
            }
            catch (error) {
                console.error('Paystack verification error:', error);
                throw new Error(`Failed to verify payment: ${error.message || 'Unknown error'}`);
            }
        };
    }
}
const paystackApi = new PaystackApi();
module.exports = paystackApi;
