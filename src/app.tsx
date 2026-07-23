import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav, Header } from './components/organisms';
import {
  WorkoutsView,
  ExercisesView,
  RunningView,
  PlayerView,
  EditView,
  HistoryView,
  ReportsView,
  SettingsView,
} from './components/pages';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      <Header />
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
          <Route path="/" element={<WorkoutsView />} />
          <Route path="/workouts" element={<WorkoutsView />} />
          <Route path="/exercises" element={<ExercisesView />} />
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
