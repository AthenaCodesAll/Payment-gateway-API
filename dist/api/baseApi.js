"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const node_fetch_1 = __importDefault(require("node-fetch"));
const ApiError_js_1 = require("../utils/ApiError.js");
class BaseApi {
    constructor(url) {
        this.fetch = async (url, body, args, requestInit) => {
            try {
                const urlObj = new URL(url, this.baseUrl);
                if (args) {
                    urlObj.search = new URLSearchParams(args).toString();
                }
                const requestOptions = { ...requestInit, body };
                const response = await (0, node_fetch_1.default)(urlObj.toString(), requestOptions);
                if (!response.ok) {
                    const errorMessage = await response.text();
                    throw new ApiError_js_1.BadRequestError(errorMessage);
                }
                if (response.status === http_status_codes_1.StatusCodes.NO_CONTENT) {
                    return;
                }
                return response.json();
            }
            catch (e) {
                throw new ApiError_js_1.BadRequestError(e.message || 'An unknown error occurred');
            }
        };
        this.get = (url, args, requestInit) => this.fetch(url, undefined, args, { ...requestInit, method: 'GET' });
        this.post = (url, body, args, requestInit) => {
            const bodyString = body ? JSON.stringify(body) : undefined;
            return this.fetch(url, bodyString, args, {
                ...requestInit,
                method: 'POST',
            });
        };
        this.baseUrl = url;
    }
}
exports.default = BaseApi;
