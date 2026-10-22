import { NextResponse } from 'next/server';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { detectSpeakingAudio, MAX_SPEAKING_AUDIO_BYTES, SPEAKING_TASKS } from '@/lib/speaking-recordings';
import { publicRecording, recordingAudio, recordingsFor, validRecordingId } from '@/lib/server/speaking-recordings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
  try {
    const cursor = new URL(request.url).searchParams.get('before');
    let query = recordingsFor(auth.uid).orderBy('createdAt', 'desc').orderBy('__name__', 'desc').limit(21);
    if (cursor) {
      const [time, id] = cursor.split('~');
      if (!validRecordingId(id || '') || !Number.isSafeInteger(Number(time)) || Number(time) <= 0) return NextResponse.json({ error: 'Invalid page.' }, { status: 400, headers });
      query = query.startAfter(Number(time), id);
    }
    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, 20);
    return NextResponse.json({ recordings: docs.map(doc => publicRecording(doc.id, doc.data())), nextCursor: snapshot.size > 20 ? `${docs[19].data().createdAt}~${docs[19].id}` : null }, { headers });
  } catch {
    return NextResponse.json({ error: 'Could not load your recordings.' }, { status: 500, headers });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
  if (Number(request.headers.get('content-length')) > MAX_SPEAKING_AUDIO_BYTES + 50000) return NextResponse.json({ error: 'Audio must be 4 MB or smaller.' }, { status: 413, headers });
  try {
    const form = await request.formData();
    const file = form.get('audio');
    const id = String(form.get('id') || '');
    const taskType = String(form.get('taskType') || '');
    const title = String(form.get('title') || '').trim().slice(0, 120);
    const questionId = String(form.get('questionId') || '').slice(0, 160);
    const questionLabel = String(form.get('questionLabel') || '').slice(0, 300);
    const promptText = String(form.get('promptText') || '');
    const source = form.get('source');
    if (!validRecordingId(id) || !(SPEAKING_TASKS as readonly string[]).includes(taskType) || !title || !questionId || promptText.length > 30000 || !['microphone', 'upload'].includes(String(source))) return NextResponse.json({ error: 'Invalid speaking answer.' }, { status: 400, headers });
    if (!(file instanceof File) || file.size < 800 || file.size > MAX_SPEAKING_AUDIO_BYTES) return NextResponse.json({ error: 'Choose an audio recording between 800 bytes and 4 MB.' }, { status: 400, headers });
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = detectSpeakingAudio(bytes, file.type);
    if (!mimeType) return NextResponse.json({ error: 'Use a valid MP3, M4A, WAV, OGG or WebM audio file.' }, { status: 415, headers });
    // Describe Image references must come from the admin's question bank, never an arbitrary client URL.
    let imageUrl = '';
    if (taskType === 'describe-image') {
      if (questionId.includes('/')) return NextResponse.json({ error: 'Invalid image question.' }, { status: 400, headers });
      const question = await adminDb!.collection('pte_questions').doc(questionId).get();
      const data = question.data();
      imageUrl = data?.data?.imageUrl || data?.imageUrl || '';
      if (!imageUrl) return NextResponse.json({ error: 'This image question is no longer available.' }, { status: 400, headers });
    }
    const ref = recordingsFor(auth.uid).doc(id);
    const existing = await ref.get();
    if (existing.exists) return NextResponse.json({ recording: publicRecording(id, existing.data()!) }, { headers });
    const audio = recordingAudio(auth.uid, id);
    try {
      await audio.save(bytes, { resumable: false, preconditionOpts: { ifGenerationMatch: 0 }, metadata: { contentType: mimeType, cacheControl: 'private, no-store' } });
    } catch (error) {
      // A concurrent retry must never overwrite an existing answer's audio.
      if ((error as { code?: number }).code !== 412) throw error;
      const concurrent = await ref.get();
      if (concurrent.exists) return NextResponse.json({ recording: publicRecording(id, concurrent.data()!) }, { headers });
      return NextResponse.json({ error: 'This answer is still saving. Please retry.' }, { status: 409, headers });
    }
    const data = { taskType, title, questionId, questionLabel, promptText, imageUrl, source, mimeType, size: bytes.length, createdAt: Date.now(), status: 'saved' };
    try { await ref.create(data); }
    catch (error) { await audio.delete({ ignoreNotFound: true }).catch(() => {}); throw error; }
    return NextResponse.json({ recording: publicRecording(id, data) }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: 'Your recording was not saved. Keep this page open and try saving again.' }, { status: 500, headers });
  }
}
