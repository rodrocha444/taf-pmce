import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { BottomNav, Header } from './components/organisms';
import { AlertTriangle } from 'lucide-react';
import { isTursoConfigured } from './db';
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
        {!isTursoConfigured && (
          <div className="max-w-4xl mx-auto px-4 pt-2 pb-1">
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 shadow-lg shadow-rose-950/40">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-white">Banco de Dados Não Configurado</p>
                <p className="text-zinc-300">
                  Defina <code className="bg-zinc-900 px-1 py-0.5 rounded text-rose-300 font-mono">VITE_TURSO_DATABASE_URL</code> e <code className="bg-zinc-900 px-1 py-0.5 rounded text-rose-300 font-mono">VITE_TURSO_AUTH_TOKEN</code> no <code className="bg-zinc-900 px-1 py-0.5 rounded text-amber-300 font-mono">.env</code> para persistir seus dados.
                </p>
              </div>
            </div>
          </div>
        )}
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
