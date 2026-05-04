import { useState } from 'react';
import { Play, Lock, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Lecture {
  id: string;
  title: string;
  description: string;
  daysToUnlock: number;
  thumbnail: string;
  duration: string;
  category: string;
}

const mockLectures: Lecture[] = [
  {
    id: '1',
    title: 'Projekt90 Mindset',
    description: 'Postavljanje temelja za dugoročni sportski uspjeh i mentalnu disciplinu.',
    daysToUnlock: 0,
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80',
    duration: '12:45',
    category: 'Mindset',
  },
  {
    id: '2',
    title: 'Savladavanje osnovnih pokreta',
    description: 'Detaljan uvid u formu Čučnja, Potiska s klupe i Mrtvog dizanja s pro savjetima.',
    daysToUnlock: 1,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80',
    duration: '24:20',
    category: 'Trening',
  },
  {
    id: '3',
    title: 'Prehrana 101: Makrosi i Mikrosi',
    description: 'Sve što trebate znati o gorivu za vaše tijelo i rast.',
    daysToUnlock: 3,
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80',
    duration: '18:15',
    category: 'Prehrana',
  },
];

export default function Lectures() {
  const { profile } = useAuth();
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Safely parse createdAt — fall back to now if empty/invalid
  const getSignupDate = (): Date => {
    if (!profile?.createdAt) return new Date();
    const parsed = new Date(profile.createdAt);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const getUnlockDate = (days: number): Date => {
    const signupDate = getSignupDate();
    return new Date(signupDate.getTime() + days * 24 * 60 * 60 * 1000);
  };

  const isLocked = (days: number): boolean => {
    if (days === 0) return false;
    // If profile hasn't loaded yet or createdAt is empty, don't lock
    if (!profile?.createdAt) return false;
    const unlockDate = getUnlockDate(days);
    return new Date() < unlockDate;
  };

  const getTimeRemaining = (days: number): string => {
    const unlockDate = getUnlockDate(days);
    const diff = unlockDate.getTime() - Date.now();
    if (diff <= 0) return 'Otključano';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${d}d ${h}h`;
  };

  if (selectedLecture) {
    return (
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <button
          onClick={() => setSelectedLecture(null)}
          className="mb-6 text-sm font-bold text-muted hover:text-primary flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> NATRAG
        </button>
        <div className="aspect-video bg-black rounded-3xl overflow-hidden mb-8 relative">
          <img
            src={selectedLecture.thumbnail}
            className="w-full h-full object-cover opacity-50"
            alt=""
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <Play className="w-8 h-8 text-black fill-current" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-black uppercase bg-primary/20 text-primary px-3 py-1 rounded-full">
            {selectedLecture.category}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {selectedLecture.duration}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            Otključano
          </span>
        </div>
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">
          {selectedLecture.title}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">{selectedLecture.description}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black mb-10 uppercase tracking-tighter">
        Baza <span className="text-primary">Znanja</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockLectures.map((l) => {
          const locked = isLocked(l.daysToUnlock);
          return (
            <div
              key={l.id}
              onClick={() => !locked && setSelectedLecture(l)}
              className={cn(
                'ursa-card relative overflow-hidden group transition-all h-[300px]',
                locked
                  ? 'opacity-60 grayscale cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-[0_0_30px_rgba(212,255,0,0.2)]',
              )}
            >
              {/* Background Image */}
              <img 
                src={l.thumbnail} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="" 
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />

              {/* Locked State Overlay */}
              {locked ? (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10">
                  <Lock className="w-10 h-10 mb-3 text-white/50" />
                  <span className="text-xs font-black uppercase bg-black/50 text-white/80 px-4 py-1.5 rounded-full backdrop-blur-md">
                    {getTimeRemaining(l.daysToUnlock)}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.5)] transform scale-50 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-8 h-8 text-black fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-black uppercase bg-primary text-black px-2 py-0.5 rounded-sm">
                    {l.category}
                  </span>
                  <span className="text-xs text-white/70 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {l.duration}
                  </span>
                </div>
                <h3 className="font-black text-2xl mb-1 text-white group-hover:text-primary transition-colors leading-tight">
                  {l.title}
                </h3>
                <p className="text-white/60 text-sm line-clamp-2">{l.description}</p>
              </div>

              {/* Progress Bar (Mock Data) */}
              {!locked && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(212,255,0,0.8)]" 
                    style={{ width: `${Math.random() * 60 + 10}%` }} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
