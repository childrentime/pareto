import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx','**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin
    },
    rules: {
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'turbo/no-undeclared-env-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports'
        }
      ],
      '@typescript-eslint/no-misused-promises': 'off',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level']
    }
  },
  {
    ignores: [
      '**/*.config.js',
      '**/*.cjs',
      '**/*.mjs',
      '.next',
      '.pareto',
      'dist',
      'pnpm-lock.yaml',
      'website/**',
      'packages/create-pareto/templates/**/*',
      'packages/**/scripts/**',
      'examples/react17/**/*',
      'examples/react18/**/*',
      '**/node_modules/**',
      '**/.pareto/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist-bin/**',
    ]
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true
    }
  }
];