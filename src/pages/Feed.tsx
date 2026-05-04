import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Send, RefreshCw, AlertCircle } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestorePost } from '../types/post';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import SkeletonCard from '../components/ui/SkeletonCard';
import Leaderboard from '../components/feed/Leaderboard';

export default function Feed() {
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as FirestorePost))
          .filter((post) => (post as any).status !== 'deleted');
        setPosts(fetched);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Feed snapshot error:', err.code, err.message);
        // If the query requires an index that doesn't exist yet, fall back gracefully
        if (err.code === 'failed-precondition') {
          setError(
            'Firestore indeks se još gradi. Pričekaj nekoliko minuta i pokušaj ponovo.',
          );
        } else if (err.code === 'permission-denied') {
          setError('Nemaš dozvolu za čitanje objava. Provjeri Firebase pravila.');
        } else {
          setError('Greška pri učitavanju feed-a. Pokušaj ponovo.');
        }
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  const handleRetry = () => {
    subscribe();
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      {/* Section header */}
      <header className="flex items-center justify-between px-6 py-4 glass sticky top-0 z-40">
        <h1 className="text-2xl font-black tracking-tighter">ZAJEDNICA</h1>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Link
            to="/messages"
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-primary"
            title="Privatne poruke"
          >
            <Send className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full px-4 pt-6">
        <div className="max-w-5xl mx-auto flex gap-6 items-start">
          {/* Feed column */}
          <main className="flex-1 min-w-0 space-y-6">
            <CreatePost />

            <div className="space-y-6">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : error ? (
                <div className="glass rounded-3xl p-10 text-center border border-red-500/20">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 text-sm mb-4 font-medium">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-black rounded-full font-black text-sm hover:opacity-90 transition-opacity mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Pokušaj ponovo
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center border border-white/5">
                  <p className="text-muted-foreground text-sm">
                    Još nema objava. Budi prvi!
                  </p>
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </main>

          {/* Leaderboard sidebar — desktop only */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-20">
            <Leaderboard />
          </aside>
        </div>
      </div>
    </div>
  );
}
