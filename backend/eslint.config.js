const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,

  {
    files: ["**/*.js"],

    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },

    ignores: ["node_modules/**"],
  },
];