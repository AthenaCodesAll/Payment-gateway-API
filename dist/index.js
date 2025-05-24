"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ApiError_js_1 = require("./utils/ApiError.js");
const ErrorHandler_js_1 = require("./middlewares/ErrorHandler.js");
const config_js_1 = __importDefault(require("./config/config.js"));
const database_js_1 = __importDefault(require("./utils/database.js"));
const http_status_codes_1 = require("http-status-codes");
const index_js_1 = __importDefault(require("./routes/index.js"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimiting_js_1 = require("./middlewares/rateLimiting.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Rate limiting - Apply globally to all requests
app.use(rateLimiting_js_1.globalLimiter);
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
app.use('/api', index_js_1.default);
// Handle 404 errors for unknown routes
app.use((req, res, next) => {
    next(new ApiError_js_1.NotFoundError(req.path));
});
// Handle 404 errors for unknown routes
app.use(ErrorHandler_js_1.ErrorHandler.handle);
const PORT = config_js_1.default.appPort || 3000;
const startServer = async () => {
    try {
        // Authenticate and connect to the database
        await database_js_1.default.authenticate();
        console.log('✅ Database connection established successfully.');
        // Synchronize models with the database schema
        await database_js_1.default.sync();
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
};
startServer();
exports.default = app;
