import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2, Mic, Sun, Play, FastForward,
  Download, Upload, Database
} from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import { useQueryClient } from '@tanstack/react-query';
import { audioEngine } from '../../utils/audio';
import { speechEngine } from '../../utils/speech';
import { ConfirmModal } from '../molecules';
import { useWorkouts, useHistory, useExerciseCatalog, useRunningWorkouts, useRunningHistory, WORKOUTS_KEY, HISTORY_KEY, CATALOG_KEY, RUNNING_WORKOUTS_KEY, RUNNING_HISTORY_KEY } from '../../hooks';

export const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const settings = useWorkoutStore(state => state.settings);
  const updateSettings = useWorkoutStore(state => state.updateSettings);

  const { data: workouts = [] } = useWorkouts();
  const { data: history = [] } = useHistory();
  const { data: exerciseCatalog = [] } = useExerciseCatalog();
  const { data: runningWorkouts = [] } = useRunningWorkouts();
  const { data: runningHistory = [] } = useRunningHistory();

  const [showResetModal, setShowResetModal] = useState(false);

  const handleConfirmReset = () => {
    // Limpa o cache local — na próxima query, buscará do Turso vazio
    qc.setQueryData(WORKOUTS_KEY, []);
    qc.setQueryData(HISTORY_KEY, []);
    qc.setQueryData(CATALOG_KEY, []);
    qc.setQueryData(RUNNING_WORKOUTS_KEY, []);
    qc.setQueryData(RUNNING_HISTORY_KEY, []);
    setShowResetModal(false);
    navigate('/');
  };

  const testBeep = () => {
    audioEngine.playGoBeep();
  };

  const testSpeech = () => {
    speechEngine.speak('Teste de áudio do assistente de treino TAF PMCE.');
  };

  // ── Backup JSON Export ────────────────────────────────────────────────────
  const handleExportFile = () => {
    const backupData = {
      app: 'TAF PMCE',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      state: { workouts, history, exerciseCatalog, runningWorkouts, runningHistory }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-taf-pmce-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.state || parsed.data || parsed;
      if (!data.workouts && !data.runningWorkouts && !data.history) {
        setImportMessage('Arquivo inválido ou incompatível.');
        return;
      }
      // Hydrate cache — as próximas mutations persistirão no Turso
      if (data.workouts) qc.setQueryData(WORKOUTS_KEY, data.workouts);
      if (data.history) qc.setQueryData(HISTORY_KEY, data.history);
      if (data.exerciseCatalog) qc.setQueryData(CATALOG_KEY, data.exerciseCatalog);
      if (data.runningWorkouts) qc.setQueryData(RUNNING_WORKOUTS_KEY, data.runningWorkouts);
      if (data.runningHistory) qc.setQueryData(RUNNING_HISTORY_KEY, data.runningHistory);
      setImportMessage('Backup importado com sucesso! Os dados estão no cache — edite qualquer item para persistir no Turso.');
    } catch {
      setImportMessage('Erro ao ler arquivo de backup.');
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <h1 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">Configurações do Aplicativo</h1>
      </div>

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

        {/* Backup JSON (Export / Import) */}
        <div className="bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-900 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Backup de Dados</h3>
              <p className="text-xs text-zinc-400">Exporte ou importe um backup JSON com todos os seus treinos e histórico.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportFile}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importar JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {importMessage && (
            <div className="p-3 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {importMessage}
            </div>
          )}
        </div>

        {/* Turso Database Info & Reset */}
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Banco de Dados em Nuvem (Turso LibSQL + Drizzle ORM)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Todos os dados são persistidos e sincronizados com Turso SQLite via Drizzle ORM.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono shrink-0">
              ATIVO
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer"
            >
              Limpar Cache Local
            </button>
          </div>
        </div>

        {/* PWA Info */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 shrink-0">
            PWA
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Instalável como App</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-zinc-400">
              O cronômetro, áudios e interface funcionam sem internet. Dados são sincronizados com Turso quando online.
            </p>
          </div>
        </div>

      </div>

      {/* Confirm Reset Cache Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Limpar Cache Local?"
        description="Isso irá remover os dados em memória. Na próxima vez que abrir cada tela, os dados serão recarregados do Turso."
        confirmLabel="Limpar Cache"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
