import rateLimit from 'express-rate-limit';

// Limit all API requests: max 100 requests per 15 mins per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit payment initialization: max 5 tries per 5 mins per IP
export const paymentInitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many payment attempts from this IP, please try again in 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts for payments
});

// Limit payment status checks: max 30 per 5 mins per IP
export const paymentVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many verification attempts from this IP, please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment status check rate limiting
export const paymentStatusLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    error: 'Too many status check requests from this IP, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: 'Too many attempts from this IP, account temporarily locked.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});