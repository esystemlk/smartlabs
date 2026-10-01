import { AudioModule, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, type AudioRecorder } from 'expo-audio';
// The functional file API moved to the /legacy entry point in Expo SDK 54+.
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

/**
 * Microphone recorder for speaking tasks. Records AAC/M4A (accepted by Gemini
 * for inline audio) and returns a `data:audio/…;base64,…` URI to POST to
 * /api/score-speaking.
 *
 * Migrated from expo-av (removed in Expo SDK 54+) to expo-audio. Uses the
 * HIGH_QUALITY preset (.m4a / AAC) so we don't hand-maintain platform codecs.
 *
 * Requires the microphone permission and a native build.
 */
const MIME_BY_EXT: Record<string, string> = {
  aac: 'audio/aac',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
};

function mimeForUri(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'audio/mp4';
}

export class SpeechRecorder {
  private recorder: AudioRecorder | null = null;

  /** Ask for mic permission. Returns true if granted. */
  static async requestPermission(): Promise<boolean> {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  }

  async start(): Promise<void> {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recorder.prepareToRecordAsync();
    recorder.record();
    this.recorder = recorder;
  }

  /** Stop and return the file uri + a base64 data URI for upload. */
  async stop(): Promise<{ uri: string; dataUri: string; durationMs: number }> {
    const recorder = this.recorder;
    if (!recorder) throw new Error('No active recording.');
    const durationSec = recorder.currentTime ?? 0;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    const uri = recorder.uri;
    this.recorder = null;
    if (!uri) throw new Error('Recording produced no file.');
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const mime = mimeForUri(uri);
    return {
      uri,
      dataUri: `data:${mime};base64,${base64}`,
      durationMs: Math.round(durationSec * 1000),
    };
  }

  async cancel(): Promise<void> {
    try {
      await this.recorder?.stop();
    } catch {
      /* ignore */
    }
    this.recorder = null;
  }
}
