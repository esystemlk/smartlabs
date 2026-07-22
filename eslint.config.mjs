import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * ESLint 9 flat config.
 *
 * The old `.eslintrc.json` was legacy (eslintrc) format, which ESLint 9 could
 * not load alongside eslint-config-next 16 — every run died with "Converting
 * circular structure to JSON", so nothing was being linted at all.
 *
 * `next.config.ts` sets eslint.ignoreDuringBuilds, so lint findings here do
 * not gate a production build.
 */
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'public/**',
      'next-env.d.ts',
      // React Native workspace — its own toolchain and DOM-incompatible types.
      'apps/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
];
