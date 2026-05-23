import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { UploadProvider } from './contexts/UploadContext';
import UploadToast from './components/ui/UploadToast';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { ShieldCheck, LogOut, Mail, Send } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './lib/firebase';

const AppShell = lazy(() => import('./components/layout/AppShell'));
const Feed = lazy(() => import('./pages/Feed'));
const Lectures = lazy(() => import('./pages/Lectures'));
const Training = lazy(() => import('./pages/Training'));
const Profile = lazy(() => import('./pages/Profile'));
const Progress = lazy(() => import('./pages/Progress'));
const Messages = lazy(() => import('./pages/Messages'));
const Challenges = lazy(() => import('./pages/Challenges'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard'));
const Members = lazy(() => import('./pages/Members'));
const StripePayment = lazy(() => import('./components/payment/StripePayment'));

// Inner app that has access to location
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [resending, setResending] = useState(false);

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

  if (!user.emailVerified) {
    return (
      <Routes>
        <Route path="*" element={
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-lg glass p-10 rounded-[3rem] border-primary/20 flex flex-col items-center">
               <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                 <Mail className="w-10 h-10 text-primary" />
               </div>
               <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter italic text-white">Provjeri Email</h1>
               <p className="text-muted-foreground mb-8 max-w-md text-lg">
                 Poslali smo ti sigurni link za potvrdu na <strong className="text-white">{user.email}</strong>.<br/><br/>
                 Otvori taj email i klikni na link kako bi potvrdio da si to stvarno ti i nastavio sa svojom transformacijom.
               </p>
               <div className="w-full flex gap-2 mb-4">
                 <button 
                   onClick={async () => {
                     await auth.currentUser?.reload();
                     window.location.reload();
                   }} 
                   className="flex-1 py-4 bg-primary text-black rounded-2xl font-black text-lg hover:scale-[1.02] transition-transform shadow-lg"
                 >
                   POTVRDIO SAM
                 </button>
                 <button 
                   onClick={async () => {
                     setResending(true);
                     try {
                       const sendCustomVerification = httpsCallable(functions, 'sendCustomVerificationEmail');
                       await sendCustomVerification();
                       alert('Novi email je poslan! Provjeri Inbox i Spam.');
                     } catch (err) {
                       alert('Greška pri slanju. Pokušaj ponovo kasnije.');
                     } finally {
                       setResending(false);
                     }
                   }}
                   disabled={resending}
                   className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   <Send className="w-4 h-4" />
                   {resending ? 'ŠALJEM...' : 'POŠALJI PONOVO'}
                 </button>
               </div>
               
               <button 
                 onClick={() => signOut(auth)} 
                 className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-colors border border-white/10"
               >
                 <LogOut className="w-5 h-5" />
                 <span>Odustani / Odjavi se</span>
               </button>
            </div>
          </div>
        } />
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
                <Suspense fallback={
                  <div className="min-h-[200px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }>
                  <StripePayment onSuccess={() => setIsSessionActive(true)} />
                </Suspense>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Jednokratna uplata od 49€. Bez pretplate.
              </p>

              <button
                onClick={() => signOut(auth)}
                className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-colors border border-white/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Odjavi se i vrati na naslovnicu</span>
              </button>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/pay" replace />} />
      </Routes>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
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
            <Route path="/members" element={profile?.isAdmin ? <Members /> : <Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </ErrorBoundary>
      </AppShell>
    </Suspense>
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
