import { adminAuth } from '@/lib/firebase-admin';
import { getQuestionBank, QUESTION_BANK_TYPES } from '@/lib/question-bank';
import { PTE_CATALOG } from '@/lib/pte-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Read-only question-bank endpoint — the single source the mobile app reads so
 * it always shows the same questions as the website.
 *
 *   GET /api/questions?catalog=1        → the full PTE catalogue (sections/tasks)
 *   GET /api/questions?type=read-aloud  → the seed questions for one task type
 *   GET /api/questions                  → the list of available task types
 *
 * Requires a valid Firebase ID token (same as the other app endpoints) so the
 * banks aren't openly scrapable.
 */
export async function POST() {
  return Response.json({ error: 'Use GET.' }, { status: 405 });
}

export async function GET(request: Request) {
  if (!adminAuth) {
    return Response.json({ error: 'Server not configured.' }, { status: 500 });
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized — sign in required.' }, { status: 401 });
  }
  try {
    await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return Response.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  if (searchParams.get('catalog')) {
    return Response.json({ catalog: PTE_CATALOG });
  }

  const type = searchParams.get('type');
  if (!type) {
    return Response.json({ types: QUESTION_BANK_TYPES });
  }

  const bank = getQuestionBank(type);
  if (!bank) {
    return Response.json(
      { error: `No question bank for task type "${type}".`, availableTypes: QUESTION_BANK_TYPES },
      { status: 404 },
    );
  }
  return Response.json({ type, count: bank.length, questions: bank });
}
