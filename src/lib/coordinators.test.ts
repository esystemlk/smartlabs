// Self-check for the coordinator tracker rules. Run: npx tsx src/lib/coordinators.test.ts
import assert from 'node:assert/strict';
import { normalizePhone, monthOf, previousMonth, markDuplicates, summarize, reportCsv, type CoordEntry } from './coordinators';

assert.equal(normalizePhone('077 123 4567'), '+94771234567');
assert.equal(normalizePhone('+94 77 123 4567'), '+94771234567');
assert.equal(normalizePhone('0094771234567'), '+94771234567');
assert.equal(normalizePhone('771234567'), '+94771234567');
assert.equal(normalizePhone('94771234567'), '+94771234567');
assert.equal(normalizePhone('+61 412 345 678'), '+61412345678');

// 2026-11-30 20:00 UTC is already 1 Dec in Sri Lanka (UTC+5:30).
assert.equal(monthOf(Date.UTC(2026, 10, 30, 20, 0)), '2026-12');
assert.equal(monthOf(Date.UTC(2026, 10, 30, 10, 0)), '2026-11');
assert.equal(previousMonth('2026-01'), '2025-12');
assert.equal(previousMonth('2026-11'), '2026-10');

const base = { coordinatorEmail: '', name: 'S', email: '', courseId: 'c', courseName: 'PTE', batchId: 'b', batchName: 'Dec', method: 'Cash', paidOn: '', note: '', slipPath: '', month: '2026-11', createdAt: 1 };
const e = (id: string, uid: string, phone: string, fee: number, paid: number, dupDecision: CoordEntry['dupDecision'] = null): CoordEntry =>
  ({ ...base, id, coordinatorUid: uid, coordinatorName: uid, phone, fee, paid, dupDecision });
const list = markDuplicates([
  e('1', 'zainab', '+94771111111', 30000, 30000),
  e('2', 'oshadi', '+94771111111', 30000, 10000),
  e('3', 'oshadi', '+94772222222', 20000, 20000),
  e('4', 'zainab', '+94773333333', 25000, 5000),
  e('5', 'zainab', '+94773333333', 25000, 5000), // same coordinator twice: not a cross-coordinator duplicate
]);
assert.deepEqual(list.map(x => [x.id, x.duplicate, x.counts]), [['1', true, false], ['2', true, false], ['3', false, true], ['4', false, true], ['5', false, true]]);

const decided = markDuplicates([e('1', 'zainab', '+94771111111', 30000, 30000, 'credit'), e('2', 'oshadi', '+94771111111', 30000, 10000, 'no-credit')]);
const sum = summarize(decided);
assert.deepEqual(sum.map(r => [r.coordinator, r.students, r.flagged, r.paid]), [['zainab', 1, 0, 30000], ['oshadi', 0, 0, 0]]);

const s2 = summarize(list);
const z = s2.find(r => r.coordinator === 'zainab')!;
assert.equal(z.students, 2); assert.equal(z.flagged, 1); assert.equal(z.balance, 40000);

const csv = reportCsv('2026-11', [{ ...list[2], name: 'Perera, "Nimal"' }]);
assert.ok(csv.startsWith('﻿'));
assert.ok(csv.includes('"Perera, ""Nimal"""'), 'quotes and commas escaped');
console.log('coordinators: all checks passed');
