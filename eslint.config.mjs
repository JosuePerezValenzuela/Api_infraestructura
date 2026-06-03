// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'be.infra.umss.net',
      'node_modules',
      'dist',
    ],
  },
  // Base JS recommended rules
  eslint.configs.recommended,
  // TypeScript recommended — registra el plugin + parser + reglas TS
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
    },
  },
  // Overrides: desactivar reglas que no aplican al proyecto
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-unreachable': 'off',
      'no-unreachable-loop': 'off',
    },
  },
  // Prettier al final para que desactive reglas de formato conflictivas
  eslintPluginPrettierRecommended,
);
