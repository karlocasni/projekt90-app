import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Feed from './pages/Feed';
import Lectures from './pages/Lectures';
import Training from './pages/Training';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import Messages from './pages/Messages';
import Challenges from './pages/Challenges';
import LeaderboardPage from './pages/Leaderboard';
import Members from './pages/Members';
import { useAuth } from './contexts/AuthContext';
import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// Payment Gate Component
const Paywall = ({ onUnlock }: { onUnlock: () => void }) => {
  const [redirecting, setRedirecting] = useState(false);

  const handleCheckout = () => {
    setRedirecting(true);
    // TODO: Stripe integration
    setTimeout(() => setRedirecting(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="glass p-10 rounded-[2.5rem] max-w-md border-primary/20">
        <h1 className="text-3xl font-black mb-4">Dovrši svoju pretplatu</h1>
        <p className="text-muted-foreground mb-8">
          Tvoj račun je registriran, ali trebaš aktivnu pretplatu kako bi pristupio zajednici i
          tečajevima.
        </p>
        <button
          onClick={handleCheckout}
          disabled={redirecting}
          className="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(190,242,100,0.3)] mb-4 disabled:opacity-70"
        >
          {redirecting ? 'UČITAVANJE...' : 'PLATI 49€ ZA PRISTUP'}
        </button>
        <button
          onClick={onUnlock}
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          [Dev] Simuliraj uspješno plaćanje
        </button>
      </div>
    </div>
  );
};

// Inner app that has access to location
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isMockActive, setIsMockActive] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isActive = profile?.status === 'active' || isMockActive;

  if (!isActive) {
    return (
      <Routes>
        <Route path="/pay" element={<Paywall onUnlock={() => setIsMockActive(true)} />} />
        <Route path="*" element={<Navigate to="/pay" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      {/* resetKey ensures ErrorBoundary clears on each route change */}
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/lectures" element={<Lectures />} />
          <Route path="/training" element={<Training />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:chatId" element={<Messages />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/members" element={<Members />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
