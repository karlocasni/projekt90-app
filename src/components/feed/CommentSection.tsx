import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreComment } from '../../types/post';
import { awardXP } from '../../lib/xp';

export default function CommentSection({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreComment)),
        );
        setLoadingComments(false);
      },
      (error) => {
        console.warn('Comments snapshot error:', error.code);
        setLoadingComments(false);
      },
    );
    return unsubscribe;
  }, [postId]);

  const avatarUrl =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`;

  const handleSubmit = async () => {
    if (!comment.trim() || !user || submitting) return;
    setSubmitting(true);
    const trimmed = comment.trim();
    setComment(''); // Optimistic clear

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId: user.uid,
        authorName: profile?.username || 'Projekt90 Član',
        authorAvatar: avatarUrl,
        content: trimmed,
        createdAt: serverTimestamp(),
      });

      // Update post comment count — non-blocking
      updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1),
      }).catch((err) => console.warn('Failed to update commentsCount:', err));

      // Award XP — non-blocking
      if (profile && !user.uid.startsWith('mock-')) {
        awardXP(user.uid, 10, profile.xp ?? 0).catch((err) =>
          console.warn('XP award failed:', err),
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      setComment(trimmed); // Restore if failed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-6 space-y-6">
      {/* Comment input */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 overflow-hidden">
          <img src={avatarUrl} alt="Me" className="w-full h-full rounded-full" />
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={user ? 'Napiši komentar...' : 'Prijavi se za komentar'}
            disabled={!user || submitting}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-12 text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || !user || submitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:scale-110 transition-transform disabled:opacity-30"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-4">
        {loadingComments ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Još nema komentara. Budi prvi!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Link to={user?.uid === c.authorId ? '/profile' : `/profile/${c.authorId}`}>
                <img
                  src={c.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorName}`}
                  className="w-8 h-8 rounded-full flex-shrink-0 hover:ring-2 ring-primary/50 transition-all"
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorName}`;
                  }}
                />
              </Link>
              <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3">
                <Link 
                  to={user?.uid === c.authorId ? '/profile' : `/profile/${c.authorId}`}
                  className="font-bold text-sm block mb-1 hover:text-primary transition-colors"
                >
                  {c.authorName}
                </Link>
                <p className="text-sm text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
