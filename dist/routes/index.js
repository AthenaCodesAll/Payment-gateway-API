"use strict";
const express = require('express');
const paystackRoute = require('./paystack');
const router = express.Router();
const allRoutes = [
    {
        path: '/paystack',
        route: paystackRoute,
    },
];
allRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
module.exports = router;
