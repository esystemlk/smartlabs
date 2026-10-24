// Read-only audit: node scripts/verify-mock-questions.cjs [.env.local]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isDeepStrictEqual } = require('util');
const admin = require('firebase-admin');
const env = require('dotenv').parse(fs.readFileSync(process.argv[2] || '.env.local'));
const account = JSON.parse(env.FIREBASE_ADMIN_CONFIG);
admin.initializeApp({ credential: admin.credential.cert(account) });
const safeId = s => String(s).replace(/[^A-Za-z0-9_-]/g, '-');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const promptOf = q => ['passage', 'topic', 'transcript', 'text', 'question', 'situation', 'describe', 'audioText', 'title'].map(k => q[k]).find(v => typeof v === 'string' && v.trim()) || '';

(async () => {
  const expected = [];
  for (const file of fs.readdirSync('mock-data/mock-1').filter(f => f.endsWith('.json'))) {
    const batch = JSON.parse(fs.readFileSync(path.join('mock-data/mock-1', file)));
    for (const item of batch.items) expected.push({ ...batch, items: undefined, item, id: `${safeId(batch.taskType)}__${safeId(item.id)}` });
  }
  if (new Set(expected.map(q => q.id)).size !== expected.length) throw new Error('Duplicate manifest IDs');
  const snapshot = await admin.firestore().collection('pte_questions').where('source', '==', 'mock-1').get();
  const docs = new Map(snapshot.docs.map(d => [d.id, d.data()]));
  const issues = [];
  let media = 0;
  let identical = 0;
  for (const q of expected) {
    const d = docs.get(q.id);
    if (!d) { issues.push(`${q.id}: missing document`); continue; }
    for (const [key, value] of Object.entries({ section: q.section, taskType: q.taskType, title: q.item.title ?? '', content: promptOf(q.item), category: q.item.category ?? null, active: false, source: 'mock-1', prediction: false, group: null })) {
      if (!isDeepStrictEqual(d[key], value)) issues.push(`${q.id}: ${key} mismatch`);
    }
    for (const [key, value] of Object.entries(q.item)) {
      if (key !== 'localPath' && !isDeepStrictEqual(d.data?.[key], value)) issues.push(`${q.id}: data.${key} mismatch`);
    }
    if (q.item.localPath) {
      const key = /\.(mp3|wav|m4a|ogg)$/i.test(q.item.localPath) ? 'audioUrl' : 'imageUrl';
      if (!d[key] || d.data?.[key] !== d[key]) { issues.push(`${q.id}: missing/inconsistent ${key}`); continue; }
      const url = new URL(d[key]);
      const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!match || url.hostname !== 'firebasestorage.googleapis.com') { issues.push(`${q.id}: unexpected media URL`); continue; }
      const file = admin.storage().bucket(decodeURIComponent(match[1])).file(decodeURIComponent(match[2]));
      const [metadata] = await file.getMetadata();
      const tokens = String(metadata.metadata?.firebaseStorageDownloadTokens || '').split(',');
      if (!tokens.includes(url.searchParams.get('token'))) issues.push(`${q.id}: invalid download token`);
      const [bytes] = await file.download();
      media++;
      if (!fs.existsSync(q.item.localPath)) issues.push(`${q.id}: local media unavailable for comparison`);
      else if (hash(bytes) !== hash(fs.readFileSync(q.item.localPath))) issues.push(`${q.id}: media bytes differ`);
      else identical++;
    }
  }
  const ids = new Set(expected.map(q => q.id));
  for (const id of docs.keys()) if (!ids.has(id)) issues.push(`${id}: unexpected mock-1 document`);
  console.log(JSON.stringify({ project: account.project_id, expected: expected.length, firestore: docs.size, mediaVerified: media, byteIdentical: identical, issues }, null, 2));
  await admin.app().delete();
  process.exitCode = issues.length ? 1 : 0;
})().catch(e => { console.error(e.message); process.exit(1); });
