// PayHere chargebacks on every notify route except recorded packages.
// In-memory database only. No live services, payments or emails.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), ts = require('typescript');

const md5 = s => crypto.createHash('md5').update(s).digest('hex').toUpperCase();
const SECRET = 'test-secret', DAY = 86400000, USER = 'users/u1';
const env = { PAYHERE_MERCHANT_SECRET: SECRET, NEXT_PUBLIC_APP_URL: 'http://localhost' };
let docs = {}, mails = [], failTransactions = false;

// Applies increments the way Firestore would, so balances can be asserted.
const write = (key, data) => {
  const next = { ...docs[key] };
  for (const [k, v] of Object.entries(data)) next[k] = v && v.increment !== undefined ? (next[k] || 0) + v.increment : v;
  docs[key] = next;
};
const ref = key => ({
  key, path: key,
  get: async () => snap(key),
  update: async data => { assert.ok(docs[key], `update of missing doc ${key}`); write(key, data); },
  collection: col => ({ doc: id => ref(`${key}/${col}/${id}`) }),
});
function snap(key) {
  const data = docs[key];
  return { id: key.split('/').pop(), ref: ref(key), exists: !!data, data: () => data };
}
const adminDb = {
  collection: col => ({
    doc: id => ref(`${col}/${id}`),
    where: (_f, _o, orderId) => ({ where: (_f2, _o2, type) => ({ limit: () => ({ get: async () => {
      const found = Object.keys(docs).filter(k => k.startsWith(`${col}/`) && docs[k].orderId === orderId && docs[k].type === type).map(snap);
      return { empty: !found.length, docs: found };
    } }) }) }),
  }),
  runTransaction: async fn => {
    if (failTransactions) throw new Error('database down');
    return fn({
      get: r => r.get(),
      update: (r, data) => { assert.ok(docs[r.key], `update of missing doc ${r.key}`); write(r.key, data); },
      set: (r, data) => write(r.key, data),
    });
  },
};

const cache = new Map();
function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full);
  const exports = {};
  cache.set(full, exports);
  const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, Date, URL, Response, Promise, Object, Math, Number, String, Array, console: { log() {}, warn() {}, error() {} }, process: { env }, require: name => {
    if (name === '@/lib/firebase-admin') return { adminDb };
    if (name === '@/lib/mail') return { sendMail: async m => { mails.push(m); } };
    if (name === '@/lib/admin-payment-email') return { renderAdminPaymentAlert: () => '' };
    if (name === '@/lib/pte-receipt-email') return { renderPteReceiptEmail: () => '' };
    if (name === '@/lib/ielts-receipt-email') return { renderIeltsReceiptEmail: () => '' };
    if (name === '@/lib/pte-packages') return { getPtePackage: () => ({ name: 'PTE' }) };
    if (name === '@/lib/utils') return { phoneKey: () => 'key' };
    if (name === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => new Date(), increment: increment => ({ increment }) } };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  } });
  return exports;
}

function notice(route, orderId, statusCode, amount = '1000.00') {
  const body = new FormData();
  const fields = { merchant_id: 'M1', order_id: orderId, payhere_amount: amount, payhere_currency: 'LKR', status_code: statusCode, payment_id: 'P1' };
  Object.entries(fields).forEach(([k, v]) => body.set(k, v));
  body.set('md5sig', md5(`M1${orderId}${amount}LKR${statusCode}${md5(SECRET)}`));
  return load(`src/app/api/payhere/${route}/route.ts`).POST({ formData: async () => body });
}
const seed = (type, extra, user = {}) => {
  docs = { [USER]: { email: 's@example.com', ...user }, 'payment_orders/o': { orderId: 'ORD', type, userId: 'u1', paymentAmount: 1000, paymentStatus: 'pending', ...extra } };
  mails = [];
};
const ORDER = 'payment_orders/o';
const chargebackMails = () => mails.filter(m => m.subject.startsWith('Chargeback'));

