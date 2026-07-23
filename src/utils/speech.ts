// Web Speech API para narração por voz em PT-BR (Guia de Treino TAF)

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private ptVoice: SpeechSynthesisVoice | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

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
    try {
      const voices = this.synth.getVoices();
      // Prioriza vozes pt-BR de alta qualidade no dispositivo
      this.ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
                     voices.find(v => v.lang.startsWith('pt')) ||
                     null;
    } catch (e) {
      console.warn('Erro ao carregar vozes do navegador:', e);
    }
  }

  // Desbloqueia sintetizador de áudio em navegadores móveis (Safari iOS / Chrome Android) no primeiro clique
  unlock() {
    if (!this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      // Executa micro narração em silêncio para ativar o canal de voz do celular
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      this.synth.speak(silentUtterance);
    } catch (e) {
      // Ignore
    }
  }

  speak(text: string, enabled = true, volume = 1) {
    if (!enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      if (!this.synth) {
        this.synth = window.speechSynthesis;
      }

      if (!this.ptVoice) {
        this.initVoice();
      }

      // Cancela narração anterior para evitar fila ou atraso
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // Velocidade levemente dinâmica para instrução esportiva
      utterance.pitch = 1.0;
      utterance.volume = Math.max(0, Math.min(1, volume));

      if (this.ptVoice) {
        utterance.voice = this.ptVoice;
      }

      // Evita Garbage Collection do Chrome Android no meio da frase
      this.activeUtterance = utterance;
      utterance.onend = () => {
        this.activeUtterance = null;
      };
      utterance.onerror = () => {
        this.activeUtterance = null;
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Erro na síntese de voz:', e);
    }
  }

  cancel() {
    if (this.synth) {
      try {
        this.synth.cancel();
        this.activeUtterance = null;
      } catch (e) {
        // Ignore
      }
    }
  }
}

export const speechEngine = new SpeechEngine();

