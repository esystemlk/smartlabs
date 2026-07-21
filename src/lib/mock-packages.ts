/**
 * Mock-exam pricing. Deliberately free of any server imports so client
 * components can read it — `mock-credits.ts` pulls in firebase-admin, which
 * must never reach the browser bundle.
 */

/** LKR, one full mock test. */
export const MOCK_PRICE = 6500;

/** No free mocks — every attempt is paid. */
export const FREE_MOCK_LIMIT = 0;

export const MOCK_PACKAGES = [
  { id: 'mock_1', label: '1 Mock Test', credits: 1, price: 6500, popular: false },
  { id: 'mock_3', label: '3 Mock Tests', credits: 3, price: 17500, popular: true },
  { id: 'mock_5', label: '5 Mock Tests', credits: 5, price: 27500, popular: false },
] as const;

export type MockPackageId = (typeof MOCK_PACKAGES)[number]['id'];
