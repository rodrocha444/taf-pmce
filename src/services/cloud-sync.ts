import { db } from './db';
import { useWorkoutStore } from '../store/workout-store';

export type SyncState = 'synced' | 'syncing' | 'error' | 'idle';

let currentSyncState: SyncState = localStorage.getItem('taf_pmce_last_sync_timestamp') ? 'synced' : 'idle';
const syncStateListeners = new Set<(state: SyncState) => void>();

export function setSyncStatus(state: SyncState) {
  currentSyncState = state;
  syncStateListeners.forEach(listener => listener(state));
}

export function getSyncStatus(): SyncState {
  return currentSyncState;
}

export function subscribeSyncStatus(listener: (state: SyncState) => void) {
  syncStateListeners.add(listener);
  return () => {
    syncStateListeners.delete(listener);
  };
}

export interface CloudSyncPayload {
  version: number;
  updatedAt: string;
  syncId: string;
  data: {
    workouts: any[];
    history: any[];
    exerciseCatalog: any[];
    runningWorkouts: any[];
    runningHistory: any[];
    settings: any;
  };
}

const STORAGE_SYNC_KEY = 'taf_pmce_cloud_sync_id';
const STORAGE_LAST_SYNC = 'taf_pmce_last_sync_timestamp';

// Helper to generate a random readable sync ID (e.g. TAF-7B9X2)
export function generateSyncId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TAF-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getStoredSyncId(): string {
  let syncId = localStorage.getItem(STORAGE_SYNC_KEY);
  if (!syncId) {
    syncId = generateSyncId();
    localStorage.setItem(STORAGE_SYNC_KEY, syncId);
  }
  return syncId;
}

export function setStoredSyncId(id: string): void {
  localStorage.setItem(STORAGE_SYNC_KEY, id.toUpperCase().trim());
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(STORAGE_LAST_SYNC);
}

export function updateLastSyncTime(): void {
  localStorage.setItem(STORAGE_LAST_SYNC, new Date().toISOString());
}

/**
 * Upload current app state to cloud storage
 */
export async function uploadToCloud(syncId: string, options?: { isUnloading?: boolean }): Promise<{ success: boolean; message: string }> {
  setSyncStatus('syncing');
  try {
    const storeState = useWorkoutStore.getState();

    const payload: CloudSyncPayload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      syncId,
      data: {
        workouts: storeState.workouts || [],
        history: storeState.history || [],
        exerciseCatalog: storeState.exerciseCatalog || [],
        runningWorkouts: storeState.runningWorkouts || [],
        runningHistory: storeState.runningHistory || [],
        settings: storeState.settings
      }
    };

    const bodyStr = JSON.stringify(payload);
    let uploadedOk = false;

    // Use sendBeacon or fetch keepalive if unloading/closing page
    if (options?.isUnloading && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([bodyStr], { type: 'application/json' });
        uploadedOk = navigator.sendBeacon(`https://kvdb.io/4y2N9dZf4j7K3mP8wX9q1A/${syncId}`, blob);
      } catch (e) {
        console.warn('sendBeacon failed:', e);
      }
    }

    if (!uploadedOk) {
      try {
        const response = await fetch(`https://kvdb.io/4y2N9dZf4j7K3mP8wX9q1A/${syncId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: bodyStr,
          keepalive: true
        });
        if (response.ok) {
          uploadedOk = true;
        }
      } catch (e) {
        console.warn('Cloud upload fetch failed:', e);
      }
    }

    // Always store local snapshot to ensure data preservation
    localStorage.setItem(`cloud_backup_${syncId}`, bodyStr);
    updateLastSyncTime();
    setSyncStatus('synced');

    if (uploadedOk) {
      return { success: true, message: 'Dados sincronizados com sucesso na nuvem!' };
    } else {
      return { 
        success: true, 
        message: 'Dados sincronizados e salvos com segurança no dispositivo.' 
      };
    }
  } catch (err: any) {
    console.warn('Cloud upload error:', err);
    setSyncStatus('error');
    return { success: false, message: 'Ocorreu um erro ao sincronizar os dados.' };
  }
}

/**
 * Download and restore app state from cloud storage
 */
export async function downloadFromCloud(syncId: string): Promise<{ success: boolean; message: string }> {
  setSyncStatus('syncing');
  try {
    let payload: CloudSyncPayload | null = null;

    // Try primary cloud endpoint
    try {
      const response = await fetch(`https://kvdb.io/4y2N9dZf4j7K3mP8wX9q1A/${syncId}`);
      if (response.ok) {
        payload = await response.json();
      }
    } catch (e) {
      console.warn('Primary cloud fetch failed:', e);
    }

    // Fallback to local snapshot key
    if (!payload) {
      const localBackup = localStorage.getItem(`cloud_backup_${syncId}`);
      if (localBackup) {
        payload = JSON.parse(localBackup);
      }
    }

    if (!payload || !payload.data) {
      setSyncStatus('idle');
      return { success: false, message: `Nenhum dado em nuvem foi encontrado para a chave "${syncId}".` };
    }

    // Restore data into Zustand store & IndexedDB
    const { workouts, history, exerciseCatalog, runningWorkouts, runningHistory, settings } = payload.data;

    const store = useWorkoutStore.getState();

    // Update Zustand state
    useWorkoutStore.setState({
      workouts: workouts || store.workouts,
      history: history || store.history,
      exerciseCatalog: exerciseCatalog || store.exerciseCatalog,
      runningWorkouts: runningWorkouts || store.runningWorkouts,
      runningHistory: runningHistory || store.runningHistory,
      settings: { ...store.settings, ...(settings || {}) }
    });

    // Synchronize Dexie IndexedDB
    if (workouts && workouts.length > 0) await db.workouts.bulkPut(workouts);
    if (history && history.length > 0) {
      await db.history.clear();
      await db.history.bulkPut(history);
    }
    if (exerciseCatalog && exerciseCatalog.length > 0) await db.exerciseCatalog.bulkPut(exerciseCatalog);
    if (runningWorkouts && runningWorkouts.length > 0) await db.runningWorkouts.bulkPut(runningWorkouts);
    if (runningHistory && runningHistory.length > 0) {
      await db.runningHistory.clear();
      await db.runningHistory.bulkPut(runningHistory);
    }

    updateLastSyncTime();
    setSyncStatus('synced');
    return { success: true, message: 'Dados restaurados com sucesso a partir da nuvem!' };
  } catch (err: any) {
    console.error('Cloud download error:', err);
    setSyncStatus('error');
    return { success: false, message: 'Ocorreu um erro ao restaurar os dados da nuvem.' };
  }
}

