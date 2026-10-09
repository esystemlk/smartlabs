/**
 * IELTS mock-exam pricing. Its OWN credit pool, separate from PTE mock credits
 * and from the per-skill universal/essay pools. No server imports here so
 * client components can read it.
 */

/** LKR, one full IELTS mock test (Listening + Reading + Writing). */
export const IELTS_MOCK_PRICE = 5000;

/** No free IELTS mocks — every attempt is paid. */
export const FREE_IELTS_MOCK_LIMIT = 0;

export const IELTS_MOCK_PACKAGES = [
  { id: 'ielts_mock_1', label: '1 Mock Test', credits: 1, price: 5000, popular: false },
  { id: 'ielts_mock_2', label: '2 Mock Tests', credits: 2, price: 9000, popular: true },
  { id: 'ielts_mock_3', label: '3 Mock Tests', credits: 3, price: 12000, popular: false },
] as const;

export type IeltsMockPackageId = (typeof IELTS_MOCK_PACKAGES)[number]['id'];
