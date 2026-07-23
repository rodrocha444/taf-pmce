import type { StateStorage } from 'zustand/middleware';
import { db } from './db';

// Custom IndexedDB storage engine for Zustand store persistence
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const record = await db.activeSessionState.get(name);
      if (record && record.session) {
        return JSON.stringify(record.session);
      }
      // Migration fallback from localStorage to IndexedDB
      const legacyData = localStorage.getItem(name);
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          await db.activeSessionState.put({ id: name, session: parsed });
        } catch {
          // ignore parse error
        }
      }
      return legacyData;
    } catch (err) {
      console.warn('IndexedDB read fallback to localStorage:', err);
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsedData = JSON.parse(value);
      
      // Save full store state into IndexedDB activeSessionState key-value table
      await db.activeSessionState.put({ id: name, session: parsedData });

      // Synchronize structured Dexie IndexedDB tables
      if (parsedData?.state) {
        const { workouts, history, runningWorkouts, runningHistory } = parsedData.state;

        if (Array.isArray(workouts) && workouts.length > 0) {
          await db.workouts.bulkPut(workouts);
        }
        if (Array.isArray(history)) {
          await db.history.clear();
          if (history.length > 0) {
            await db.history.bulkPut(history);
          }
        }
        if (Array.isArray(runningWorkouts) && runningWorkouts.length > 0) {
          await db.runningWorkouts.bulkPut(runningWorkouts);
        }
        if (Array.isArray(runningHistory)) {
          await db.runningHistory.clear();
          if (runningHistory.length > 0) {
            await db.runningHistory.bulkPut(runningHistory);
          }
        }
      }
    } catch (err) {
      console.warn('IndexedDB write fallback to localStorage:', err);
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await db.activeSessionState.delete(name);
      await db.workouts.clear();
      await db.history.clear();
      await db.runningWorkouts.clear();
      await db.runningHistory.clear();
      localStorage.removeItem(name);
    } catch (err) {
      localStorage.removeItem(name);
    }
  }
};
