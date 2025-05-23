import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError';

export class ErrorHandler {
   // Centralized error handler middleware
  static handle = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    
    // Send error response with status and message
    return res.status(statusCode).send({
      success: false,
      message: err.message,
    });
  };
}
