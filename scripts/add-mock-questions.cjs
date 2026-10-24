const admin = require('firebase-admin');
const fs = require('fs');

const env = fs.readFileSync(process.argv[2], 'utf-8');
const match = env.match(/FIREBASE_ADMIN_CONFIG=(.*)/);
const sa = JSON.parse(match[1]);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const itemsFile = process.argv[3];
const { section, taskType, items } = JSON.parse(fs.readFileSync(itemsFile, 'utf-8'));

const safeId = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '-');

function promptOf(q) {
  for (const k of ['passage', 'topic', 'transcript', 'text', 'question', 'situation', 'describe', 'audioText', 'title']) {
    const v = q?.[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

(async () => {
  let added = 0;
  for (const item of items) {
    const id = `${safeId(taskType)}__${safeId(item.id)}`;
    const payload = {
      section,
      taskType,
      title: item.title ?? '',
      content: promptOf(item),
      category: item.category ?? null,
      audioUrl: item.audioUrl ?? null,
      imageUrl: item.imageUrl ?? null,
      data: item,
      active: false, // hidden from public practice; still selectable in the admin mock builder
      source: 'mock-1',
      prediction: false,
      group: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('pte_questions').doc(id).set(payload, { merge: true });
    console.log('upserted', id);
    added++;
  }
  console.log(`Done. ${added} question(s) written to pte_questions.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
