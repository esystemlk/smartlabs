'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TASK_OPTIONS, exampleForTask, bulkAddQuestions, type BulkResult } from '@/lib/services/pte-questions-bulk';
import { ArrowLeft, Download, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export default function BulkUploadPage() {
  const [taskType, setTaskType] = useState('write-essay');
  const [isPrediction, setIsPrediction] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Single-question add (works for every task type via the same bulk writer).
  const [singleJson, setSingleJson] = useState('');
  const [singleBusy, setSingleBusy] = useState(false);
  const [singleResult, setSingleResult] = useState<BulkResult | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  const selected = useMemo(() => TASK_OPTIONS.find((t) => t.taskType === taskType)!, [taskType]);
  const isEssay = taskType === 'write-essay';

  // Allow deep-linking a specific type: /…/bulk?type=<taskType>
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('type');
      if (t && TASK_OPTIONS.some((o) => o.taskType === t)) setTaskType(t);
    } catch { /* ignore */ }
  }, []);

  // Prefill the single-question editor with one example item whenever the type changes.
  useEffect(() => {
    const one = (exampleForTask(taskType)[0] ?? {}) as Record<string, unknown>;
    setSingleJson(JSON.stringify(one, null, 2));
    setSingleResult(null);
    setSingleError(null);
  }, [taskType]);

  const addSingle = async () => {
    setSingleError(null);
    setSingleResult(null);
    let item: unknown;
    try {
      item = JSON.parse(singleJson);
    } catch {
      setSingleError('That is not valid JSON. Fix the fields and try again.');
      return;
    }
    if (Array.isArray(item)) { setSingleError('Paste a single question object here (no square brackets). Use the file upload above for many.'); return; }
    if (!item || typeof item !== 'object') { setSingleError('The question must be a JSON object.'); return; }
    setSingleBusy(true);
    try {
      const res = await bulkAddQuestions(selected.section, taskType, [item], { isPrediction: isEssay && isPrediction });
      setSingleResult(res);
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : String(e));
    } finally {
      setSingleBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const g: Record<string, typeof TASK_OPTIONS> = { speaking: [], writing: [], reading: [], listening: [] };
    for (const t of TASK_OPTIONS) g[t.section].push(t);
    return g;
  }, []);

  const downloadExample = () => {
    const sample = exampleForTask(taskType);
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `example-${taskType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const text = await file.text();
      let items: unknown;
      try {
        items = JSON.parse(text);
      } catch {
        throw new Error('That file is not valid JSON. Download the example to see the format.');
      }
      if (!Array.isArray(items)) throw new Error('The JSON must be an array of question objects.');
      if (items.length === 0) throw new Error('The file has no questions.');
      const res = await bulkAddQuestions(selected.section, taskType, items as unknown[], { isPrediction: isEssay && isPrediction });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/dashboard/question-bank" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Question bank
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Add questions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add questions for <strong>every task type</strong> across all four sections — one at a time,
          or many at once from a JSON file. Pick the type below; the single-question editor is
          prefilled with the correct fields for that type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose the task type</CardTitle>
          <CardDescription>The uploaded questions will be added under this type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={taskType}
            onChange={(e) => { setTaskType(e.target.value); setResult(null); setError(null); }}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
          >
            {(['speaking', 'writing', 'reading', 'listening'] as const).map((sec) => (
              <optgroup key={sec} label={sec[0].toUpperCase() + sec.slice(1)}>
                {grouped[sec].map((t) => (
                  <option key={t.taskType} value={t.taskType}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {isEssay && (
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={isPrediction} onChange={(e) => setIsPrediction(e.target.checked)} className="h-4 w-4" />
              <span>These essays are <strong>predicted exam questions</strong> (show under the “Predictions” tab).</span>
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Add a single question</CardTitle>
          <CardDescription>
            Prefilled with the correct fields for <strong>{selected.label}</strong>. Edit the values
            (change the <code>id</code> so it doesn&apos;t overwrite an example) and click Add.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={singleJson}
            onChange={(e) => setSingleJson(e.target.value)}
            spellCheck={false}
            rows={10}
            className="w-full rounded-lg border bg-background px-3 py-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center gap-3">
            <Button onClick={addSingle} disabled={singleBusy}>
              {singleBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add this question
            </Button>
            <button type="button" onClick={() => setSingleJson(JSON.stringify((exampleForTask(taskType)[0] ?? {}), null, 2))}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground">Reset to example</button>
          </div>
          {singleError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{singleError}</span>
            </div>
          )}
          {singleResult && (
            <div className={`rounded-lg border p-3 text-sm ${singleResult.success ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              <div className="flex items-center gap-2 font-bold">
                {singleResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                {singleResult.success ? 'Question added.' : `Could not add — ${singleResult.firstError ?? 'unknown error'}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Get the format</CardTitle>
          <CardDescription>
            Downloads a sample JSON file for <strong>{selected.label}</strong> with 1–2 real
            examples. Keep the same field names; add as many items to the array as you like.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadExample}>
            <Download className="mr-2 h-4 w-4" /> Download example ({taskType}.json)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Upload many at once (optional)</CardTitle>
          <CardDescription>A JSON array of question objects. Re-uploading items with the same
          <code> id</code> updates them instead of duplicating.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90"
          />
          {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</p>}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
            </div>
          )}

          {result && (
            <div className={`rounded-lg border p-3 text-sm ${result.success ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              <div className="flex items-center gap-2 font-bold">
                {result.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                Added {result.added} question{result.added === 1 ? '' : 's'}
                {result.failed > 0 ? `, ${result.failed} failed` : ''}.
              </div>
              {result.firstError && <p className="mt-1 text-xs">First error: {result.firstError}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
