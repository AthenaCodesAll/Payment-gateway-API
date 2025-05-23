"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paystack_1 = __importDefault(require("./paystack"));
const router = express_1.default.Router();
const allRoutes = [
    {
        path: '/paystack',
        route: paystack_1.default,
    },
];
allRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