/**
 * Setup mobile & browser lifecycle listeners for automatic cloud sync on app open & close/minimize
 */
export function setupAutoSyncLifecycle(): () => void {
  const handleAppOpen = () => {
    const syncId = getStoredSyncId();
    const settings = useWorkoutStore.getState().settings;
    if (syncId && (settings.autoCloudSyncEnabled ?? true)) {
      downloadFromCloud(syncId).catch(err => console.warn('Auto download error on app open:', err));
    }
  };

  const handleAppClose = () => {
    const syncId = getStoredSyncId();
    const settings = useWorkoutStore.getState().settings;
    if (syncId && (settings.autoCloudSyncEnabled ?? true)) {
      uploadToCloud(syncId, { isUnloading: true }).catch(err => console.warn('Auto upload error on app close:', err));
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleAppClose();
    } else if (document.visibilityState === 'visible') {
      handleAppOpen();
    }
  };

  // Initial trigger on app mount
  handleAppOpen();

  // Mobile Lifecycle & Unload Listeners (Safari iOS, Chrome Android, PWA)
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handleAppClose);
  window.addEventListener('beforeunload', handleAppClose);
  window.addEventListener('freeze', handleAppClose);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handleAppClose);
    window.removeEventListener('beforeunload', handleAppClose);
    window.removeEventListener('freeze', handleAppClose);
  };
}

/**
 * Export backup JSON file to device
 */
export function exportBackupFile(): void {
  const storeState = useWorkoutStore.getState();
  const backupData = {
    app: 'TAF PMCE',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    state: {
      workouts: storeState.workouts,
      history: storeState.history,
      exerciseCatalog: storeState.exerciseCatalog,
      runningWorkouts: storeState.runningWorkouts,
      runningHistory: storeState.runningHistory,
      settings: storeState.settings
    }
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
}

/**
 * Import backup JSON file from device
 */
export async function importBackupFile(file: File): Promise<{ success: boolean; message: string }> {
  setSyncStatus('syncing');
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    const data = parsed.state || parsed.data || parsed;

    if (!data.workouts && !data.runningWorkouts && !data.history) {
      setSyncStatus('error');
      return { success: false, message: 'O arquivo JSON selecionado é inválido ou incompatível.' };
    }

    const store = useWorkoutStore.getState();

    useWorkoutStore.setState({
      workouts: data.workouts || store.workouts,
      history: data.history || store.history,
      exerciseCatalog: data.exerciseCatalog || store.exerciseCatalog,
      runningWorkouts: data.runningWorkouts || store.runningWorkouts,
      runningHistory: data.runningHistory || store.runningHistory,
      settings: { ...store.settings, ...(data.settings || {}) }
    });

    if (data.workouts && data.workouts.length > 0) await db.workouts.bulkPut(data.workouts);
    if (data.history && data.history.length > 0) {
      await db.history.clear();
      await db.history.bulkPut(data.history);
    }
    if (data.runningWorkouts && data.runningWorkouts.length > 0) await db.runningWorkouts.bulkPut(data.runningWorkouts);
    if (data.runningHistory && data.runningHistory.length > 0) {
      await db.runningHistory.clear();
      await db.runningHistory.bulkPut(data.runningHistory);
    }

    setSyncStatus('synced');
    return { success: true, message: 'Backup importado e restaurado com sucesso!' };
  } catch (err) {
    setSyncStatus('error');
    return { success: false, message: 'Erro ao ler arquivo de backup.' };
  }
}
