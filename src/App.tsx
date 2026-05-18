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
import { UploadProvider } from './contexts/UploadContext';
import UploadToast from './components/ui/UploadToast';
import StripePayment from './components/payment/StripePayment';
import { ShieldCheck } from 'lucide-react';

// Inner app that has access to location
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isSessionActive, setIsSessionActive] = useState(false);

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

  // Safely parse createdAt
  const getSignupDate = (): Date => {
    if (!profile?.createdAt) return new Date();
    
    // Handle Firestore Timestamp objects
    if (typeof profile.createdAt === 'object' && 'seconds' in profile.createdAt) {
      return new Date((profile.createdAt as any).seconds * 1000);
    }
    
    const parsed = new Date(profile.createdAt);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const getDaysElapsed = () => {
    const signupDate = getSignupDate();
    const diff = Date.now() - signupDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const offsetDays = profile?.offsetDays || 0;
  const subscriptionLimit = 90 + offsetDays;
  const daysElapsed = getDaysElapsed();
  const daysRemaining = Math.max(0, subscriptionLimit - daysElapsed);
  const isTimeLocked = !profile?.isAdmin && daysRemaining <= 0;
  const isBaseActive = profile?.status === 'active' || isSessionActive;
  const isActive = profile?.isAdmin || (isBaseActive && !isTimeLocked);

  if (!isActive) {
    return (
      <Routes>
        <Route path="/pay" element={
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg glass p-10 rounded-[3rem] border-primary/20 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">
                {isTimeLocked ? 'Pristup Istekao' : 'Aktiviraj Pristup'}
              </h1>
              <p className="text-muted-foreground mb-10 text-lg">
                {isTimeLocked 
                  ? 'Tvojih 90 dana je prošlo. Za nastavak transformacije i pristup zajednici, obnovi svoje članstvo.'
                  : 'Dovrši uplatu kako bi otključao 90 dana vrhunskih treninga, planova prehrane i elitne zajednice.'}
              </p>
              
              <div className="bg-black/20 p-8 rounded-3xl border border-white/5 mb-8">
                <StripePayment onSuccess={() => setIsSessionActive(true)} />
              </div>

              <p className="text-sm text-muted-foreground">
                Jednokratna uplata od 49€. Bez pretplate.
              </p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/pay" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      {daysRemaining <= 7 && (
        <div className="bg-primary text-black py-2 px-4 text-center font-bold text-sm">
          ⚠️ Preostalo još {daysRemaining} dana pristupa. <button className="underline ml-2">Obnovi sada</button>
        </div>
      )}
      {/* resetKey ensures ErrorBoundary clears on each route change */}
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/lectures" element={<Lectures />} />
          <Route path="/training" element={<Training />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/profile/u/:username" element={<Profile />} />
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
  return (
    <UploadProvider>
      <AppRoutes />
      <UploadToast />
    </UploadProvider>
  );
}

export default App;
