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
const config_1 = __importDefault(require("../config/config"));
const snakeToCamelCase_1 = require("../utils/snakeToCamelCase");
const baseApi_1 = __importDefault(require("./baseApi"));
class PaystackApi extends baseApi_1.default {
    // Initialize with Paystack base URL
    constructor() {
        super(config_1.default.paystackUrl);
        // Set headers for requests
        this.requestInit = {
            headers: {
                'Content-Type': 'application/json', // Fixed: lowercase 'application'
                authorization: `Bearer ${config_1.default.paystackSecret}`,
            },
        };
        // Start payment process
        this.initializePayment = (paymentDetails) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.post('/transaction/initialize', paymentDetails, undefined, this.requestInit);
                // Add validation for response
                if (!response || !response.data) {
                    throw new Error('Invalid response from Paystack API');
                }
                // Convert keys from snake_case to camelCase
                return (0, snakeToCamelCase_1.convertObjectFromSnakeToCamelCase)(response.data);
            }
            catch (error) {
                console.error('Paystack initialization error:', error);
                throw new Error(`Failed to initialize payment: ${error.message}`);
            }
        });
        // Verify payment status by reference
        this.verifyPayment = (paymentReference) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!paymentReference) {
                    throw new Error('Payment reference is required');
                }
                const response = yield this.get(`/transaction/verify/${paymentReference}`, undefined, this.requestInit);
                // Add validation for response
                if (!response || !response.data) {
                    throw new Error('Invalid response from Paystack API');
                }
                return response;
            }
            catch (error) {
                console.error('Paystack verification error:', error);
                throw new Error(`Failed to verify payment: ${error.message}`);
            }
        });
    }
}
// Create and export instance
const paystackApi = new PaystackApi();
exports.default = paystackApi;
