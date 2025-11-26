import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Ignore generated and build artifacts
  {
    ignores: ['.astro/**', 'dist/**', 'node_modules/**', 'public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow generated .d.ts patterns that include `any` and triple-slash refs
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // JavaScript files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'no-undef': 'off',
    },
  },
];
