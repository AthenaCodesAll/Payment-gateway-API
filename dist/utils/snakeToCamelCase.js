"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertObjectFromSnakeToCamelCase = exports.snakeToCamelCase = void 0;
// Converts a snake_case to camelCase
const snakeToCamelCase = (str) => str.replace(/([-_][a-z0-9])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
exports.snakeToCamelCase = snakeToCamelCase;
const convertObjectFromSnakeToCamelCase = (obj // Change this line
) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return non-objects directly
    }
    if (Array.isArray(obj)) {
        // If it's an array, recursively convert each item
        return obj.map(item => (0, exports.convertObjectFromSnakeToCamelCase)(item));
    }
    // If it's an object, reduce it by converting keys
    return Object.keys(obj).reduce((acc, key) => {
        const camelCaseKey = (0, exports.snakeToCamelCase)(key);
        // Recursively convert nested objects/arrays
        acc[camelCaseKey] = (0, exports.convertObjectFromSnakeToCamelCase)(obj[key]);
        return acc;
    }, {});
};
exports.convertObjectFromSnakeToCamelCase = convertObjectFromSnakeToCamelCase;
