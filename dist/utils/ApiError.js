"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = exports.NotFoundError = exports.ApiError = void 0;
const http_status_codes_1 = require("http-status-codes");
// Base API error class with HTTP status code
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ApiError = ApiError;
// Specific error for 404 Not Found with path info
class NotFoundError extends ApiError {
    constructor(path) {
        super(http_status_codes_1.StatusCodes.NOT_FOUND, `The requested path ${path} was not found`);
    }
}
exports.NotFoundError = NotFoundError;
// Specific error for 400 Bad Request with custom message
class BadRequestError extends ApiError {
    constructor(message) {
        super(http_status_codes_1.StatusCodes.BAD_REQUEST, message);
    }
}
exports.BadRequestError = BadRequestError;
