import { POST as essay } from '@/app/api/score-essay/route';
import { POST as swt } from '@/app/api/score-swt/route';
import { POST as sst } from '@/app/api/score-sst/route';
import { internalHeaders } from '@/lib/internal-auth';
import { scorePteSpeaking } from '@/ai/flows/score-pte-speaking';
import { scoreWfd } from '@/lib/wfd-scoring';
import { speakingTask, scoreObjective, type FullAnswer, type FullScore } from '@/lib/full-mock';
import admin from 'firebase-admin';
import { repeatSentenceReference } from '@/lib/full-mock-reference';
import { withMockAiKey } from '@/lib/mock-ai-context';

async function writing(kind: string, data: Record<string, any>, answer: string, token: string): Promise<FullScore> {
  const handler = kind === 'write-essay' ? essay : kind === 'swt' ? swt : sst;
  const text = data.passage || data.topic || data.transcript || data.text;
  const body = kind === 'write-essay' ? { topic: text, essay: answer, wordCount: answer.trim().split(/\s+/).length, requestModelEssay: false }
    : kind === 'swt' ? { passage: text, summary: answer } : { transcript: text, summary: answer };
  const result = await handler(new Request('http://internal/scoring', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token, ...internalHeaders() }, body: JSON.stringify(body) }));
  const d = await result.json();
  if (!result.ok) throw new Error('AI scoring is temporarily unavailable. Your response is saved.');
  let raw = Number(d.total), max = Number(d.maxTotal);
  if (kind === 'write-essay') {
    if (!Array.isArray(d.criteria) || !d.criteria.length) throw new Error('Incomplete essay assessment.');
    raw = d.criteria.reduce((s: number,c: any) => s + Number(c.score),0);
    max = d.criteria.reduce((s: number,c: any) => s + Number(c.max),0);
  }
  if (!Number.isFinite(raw) || !Number.isFinite(max) || max <= 0) throw new Error('Invalid writing assessment.');
  return { raw, max, percent: Math.max(0,Math.min(100,raw/max*100)), detail: d };
}
export async function scoreFullQuestion(type: string, source: Record<string, any>, answer: FullAnswer, audioPath: string | undefined, token: string): Promise<FullScore> {
  const attempted = audioPath || (Array.isArray(answer) ? answer.length : answer.trim());
  const run = () => scoreQuestion(type,source,answer,audioPath,token);
  return attempted && (speakingTask(type) || ['swt','write-essay','summarize-spoken-text'].includes(type)) ? withMockAiKey(run) : run();
}
async function scoreQuestion(type: string, source: Record<string, any>, answer: FullAnswer, audioPath: string | undefined, token: string): Promise<FullScore> {
  const data = source.data || {};
  if ((!Array.isArray(answer) && !answer.trim()) && !audioPath || Array.isArray(answer) && !answer.length && !audioPath) return { raw: 0, max: 1, percent: 0, detail: { skipped: true } };
  if (speakingTask(type)) {
    if (!audioPath) return { raw: 0, max: 1, percent: 0, detail: { skipped: true } };
    const file = admin.storage().bucket('smart-labs-ekk8j.firebasestorage.app').file(audioPath);
    const [[bytes], [meta]] = await Promise.all([file.download(),file.getMetadata()]);
    const promptText = type === 'repeat-sentence' ? await repeatSentenceReference(source.audioUrl)
      : [data.text, data.question, data.situation, data.transcript, data.describe, data.answer && `Accepted answers: ${data.answer}`].filter(Boolean).join('\n');
    const result = await scorePteSpeaking({ taskType: type,
      promptText,
      imageUrl: source.imageUrl || undefined,
      audioDataUri: `data:${meta.contentType || 'audio/webm'};base64,${bytes.toString('base64')}`,
    });
    // Preserve the trainer's exact markings and feedback. Only normalize its
    // existing 10–90 overall mark for cross-task aggregation; do not re-mark traits.
    return { raw: result.overall, max: 90, percent: Math.max(0,Math.min(100,(result.overall-10)/80*100)), detail: result };
  }
  if (['swt','write-essay','summarize-spoken-text'].includes(type)) return writing(type,data,String(answer),token);
  if (type === 'write-from-dictation') {
    const d = scoreWfd(data.text,String(answer));
    return { raw: d.correctWords, max: d.totalWords, percent: d.accuracy, detail: d };
  }
  return scoreObjective(type,data,answer);
}