// Credit packs: route, order type, order fields, balance field, amount granted.
const PACKS = [
  ['mock-notify', 'mock_credits', { mockCredits: 3 }, 'mockPaidCredits', 3],
  ['ielts-mock-notify', 'ielts_mock_credits', { ieltsMockCredits: 3 }, 'ieltsMockPaidCredits', 3],
  ['essay-notify', 'essay_credits', { packageId: 'essay_10', scoringCredits: 10, genCredits: 5 }, 'essayPaidCredits', 10],
  ['ielts-essay-notify', 'ielts_essay_credits', { packageId: 'ielts_essay_10', scoringCredits: 10 }, 'ieltsEssayPaidCredits', 10],
  ['speaking-notify', 'speaking_credits', { packageId: 'speaking_10', scoringCredits: 10 }, 'speakingPaidCredits', 10],
  ['sst-notify', 'sst_credits', { packageId: 'sst_10', scoringCredits: 10 }, 'sstPaidCredits', 10],
  ['swt-notify', 'swt_credits', { packageId: 'swt_10', scoringCredits: 10 }, 'swtPaidCredits', 10],
  ['universal-notify', 'universal_credits', { packageId: 'universal_10', scoringCredits: 10 }, 'universalPaidCredits', 10],
];
// Unlimited plans: route, order type, order fields, expiry field.
const PLANS = [
  ['essay-notify', 'essay_credits', { packageId: 'essay_unlimited', scoringCredits: 0, genCredits: 300 }, 'essayMonthlyExpiry'],
  ['ielts-essay-notify', 'ielts_essay_credits', { packageId: 'ielts_essay_unlimited', scoringCredits: -1, monthlyDays: 40 }, 'ieltsEssayMonthlyExpiry'],
  ['speaking-notify', 'speaking_credits', { packageId: 'speaking_unlimited', scoringCredits: 0 }, 'speakingMonthlyExpiry'],
  ['sst-notify', 'sst_credits', { packageId: 'sst_unlimited', scoringCredits: 0 }, 'sstMonthlyExpiry'],
  ['swt-notify', 'swt_credits', { packageId: 'swt_unlimited', scoringCredits: 0 }, 'swtMonthlyExpiry'],
  ['universal-notify', 'universal_credits', { packageId: 'universal_unlimited', scoringCredits: 0 }, 'universalMonthlyExpiry'],
];

