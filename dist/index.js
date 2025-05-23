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
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ApiError_1 = require("./utils/ApiError");
const ErrorHandler_1 = require("./middlewares/ErrorHandler");
const config_1 = __importDefault(require("./config/config"));
const database_1 = __importDefault(require("./utils/database"));
const http_status_codes_1 = require("http-status-codes");
const routes_1 = __importDefault(require("./routes"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimiting_1 = require("./middlewares/rateLimiting");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Rate limiting - Apply globally to all requests
app.use(rateLimiting_1.globalLimiter);
// Body parsing middlewares
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Root endpoint - API health check
app.get('/', (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: 'Payment Gateway API',
    });
});
// API routes
app.use('/api', routes_1.default);
// Handle 404 errors for unknown routes
app.use((req, res, next) => {
    next(new ApiError_1.NotFoundError(req.path));
});
// Handle 404 errors for unknown routes
app.use(ErrorHandler_1.ErrorHandler.handle);
const PORT = config_1.default.appPort || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authenticate and connect to the database
        yield database_1.default.authenticate();
        console.log('✅ Database connection established successfully.');
        // Synchronize models with the database schema
        yield database_1.default.sync();
        console.log('✅ Database synchronized successfully.');
        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error(`Error occurred: ${error}`);
        process.exit(1);
    }
});
startServer();
exports.default = app;
