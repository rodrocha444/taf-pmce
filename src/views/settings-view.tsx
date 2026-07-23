import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Mic, Sun, ArrowLeft, Play, FastForward } from 'lucide-react';
import { useWorkoutStore } from '../store/workout-store';
import { audioEngine } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { ConfirmModal } from '../components/confirm-modal';

export const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const settings = useWorkoutStore(state => state.settings);
  const updateSettings = useWorkoutStore(state => state.updateSettings);
  const resetAllDataToDefaults = useWorkoutStore(state => state.resetAllDataToDefaults);

  const [showResetModal, setShowResetModal] = useState(false);

  const handleConfirmReset = () => {
    resetAllDataToDefaults();
    setShowResetModal(false);
    navigate('/');
  };

  const testBeep = () => {
    audioEngine.playGoBeep();
  };

  const testSpeech = () => {
    speechEngine.speak('Teste de áudio do assistente de treino TAF PMCE.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h1 className="text-xl font-bold text-white font-['Outfit']">Configurações</h1>

        <div className="w-20" />
      </div>

      {/* Settings Options List */}
      <div className="space-y-4">

        {/* Audio & Beeps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sinais Sonoros (Bipes)</h3>
                <p className="text-xs text-zinc-400">Emite bipes na contagem regressiva dos últimos 3 segundos</p>
              </div>
            </div>

            <button
              onClick={() => updateSettings({ soundBeepEnabled: !settings.soundBeepEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundBeepEnabled ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                  settings.soundBeepEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={testBeep}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar Som</span>
            </button>
          </div>
        </div>

        {/* Voice Assistant TTS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Locução por Voz (PT-BR)</h3>
                <p className="text-xs text-zinc-400">Anuncia o nome e dicas do próximo exercício antes de começar</p>
              </div>
            </div>

            <button
              onClick={() => updateSettings({ ttsVoiceEnabled: !settings.ttsVoiceEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.ttsVoiceEnabled ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                  settings.ttsVoiceEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={testSpeech}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar Voz</span>
            </button>
          </div>
        </div>

        {/* Screen Wake Lock */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manter Tela Acesa (Wake Lock)</h3>
              <p className="text-xs text-zinc-400">Evita que o celular apague a tela durante a execução do treino</p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ keepScreenOn: !settings.keepScreenOn })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.keepScreenOn ? 'bg-amber-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                settings.keepScreenOn ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Auto Advance Blocks Toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FastForward className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Avanço Automático de Blocos</h3>
              <p className="text-xs text-zinc-400">
                {settings.autoAdvanceBlocks
                  ? 'Passa automaticamente para o próximo exercício ao término do tempo'
                  : 'Pausa o treino ao final de cada bloco e aguarda o toque para continuar'}
              </p>
            </div>
          </div>

          <button
            onClick={() => updateSettings({ autoAdvanceBlocks: !settings.autoAdvanceBlocks })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.autoAdvanceBlocks ? 'bg-amber-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                settings.autoAdvanceBlocks ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Preparation Countdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold font-mono">
              3s
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Contagem de Preparação</h3>
              <p className="text-xs text-zinc-400">Tempo de preparação antes de iniciar o 1º exercício</p>
            </div>
          </div>

          <select
            value={settings.prepCountdownSeconds}
            onChange={e => updateSettings({ prepCountdownSeconds: parseInt(e.target.value) || 0 })}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold font-mono"
          >
            <option value={0}>Sem Contagem (0s)</option>
            <option value={3}>3 Segundos</option>
            <option value={5}>5 Segundos</option>
            <option value={10}>10 Segundos</option>
          </select>
        </div>

        {/* IndexedDB Database Engine Info & Reset */}
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                SQL
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Banco de Dados Local (IndexedDB / SQLite Engine)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Armazenamento de alta performance estruturado com relação 1 para muitos (Treino → Exercícios Registrados).
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
              ATIVO
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer"
            >
              Resetar Banco & Treinos para o Padrão Inicial
            </button>
          </div>
        </div>

        {/* Offline & PWA Info */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              PWA
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>100% Disponível Offline</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-xs text-zinc-400">
                Todo o treino, cronômetro, áudios e dados funcionam sem nenhuma conexão com a internet.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Confirm Reset DB Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Resetar Banco de Dados para o Padrão"
        description="Esta ação irá restaurar os exercícios registrados da biblioteca e o treino TAF PMCE para o padrão oficial com relação 1 para muitos. Deseja continuar?"
        confirmLabel="Resetar Banco"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
