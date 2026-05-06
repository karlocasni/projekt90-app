import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/post';
import XPBadge from '../components/ui/XPBadge';
import { useAuth } from '../contexts/AuthContext';

interface MemberEntry {
  uid: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  createdAt: string;
}

function formatJoinDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('hr-HR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function Members() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.uid === 'mock-123') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMembers(
          snapshot.docs.map((d) => {
            const data = d.data() as UserProfile;
            return {
              uid: d.id,
              username: data.username || 'Nepoznat',
              avatar_url: data.avatar_url,
              xp: data.xp ?? 0,
              level: data.level ?? 1,
              createdAt: data.createdAt || '',
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
      <div className="flex items-center gap-3 px-2">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="font-heading font-black text-3xl uppercase tracking-tighter">ČLANOVI</h1>
        {!loading && (
          <span className="text-xs text-muted-foreground font-medium ml-auto">
            {members.length} članova
          </span>
        )}
      </div>

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
                {member.createdAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatJoinDate(member.createdAt)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
