// Uploads the bundled IELTS Listening audio to Firebase Storage so it no longer
// ships with the Vercel deployment. Run ONCE from the project root:
//
//   # PowerShell (set the admin config from your service-account JSON):
//   $env:FIREBASE_ADMIN_CONFIG = Get-Content path\to\serviceAccount.json -Raw
//   node scripts/upload-ielts-audio.mjs
//
// Or put FIREBASE_ADMIN_CONFIG=<json> on one line in .env.local and just run:
//   node scripts/upload-ielts-audio.mjs
//
// It uploads public/audio/ielts/listening/** to the Storage path
// ielts-listening/** (same structure the JSON files now reference). Re-running
// is safe — it overwrites existing objects.

import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = 'smart-labs-ekk8j.firebasestorage.app';
const LOCAL_DIR = path.join(ROOT, 'public', 'audio', 'ielts', 'listening');
const CONTENT_TYPE = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav' };

function getAdminConfig() {
  if (process.env.FIREBASE_ADMIN_CONFIG) return process.env.FIREBASE_ADMIN_CONFIG;
  // Fallback: pull a single-line FIREBASE_ADMIN_CONFIG=... out of .env.local.
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
    const line = env.split(/\r?\n/).find((l) => l.startsWith('FIREBASE_ADMIN_CONFIG='));
    if (line) return line.slice('FIREBASE_ADMIN_CONFIG='.length).replace(/^['"]|['"]$/g, '');
  } catch { /* no .env.local */ }
  return null;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

async function main() {
  const cfg = getAdminConfig();
  if (!cfg) {
    console.error('❌ FIREBASE_ADMIN_CONFIG is not set (env var or .env.local). See the comment at the top of this file.');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(cfg)), storageBucket: BUCKET });
  const bucket = admin.storage().bucket();

  if (!fs.existsSync(LOCAL_DIR)) { console.error('❌ No local audio at', LOCAL_DIR); process.exit(1); }
  const files = walk(LOCAL_DIR);
  console.log(`Uploading ${files.length} file(s) to gs://${BUCKET}/ielts-listening/ …\n`);

  let ok = 0;
  for (const file of files) {
    const rel = path.relative(LOCAL_DIR, file).split(path.sep).join('/'); // cambridge-11/test-1/part-1.mp3
    const dest = `ielts-listening/${rel}`;
    const ext = path.extname(file).toLowerCase();
    try {
      await bucket.upload(file, { destination: dest, metadata: { contentType: CONTENT_TYPE[ext] || 'application/octet-stream', cacheControl: 'public, max-age=31536000, immutable' } });
      ok++;
      console.log(`  ✓ ${dest}`);
    } catch (e) {
      console.error(`  ✗ ${dest}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\nDone: ${ok}/${files.length} uploaded.`);
  console.log('Make sure storage.rules (public read for ielts-listening/) is published so the ?alt=media URLs work.');
}

main().catch((e) => { console.error(e); process.exit(1); });
