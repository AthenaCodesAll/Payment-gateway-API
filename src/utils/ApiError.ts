import { StatusCodes } from 'http-status-codes';

// Base API error class with HTTP status code
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;
  }
}

// Specific error for 404 Not Found with path info
export class NotFoundError extends ApiError {
  constructor(path: string) {
    super(StatusCodes.NOT_FOUND, `The requested path ${path} was not found`);
  }
}

// Specific error for 400 Bad Request with custom message
export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(StatusCodes.BAD_REQUEST, message);
  }
}
