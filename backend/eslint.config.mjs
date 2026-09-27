import js from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
  },
  js.configs.recommended,
];