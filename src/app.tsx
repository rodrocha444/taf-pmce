import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/bottom-nav';
import { HomeView } from './views/home-view';
import { PlayerView } from './views/player-view';
import { EditView } from './views/edit-view';
import { WorkoutsView } from './views/workouts-view';
import { HistoryView } from './views/history-view';
import { SettingsView } from './views/settings-view';
import { RunningView } from './views/running-view';
import { ReportsView } from './views/reports-view';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      <main className="flex-1 pt-safe-top px-safe">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/workouts" element={<WorkoutsView />} />
          <Route path="/running" element={<RunningView />} />
          <Route path="/player" element={<PlayerView />} />
          <Route path="/edit" element={<EditView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
