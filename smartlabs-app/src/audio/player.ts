import { Audio } from 'expo-av';
import { synthesizeSpeech } from '@/api/tts';

/**
 * Plays a listening prompt. If the item has a hosted `audioUrl` we stream it;
 * otherwise we synthesize the text with the backend TTS endpoint (base64 MP3)
 * and play that — mirroring the website's fallback behaviour.
 */
export class PromptPlayer {
  private sound: Audio.Sound | null = null;

  async prepare(opts: { audioUrl?: string; text?: string; voice?: string }): Promise<void> {
    await this.unload();
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const uri = opts.audioUrl && opts.audioUrl.trim()
      ? opts.audioUrl
      : await synthesizeSpeech(opts.text ?? '', opts.voice);
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    this.sound = sound;
  }

  async play(): Promise<void> {
    if (!this.sound) return;
    await this.sound.replayAsync();
  }

  async stop(): Promise<void> {
    try {
      await this.sound?.stopAsync();
    } catch {
      /* ignore */
    }
  }

  async unload(): Promise<void> {
    try {
      await this.sound?.unloadAsync();
    } catch {
      /* ignore */
    }
    this.sound = null;
  }
}
