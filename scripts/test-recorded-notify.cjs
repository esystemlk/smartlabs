// Recorded package payment notices: forged orders, renewals and chargebacks.
// In-memory database only. No live services, payments or emails.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), ts = require('typescript');

const md5 = s => crypto.createHash('md5').update(s).digest('hex').toUpperCase();
const SECRET = 'test-secret', DAY = 86400000;
const env = { PAYHERE_MERCHANT_SECRET: SECRET };
const DELETE = { deleted: true };
let docs = {}, mails = [];

const ref = (col, id) => ({
  key: `${col}/${id}`,
  get: async () => snap(col, id),
  update: async data => { docs[`${col}/${id}`] = { ...docs[`${col}/${id}`], ...data }; },
});
function snap(col, id) {
  const data = docs[`${col}/${id}`];
  return { id, ref: ref(col, id), exists: !!data, data: () => data };
}
const adminDb = {
  collection: col => ({
    doc: id => ref(col, id),
    where: (_f, _o, orderId) => ({ where: (_f2, _o2, type) => ({ limit: () => ({ get: async () => {
      const found = Object.keys(docs).filter(k => k.startsWith(`${col}/`) && docs[k].orderId === orderId && docs[k].type === type)
        .map(k => snap(col, k.slice(col.length + 1)));
      return { empty: !found.length, docs: found };
    } }) }) }),
  }),
  runTransaction: async fn => fn({
    get: r => r.get(),
    update: (r, data) => { docs[r.key] = { ...docs[r.key], ...data }; },
    set: (r, data) => {
      const next = { ...docs[r.key], ...data };
      Object.keys(next).forEach(k => { if (next[k] === DELETE) delete next[k]; });
      docs[r.key] = next;
    },
  }),
};

const cache = new Map();
function load(file) {
  const full = path.resolve(file);
  if (cache.has(full)) return cache.get(full);
  const exports = {};
  cache.set(full, exports);
  const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, Date, URL, Response, console: { log() {}, warn() {}, error() {} }, process: { env }, require: name => {
    if (name === '@/lib/firebase-admin') return { adminDb };
    if (name === '@/lib/mail') return { sendMail: async m => { mails.push(m); } };
    if (name === '@/lib/admin-payment-email') return { renderAdminPaymentAlert: () => '' };
    if (name === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => new Date(), delete: () => DELETE } };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  } });
  return exports;
}
const route = load('src/app/api/payhere/recorded-package-notify/route.ts');

function notice(orderId, statusCode, amount = '20000.00') {
  const body = new FormData();
  const fields = { merchant_id: 'M1', order_id: orderId, payhere_amount: amount, payhere_currency: 'LKR', status_code: statusCode, payment_id: 'P1' };
  Object.entries(fields).forEach(([k, v]) => body.set(k, v));
  body.set('md5sig', md5(`M1${orderId}${amount}LKR${statusCode}${md5(SECRET)}`));
  return route.POST({ formData: async () => body });
}
const order = (orderId, extra = {}) => ({ orderId, type: 'recorded_package', userId: 'student-12345', packageId: 'pkg', packageTitle: 'PTE', accessMonths: 2, paymentAmount: 20000, paymentStatus: 'pending', ...extra });
const ENROLL = 'recorded_enrollments/student-12345_pkg', ID = 'recpkg_student-_1';

async function main() {
  // Forged: a cheap purchase's signed ID cannot match a browser-written package order.
  docs = { 'payment_orders/forged': order('swt_student-_1', { paymentAmount: 500, accessMonths: 2 }) };
  await notice('swt_student-_1', '2', '500.00');
  assert.equal(docs[ENROLL], undefined);

  // Forged: months beyond anything on sale are refused even with a package-style ID.
  docs = { 'payment_orders/o': order(ID, { accessMonths: 1200 }) };
  await notice(ID, '2');
  assert.equal(docs[ENROLL], undefined);

  // First purchase: two months from today, active.
  docs = { 'payment_orders/o': order(ID) };
  await notice(ID, '2');
  assert.equal(docs[ENROLL].status, 'active');
  const days = (docs[ENROLL].expiresAt - Date.now()) / DAY;
  assert.ok(days > 58 && days < 63, `expected about two months, got ${days}`);

  // A repeated success notice changes nothing and sends no more email.
  const firstExpiry = docs[ENROLL].expiresAt, sent = mails.length;
  await notice(ID, '2');
  assert.equal(docs[ENROLL].expiresAt, firstExpiry);
  assert.equal(mails.length, sent);

  // Renewing while active keeps unused days and allows a new expiry reminder.
  const remaining = new Date(Date.now() + 20 * DAY);
  docs = { 'payment_orders/o': order(ID), [ENROLL]: { status: 'active', expiresAt: remaining, reminder7SentAt: new Date() } };
  await notice(ID, '2');
  const renewed = (docs[ENROLL].expiresAt - Date.now()) / DAY;
  assert.ok(renewed > 78 && renewed < 83, `expected about 80 days, got ${renewed}`);
  assert.equal(docs[ENROLL].reminder7SentAt, undefined);

  // Buying again after expiry starts from today, not the old date.
  docs = { 'payment_orders/o': order(ID), [ENROLL]: { status: 'expired', expiresAt: new Date(Date.now() - 30 * DAY) } };
  await notice(ID, '2');
  const fresh = (docs[ENROLL].expiresAt - Date.now()) / DAY;
  assert.ok(fresh > 58 && fresh < 63, `expected about two months, got ${fresh}`);

  // Chargeback after success removes access and alerts staff.
  mails = [];
  await notice(ID, '-3');
  assert.equal(docs[ENROLL].status, 'chargedback');
  assert.equal(docs['payment_orders/o'].paymentStatus, 'chargedback');
  assert.equal(mails.length, 1);

  // A replayed success notice cannot restore access after a chargeback.
  await notice(ID, '2');
  assert.equal(docs[ENROLL].status, 'chargedback');
  assert.equal(mails.length, 1);

  // An underpayment still grants nothing.
  docs = { 'payment_orders/o': order(ID) };
  await notice(ID, '2', '100.00');
  assert.equal(docs[ENROLL], undefined);
  assert.equal(docs['payment_orders/o'].paymentStatus, 'amount_mismatch');

  console.log('Passed: forged orders, duration limits, renewal days, reminder reset, chargeback removal, replay and underpayment.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
