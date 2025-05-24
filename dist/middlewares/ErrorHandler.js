"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
class ErrorHandler {
}
exports.ErrorHandler = ErrorHandler;
ErrorHandler.handle = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    const statusCode = err.statusCode || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).send({
        success: false,
        message: err.message,
    });
};
