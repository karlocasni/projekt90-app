import { useState, useEffect, useRef } from 'react';
import {
  Trophy, Plus, X, Upload, ChevronLeft, Calendar,
  Clock, Crown, Send, CheckCircle2, ImageIcon, Video
} from 'lucide-react';
import {
  collection, onSnapshot, addDoc, query, doc, updateDoc,
  orderBy, Timestamp, serverTimestamp, getDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, compressVideo, validateVideo } from '../lib/compress';
import { cn } from '../lib/utils';

interface Challenge {
  id: string;
  title: string;
  description: string;
  active: boolean;
  deadline?: string;      // ISO date string
  winnerDate?: string;    // ISO date string – date admin picks winner
  winnerId?: string;
  winnerName?: string;
  winnerMessage?: string;
  winnerMediaUrl?: string;
  winnerAnnouncement?: string;
}

interface Submission {
  id: string;
  challengeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  message: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
  createdAt: Timestamp;
  isWinner?: boolean;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isPast(iso?: string) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

// ──────────────── ChallengeDetail ────────────────
function ChallengeDetail({ challenge, onBack }: { challenge: Challenge; onBack: () => void }) {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState(challenge.winnerAnnouncement || '');
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const deadlinePassed = isPast(challenge.deadline);

  useEffect(() => {
    const q = query(
      collection(db, 'challenges', challenge.id, 'submissions'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });
  }, [challenge.id]);

  const handleMediaSelect = async (file: File, type: 'image' | 'video') => {
    setError(null);
    try {
      if (type === 'video') await validateVideo(file, !!profile?.isAdmin);
      setMediaFile(file);
      setMediaType(type);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let mediaUrl: string | null = null;
      let finalType = mediaType;

      if (mediaFile && mediaType) {
        setUploading(true);
        let blob: Blob | File = mediaFile;
        if (mediaType === 'image') {
          blob = await compressImage(mediaFile);
        } else if (mediaType === 'video') {
          blob = await compressVideo(mediaFile, (p) => setUploadProgress(Math.floor(p / 2)));
        }

        const path = `challenge-submissions/${challenge.id}/${user.uid}_${Date.now()}`;
        const storageRef = ref(storage, path);
        await new Promise<void>((res, rej) => {
          const task = uploadBytesResumable(storageRef, blob);
          task.on('state_changed',
            (s) => {
              const uP = Math.round(s.bytesTransferred / s.totalBytes * 100);
              setUploadProgress(mediaType === 'video' ? 50 + Math.floor(uP / 2) : uP);
            },
            rej, () => res()
          );
        });
        mediaUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }

      await addDoc(collection(db, 'challenges', challenge.id, 'submissions'), {
        challengeId: challenge.id,
        authorId: user.uid,
        authorName: profile.username || 'Projekt90 Član',
        authorAvatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        message: message.trim(),
        mediaUrl,
        mediaType: finalType,
        createdAt: serverTimestamp(),
        isWinner: false,
      });

      setMessage('');
      setMediaFile(null);
      setMediaType(null);
      setUploadProgress(0);
    } catch (e: any) {
      setError(e.message || 'Greška pri slanju.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const pickWinner = async (sub: Submission) => {
    if (!profile?.isAdmin) return;
    if (!window.confirm(`Proglasi ${sub.authorName} pobjednikom?`)) return;
    await updateDoc(doc(db, 'challenges', challenge.id), {
      winnerId: sub.authorId,
      winnerName: sub.authorName,
      winnerMessage: sub.message,
      winnerMediaUrl: sub.mediaUrl || null,
      winnerAnnouncement: announcementText,
    });
    await updateDoc(doc(db, 'challenges', challenge.id, 'submissions', sub.id), { isWinner: true });
    alert('Pobjednik proglašen!');
  };

  const winner = challenge.winnerId ? submissions.find(s => s.isWinner) || null : null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 md:px-0">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">Natrag</span>
      </button>

      {/* Header */}
      <div className="ursa-card p-8 mb-6 border-l-4 border-l-primary">
        <div className="flex flex-wrap gap-3 mb-3">
          {challenge.deadline && (
            <span className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full", deadlinePassed ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary')}>
              <Calendar className="w-3 h-3" />
              Rok: {formatDate(challenge.deadline)}
              {deadlinePassed && ' (isteklo)'}
            </span>
          )}
          {challenge.winnerDate && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              <Crown className="w-3 h-3" />
              Pobjednik: {formatDate(challenge.winnerDate)}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-3">{challenge.title}</h1>
        <p className="text-muted-foreground">{challenge.description}</p>
      </div>

      {/* Winner banner */}
      {challenge.winnerId && (
        <div className="ursa-card p-6 mb-6 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-500/20 p-2 rounded-full"><Crown className="w-5 h-5 text-yellow-400" /></div>
            <div>
              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest block">🏆 Pobjednik izazova!</span>
              <span className="font-black text-lg text-white">{challenge.winnerName}</span>
            </div>
          </div>
          {challenge.winnerAnnouncement && (
            <p className="text-muted-foreground text-sm italic mb-3">„{challenge.winnerAnnouncement}"</p>
          )}
          {challenge.winnerMessage && <p className="text-white/80 text-sm mb-3">{challenge.winnerMessage}</p>}
          {challenge.winnerMediaUrl && (
            winner?.mediaType === 'video'
              ? <video src={challenge.winnerMediaUrl} className="rounded-xl w-full max-h-80 object-cover" controls playsInline />
              : <img src={challenge.winnerMediaUrl} className="rounded-xl w-full max-h-80 object-cover" alt="Winner" />
          )}
        </div>
      )}

      {/* Admin: set winner announcement text */}
      {profile?.isAdmin && !challenge.winnerId && (
        <div className="ursa-card p-4 mb-6 border border-primary/20 bg-primary/5">
          <p className="text-xs font-black text-primary uppercase mb-2">Admin: tekst objave pobjednika</p>
          <textarea
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            placeholder="Upišite poruku koja će se prikazati uz pobjednika..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white resize-none"
            rows={2}
          />
        </div>
      )}

      {/* Submit form */}
      {!deadlinePassed && !challenge.winnerId && (
        <div className="ursa-card p-6 mb-6">
          <h2 className="font-black text-sm uppercase tracking-widest mb-4 text-primary">Pošalji prijavu</h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Napiši poruku uz svoju prijavu..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm resize-none mb-3"
            rows={3}
          />

          {/* Media preview */}
          {mediaFile && mediaType && (
            <div className="relative inline-block mb-3">
              {mediaType === 'image'
                ? <img src={URL.createObjectURL(mediaFile)} className="h-24 rounded-xl object-cover" alt="" />
                : <video src={URL.createObjectURL(mediaFile)} className="h-24 rounded-xl object-cover" muted />
              }
              <button onClick={() => { setMediaFile(null); setMediaType(null); }} className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {uploading && (
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => imageRef.current?.click()} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-primary transition-colors" title="Slika">
                <ImageIcon className="w-4 h-4" />
              </button>
              <button onClick={() => videoRef.current?.click()} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-primary transition-colors" title="Video (max 60s)">
                <Video className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting || uploading}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-black rounded-full font-black text-sm disabled:opacity-50 hover:scale-105 transition-transform"
            >
              {submitting ? 'Slanje...' : 'Pošalji'} <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f, 'image'); e.target.value = ''; }} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f, 'video'); e.target.value = ''; }} />
        </div>
      )}

