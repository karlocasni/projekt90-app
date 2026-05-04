import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, Camera, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import XPBadge from '../components/ui/XPBadge';
import { UserProfile } from '../types/post';
import { calculateLevel } from '../lib/xp';

export default function Profile() {
  const { userId: paramId } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile, signOut } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  
  // Form states for current user
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we are looking at our own profile
  const isOwnProfile = !paramId || paramId === user?.uid;

  useEffect(() => {
    async function fetchUser() {
      if (isOwnProfile) {
        setViewedProfile(myProfile);
        if (myProfile) {
          setUsername(myProfile.username || '');
          setPhoneNumber(myProfile.phone_number || '');
        }
      } else if (paramId) {
        setFetchingProfile(true);
        try {
          const docSnap = await getDoc(doc(db, 'profiles', paramId));
          if (docSnap.exists()) {
            setViewedProfile(docSnap.data() as UserProfile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        } finally {
          setFetchingProfile(false);
        }
      }
    }
    fetchUser();
  }, [paramId, isOwnProfile, myProfile]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user?.uid) throw new Error('Korisnik nije prijavljen.');
      await setDoc(
        doc(db, 'profiles', user.uid),
        { username, phone_number: phoneNumber, updatedAt: new Date().toISOString() },
        { merge: true },
      );
      showStatus('success', 'Profil uspješno ažuriran!');
    } catch (err) {
      showStatus('error', 'Greška pri ažuriranju profila.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    // Check file size (2MB limit as per rules)
    if (file.size > 2 * 1024 * 1024) {
      showStatus('error', 'Slika je prevelika. Maksimalna veličina je 2MB.');
      return;
    }

    const storageRef = ref(storage, `avatars/${user.uid}/avatar.jpg`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      (err) => {
        console.error(err);
        setUploadProgress(null);
        showStatus('error', 'Greška pri uploadu slike.');
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, 'profiles', user.uid), { avatar_url: url }, { merge: true });
        setUploadProgress(null);
        showStatus('success', 'Avatar uspješno ažuriran!');
      },
    );
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const avatarSrc =
    viewedProfile?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewedProfile?.username || 'user'}`;

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto pb-20">
      <header className="mb-10 flex items-start justify-between">
        <div>
          {!isOwnProfile && (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Povratak</span>
            </button>
          )}
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white">
            {isOwnProfile ? 'KORISNIČKI ' : 'PREGLED '} 
            <span className="text-primary">PROFILA</span>
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">
            {isOwnProfile 
              ? 'Upravljaj svojim podacima i pretplatom.' 
              : `Statistika i podaci korisnika ${viewedProfile?.username}.`}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="ursa-card p-8 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <div className="w-32 h-32 rounded-full border-2 border-primary p-1">
              <img
                src={avatarSrc}
                className="w-full h-full rounded-full object-cover"
                alt="Avatar"
              />
              {isOwnProfile && uploadProgress !== null && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="text-xs font-black text-white">{uploadProgress}%</span>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="absolute bottom-1 right-1 p-2 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          )}
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
            {viewedProfile?.username || 'Projekt90 Član'}
          </h2>
          <div className="mt-2">
            <XPBadge xp={viewedProfile?.xp ?? 0} />
          </div>
          {viewedProfile?.status === 'active' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Aktivni Član
              </span>
            </div>
          )}
        </div>

        {isOwnProfile ? (
          /* Form Section for Own Profile */
          <form onSubmit={handleUpdate} className="ursa-card p-8 space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-muted-foreground uppercase ml-1">
                Email adresa
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-muted-foreground uppercase ml-1">
                Korisničko ime
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                  placeholder="korisnicko_ime"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-muted-foreground uppercase ml-1">
                Broj mobitela
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:outline-none transition-colors text-white"
                  placeholder="+385 91 000 0000"
                />
              </div>
            </div>

            {statusMsg && (
              <p
                className={
                  statusMsg.type === 'success'
                    ? 'text-sm text-primary font-bold text-center'
                    : 'text-sm text-red-400 font-bold text-center'
                }
              >
                {statusMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading ? 'SPREMANJE...' : 'AŽURIRAJ PROFIL'}
            </button>
          </form>
        ) : (
          /* View-only stats for other users */
          <div className="grid grid-cols-2 gap-4">
            <div className="ursa-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Ukupni XP
              </span>
              <span className="text-2xl font-black text-primary">
                {(viewedProfile?.xp ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="ursa-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Razina
              </span>
              <span className="text-2xl font-black text-white">
                {calculateLevel(viewedProfile?.xp ?? 0)}
              </span>
            </div>
          </div>
        )}

        {/* Sign out (only on own profile) */}
        {isOwnProfile && (
          <button
            onClick={signOut}
            className="w-full py-4 ursa-card border-red-500/20 text-red-400 font-black text-lg flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" /> ODJAVA
          </button>
        )}
      </div>
    </div>
  );
}
