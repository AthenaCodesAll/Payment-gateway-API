"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = __importDefault(require("../config/config.js"));
const snakeToCamelCase_js_1 = require("../utils/snakeToCamelCase.js");
const baseApi_js_1 = __importDefault(require("./baseApi.js"));
class PaystackApi extends baseApi_js_1.default {
    constructor() {
        super(config_js_1.default.paystackUrl);
        this.requestInit = {
            headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${config_js_1.default.paystackSecret}`,
            },
        };
        this.initializePayment = async (paymentDetails) => {
            try {
                const response = await this.post('/transaction/initialize', paymentDetails, undefined, this.requestInit);
                if (!response || !response.data) {
                    throw new Error('Invalid response from Paystack API');
                }
                return (0, snakeToCamelCase_js_1.convertObjectFromSnakeToCamelCase)(response.data);
            }
            catch (error) { // Line 67: Changed 'any' to 'unknown'
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
            catch (error) { // Line 92: Changed 'any' to 'unknown'
                console.error('Paystack verification error:', error);
                throw new Error(`Failed to verify payment: ${error.message || 'Unknown error'}`);
            }
        };
    }
}
const paystackApi = new PaystackApi();
exports.default = paystackApi;
