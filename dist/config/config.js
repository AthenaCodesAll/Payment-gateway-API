"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: __dirname + `/../../.env` });
const config = {
    dbHost: process.env.POSTGRES_HOST,
    dbUser: process.env.POSTGRES_USER,
    dbPassword: process.env.POSTGRES_PASSWORD,
    dbName: process.env.POSTGRES_DB,
    appPort: process.env.APPLICATION_PORT,
    paystackSecret: process.env.PAYSTACK_SECRET_KEY,
    paystackUrl: process.env.PAYSTACK_BASE_URL,
};
exports.default = config;
