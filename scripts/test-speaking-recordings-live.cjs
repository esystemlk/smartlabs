// Optional integration smoke test using disposable users and a synthetic silent WAV.
// Run only against a local server: node scripts/test-speaking-recordings-live.cjs --run
const assert = require('node:assert/strict'), fs = require('node:fs'), { randomUUID } = require('node:crypto');
async function main() {
  if (!process.argv.includes('--run')) throw new Error('Pass --run to create and clean up disposable integration-test records.');
  require('@next/env').loadEnvConfig(process.cwd());
  const admin = require('firebase-admin');
  let credentials;
  try { credentials = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG || ''); } catch { throw new Error('Firebase Admin is not configured.'); }
  const configText = fs.readFileSync('src/firebase/config.ts', 'utf8');
  const config = JSON.parse(configText.slice(configText.indexOf('{'), configText.lastIndexOf('}') + 1));
  const app = admin.initializeApp({ credential: admin.credential.cert(credentials) }, 'speaking-recordings-smoke');
  const db = app.firestore(), auth = app.auth(), bucket = app.storage().bucket(config.storageBucket);
  const users = [], ids = [];
  const request = async (token, path = '', method = 'GET', body) => fetch('http://127.0.0.1:9031/api/speaking-recordings' + path, { method, headers: token ? { Authorization: 'Bearer ' + token } : {}, ...(body ? { body } : {}), signal: AbortSignal.timeout(30000) });
  try {
    for (let i = 0; i < 2; i++) {
      const uid = 'codex-speaking-smoke-' + randomUUID();
      await auth.createUser({ uid }); users.push(uid);
      await db.collection('users').doc(uid).set({ role: 'student', speakingPaidCredits: 0 });
      const customToken = await auth.createCustomToken(uid);
      const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + config.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: customToken, returnSecureToken: true }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok || !data.idToken) throw new Error('Could not establish disposable test session.');
      ids.push(data.idToken);
    }
    assert.equal((await request()).status, 401);
    const id = randomUUID();
    const wav = Buffer.alloc(32044); wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
    const form = new FormData();
    for (const [key, value] of Object.entries({ id, taskType: 'read-aloud', title: 'Disposable integration test', questionId: 'smoke-test', questionLabel: 'Synthetic silent audio', promptText: 'Test only', source: 'upload' })) form.set(key, value);
    form.set('audio', new File([wav], 'test.wav', { type: 'audio/wav' }));
    const upload = await request(ids[0], '', 'POST', form);
    if (upload.status !== 201) { const data = await upload.json(); throw new Error('Audio save failed: ' + data.error); }
    const listed = await (await request(ids[0])).json(); assert.equal(listed.recordings[0].id, id);
    const replay = await request(ids[0], '/' + id); assert.equal(replay.status, 200); assert.deepEqual(Buffer.from(await replay.arrayBuffer()), wav);
    assert.equal((await request(ids[1], '/' + id)).status, 404);
    assert.equal((await request(ids[1], '/' + id + '/score', 'POST')).status, 404);
    assert.equal((await request(ids[0], '/' + id + '/score', 'POST')).status, 402, 'Unfunded test accounts must not call AI.');
    assert.equal((await request(ids[0], '/' + id)).status, 200, 'No-credit state retains replay.');
    assert.equal((await request(ids[0], '/' + id, 'DELETE')).status, 200);
    assert.equal((await request(ids[0], '/' + id)).status, 404);
    console.log('Passed live smoke: Firebase save, history, byte-exact replay, cross-account isolation, no-credit AI gate and deletion. No AI scoring or purchases performed.');
  } finally {
    for (const uid of users) {
      if (!uid.startsWith('codex-speaking-smoke-')) throw new Error('Unsafe cleanup target.');
      const answers = await db.collection('users').doc(uid).collection('speaking_recordings').get();
      for (const answer of answers.docs) { await bucket.file(`speaking-answers/${uid}/${answer.id}`).delete({ ignoreNotFound: true }); await answer.ref.delete(); }
      await db.collection('users').doc(uid).delete(); await auth.deleteUser(uid);
    }
    await app.delete();
  }
}
main().catch(error => { console.error(error.message || 'Live speaking test failed.'); process.exitCode = 1; });
