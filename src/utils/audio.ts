// Web Audio API Sound Synthesizer

class AudioEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playBeep(frequency = 880, duration = 0.15, volume = 0.3) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  playCountdownTick() {
    this.playBeep(700, 0.12, 0.4);
  }

  playGoBeep() {
    this.playBeep(1400, 0.4, 0.6);
  }

  playCompletionFanfare() {
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        setTimeout(() => {
          this.playBeep(freq, 0.3, 0.5);
        }, index * 180);
      });
    } catch (e) {
      console.warn('Fanfare failed:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
