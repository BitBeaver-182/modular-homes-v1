import { fixupPluginRules } from "@eslint/compat";
import eslintJS from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintPluginImport from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

const files = ["src/**/*.{ts,tsx}"];
const tsconfigRootDir = import.meta.dirname;
const patchedImportPlugin = fixupPluginRules(eslintPluginImport);
const patchedReactHooksPlugin = fixupPluginRules(eslintPluginReactHooks);

export default typescriptEslint.config(
  {
    ignores: ["src/routeTree.gen.ts"],
  },
  {
    name: "dashboard/base",
    files,
    extends: [eslintJS.configs.recommended],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        project: "./tsconfig.json",
        sourceType: "module",
        tsconfigRootDir,
      },
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    settings: {
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
          tsconfigRootDir,
        },
      },
      react: {
        version: "detect",
      },
    },
    plugins: {
      import: patchedImportPlugin,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      "array-callback-return": "error",
      "consistent-return": "off",
      curly: ["error", "all"],
      "default-case": "off",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-anonymous-default-export": "error",
      "import/no-duplicates": "error",
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.{ts,tsx}",
            "**/*.spec.{ts,tsx}",
            "playwright.config.ts",
            "vite.config.ts",
            "vitest.setup.ts",
          ],
        },
      ],
      "import/no-mutable-exports": "error",
      "import/no-unresolved": "off",
      "import/order": [
        "error",
        {
          alphabetize: { caseInsensitive: true, order: "asc" },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              group: "internal",
              pattern: "@/**",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "import/prefer-default-export": "off",
      "no-alert": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-else-return": ["error", { allowElseIf: false }],
      "no-nested-ternary": "off",
      "no-param-reassign": ["error", { props: false }],
      "no-promise-executor-return": "error",
      "no-restricted-exports": "off",
      "no-shadow": "off",
      "no-template-curly-in-string": "error",
      "no-use-before-define": "off",
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "prefer-template": "error",
      radix: "error",
    },
  },
  ...typescriptEslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files,
  })),
  ...typescriptEslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files,
  })),
  {
    name: "dashboard/typescript-overrides",
    files,
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "no-return-await": "off",
    },
  },
  {
    name: "dashboard/react",
    files,
    extends: [eslintPluginReact.configs.flat["jsx-runtime"]],
    plugins: {
      "react-hooks": patchedReactHooksPlugin,
      "react-refresh": eslintPluginReactRefresh,
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      "react/button-has-type": "error",
      "react/function-component-definition": "off",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-filename-extension": [
        "error",
        {
          extensions: [".tsx"],
        },
      ],
      "react/jsx-fragments": ["error", "syntax"],
      "react/jsx-no-target-blank": [
        "error",
        {
          allowReferrer: false,
          enforceDynamicLinks: "always",
        },
      ],
      "react/jsx-props-no-spreading": "off",
      "react/no-array-index-key": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unstable-nested-components": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/require-default-props": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    name: "dashboard/a11y",
    files,
    ...jsxA11yPlugin.flatConfigs.recommended,
    rules: {
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
    },
  },
  {
    name: "dashboard/component-library-overrides",
    files: ["src/components/ui/**/*.{ts,tsx}", "src/components/reui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "no-param-reassign": "off",
    },
  },
);
