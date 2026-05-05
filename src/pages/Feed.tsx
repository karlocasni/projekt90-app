import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { cn } from '../lib/utils';

const FEED_CATEGORIES = ['Sve', 'Opća rasprava', 'Lekcije', 'Napredak', 'Pobjede'];

const SECONDARY_TABS = [
  { label: 'Trening', path: '/training' },
  { label: 'Izazovi', path: '/challenges' },
  { label: 'Rang lista', path: '/leaderboard' },
  { label: 'Članovi', path: '/members' },
];

export default function Feed() {
  const location = useLocation();
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Sve');

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

  const filteredPosts =
    activeCategory === 'Sve'
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="flex flex-col">
      {/* Desktop-only secondary bar — only visible on /feed */}
      <header className="hidden md:flex items-center gap-4 px-6 py-3 glass sticky top-16 z-40">
        <h1 className="text-2xl font-black tracking-tighter flex-shrink-0">ZAJEDNICA</h1>

        {/* Scrollable tabs */}
        <div className="flex-1 flex items-end gap-0 overflow-x-auto scrollbar-none">
          {SECONDARY_TABS.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 text-sm border-b-2 transition-colors flex-shrink-0',
                location.pathname === tab.path
                  ? 'text-white font-bold border-primary'
                  : 'text-white/50 hover:text-white border-transparent',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3 flex-shrink-0">
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

      <div className="py-4 md:py-6 space-y-4">
        <CreatePost />

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {FEED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0',
                activeCategory === cat
                  ? 'bg-primary text-black'
                  : 'border border-white/20 text-muted-foreground hover:border-white/40 hover:text-white',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
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
              <p className="text-muted-foreground text-sm">Još nema objava. Budi prvi!</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-white/5">
              <p className="text-muted-foreground text-sm">
                Nema objava u kategoriji &ldquo;{activeCategory}&rdquo;.
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}
