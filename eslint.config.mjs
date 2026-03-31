import nextParser from "eslint-config-next/parser";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import typeScriptESLint from "typescript-eslint";

const designSystemMessage =
  "Use `@/design-system` instead. Legacy UI paths are implementation details, not app-facing imports.";

export default [
  {
    name: "studyplatform/global-ignores",
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
  {
    name: "studyplatform/parser",
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["next-env.d.ts"],
    languageOptions: {
      parser: nextParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: "module",
        allowImportExportEverywhere: true,
        babelOptions: {
          presets: ["next/babel"],
          caller: {
            supportsTopLevelAwait: true,
          },
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": typeScriptESLint.plugin,
      "react-hooks": reactHooksPlugin,
    },
  },
  {
    name: "studyplatform/design-system-imports",
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
    ],
    ignores: [
      "src/design-system/**",
      "src/components/ui/**",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/components/ui/Button",
              importNames: ["Button", "buttonVariants"],
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Input",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Textarea",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Select",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Switch",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Card",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/Container",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/form-section",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms",
              importNames: ["Input", "Textarea", "Select", "Switch", "FormSection"],
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms/Input",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms/Textarea",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms/Select",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms/Switch",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/forms/FormSection",
              message: designSystemMessage,
            },
            {
              name: "@/components/ui/PrimaryButton",
              message: "PrimaryButton was removed. Use `@/design-system` Button instead.",
            },
            {
              name: "@/components/ui/SecondaryButton",
              message: "SecondaryButton was removed. Use `@/design-system` Button instead.",
            },
            {
              name: "@/components/ui/SearchInput",
              message: "Use `@/design-system` SearchInput instead.",
            },
            {
              name: "@/components/ui/Badge",
              message: "Use `@/design-system` Badge instead.",
            },
            {
              name: "@/components/ui/Modal",
              message: "Use `@/design-system` Modal instead.",
            },
            {
              name: "@/components/ui/Avatar",
              message: "Use `@/design-system` Avatar instead.",
            },
            {
              name: "@/components/ui/toast-provider",
              message: "Use `@/design-system` ToastProvider instead.",
            },
            {
              name: "@/hooks/use-toast",
              message: "Use `@/design-system` useToast instead.",
            },
            {
              name: "@/components/shared/SearchInput",
              message: "Use `@/design-system` SearchInput instead.",
            },
            {
              name: "@/components/admin/FormSection",
              message: "Use `@/design-system` FormSection instead.",
            },
            {
              name: "@/components/layout/PageContainer",
              message: "Use `@/design-system` layout exports instead.",
            },
            {
              name: "@/components/form/form-section",
              message: "Use `@/design-system` FormSection instead.",
            },
          ],
        },
      ],
    },
  },
];
