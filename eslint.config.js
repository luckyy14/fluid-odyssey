import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$' }],
      // App.jsx + others gate setState on mount-only conditions; allow it.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Block library + lib modules co-locate Zod schemas with components on
    // purpose (each block owns its propsSchema). Disable the fast-refresh
    // rule for these — HMR is fine with the schema constants.
    files: ['src/components/blocks/**', 'src/lib/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
