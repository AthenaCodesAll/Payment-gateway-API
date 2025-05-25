const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const { NotFoundError } = require('./utils/ApiError');
const { ErrorHandler } = require('./middlewares/ErrorHandler');
const config = require('./config/config');
const connection = require('./utils/database');
const { StatusCodes } = require('http-status-codes');
const helmet = require('helmet');
const { globalLimiter } = require('./middlewares/rateLimiting');

// Debug the router import
const router = require('./routes/index');
console.log('🔍 Router imported:', router);
console.log('🔍 Router type:', typeof router);
console.log('🔍 Is function:', typeof router === 'function');

// Type imports for TypeScript (these don't affect runtime)
import type { Application, NextFunction, Request, Response } from 'express';

dotenv.config();
const app: Application = express();

// Security middlewares
app.use(helmet());
app.use(cors());

// Rate limiting - Apply globally to all requests
app.use(globalLimiter);

// Body parsing middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root endpoint - API health check
app.get('/', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    message: 'Payment Gateway API',
  });
});

// API routes
app.use('/api', router);

// Handle 404 errors for unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(req.path));
});

// Handle 404 errors for unknown routes
app.use(ErrorHandler.handle);

const PORT = config.appPort || 3000;

const startServer = async () => {
  try {
    // Authenticate and connect to the database
    await connection.authenticate();
    console.log('✅ Database connection established successfully.');

    // Synchronize models with the database schema
    await connection.sync();
    console.log('✅ Database synchronized successfully.');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error occurred: ${error}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;