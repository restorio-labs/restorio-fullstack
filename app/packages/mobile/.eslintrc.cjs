module.exports = {
  root: true,
  extends: ["../../../.eslintrc.json"],
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },
};
