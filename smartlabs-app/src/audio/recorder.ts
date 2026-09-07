import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Microphone recorder for speaking tasks. Records in formats Gemini accepts for
 * inline audio (AAC on Android, LinearPCM/WAV on iOS), then returns a
 * `data:audio/…;base64,…` URI to POST to /api/score-speaking.
 *
 * Requires the microphone permission and a native build (Expo Go can't grant
 * mic access reliably) — see the app README.
 */
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.aac',
    outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 96000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 96000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const MIME_BY_EXT: Record<string, string> = {
  aac: 'audio/aac',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
};

function mimeForUri(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'audio/aac';
}

export class SpeechRecorder {
  private recording: Audio.Recording | null = null;

  /** Ask for mic permission. Returns true if granted. */
  static async requestPermission(): Promise<boolean> {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  }

  async start(): Promise<void> {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    this.recording = recording;
  }

  /** Stop and return the file uri + a base64 data URI for upload. */
  async stop(): Promise<{ uri: string; dataUri: string; durationMs: number }> {
    const recording = this.recording;
    if (!recording) throw new Error('No active recording.');
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const status = await recording.getStatusAsync();
    const uri = recording.getURI();
    this.recording = null;
    if (!uri) throw new Error('Recording produced no file.');
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const mime = mimeForUri(uri);
    return {
      uri,
      dataUri: `data:${mime};base64,${base64}`,
      durationMs: status.durationMillis ?? 0,
    };
  }

  async cancel(): Promise<void> {
    try {
      await this.recording?.stopAndUnloadAsync();
    } catch {
      /* ignore */
    }
    this.recording = null;
  }
}
