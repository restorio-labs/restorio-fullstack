import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { fixupPluginRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "**/node_modules",
    "**/dist",
    "**/build",
    "**/.next",
    "**/coverage",
    "**/*.config.js",
    "**/*.config.cjs",
    "**/*.eslintrc.cjs",
    "**/e2e",
    "**/bun.lockb",
    "**/package-lock.json",
    "**/*.log",
    "**/*.md",
    "**/postcss.config.js",
    "**/vitest.setup.ts",
    "apps/public-web/**/*",
    "**/vitest.config.ts",
    "**/scripts",
]), {
    extends: compat.extends("./.eslintrc.json"),

    plugins: {
        react,
        "react-hooks": fixupPluginRules(reactHooks),
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/display-name": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "react/jsx-uses-react": "off",
        "react/jsx-uses-vars": "error",
        "react/jsx-key": "error",
        "react/jsx-no-duplicate-props": "error",
        "react/jsx-no-undef": "error",
        "react/jsx-pascal-case": "error",
        "react/no-array-index-key": "warn",
        "react/no-danger": "warn",
        "react/no-deprecated": "error",
        "react/no-direct-mutation-state": "error",
        "react/no-unknown-property": "error",
        "react/self-closing-comp": "error",
        "react/jsx-boolean-value": ["error", "never"],

        "react/jsx-curly-brace-presence": ["error", {
            props: "never",
            children: "never",
        }],

        "react/jsx-fragments": ["error", "syntax"],
    },
}]);