// Screen Wake Lock API para manter a tela do celular sempre acesa durante a execução do treino

class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isEnabled = true;

  constructor() {
    if (typeof document !== 'undefined') {
      // Quando a aba/app volta a ficar visível após minimizar, reativa o Screen Wake Lock automaticamente
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && this.isEnabled) {
          await this.request();
        }
      });
    }
  }

  async request(): Promise<boolean> {
    if (!this.isEnabled) return false;

    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (this.wakeLock && !this.wakeLock.released) {
          return true;
        }

        this.wakeLock = await navigator.wakeLock.request('screen');

        this.wakeLock.addEventListener('release', () => {
          console.log('Screen Wake Lock liberado pelo sistema');
        });

        console.log('Screen Wake Lock mantido com sucesso!');
        return true;
      } catch (err) {
        console.warn('Falha na solicitação do Screen Wake Lock:', err);
      }
    }
    return false;
  }

  async release(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Screen Wake Lock encerrado');
      } catch (err) {
        console.warn('Falha ao liberar Screen Wake Lock:', err);
      }
    }
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  isActive(): boolean {
    return !!this.wakeLock && !this.wakeLock.released;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.release();
    }
  }
}

export const wakeLockManager = new WakeLockManager();

