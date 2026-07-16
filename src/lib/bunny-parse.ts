/**
 * Parse Bunny Stream references out of whatever the admin pastes.
 * Accepts:
 *   https://iframe.mediadelivery.net/embed/12345/abcd-guid?autoplay=false
 *   https://iframe.mediadelivery.net/play/12345/abcd-guid
 *   https://video.bunnycdn.com/embed/12345/abcd-guid
 *   12345/abcd-guid
 *   <iframe src="https://iframe.mediadelivery.net/embed/12345/abcd-guid" ...></iframe>
 */
export interface BunnyRef { libraryId: string; videoId: string; }

const GUID = '[0-9a-fA-F-]{8,}';
const PATTERNS = [
  new RegExp(`mediadelivery\\.net/(?:embed|play)/(\\d+)/(${GUID})`),
  new RegExp(`video\\.bunnycdn\\.com/(?:embed|play)/(\\d+)/(${GUID})`),
  new RegExp(`^\\s*(\\d+)\\s*/\\s*(${GUID})\\s*$`),
];

export function parseBunnyRef(input: string): BunnyRef | null {
  const s = (input ?? '').trim();
  if (!s) return null;
  for (const re of PATTERNS) {
    const m = s.match(re);
    if (m) return { libraryId: m[1], videoId: m[2] };
  }
  return null;
}

export interface BulkRow {
  line: number;
  raw: string;
  ok: boolean;
  error?: string;
  title?: string;
  month?: string;
  classNumber?: 1 | 2;
  classDate?: string;
  libraryId?: string;
  videoId?: string;
}

/**
 * Bulk format — one recording per line, pipe-separated:
 *   Title | YYYY-MM-DD | 1 | <bunny link or libraryId/videoId>
 * Month is derived from the date. Blank lines and #comments are skipped.
 */
export function parseBulk(text: string): BulkRow[] {
  const rows: BulkRow[] = [];
  text.split('\n').forEach((raw, i) => {
    const line = i + 1;
    const t = raw.trim();
    if (!t || t.startsWith('#')) return;

    const parts = t.split('|').map(p => p.trim());
    if (parts.length < 4) {
      rows.push({ line, raw: t, ok: false, error: 'Expected 4 fields: Title | YYYY-MM-DD | 1 or 2 | Bunny link' });
      return;
    }
    const [title, classDate, classNumStr, link] = parts;

    if (!title) { rows.push({ line, raw: t, ok: false, error: 'Title is empty' }); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classDate)) {
      rows.push({ line, raw: t, ok: false, error: `Bad date "${classDate}" — use YYYY-MM-DD` }); return;
    }
    const classNumber = Number(classNumStr);
    if (classNumber !== 1 && classNumber !== 2) {
      rows.push({ line, raw: t, ok: false, error: `Class number must be 1 or 2 (got "${classNumStr}")` }); return;
    }
    const ref = parseBunnyRef(link);
    if (!ref) {
      rows.push({ line, raw: t, ok: false, error: 'Could not read a Bunny library/video id from the link' }); return;
    }

    rows.push({
      line, raw: t, ok: true,
      title,
      classDate,
      month: classDate.slice(0, 7),
      classNumber: classNumber as 1 | 2,
      libraryId: ref.libraryId,
      videoId: ref.videoId,
    });
  });
  return rows;
}