async function main() {
  for (const [route, type, fields, field, amount] of PACKS) {
    // Unused credits are removed, leaving what the student had before.
    seed(type, fields, { [field]: 2 });
    await notice(route, 'ORD', '2');
    assert.equal(docs[USER][field], 2 + amount, route);
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], 2, route);
    assert.equal(docs[ORDER].paymentStatus, 'chargedback', route);
    assert.equal(Object.keys(docs[ORDER].chargebackUnrecovered).length, 0, route);
    assert.equal(chargebackMails().length, 1, route);
    assert.equal(chargebackMails()[0].to, 'contact@smartlabs.lk', route);

    // Repeated chargeback removes nothing more and sends no second alert.
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], 2, route);
    assert.equal(chargebackMails().length, 1, route);

    // A replayed success restores nothing, and later statuses do not rewrite the record.
    await notice(route, 'ORD', '2');
    assert.equal(docs[USER][field], 2, route);
    assert.equal(docs[ORDER].paymentStatus, 'chargedback', route);
    await notice(route, 'ORD', '-2');
    assert.equal(docs[ORDER].paymentStatus, 'chargedback', route);

    // Spent credits: the balance stops at zero and the shortfall is recorded.
    seed(type, { ...fields, paymentStatus: 'success', updatedAt: new Date() }, { [field]: 1 });
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], 0, route);
    assert.equal(docs[ORDER].chargebackUnrecovered[field], amount - 1, route);

    // Never below zero, even with no balance field at all.
    seed(type, { ...fields, paymentStatus: 'success', updatedAt: new Date() });
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], 0, route);

    // A chargeback on an order that never granted anything takes nothing away.
    seed(type, { ...fields, paymentStatus: 'amount_mismatch' }, { [field]: 7 });
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], 7, route);
    assert.equal(docs[ORDER].paymentStatus, 'chargedback', route);
  }

  // Essay packs also grant generation credits.
  seed('essay_credits', PACKS[2][2], { essayGenCredits: 1 });
  await notice('essay-notify', 'ORD', '2');
  assert.equal(docs[USER].essayGenCredits, 6);
  await notice('essay-notify', 'ORD', '-3');
  assert.equal(docs[USER].essayGenCredits, 1);

  for (const [route, type, fields, field] of PLANS) {
    // An unlimited plan from this order ends.
    seed(type, fields);
    await notice(route, 'ORD', '2');
    assert.ok(docs[USER][field] > new Date(), route);
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], null, route);
    await notice(route, 'ORD', '2');
    assert.equal(docs[USER][field], null, route);

    // An older plan's chargeback leaves a newer plan running and tells staff.
    const newer = new Date(Date.now() + 39 * DAY);
    seed(type, { ...fields, paymentStatus: 'success', updatedAt: new Date(Date.now() - 20 * DAY) }, { [field]: newer });
    await notice(route, 'ORD', '-3');
    assert.equal(docs[USER][field], newer, route);
    assert.match(chargebackMails()[0].html, /Check it by hand/, route);
  }

  // Class recording: access ends, and a newer purchase's row is left alone.
  const REC = 'recording_access/u1_r1';
  seed('class_recording', { recordingId: 'r1', recordingTitle: 'Class' });
  await notice('recording-notify', 'ORD', '2');
  assert.equal(docs[REC].status, 'active');
  await notice('recording-notify', 'ORD', '-3');
  assert.equal(docs[REC].status, 'chargedback');
  await notice('recording-notify', 'ORD', '2');
  assert.equal(docs[REC].status, 'chargedback');
  assert.equal(chargebackMails().length, 1);
  seed('class_recording', { recordingId: 'r1', paymentStatus: 'success' });
  docs[REC] = { status: 'active', orderId: 'NEWER' };
  await notice('recording-notify', 'ORD', '-3');
  assert.equal(docs[REC].status, 'active');
  assert.equal(docs[ORDER].paymentStatus, 'chargedback');

  // PTE course: enrolment ends and the seat comes back, once.
  const PTE = 'pte_course_enrollments/ORD', BATCH = 'pte_batches/b1';
  seed('pte_course', { packageId: 'p1', batchId: 'b1', fullName: 'S' });
  docs[BATCH] = { seatsFilled: 4 };
  await notice('pte-course-notify', 'ORD', '2');
  assert.equal(docs[PTE].status, 'active');
  assert.equal(docs[BATCH].seatsFilled, 5);
  await notice('pte-course-notify', 'ORD', '-3');
  assert.equal(docs[PTE].status, 'chargedback');
  assert.equal(docs[BATCH].seatsFilled, 4);
  await notice('pte-course-notify', 'ORD', '-3');
  await notice('pte-course-notify', 'ORD', '2');
  assert.equal(docs[PTE].status, 'chargedback');
  assert.equal(docs[BATCH].seatsFilled, 4);
  // Seats never go negative.
  seed('pte_course', { packageId: 'p1', batchId: 'b1', paymentStatus: 'success' });
  docs[BATCH] = { seatsFilled: 0 };
  await notice('pte-course-notify', 'ORD', '-3');
  assert.equal(docs[BATCH].seatsFilled, 0);

  // IELTS course: both enrolment rows end. It must be recorded as a chargeback, not "failed".
  const IELTS = 'ielts_course_enrollments/ORD', MIRROR = `${USER}/enrollments/ORD`;
  seed('ielts_course', { fullName: 'S' });
  await notice('ielts-course-notify', 'ORD', '2');
  assert.equal(docs[MIRROR].status, 'active');
  await notice('ielts-course-notify', 'ORD', '-3');
  assert.equal(docs[IELTS].status, 'chargedback');
  assert.equal(docs[MIRROR].status, 'chargedback');
  assert.equal(docs[ORDER].paymentStatus, 'chargedback');
  await notice('ielts-course-notify', 'ORD', '2');
  assert.equal(docs[IELTS].status, 'chargedback');
  assert.equal(chargebackMails().length, 1);

  // A database failure still reaches staff, and changes nothing.
  seed('mock_credits', { mockCredits: 3, paymentStatus: 'success' }, { mockPaidCredits: 3 });
  failTransactions = true;
  await notice('mock-notify', 'ORD', '-3');
  failTransactions = false;
  assert.equal(docs[USER].mockPaidCredits, 3);
  assert.match(chargebackMails()[0].html, /FAILED/);

  // Certificates have no payment order: the request itself holds the state.
  const CERT = 'certificate_requests/c1', CERT_ORDER = 'cert_c1_1';
  const certificate = (extra = {}) => { docs = { [CERT]: { userId: 'u1', paymentStatus: 'pending', status: 'pending_payment', nameOnCertificate: 'S', amount: 1500, ...extra } }; mails = []; };
  certificate();
  await notice('certificate-notify', CERT_ORDER, '2');
  assert.equal(docs[CERT].status, 'pending_verification');
  await notice('certificate-notify', CERT_ORDER, '-3');
  assert.equal(docs[CERT].paymentStatus, 'chargedback');
  assert.equal(docs[CERT].status, 'rejected');
  assert.equal(chargebackMails().length, 1);
  await notice('certificate-notify', CERT_ORDER, '2');
  await notice('certificate-notify', CERT_ORDER, '-3');
  assert.equal(docs[CERT].status, 'rejected');
  assert.equal(chargebackMails().length, 1);

  // An issued certificate keeps its status and staff are told to decide.
  certificate({ paymentStatus: 'paid', paymentOrderId: CERT_ORDER, status: 'approved' });
  await notice('certificate-notify', CERT_ORDER, '-3');
  assert.equal(docs[CERT].status, 'approved');
  assert.equal(docs[CERT].paymentStatus, 'chargedback');
  assert.match(chargebackMails()[0].html, /already issued/);

  // A chargeback for some other order, or a repeat success, cannot disturb a paid request.
  certificate({ paymentStatus: 'paid', paymentOrderId: CERT_ORDER, status: 'approved' });
  await notice('certificate-notify', 'cert_c1_2', '-3');
  await notice('certificate-notify', CERT_ORDER, '2');
  assert.equal(docs[CERT].paymentStatus, 'paid');
  assert.equal(docs[CERT].status, 'approved');
  assert.equal(mails.length, 0);

  console.log(`Passed: ${PACKS.length} credit packs, ${PLANS.length} unlimited plans, recording, PTE course, IELTS course, certificate.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
