import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Flame } from 'lucide-react';
import { auth, db, functions } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  // Update mode if initialMode changes while open or when opening
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode, isOpen]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) return; // Registration is closed
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Pogrešan email ili lozinka. Provjerite podatke.';
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass p-8 rounded-[2.5rem] border-primary/20 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter text-white animate-pulse">
          {isLogin ? 'Dobrodošao natrag' : 'Prijave su zatvorene'}
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          {isLogin ? 'Prijavi se za nastavak transformacije.' : 'Hvala ti na ogromnom interesu.'}
        </p>

        {!isLogin ? (
          <div className="space-y-6 text-center py-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Flame className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Registracije za nove članove su privremeno zatvorene. Trenutno smo maksimalno posvećeni radu s postojećim polaznicima kako bismo im osigurali vrhunske rezultate i potpunu transformaciju.
            </p>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">
              Uskoro otvaramo nova mjesta!
            </p>
            <button
              onClick={() => setIsLogin(true)}
              className="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              PRIJAVI SE (POSTOJEĆI ČLANOVI)
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email adresa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'OBRADA...' : 'PRIJAVI SE'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {isLogin ? 'Nemaš račun?' : 'Već imaš račun?'} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Saznaj više' : 'Prijavi se'}
          </button>
        </p>
      </div>
    </div>
  );
}
