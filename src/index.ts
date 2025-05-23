import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { NotFoundError } from './utils/ApiError';
import { ErrorHandler } from './middlewares/ErrorHandler';
import config from './config/config';
import connection from './utils/database';
import { StatusCodes } from 'http-status-codes';
import router from './routes';
import helmet from 'helmet';
import { globalLimiter } from './middlewares/rateLimiting'; 

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

export default app;