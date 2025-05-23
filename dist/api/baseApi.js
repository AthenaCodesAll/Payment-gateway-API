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
const http_status_codes_1 = require("http-status-codes");
const node_fetch_1 = __importDefault(require("node-fetch"));
const ApiError_1 = require("../utils/ApiError");
class BaseApi {
    // Set base URL
    constructor(url) {
        // Main fetch function
        this.fetch = (url, body, args, requestInit) => __awaiter(this, void 0, void 0, function* () {
            try {
                const urlObj = new URL(url, this.baseUrl);
                // Add query params if any
                if (args) {
                    urlObj.search = new URLSearchParams(args).toString();
                }
                const requestOptions = Object.assign(Object.assign({}, requestInit), { body });
                const response = yield (0, node_fetch_1.default)(urlObj.toString(), requestOptions);
                // Throw error if response is not ok
                if (!response.ok) {
                    const errorMessage = yield response.text();
                    throw new ApiError_1.BadRequestError(errorMessage);
                }
                // Return nothing if no content
                if (response.status === http_status_codes_1.StatusCodes.NO_CONTENT) {
                    return;
                }
                // Return response as JSON
                return response.json();
            }
            catch (e) {
                throw new ApiError_1.BadRequestError(e.message);
            }
        });
        // GET request
        this.get = (url, args, requestInit) => this.fetch(url, undefined, args, Object.assign(Object.assign({}, requestInit), { method: 'GET' }));
        // POST request
        this.post = (url, body, args, requestInit) => {
            const bodyString = body ? JSON.stringify(body) : undefined;
            return this.fetch(url, bodyString, args, Object.assign(Object.assign({}, requestInit), { method: 'POST' }));
        };
        this.baseUrl = url;
    }
}
//Export class
exports.default = BaseApi;
