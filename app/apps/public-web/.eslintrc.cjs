module.exports = {
  ignorePatterns: ["tests/unit/**"],
  extends: ["../../../.eslintrc.react.json"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: [`${__dirname}/tsconfig.json`, `${__dirname}/tsconfig.eslint.json`],
      },
    },
  },
};
