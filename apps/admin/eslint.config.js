import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // This codebase is classic React (no React Compiler), and fetching
      // data on mount by calling an async function from a plain useEffect
      // is the pattern React's own docs endorse for synchronizing with an
      // external system. eslint-plugin-react-hooks v7's "recommended" set
      // now includes React-Compiler-readiness rules that flag that pattern
      // as an error; downgrading to a warning keeps it visible without
      // treating pre-compiler-adoption code as build-breaking.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Vendored shadcn/ui primitives, not app code we maintain by hand.
    // Re-running `npx shadcn add` regenerates these, so keep them diffing
    // cleanly against upstream rather than restructuring for these rules:
    // shadcn's own convention exports variant helpers (e.g. buttonVariants)
    // alongside the component, and sidebar.tsx's Math.random() is a
    // once-per-mount skeleton width, memoized with an empty dependency array.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
