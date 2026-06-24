import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Copy, Check, UserPlus, X, ShieldAlert } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../lib/firebase';
import { UserProfile } from '../types/post';
import XPBadge from '../components/ui/XPBadge';
import { useAuth } from '../contexts/AuthContext';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface MemberEntry {
  uid: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  createdAt: unknown;
  status: string;
  email?: string;
}

function formatJoinDate(createdAt: unknown): string {
  try {
    let date: Date;
    // Firestore Timestamp object
    if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
      date = (createdAt as { toDate: () => Date }).toDate();
    } else if (typeof createdAt === 'string' && createdAt) {
      date = new Date(createdAt);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('hr-HR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function Members() {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [allProfiles, setAllProfiles] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states for creating a new user
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addGender, setAddGender] = useState<'male' | 'female'>('male');
  const [addStatus, setAddStatus] = useState<'active' | 'inactive'>('active');
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setAddError(null);
    setAddSuccess(null);

    let tempApp;
    try {
      // 1. Create a unique secondary Firebase app
      const appName = `temp-app-${Date.now()}`;
      tempApp = initializeApp(firebaseConfig, appName);
      const tempAuth = getAuth(tempApp);

      // 2. Create the user in Auth using the temporary instance
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        addEmail.trim(),
        addPassword
      );
      const newUid = userCredential.user.uid;

      // 3. Create the user profile document in Firestore using the admin's Firestore connection
      await setDoc(doc(db, 'profiles', newUid), {
        username: addUsername.trim(),
        email: addEmail.trim().toLowerCase(),
        gender: addGender,
        status: addStatus,
        createdAt: new Date().toISOString(),
        xp: 0,
        level: 1,
      });

      // 4. Clean up temp Auth session
      await signOut(tempAuth);

      setAddSuccess(`Korisnik ${addUsername} uspješno kreiran!`);
      // Reset form
      setAddUsername('');
      setAddEmail('');
      setAddPassword('');
      setAddGender('male');
      setAddStatus('active');
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Greška pri kreiranju korisnika.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'Korisnik s ovim emailom već postoji.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Lozinka mora imati barem 6 znakova.';
      }
      setAddError(errMsg);
    } finally {
      if (tempApp) {
        try {
          await deleteApp(tempApp);
        } catch (delErr) {
          console.error('Error deleting temp app:', delErr);
        }
      }
      setAddingUser(false);
    }
  };

  const unpaidEmails = allProfiles
    .filter((m) => m.status !== 'active' && m.email)
    .map((m) => m.email as string);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'profiles'),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMembers(
          snapshot.docs
            .map((d) => {
              const data = d.data() as UserProfile;
              return {
                uid: d.id,
                username: data.username || 'Nepoznat',
                avatar_url: data.avatar_url,
                xp: data.xp ?? 0,
                level: data.level ?? 1,
                createdAt: data.createdAt ?? '',
                status: data.status || 'inactive',
              };
            })
            .filter((m) => m.status === 'active'),
        );
        setAllProfiles(
          snapshot.docs.map((d) => {
            const data = d.data() as UserProfile;
            return {
              uid: d.id,
              username: data.username || 'Nepoznat',
              avatar_url: data.avatar_url,
              xp: data.xp ?? 0,
              level: data.level ?? 1,
              createdAt: data.createdAt ?? '',
              status: data.status || 'inactive',
              email: data.email || '',
            };
          }),
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Members snapshot error:', err.code);
        setError('Greška pri učitavanju članova.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <div className="py-6 px-4 md:px-0 space-y-4">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="font-heading font-black text-3xl uppercase tracking-tighter">ČLANOVI</h1>
          {!loading && (
            <span className="px-2 py-0.5 bg-primary/15 text-primary rounded-full border border-primary/30 text-xs font-bold">
              {members.length} platilo
            </span>
          )}
        </div>
        {currentProfile?.isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/10"
          >
            <UserPlus className="w-4 h-4" />
            Dodaj Člana
          </button>
        )}
      </div>

      {/* Copy unpaid emails button */}
      {!loading && unpaidEmails.length > 0 && (
        <div className="ursa-card p-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">Registrirani bez plaćanja</p>
              <p className="text-sm text-white/70 mt-0.5">{unpaidEmails.length} korisnika — kopiraj za slanje maila</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(unpaidEmails.join('; '));
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 rounded-xl font-black text-xs uppercase tracking-widest transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopirano!' : 'Kopiraj emailove'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ursa-card p-4 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-white/10" />
              <div className="w-20 h-4 bg-white/10 rounded" />
              <div className="w-12 h-5 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm text-center p-8">{error}</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center p-8">Nema članova</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {members.map((member) => {
            const avatarSrc =
              member.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`;
            const profilePath =
              currentUser?.uid === member.uid ? '/profile' : `/profile/${member.uid}`;

            return (
              <Link
                key={member.uid}
                to={profilePath}
                className="ursa-card p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors group"
              >
                <img
                  src={avatarSrc}
                  alt={member.username}
                  className="w-14 h-14 rounded-full border border-white/10 object-cover group-hover:border-primary/50 transition-colors"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`;
                  }}
                />
                <span className="font-bold text-sm text-center truncate w-full text-center group-hover:text-primary transition-colors">
                  {member.username}
                </span>
                <XPBadge xp={member.xp} compact />
                {Boolean(member.createdAt) && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatJoinDate(member.createdAt)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
      {/* User Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowAddModal(false);
                setAddError(null);
                setAddSuccess(null);
              }}
              className="absolute top-5 right-5 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading font-black uppercase tracking-tighter text-white">Dodaj Novog Člana</h2>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                  Korisničko ime (Ime i Prezime)
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Dragan Raič"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                  Email adresa
                </label>
                <input
                  type="email"
                  required
                  placeholder="npr. dragan@gmail.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                  Lozinka
                </label>
                <input
                  type="password"
                  required
                  placeholder="Barem 6 znakova"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                    Spol
                  </label>
                  <select
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value as 'male' | 'female')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                  >
                    <option value="male" className="bg-[#161616]">Muški</option>
                    <option value="female" className="bg-[#161616]">Ženski</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                    Status Profila
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                  >
                    <option value="active" className="bg-[#161616]">Aktivno</option>
                    <option value="inactive" className="bg-[#161616]">Neaktivno</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={addingUser}
                className="w-full py-3 bg-primary text-black rounded-xl font-heading font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-primary/10"
              >
                {addingUser ? 'Kreiranje...' : 'Kreiraj Korisnika'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
