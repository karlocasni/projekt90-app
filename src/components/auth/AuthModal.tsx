import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Flame } from 'lucide-react';
import { auth, db, functions } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUid = userCredential.user.uid;
        
        await setDoc(doc(db, 'profiles', newUid), {
          username: name.trim(),
          email: email.trim().toLowerCase(),
          gender: gender,
          status: 'inactive',
          hasPaid: false,
          createdAt: new Date().toISOString(),
          xp: 0,
          level: 1,
        });

        try {
          const sendCustomVerification = httpsCallable(functions, 'sendCustomVerificationEmail');
          await sendCustomVerification();
        } catch (emailErr) {
          console.error("Error sending verification email:", emailErr);
        }
      }
      onClose();
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Pogrešan email ili lozinka. Provjerite podatke.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Korisnik s ovim emailom već postoji.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Lozinka mora imati barem 6 znakova.';
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
          {isLogin ? 'Dobrodošao natrag' : 'Pridruži se plemenu'}
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          {isLogin ? 'Prijavi se za nastavak transformacije.' : 'Kreiraj račun i započni svojih 90 dana.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ime i Prezime"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 rounded-xl border text-sm font-bold transition-colors ${
                    gender === 'male'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  MUŠKO
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 rounded-xl border text-sm font-bold transition-colors ${
                    gender === 'female'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  ŽENSKO
                </button>
              </div>
            </>
          )}
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
              {loading ? 'OBRADA...' : (isLogin ? 'PRIJAVI SE' : 'KREIRAJ RAČUN')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {isLogin ? 'Nemaš račun?' : 'Već imaš račun?'} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Kreiraj račun' : 'Prijavi se'}
          </button>
        </p>
      </div>
    </div>
  );
}
