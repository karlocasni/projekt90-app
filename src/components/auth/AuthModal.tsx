import { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
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
        const user = userCredential.user;
        
        // Create profile in Firestore
        await setDoc(doc(db, 'profiles', user.uid), {
          username: username || email.split('@')[0],
          email,
          status: 'inactive',
          xp: 0,
          level: 1,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
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

        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter text-white">
          {isLogin ? 'Dobrodošao natrag' : 'Pridruži se plemenu'}
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          {isLogin ? 'Prijavi se za nastavak transformacije.' : 'Započni svoju evoluciju danas.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Korisničko ime"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                required
              />
            </div>
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
            {loading ? 'OBRADA...' : (isLogin ? 'PRIJAVI SE' : 'REGISTRIRAJ SE')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          {isLogin ? 'Nemaš račun?' : 'Već imaš račun?'} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Registriraj se' : 'Prijavi se'}
          </button>
        </p>
      </div>
    </div>
  );
}
