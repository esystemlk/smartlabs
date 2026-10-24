// Uploads local audio/image files to Firebase Storage and upserts matching
// pte_questions docs (hidden: active=false) for the mock-test question bank.
//
// Usage: node scripts/upload-mock-audio.cjs <envFile> <manifestJsonFile>
// Manifest shape:
// { "section": "speaking", "taskType": "repeat-sentence", "storagePrefix": "repeat-sentence",
//   "items": [ { "id": "mock1-1", "title": "...", "localPath": "C:/.../file.mp3", "category": "mock-1" } ] }
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const env = fs.readFileSync(process.argv[2], 'utf-8');
const sa = JSON.parse(env.match(/FIREBASE_ADMIN_CONFIG=(.*)/)[1]);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const bucket = admin.storage().bucket('smart-labs-ekk8j.firebasestorage.app');

const manifestFile = process.argv[3];
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
const { section, taskType, storagePrefix, items } = manifest;

const safeId = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '-');
const safeName = (s) => String(s).replace(/[^a-zA-Z0-9._-]/g, '_');

function promptOf(q) {
  for (const k of ['passage', 'topic', 'transcript', 'text', 'question', 'situation', 'describe', 'audioText', 'title']) {
    const v = q?.[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

async function uploadOne(localPath, destPrefix) {
  const ext = path.extname(localPath);
  const dest = `${destPrefix}/${Date.now()}-${safeName(path.basename(localPath))}`;
  const token = crypto.randomUUID();
  await bucket.upload(localPath, {
    destination: dest,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  const encodedPath = encodeURIComponent(dest);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

(async () => {
  let added = 0;
  for (const item of items) {
    let audioUrl, imageUrl;
    if (item.localPath) {
      const ext = path.extname(item.localPath).toLowerCase();
      const url = await uploadOne(item.localPath, storagePrefix);
      if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) audioUrl = url;
      else imageUrl = url;
      console.log('uploaded', item.localPath, '->', url);
    }
    const id = `${safeId(taskType)}__${safeId(item.id)}`;
    const { localPath, ...itemRest } = item;
    const dataItem = { ...itemRest, ...(audioUrl ? { audioUrl } : {}), ...(imageUrl ? { imageUrl } : {}) };
    const payload = {
      section,
      taskType,
      title: item.title ?? '',
      content: promptOf(item),
      category: item.category ?? null,
      audioUrl: audioUrl ?? null,
      imageUrl: imageUrl ?? null,
      data: dataItem,
      active: false,
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
