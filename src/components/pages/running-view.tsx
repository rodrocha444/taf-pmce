import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Award, 
  Gauge,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Flag
} from 'lucide-react';
import { useWorkoutStore } from '../../store/workout-store';
import type { RunningTargetMode, RunningLapDetail } from '../../types';
import { formatPace, formatSecondsToMMSS, formatDate, calculatePaceSecPerKm, calculateSpeedKmH } from '../../utils/formatters';

interface ManualLapItem {
  mins: string;
  secs: string;
  meters: string;
}

export const RunningView: React.FC = () => {
  const runningWorkouts = useWorkoutStore(state => state.runningWorkouts || []);
  const runningHistory = useWorkoutStore(state => state.runningHistory || []);
  const addRunningWorkout = useWorkoutStore(state => state.addRunningWorkout);
  const deleteRunningWorkout = useWorkoutStore(state => state.deleteRunningWorkout);
  const addRunningLog = useWorkoutStore(state => state.addRunningLog);
  const deleteRunningLog = useWorkoutStore(state => state.deleteRunningLog);
  const clearRunningHistory = useWorkoutStore(state => state.clearRunningHistory);

  const [activeTab, setActiveTab] = useState<'workouts' | 'history' | 'calculator'>('workouts');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Create Workout Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [targetMode, setTargetMode] = useState<RunningTargetMode>('distance');
  const [targetDistanceKm, setTargetDistanceKm] = useState('2.4');
  const [targetMins, setTargetMins] = useState('12');
  const [targetSecs, setTargetSecs] = useState('0');
  
  // Interval specific fields
  const [lapsCountInput, setLapsCountInput] = useState('6');
  const [lapDistMetersInput, setLapDistMetersInput] = useState('400');
  const [lapTargetMins, setLapTargetMins] = useState('2');
  const [lapTargetSecs, setLapTargetSecs] = useState('0');
  const [restBetweenLapsSecsInput, setRestBetweenLapsSecsInput] = useState('60');

  const [workoutNotes, setWorkoutNotes] = useState('');

  // Register Log Modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTitle, setLogTitle] = useState('Corrida TAF PMCE (2.400m)');
  const [logDistanceKm, setLogDistanceKm] = useState('2.4');
  const [logMins, setLogMins] = useState('11');
  const [logSecs, setLogSecs] = useState('45');
  const [logNotes, setLogNotes] = useState('');

  // Manual Laps state for Register Log Modal
  const [includeLaps, setIncludeLaps] = useState(false);
  const [manualLaps, setManualLaps] = useState<ManualLapItem[]>([
    { mins: '2', secs: '00', meters: '400' },
    { mins: '2', secs: '00', meters: '400' }
  ]);

  // Interactive Calculator state
  const [calcDistKm, setCalcDistKm] = useState('2.4');
  const [calcMins, setCalcMins] = useState('12');
  const [calcSecs, setCalcSecs] = useState('0');

  // Handle Add Manual Lap Item
  const handleAddManualLapItem = () => {
    const lastMeters = manualLaps.length > 0 ? manualLaps[manualLaps.length - 1].meters : '400';
    setManualLaps(prev => [...prev, { mins: '2', secs: '00', meters: lastMeters }]);
  };

  // Handle Remove Manual Lap Item
  const handleRemoveManualLapItem = (index: number) => {
    setManualLaps(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Update Manual Lap Item
  const handleUpdateManualLapItem = (index: number, field: keyof ManualLapItem, value: string) => {
    setManualLaps(prev => prev.map((lap, i) => i === index ? { ...lap, [field]: value } : lap));
  };

  // Handle create new running workout
  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle.trim()) return;

    if (targetMode === 'interval') {
      const laps = parseInt(lapsCountInput) || 6;
      const lapMeters = parseInt(lapDistMetersInput) || 400;
      const lapTargetSecsVal = (parseInt(lapTargetMins) || 0) * 60 + (parseInt(lapTargetSecs) || 0);
      const restSecsVal = parseInt(restBetweenLapsSecsInput) || 60;
      const totalKm = (laps * lapMeters) / 1000;
      const totalSecsVal = (lapTargetSecsVal * laps) + (restSecsVal * Math.max(0, laps - 1));

      addRunningWorkout({
        title: workoutTitle.trim(),
        targetMode: 'interval',
        targetDistanceKm: Number(totalKm.toFixed(2)),
        targetDurationSeconds: totalSecsVal,
        targetPaceSecPerKm: Math.round(totalSecsVal / totalKm),
        lapsCount: laps,
        lapDistanceMeters: lapMeters,
        lapTargetSeconds: lapTargetSecsVal,
        restBetweenLapsSeconds: restSecsVal,
        notes: workoutNotes.trim() || `${laps} tiros de ${lapMeters}m com ${restSecsVal}s de descanso`
      });
    } else {
      const distKm = parseFloat(targetDistanceKm) || 2.4;
      const durSecs = (parseInt(targetMins) || 0) * 60 + (parseInt(targetSecs) || 0);

      addRunningWorkout({
        title: workoutTitle.trim(),
        targetMode,
        targetDistanceKm: distKm,
        targetDurationSeconds: durSecs > 0 ? durSecs : undefined,
        targetPaceSecPerKm: durSecs > 0 && distKm > 0 ? Math.round(durSecs / distKm) : undefined,
        notes: workoutNotes.trim()
      });
    }

    setShowCreateModal(false);
    setWorkoutTitle('');
    setWorkoutNotes('');
  };

  // Handle register log entry
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDistKm = parseFloat(logDistanceKm) || 2.4;
    let finalDurSecs = (parseInt(logMins) || 0) * 60 + (parseInt(logSecs) || 0);
    let lapDetails: RunningLapDetail[] | undefined = undefined;

    if (includeLaps && manualLaps.length > 0) {
      let accumMeters = 0;
      let accumSecs = 0;

      lapDetails = manualLaps.map((lap, idx) => {
        const lapMeters = parseInt(lap.meters) || 400;
        const lapSecsVal = (parseInt(lap.mins) || 0) * 60 + (parseInt(lap.secs) || 0);
        const lapDistKm = lapMeters / 1000;
        const paceSecs = calculatePaceSecPerKm(lapDistKm, lapSecsVal);

        accumMeters += lapMeters;
        accumSecs += lapSecsVal;

        return {
          lapNumber: idx + 1,
          durationSeconds: lapSecsVal,
          distanceMeters: lapMeters,
          paceSecPerKm: paceSecs
        };
      });

      if (accumMeters > 0) {
        finalDistKm = Number((accumMeters / 1000).toFixed(2));
      }
      if (accumSecs > 0) {
        finalDurSecs = accumSecs;
      }
    }

    if (finalDistKm <= 0 || finalDurSecs <= 0) return;

    addRunningLog({
      workoutTitle: logTitle.trim() || 'Corrida TAF',
      date: new Date().toISOString(),
      distanceKm: finalDistKm,
      durationSeconds: finalDurSecs,
      laps: lapDetails,
      notes: logNotes.trim()
    });

    setShowLogModal(false);
    setLogNotes('');
    setActiveTab('history');
  };

  // Calculated values for interactive calculator
  const calcDistNum = parseFloat(calcDistKm) || 0;
  const calcTotalSecs = (parseInt(calcMins) || 0) * 60 + (parseInt(calcSecs) || 0);
  const calcPaceSecs = calculatePaceSecPerKm(calcDistNum, calcTotalSecs);
  const calcSpeed = calculateSpeedKmH(calcDistNum, calcTotalSecs);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 pb-28">
      {/* Top Action & Tab Selectors */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-3 gap-1 p-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'workouts'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Histórico ({runningHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Pace</span>
          </button>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Registrar Corrida"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Registrar</span>
        </button>
      </div>

      {/* TAB 1: TREINOS & METAS */}
      {activeTab === 'workouts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Metas e Planos de Corrida
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Nova Meta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {runningWorkouts.map(w => {
              const paceSecs = w.targetPaceSecPerKm || (w.targetDurationSeconds && w.targetDistanceKm ? Math.round(w.targetDurationSeconds / w.targetDistanceKm) : 0);

              return (
                <div
                  key={w.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                          {w.targetMode === 'interval' ? 'Intervalado / Voltas' : w.targetMode === 'distance' ? 'Por Distância' : w.targetMode === 'time' ? 'Por Tempo' : 'Por Pace'}
                        </span>
                        {w.isDefault && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            Oficial TAF
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5 font-['Outfit']">{w.title}</h3>
                    </div>

                    {!w.isDefault && (
                      <button
                        onClick={() => deleteRunningWorkout(w.id)}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Interval Details Badge if interval mode */}
                  {w.targetMode === 'interval' && w.lapsCount && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-xs text-amber-300 font-medium flex items-center justify-between">
                      <span>🎯 {w.lapsCount} tiros de {w.lapDistanceMeters || 400}m</span>
                      <span>Rest: {w.restBetweenLapsSeconds || 60}s</span>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 rounded-xl p-2.5 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-sans block">Distância</span>
                      <strong className="text-sm font-bold text-white">
                        {w.targetDistanceKm ? `${w.targetDistanceKm} km` : '--'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 font-sans block">Tempo Alvo</span>
                      <strong className="text-sm font-bold text-amber-400">
                        {w.targetDurationSeconds ? formatSecondsToMMSS(w.targetDurationSeconds) : '--'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 font-sans block">Pace Meta</span>
                      <strong className="text-sm font-bold text-cyan-400">
                        {formatPace(paceSecs)}
                      </strong>
                    </div>
                  </div>

                  {w.notes && (
                    <p className="text-xs text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                      ⚡ {w.notes}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setLogTitle(w.title);
                      setLogDistanceKm(w.targetDistanceKm ? String(w.targetDistanceKm) : '2.4');
                      if (w.targetDurationSeconds) {
                        setLogMins(String(Math.floor(w.targetDurationSeconds / 60)));
                        setLogSecs(String(w.targetDurationSeconds % 60));
                      }
                      if (w.targetMode === 'interval' && w.lapsCount) {
                        setIncludeLaps(true);
                        const initialLaps: ManualLapItem[] = [];
                        const lapM = String(w.lapDistanceMeters || 400);
                        const targetSecsVal = w.lapTargetSeconds || 120;
                        const minsStr = String(Math.floor(targetSecsVal / 60));
                        const secsStr = String(targetSecsVal % 60).padStart(2, '0');

                        for (let i = 0; i < w.lapsCount; i++) {
                          initialLaps.push({ mins: minsStr, secs: secsStr, meters: lapM });
                        }
                        setManualLaps(initialLaps);
                      }
                      setShowLogModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Registrar Resultado</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE CORRIDAS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Histórico de Execuções ({runningHistory.length})
            </h2>
            {runningHistory.length > 0 && (
              <button
                onClick={clearRunningHistory}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Limpar Histórico
              </button>
            )}
          </div>

          {runningHistory.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhum Registro de Corrida</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Registre suas corridas ou tiros de pista para acompanhar a evolução do seu Pace e velocidade em km/h.
              </p>
              <button
                onClick={() => setShowLogModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primeira Corrida</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {runningHistory.map(log => {
                const isExpanded = expandedLogId === log.id;
                const hasLaps = log.laps && log.laps.length > 0;

                return (
                  <div
                    key={log.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-['Outfit'] truncate">
                            {log.workoutTitle}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatDate(log.date)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                          <span className="text-amber-400 font-bold">
                            📍 {log.distanceKm} km
                          </span>
                          <span className="text-zinc-300">
                            ⏱ {formatSecondsToMMSS(log.durationSeconds)}
                          </span>
                          <span className="text-cyan-400 font-bold">
                            ⚡ {formatPace(log.paceSecPerKm)}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            🚀 {log.speedKmH} km/h
                          </span>
                        </div>

                        {log.notes && (
                          <p className="text-[11px] text-zinc-400 pt-0.5 truncate">{log.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {hasLaps && (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 text-amber-400 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-mono font-bold"
                            title="Ver detalhamento por voltas"
                          >
                            <span>{log.laps?.length} voltas</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        <button
                          onClick={() => deleteRunningLog(log.id)}
                          className="p-2 text-zinc-600 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Laps Details */}
                    {isExpanded && hasLaps && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-1 font-mono text-[11px]">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                          Detalhamento de Voltas / Tiros Gravados
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {log.laps?.map(lap => (
                            <div
                              key={lap.lapNumber}
                              className="bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 flex items-center justify-between"
                            >
                              <span className="text-amber-400 font-bold">Volta #{lap.lapNumber} ({lap.distanceMeters}m)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-200">{formatSecondsToMMSS(lap.durationSeconds)}</span>
                                <span className="text-cyan-400 font-bold">{formatPace(lap.paceSecPerKm)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALCULADORA DE PACE */}
      {activeTab === 'calculator' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-5">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Calculadora Interativa de Pace</h2>
              <p className="text-xs text-zinc-400">Insira a distância e o tempo estimado para calcular o ritmo exato por km</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Distância */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Distância Percorrida (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={calcDistKm}
                onChange={e => setCalcDistKm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                placeholder="ex: 2.4"
              />
            </div>

            {/* Input Tempo (Minutos e Segundos) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tempo Gasto (Minutos : Segundos)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={calcMins}
                  onChange={e => setCalcMins(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                  placeholder="Min"
                />
                <span className="text-zinc-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={calcSecs}
                  onChange={e => setCalcSecs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                  placeholder="Seg"
                />
              </div>
            </div>
          </div>

          {/* Result Highlight Box */}
          <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Ritmo (Pace Médio)</span>
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                {formatPace(calcPaceSecs)}
              </span>
            </div>

            <div className="space-y-1 border-l border-zinc-800 pl-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Velocidade Média</span>
              <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
                {calcSpeed} <span className="text-sm font-normal text-zinc-400">km/h</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA META DE CORRIDA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveWorkout}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">Criar Nova Meta de Corrida</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Título da Meta / Treino</label>
              <input
                type="text"
                required
                value={workoutTitle}
                onChange={e => setWorkoutTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                placeholder="ex: Treino Intervalado 6x400m"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tipo de Treino</label>
              <select
                value={targetMode}
                onChange={e => setTargetMode(e.target.value as RunningTargetMode)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold focus:outline-none"
              >
                <option value="interval">⏱️ Por Intervalos / Voltas (Tiros de Pista)</option>
                <option value="distance">📍 Por Distância Alvo (km)</option>
                <option value="time">⌛ Por Tempo Limite (minutos)</option>
                <option value="pace">⚡ Por Pace Alvo (min/km)</option>
              </select>
            </div>

            {targetMode === 'interval' ? (
              <div className="space-y-3 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400">Nº de Voltas / Tiros</label>
                    <input
                      type="number"
                      min="1"
                      value={lapsCountInput}
                      onChange={e => setLapsCountInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-mono font-bold"
                      placeholder="6"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400">Metros por Volta</label>
                    <select
                      value={lapDistMetersInput}
                      onChange={e => setLapDistMetersInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono font-bold"
                    >
                      <option value="100">100m</option>
                      <option value="200">200m</option>
                      <option value="400">400m</option>
                      <option value="800">800m</option>
                      <option value="1000">1.000m</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400">Tempo Alvo por Volta</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={lapTargetMins}
                        onChange={e => setLapTargetMins(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono font-bold"
                        placeholder="2"
                      />
                      <span className="text-zinc-500 font-bold">:</span>
                      <input
                        type="number"
                        value={lapTargetSecs}
                        onChange={e => setLapTargetSecs(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono font-bold"
                        placeholder="00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-400">Descanso entre Voltas (s)</label>
                    <input
                      type="number"
                      value={restBetweenLapsSecsInput}
                      onChange={e => setRestBetweenLapsSecsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400 text-xs font-mono font-bold"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Distância (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetDistanceKm}
                    onChange={e => setTargetDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="2.4"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Tempo Alvo (Min : Seg)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={targetMins}
                      onChange={e => setTargetMins(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                      placeholder="12"
                    />
                    <span className="text-zinc-500 font-bold">:</span>
                    <input
                      type="number"
                      value={targetSecs}
                      onChange={e => setTargetSecs(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                      placeholder="00"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Observações / Estratégia</label>
              <textarea
                rows={2}
                value={workoutNotes}
                onChange={e => setWorkoutNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none"
                placeholder="ex: Tentar manter ritmo constante em todas as voltas"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              >
                Salvar Meta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REGISTRAR RESULTADO DE CORRIDA (COM ADIÇÃO DE VOLTAS MANUAIS) */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveLog}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">Registrar Treino de Corrida</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Nome do Treino</label>
              <input
                type="text"
                required
                value={logTitle}
                onChange={e => setLogTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                placeholder="ex: Corrida TAF PMCE 2.400m"
              />
            </div>

            {/* Toggle Manual Laps */}
            <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Adicionar detalhamento por voltas</span>
              </div>

              <button
                type="button"
                onClick={() => setIncludeLaps(!includeLaps)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  includeLaps ? 'bg-amber-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                    includeLaps ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Manual Laps Inputs List */}
            {includeLaps ? (
              <div className="space-y-2 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Voltas / Tiros Manuais ({manualLaps.length})</span>
                  <button
                    type="button"
                    onClick={handleAddManualLapItem}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Volta</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {manualLaps.map((lap, idx) => (
                    <div key={idx} className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-amber-400 shrink-0">#{idx + 1}</span>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={lap.meters}
                          onChange={e => handleUpdateManualLapItem(idx, 'meters', e.target.value)}
                          className="w-16 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold text-center"
                          placeholder="400"
                        />
                        <span className="text-[10px] text-zinc-500">m</span>

                        <input
                          type="number"
                          value={lap.mins}
                          onChange={e => handleUpdateManualLapItem(idx, 'mins', e.target.value)}
                          className="w-12 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold text-center"
                          placeholder="2"
                        />
                        <span className="text-zinc-500 font-bold">:</span>
                        <input
                          type="number"
                          value={lap.secs}
                          onChange={e => handleUpdateManualLapItem(idx, 'secs', e.target.value)}
                          className="w-12 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold text-center"
                          placeholder="00"
                        />
                      </div>

                      {manualLaps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualLapItem(idx)}
                          className="p-1 text-zinc-600 hover:text-rose-400 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Distância Percorrida (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={logDistanceKm}
                    onChange={e => setLogDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                    placeholder="2.4"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400">Tempo Gasto (Min : Seg)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      required
                      value={logMins}
                      onChange={e => setLogMins(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                      placeholder="11"
                    />
                    <span className="text-zinc-500 font-bold">:</span>
                    <input
                      type="number"
                      required
                      value={logSecs}
                      onChange={e => setLogSecs(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold"
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Realtime calculated Pace preview */}
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Pace Médio Calculado:</span>
              <span className="text-amber-400 font-bold">
                {includeLaps && manualLaps.length > 0 ? (
                  formatPace(calculatePaceSecPerKm(
                    manualLaps.reduce((acc, l) => acc + (parseInt(l.meters) || 0), 0) / 1000,
                    manualLaps.reduce((acc, l) => acc + (parseInt(l.mins) || 0) * 60 + (parseInt(l.secs) || 0), 0)
                  ))
                ) : (
                  formatPace(calculatePaceSecPerKm(parseFloat(logDistanceKm) || 0, (parseInt(logMins) || 0) * 60 + (parseInt(logSecs) || 0)))
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Sensação / Notas da Corrida</label>
              <textarea
                rows={2}
                value={logNotes}
                onChange={e => setLogNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none"
                placeholder="ex: Corrida forte, ritmo mantido abaixo de 5:00/km no final"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              >
                Salvar no Histórico
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
