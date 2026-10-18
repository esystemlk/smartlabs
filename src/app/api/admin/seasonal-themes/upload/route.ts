import { NextRequest, NextResponse } from 'next/server';
import { verifyThemeAdmin } from '@/lib/seasonal-theme/server';
import { themeIds, type ThemeId } from '@/lib/seasonal-theme/config';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const auth = await verifyThemeAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const maxBytes = 3 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes + 20_000) return NextResponse.json({ error: 'Choose a file smaller than 3 MB.' }, { status: 413 });
  try {
    const data = await request.formData();
    const id = data.get('themeId') ?? 'halloween';
    if (!themeIds.includes(id as ThemeId)) return NextResponse.json({ error: 'Unknown theme.' }, { status: 400 });
    const file = data.get('file');
    if (!(file instanceof File) || file.size > maxBytes || file.size < 12) return NextResponse.json({ error: 'Choose an image or sound file smaller than 3 MB.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    let extension = '', mime = '';
    if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { extension = 'png'; mime = 'image/png'; }
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { extension = 'jpg'; mime = 'image/jpeg'; }
    else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') { extension = 'webp'; mime = 'image/webp'; }
    else if (bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 0xe0) === 0xe0)) { extension = 'mp3'; mime = 'audio/mpeg'; }
    else if (bytes.toString('ascii', 0, 4) === 'OggS') { extension = 'ogg'; mime = 'audio/ogg'; }
    if (!extension || file.type !== mime) return NextResponse.json({ error: 'Use a genuine PNG, JPEG, WebP, MP3 or Ogg file. SVG and HTML are not accepted.' }, { status: 400 });
    const zone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const secret = process.env.BUNNY_STORAGE_API_KEY;
    const hostname = process.env.BUNNY_STORAGE_HOSTNAME;
    const cdn = process.env.NEXT_PUBLIC_BUNNY_HOSTNAME;
    if (!zone || !secret || !hostname || !cdn) return NextResponse.json({ error: 'Media storage is not configured. The bundled seasonal images remain available.' }, { status: 503 });
    const key = `images/seasonal/${id}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await fetch(`https://${hostname}/${zone}/${key}`, { method: 'PUT', headers: { AccessKey: secret, 'Content-Type': mime }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(20_000) });
    if (!uploaded.ok) throw new Error('Upload failed');
    const cdnBase = cdn.startsWith('https://') ? cdn : `https://${cdn}`;
    return NextResponse.json({ url: `${cdnBase.replace(/\/$/, '')}/${key}`, bytes: bytes.length, mime });
  } catch { return NextResponse.json({ error: 'Upload failed. Existing media has not been replaced.' }, { status: 503 }); }
}
