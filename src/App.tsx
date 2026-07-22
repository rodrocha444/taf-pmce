import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { PlayerView } from './views/PlayerView';
import { EditView } from './views/EditView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isPlayerScreen = location.pathname === '/player';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {!isPlayerScreen && <Header />}
      <main className="flex-1">
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
          <Route path="/player" element={<PlayerView />} />
          <Route path="/edit" element={<EditView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