      {/* Submissions list */}
      <div className="space-y-4">
        <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
          Prijave ({submissions.length})
        </h2>
        {submissions.length === 0 && (
          <div className="ursa-card p-8 text-center text-muted-foreground text-sm">
            Još nema prijava. Budi prvi!
          </div>
        )}
        {submissions.map(sub => (
          <div key={sub.id} className={cn('ursa-card p-5', sub.isWinner && 'border border-yellow-500/40 bg-yellow-500/5')}>
            <div className="flex items-start gap-3 mb-3">
              <img src={sub.authorAvatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm">{sub.authorName}</span>
                  {sub.isWinner && <Crown className="w-4 h-4 text-yellow-400" />}
                </div>
                <p className="text-white/80 text-sm mt-1">{sub.message}</p>
              </div>
              {profile?.isAdmin && !challenge.winnerId && (
                <button
                  onClick={() => pickWinner(sub)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-full hover:bg-yellow-400/10 transition-colors flex-shrink-0"
                >
                  <Crown className="w-3 h-3" /> Pobjednik
                </button>
              )}
            </div>
            {sub.mediaUrl && (
              sub.mediaType === 'video'
                ? <video src={`${sub.mediaUrl}#t=0.001`} className="rounded-xl w-full max-h-64 object-cover mt-2 bg-black" controls playsInline preload="metadata" />
                : <img src={sub.mediaUrl} className="rounded-xl w-full max-h-64 object-cover mt-2" alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────── Admin Create/Edit Modal ────────────────
function ChallengFormModal({ existing, onClose }: { existing?: Challenge; onClose: () => void }) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    active: existing?.active ?? true,
    deadline: existing?.deadline || '',
    winnerDate: existing?.winnerDate || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        active: form.active,
        deadline: form.deadline || null,
        winnerDate: form.winnerDate || null,
      };
      if (existing) {
        await updateDoc(doc(db, 'challenges', existing.id), data);
      } else {
        await addDoc(collection(db, 'challenges'), data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Greška.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md glass p-8 rounded-[2.5rem] border-primary/20 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">{existing ? 'Uredi' : 'Novi'} <span className="text-primary">Izazov</span></h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Naslov izazova" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary text-white" required />
          <textarea placeholder="Opis izazova" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary text-white" rows={3} required />
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase mb-1 block">Rok za prijave</label>
            <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary text-white" />
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase mb-1 block">Datum objave pobjednika</label>
            <input type="date" value={form.winnerDate} onChange={e => setForm({ ...form, winnerDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary text-white" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-primary text-black rounded-xl font-black text-lg hover:scale-[1.02] transition-transform disabled:opacity-50">
            {loading ? 'SPREMANJE...' : (existing ? 'SPREMI PROMJENE' : 'KREIRAJ IZAZOV')}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────── Main Challenges Page ────────────────
export default function Challenges() {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'challenges'));
    return onSnapshot(q, (snap) => {
      const updated = snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
      setChallenges(updated);
      // Keep selected challenge in sync with live data
      setSelectedChallenge(prev => prev ? (updated.find(c => c.id === prev.id) ?? null) : null);
    });
  }, []);

  const handleClose = async (c: Challenge) => {
    if (!window.confirm('Zatvori prijave za ovaj izazov (postavi rok na danas)?')) return;
    await updateDoc(doc(db, 'challenges', c.id), { active: false, deadline: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = async (c: Challenge) => {
    if (!window.confirm(`Obriši izazov "${c.title}"? Ovo se ne može poništiti.`)) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'challenges', c.id));
  };

  if (selectedChallenge) {
    return (
      <ChallengeDetail
        challenge={selectedChallenge}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  return (
    <div className="py-6 px-4 md:px-0 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" /> IZAZOVI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Sudjeluj, pošalji prijavu i osvoji nagrade!</p>
        </div>
        {profile?.isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-full font-black text-xs hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> NOVI IZAZOV
          </button>
        )}
      </div>

      {challenges.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center border border-white/5">
          <Trophy className="w-12 h-12 text-primary/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-base">Trenutno nema aktivnih izazova.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {challenges.map(c => {
            const deadlinePassed = isPast(c.deadline);
            const hasWinner = !!c.winnerId;
            return (
              <div
                key={c.id}
                className="ursa-card border-l-4 border-l-primary group"
              >
                <div
                  onClick={() => setSelectedChallenge(c)}
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {hasWinner && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                            <Crown className="w-3 h-3" /> Pobjednik proglašen
                          </span>
                        )}
                        {!hasWinner && !c.active && (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-400">Zatvoreno</span>
                        )}
                        {!hasWinner && deadlinePassed && c.active && (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500/20 text-red-400">Rok istekao</span>
                        )}
                        {!hasWinner && !deadlinePassed && c.deadline && c.active && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                            <Clock className="w-3 h-3" /> Rok: {formatDate(c.deadline)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-xl uppercase group-hover:text-primary transition-colors">{c.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{c.description}</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Admin actions row */}
                {profile?.isAdmin && (
                  <div className="px-6 pb-4 flex gap-2 border-t border-white/5 pt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingChallenge(c); }}
                      className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      Uredi
                    </button>
                    {c.active && !hasWinner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClose(c); }}
                        className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white/20 text-muted-foreground hover:bg-white/5 transition-colors"
                      >
                        Zatvori
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
                      className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      Obriši
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && <ChallengFormModal onClose={() => setShowCreateModal(false)} />}
      {editingChallenge && <ChallengFormModal existing={editingChallenge} onClose={() => setEditingChallenge(null)} />}
    </div>
  );
}
