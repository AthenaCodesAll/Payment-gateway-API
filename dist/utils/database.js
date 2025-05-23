"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const config_1 = __importDefault(require("../config/config"));
const connection = new sequelize_typescript_1.Sequelize({
    dialect: 'postgres',
    host: config_1.default.dbHost,
    username: config_1.default.dbUser,
    password: config_1.default.dbPassword,
    database: config_1.default.dbName,
    logging: false,
    models: [__dirname + '/../models'],
});
exports.default = connection;
