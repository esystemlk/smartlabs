const EXT: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a' };
export const MAX_REVIEW_AUDIO_BYTES = 8 * 1024 * 1024;

/** Normalises a recording (raw bytes + MIME, or a data:audio URI) for saving; null when empty, too big or not audio. */
export function reviewAudioFrom(audio: { bytes?: Uint8Array; dataUri?: string; mimeType?: string }): { bytes: Uint8Array; mime: string; ext: string } | null {
  let bytes = audio.bytes;
  let mime = (audio.mimeType || '').split(';')[0].trim().toLowerCase();
  if (!bytes && audio.dataUri?.startsWith('data:audio')) {
    const comma = audio.dataUri.indexOf(',');
    if (comma < 0) return null;
    mime = audio.dataUri.slice(5, comma).split(';')[0].toLowerCase();
    bytes = Buffer.from(audio.dataUri.slice(comma + 1), 'base64');
  }
  if (!bytes || bytes.length < 200 || bytes.length > MAX_REVIEW_AUDIO_BYTES) return null;
  return { bytes, mime: mime || 'audio/webm', ext: EXT[mime] || 'webm' };
}
