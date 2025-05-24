import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module", 
        ecmaVersion: 2022,
      },
      globals: {
        ...globals.node, 
      }
    },
  },

  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/"
    ],
  }
];