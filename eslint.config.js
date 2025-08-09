import globals from "globals";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";

export default [
    // Global ignores
    {
        ignores: ["dist/**", "node_modules/**"],
    },

    // Base JavaScript config
    js.configs.recommended,

    // TypeScript files
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsparser,
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "@stylistic": stylistic,
        },
        rules: {
            // TypeScript rules
            ...tseslint.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-non-null-assertion": "error",

            // Stylistic rules
            "@stylistic/indent": ["error", 4],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/array-bracket-spacing": ["error", "never"],
            "@stylistic/eol-last": ["error", "always"],

            // General rules
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error",
        },
    },
];
