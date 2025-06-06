import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';

export class ErrorHandler {
  static handle = (
    err: ApiError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ) => {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).send({
      success: false,
      message: err.message,
    });
  };
}