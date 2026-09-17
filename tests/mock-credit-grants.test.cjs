const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/app/api/admin/manage-mock-credits/route.ts'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const valid = { email: 'student@example.com', targetUid: 'student-1', amount: 3,
  requestId: '12345678-1234-1234-1234-123456789abc', note: 'Offline payment' };

function setup({ role = 'admin', authorized = true, found = true, profile = true, auditFails = false } = {}) {
  const records = new Map(profile ? [['users/student-1', { mockPaidCredits: 2, essayPaidCredits: 9, displayName: 'Student' }]] : []);
  const emails = [];
  const snap = key => ({ exists: records.has(key), data: () => records.get(key) });
  let queue = Promise.resolve();
  const adminDb = {
    collection: collection => ({ doc: id => ({ key: `${collection}/${id}`, get: async () => snap(`${collection}/${id}`) }) }),
    runTransaction: callback => {
      const result = queue.then(async () => {
        const writes = [];
        const value = await callback({
          get: async ref => snap(ref.key),
          update: (ref, data) => writes.push([ref.key, { ...records.get(ref.key), ...data }]),
          set: (ref, data) => { if (auditFails) throw new Error('Audit write failed'); writes.push([ref.key, data]); },
        });
        writes.forEach(([key, data]) => records.set(key, data));
        return value;
      });
      queue = result.catch(() => {});
      return result;
    },
  };
  class NextResponse extends Response {
    static json(data, init) { return new NextResponse(JSON.stringify(data), init); }
  }
  const modules = {
    'next/server': { NextResponse },
    'firebase-admin/firestore': { FieldValue: { serverTimestamp: () => 'server-time' } },
    '@/lib/firebase-admin': { adminDb, adminAuth: { getUserByEmail: async email => {
      emails.push(email);
      if (!found) throw Object.assign(new Error('Not found'), { code: 'auth/user-not-found' });
      return { uid: 'student-1', email: 'student@example.com' };
    } } },
    '@/lib/api-auth': { verifyAuthed: async () => authorized ? { ok: true, uid: 'admin-1', role } : { ok: false, status: 401, error: 'Unauthorized' } },
    '@/lib/mock-credits': { getMockCredits: async () => ({ paid: records.get('users/student-1').mockPaidCredits, unlimited: false }) },
  };
  const context = { exports: {}, require: name => { assert.ok(modules[name], `Unexpected import: ${name}`); return modules[name]; }, URL, console: { error: () => {} } };
  vm.runInNewContext(code, context);
  const post = (body = valid) => context.exports.POST(new Request('https://local.test/api/admin/manage-mock-credits', { method: 'POST', body: JSON.stringify(body) }));
  const get = (email = 'student@example.com') => context.exports.GET(new Request(`https://local.test/api/admin/manage-mock-credits?email=${encodeURIComponent(email)}`));
  return { post, get, records, emails };
}

test('lookup normalizes email and returns the existing mock balance', async () => {
  const h = setup(); const response = await h.get('  STUDENT@EXAMPLE.COM  ');
  assert.equal(response.status, 200); assert.equal((await response.json()).paid, 2);
  assert.deepEqual(h.emails, ['student@example.com']);
  assert.equal(h.records.size, 1);
});

for (const options of [{ authorized: false }, { role: 'student' }, { role: 'teacher' }]) {
  test(`blocks unauthorized lookup and grants: ${JSON.stringify(options)}`, async () => {
    const h = setup(options); const status = options.authorized === false ? 401 : 403;
    assert.equal((await h.get()).status, status); assert.equal((await h.post()).status, status);
    assert.equal(h.emails.length, 0); assert.equal(h.records.size, 1);
  });
}

for (const role of ['admin', 'developer']) {
  test(`${role} grants only mock credits and records an audit receipt`, async () => {
    const h = setup({ role }); const response = await h.post();
    assert.equal(response.status, 200); assert.equal((await response.json()).paid, 5);
    assert.equal(h.records.get('users/student-1').mockPaidCredits, 5);
    assert.equal(h.records.get('users/student-1').essayPaidCredits, 9);
    const audit = [...h.records.entries()].find(([key]) => key.startsWith('admin_actions/'))[1];
    assert.equal(audit.performedBy, 'admin-1'); assert.equal(audit.targetUid, 'student-1');
    assert.equal(audit.amount, 3); assert.equal(audit.note, 'Offline payment');
    assert.equal(audit.previousBalance, 2); assert.equal(audit.newBalance, 5);
  });
}

for (const amount of [0, -1, 1.5, '3', null, 1001]) {
  test(`rejects invalid amount ${JSON.stringify(amount)} without changing the balance`, async () => {
    const h = setup(); assert.equal((await h.post({ ...valid, amount })).status, 400);
    assert.equal(h.records.get('users/student-1').mockPaidCredits, 2);
  });
}

test('simultaneous retries grant only once', async () => {
  const h = setup(); const results = await Promise.all([h.post(), h.post()]);
  assert.deepEqual(results.map(r => r.status), [200, 200]);
  assert.equal((await results[1].json()).duplicate, true);
  assert.equal(h.records.get('users/student-1').mockPaidCredits, 5); assert.equal(h.records.size, 2);
});
test('different grants add to the balance without overwriting each other', async () => {
  const h = setup(); await Promise.all([h.post(), h.post({ ...valid, requestId: '12345678-1234-1234-1234-123456789def' })]);
  assert.equal(h.records.get('users/student-1').mockPaidCredits, 8); assert.equal(h.records.size, 3);
});
test('reusing a receipt with a different amount is rejected', async () => {
  const h = setup(); await h.post(); assert.equal((await h.post({ ...valid, amount: 10 })).status, 409);
  assert.equal(h.records.get('users/student-1').mockPaidCredits, 5);
});
test('an audit failure rolls back the credit grant', async () => {
  const h = setup({ auditFails: true }); assert.equal((await h.post()).status, 500);
  assert.equal(h.records.get('users/student-1').mockPaidCredits, 2); assert.equal(h.records.size, 1);
});
test('missing accounts and profiles do not receive credits', async () => {
  for (const options of [{ found: false }, { profile: false }]) {
    const h = setup(options); assert.equal((await h.get()).status, 404); assert.equal((await h.post()).status, 404);
    assert.ok(![...h.records.keys()].some(key => key.startsWith('admin_actions/')));
  }
});
test('a changed recipient cannot receive a grant intended for another user', async () => {
  const h = setup(); assert.equal((await h.post({ ...valid, targetUid: 'someone-else' })).status, 409);
  assert.equal(h.records.get('users/student-1').mockPaidCredits, 2);
});
test('invalid email, request ID and oversized notes are rejected', async () => {
  for (const change of [{ email: 'invalid' }, { requestId: '../bad' }, { note: 'x'.repeat(301) }]) {
    const h = setup(); assert.equal((await h.post({ ...valid, ...change })).status, 400);
    assert.equal(h.records.size, 1);
  }
});
