// Web Speech API for PT-BR Voice Prompts

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private ptVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize pt-BR voices
    this.ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
                   voices.find(v => v.lang.startsWith('pt')) ||
                   null;
  }

  speak(text: string, enabled = true) {
    if (!enabled || !this.synth) return;

    try {
      // Cancel previous utterances to avoid queue backlog
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      if (this.ptVoice) {
        utterance.voice = this.ptVoice;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechEngine = new SpeechEngine();
