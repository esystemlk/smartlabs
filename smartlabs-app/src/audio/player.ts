import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { synthesizeSpeech } from '@/api/tts';

/**
 * Plays a listening prompt. If the item has a hosted `audioUrl` we stream it;
 * otherwise we synthesize the text with the backend TTS endpoint (base64 MP3)
 * and play that — mirroring the website's fallback behaviour.
 *
 * Migrated from expo-av (removed in Expo SDK 54+) to expo-audio.
 */
export class PromptPlayer {
  private player: AudioPlayer | null = null;

  async prepare(opts: { audioUrl?: string; text?: string; voice?: string }): Promise<void> {
    await this.unload();
    await setAudioModeAsync({ playsInSilentMode: true });
    const uri = opts.audioUrl && opts.audioUrl.trim()
      ? opts.audioUrl
      : await synthesizeSpeech(opts.text ?? '', opts.voice);
    this.player = createAudioPlayer({ uri });
  }

  async play(): Promise<void> {
    if (!this.player) return;
    try {
      await this.player.seekTo(0);
    } catch {
      /* ignore */
    }
    this.player.play();
  }

  async stop(): Promise<void> {
    try {
      this.player?.pause();
    } catch {
      /* ignore */
    }
  }

  async unload(): Promise<void> {
    try {
      this.player?.remove();
    } catch {
      /* ignore */
    }
    this.player = null;
  }
}
