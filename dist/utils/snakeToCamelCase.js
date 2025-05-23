"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertObjectFromSnakeToCamelCase = exports.snakeToCamelCase = void 0;
// Converts a snake_case to camelCase
const snakeToCamelCase = (str) => str.replace(/([-_][a-z0-9])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
exports.snakeToCamelCase = snakeToCamelCase;
const convertObjectFromSnakeToCamelCase = (obj) => {
    return Object.keys(obj).reduce((prev, cur) => {
        return Object.assign(Object.assign({}, prev), { [(0, exports.snakeToCamelCase)(cur)]: obj[cur] });
    }, {});
};
exports.convertObjectFromSnakeToCamelCase = convertObjectFromSnakeToCamelCase;
