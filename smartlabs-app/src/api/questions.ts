import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '@/api/client';

export type PteScoring = 'ai' | 'auto';
export type PteInput = 'mic' | 'text' | 'choice' | 'order' | 'blank';

export interface PteTask {
  taskType: string;
  label: string;
  slug: string;
  scoring: PteScoring;
  weight: string;
  isNew?: boolean;
  built?: boolean;
  input: PteInput;
  color: string;
}

export interface PteSection {
  id: 'speaking' | 'writing' | 'reading' | 'listening';
  label: string;
  color: string;
  tasks: PteTask[];
}

/**
 * Cache-first GET (stale-while-offline). Returns cached data instantly when it's
 * younger than `ttlMs` (no network → fast), otherwise fetches fresh and updates
 * the cache. If the network fails and we have *any* cached copy, we serve that
 * so the app keeps working offline. Question banks are user-agnostic, so the
 * cache keys are global.
 */
async function cachedGet<T>(key: string, path: string, ttlMs: number): Promise<T> {
  const now = Date.now();
  let cached: { at: number; data: T } | null = null;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) cached = JSON.parse(raw) as { at: number; data: T };
  } catch {
    /* ignore cache read errors */
  }
  if (cached && now - cached.at < ttlMs) return cached.data;
  try {
    const data = await apiGet<T>(path);
    AsyncStorage.setItem(key, JSON.stringify({ at: now, data })).catch(() => {});
    return data;
  } catch (e) {
    if (cached) return cached.data; // offline / hiccup → serve stale
    throw e;
  }
}

const CATALOG_TTL = 6 * 60 * 60 * 1000; // 6h — the catalogue rarely changes
const QUESTIONS_TTL = 60 * 60 * 1000; // 1h

/** The full PTE catalogue — same source the website mega-menu reads. */
export function fetchCatalog() {
  return cachedGet<{ catalog: PteSection[] }>('sl.cache.catalog', '/api/questions?catalog=1', CATALOG_TTL);
}

/** The question bank for one task type (DB-backed, cached for speed/offline). */
export function fetchQuestions<T = unknown>(taskType: string) {
  return cachedGet<{ type: string; count: number; questions: T[] }>(
    `sl.cache.q.${taskType}`,
    `/api/questions?type=${encodeURIComponent(taskType)}`,
    QUESTIONS_TTL,
  );
}
