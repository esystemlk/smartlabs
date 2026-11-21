// Self-check for one-to-one slot and refund rules. Run: npx tsx src/lib/one-to-one.test.ts
import assert from 'node:assert/strict';
import { freeStarts, refundBand, toEpoch, colomboDate, colomboMin, fmtTime, dueReminder } from './one-to-one';

const h = (x: number) => x * 60;
const win = [{ startMin: h(9), endMin: h(12) }];
const opts = { stepMin: 30, cooldownMin: 30 };

// Nothing booked, Sunday 9–12.
assert.deepEqual(freeStarts(win, [], 1, opts).map(fmtTime), ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM']);
assert.deepEqual(freeStarts(win, [], 2, opts).map(fmtTime), ['9:00 AM', '9:30 AM', '10:00 AM']);
assert.deepEqual(freeStarts(win, [], 3, opts).map(fmtTime), ['9:00 AM']);

// 9–10 booked → next student's first start is 10:30.
const a = [{ startMin: h(9), endMin: h(10) }];
assert.deepEqual(freeStarts(win, a, 1, opts).map(fmtTime), ['10:30 AM', '11:00 AM']);
assert.deepEqual(freeStarts(win, a, 2, opts), []);

// 9–10 and 10:30–11:30 booked → nothing left.
assert.deepEqual(freeStarts(win, [...a, { startMin: h(10.5), endMin: h(11.5) }], 1, opts), []);

// 10–11 booked → 9:00 ends inside cooldown, 11:30 runs past 12.
assert.deepEqual(freeStarts(win, [{ startMin: h(10), endMin: h(11) }], 1, opts), []);

// Earliest-start cutoff (today, now = 9:40).
assert.deepEqual(freeStarts(win, [], 1, { ...opts, earliestMin: h(9) + 40 }).map(fmtTime), ['10:00 AM', '10:30 AM', '11:00 AM']);

// Time-zone helpers round-trip.
const t = toEpoch('2026-11-23', h(9));
assert.equal(new Date(t).toISOString(), '2026-11-23T03:30:00.000Z');
assert.equal(colomboDate(t), '2026-11-23');
assert.equal(colomboMin(t), h(9));

// Refund bands.
const start = toEpoch('2026-11-30', h(9));
assert.equal(refundBand(start, toEpoch('2026-11-27', h(9))), 'full');        // exactly 3 days
assert.equal(refundBand(start, toEpoch('2026-11-27', h(9) + 1)), 'late');    // just under
assert.equal(refundBand(start, toEpoch('2026-11-29', h(23))), 'late');       // day before
assert.equal(refundBand(start, toEpoch('2026-11-30', h(1))), 'none');        // same day
assert.equal(refundBand(start, start + 1), 'none');

// Reminders — class Sun 30 Nov 10:00–11:00, paid days earlier.
const rb = { date: '2026-11-30', startAt: toEpoch('2026-11-30', h(10)), endAt: toEpoch('2026-11-30', h(11)), paidAt: toEpoch('2026-11-20', h(12)) };
const at = (d: string, m: number) => toEpoch(d, m);
assert.deepEqual(dueReminder(rb, {}, at('2026-11-29', h(17))), { send: null, skip: [] });
assert.deepEqual(dueReminder(rb, {}, at('2026-11-29', h(18))), { send: 'dayBefore', skip: [] });
assert.deepEqual(dueReminder(rb, { dayBefore: 1 }, at('2026-11-29', h(20))), { send: null, skip: [] });
assert.deepEqual(dueReminder(rb, { dayBefore: 1 }, at('2026-11-30', h(7))), { send: 'classDay', skip: [] });
assert.deepEqual(dueReminder(rb, { dayBefore: 1, classDay: 1 }, at('2026-11-30', h(9))), { send: 'hourBefore', skip: [] });
assert.deepEqual(dueReminder(rb, { dayBefore: 1, classDay: 1, hourBefore: 1 }, at('2026-11-30', h(10) - 5)), { send: 'starting', skip: [] });
// Pinger was down all morning → only "starting" goes out, the rest are skipped.
assert.deepEqual(dueReminder(rb, { dayBefore: 1 }, at('2026-11-30', h(10))), { send: 'starting', skip: ['classDay', 'hourBefore'] });
assert.deepEqual(dueReminder(rb, {}, rb.endAt), { send: null, skip: [] });
// Early class (7:30 AM): class-day reminder moves to 2 h before.
const early = { ...rb, startAt: at('2026-11-30', h(7.5)), endAt: at('2026-11-30', h(8.5)) };
assert.equal(dueReminder(early, { dayBefore: 1 }, at('2026-11-30', h(5.5))).send, 'classDay');
// Booked this morning at 8:00 for 10:00 → class-day skipped, 1-hour reminder still sent.
const sameDay = { ...rb, paidAt: at('2026-11-30', h(8)) };
assert.deepEqual(dueReminder(sameDay, {}, at('2026-11-30', h(8) + 1)), { send: null, skip: ['dayBefore', 'classDay'] });
assert.equal(dueReminder(sameDay, { dayBefore: 1, classDay: 1 }, at('2026-11-30', h(9))).send, 'hourBefore');

console.log('one-to-one: all checks passed');
