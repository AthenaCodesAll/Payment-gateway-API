/* eslint-env node */
const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
        sourceType: "script",
        ecmaVersion: 2022,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  {
    ignores: ["node_modules/", "dist/", "build/", "eslint.config.cjs"],
  },
];
