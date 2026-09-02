import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isPlayer = location.pathname === '/player';
  const isEdit = location.pathname === '/edit';
  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="h-screen h-[100dvh] bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 overflow-hidden relative">
      <Header />
      <main
        ref={mainRef}
        className={`absolute left-0 right-0 ${
          isPlayer
            ? 'top-0 bottom-0 h-full overflow-hidden'
            : isEdit
            ? 'top-0 bottom-0 overflow-y-auto overflow-x-hidden player-safe-container'
            : 'main-content-viewport overflow-y-auto overflow-x-hidden px-safe'
        }`}
      >
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
