import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Share2, MoreHorizontal, Flame, MessageCircle } from 'lucide-react';
import {
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileCache } from '../../contexts/ProfileCacheContext';
import { FirestorePost, UserProfile } from '../../types/post';
import { cn } from '../../lib/utils';
import CommentSection from './CommentSection';
import { awardXP } from '../../lib/xp';

function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate();
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Upravo';
    if (diffMins < 60) return `Prije ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const label = diffHours === 1 ? 'sat' : diffHours < 5 ? 'sata' : 'sati';
      return `Prije ${diffHours} ${label}`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `Prije ${diffDays} ${diffDays === 1 ? 'dan' : 'dana'}`;
  } catch {
    return '';
  }
}

interface PostCardProps {
  post: FirestorePost;
}

export default function PostCard({ post }: PostCardProps) {
  const { user, profile } = useAuth();
  const { getProfile } = useProfileCache();
  const navigate = useNavigate();
  
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get latest avatar from cache, fallback to post data
  const cachedProfile = getProfile(post.authorId);
  const currentAvatar = cachedProfile?.avatar_url || post.authorAvatar;
  const currentName = cachedProfile?.username || post.authorName;

  const initDM = async () => {
    if (!user || !profile || user.uid === post.authorId) return;
    const chatId = [user.uid, post.authorId].sort().join('_');
    const myAvatar =
      profile.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'user'}`;
    await setDoc(
      doc(db, 'chats', chatId),
      {
        participants: [user.uid, post.authorId],
        participantNames: {
          [user.uid]: profile.username || 'Projekt90 Član',
          [post.authorId]: currentName,
        },
        participantAvatars: {
          [user.uid]: myAvatar,
          [post.authorId]: currentAvatar,
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: '',
      },
      { merge: true },
    );
    navigate(`/messages/${chatId}`);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Projekt90 Objava',
      text: post.content,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link kopiran u međuspremnik!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovu objavu?')) return;
    setDeleting(true);
    try {
      // For this app, we'll do a hard delete to keep the feed clean
      await updateDoc(doc(db, 'posts', post.id), { status: 'deleted' });
      // Note: You might want to filter queries by status != 'deleted'
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Greška pri brisanju.');
    } finally {
      setDeleting(false);
      setShowOptions(false);
    }
  };

  const likes: string[] = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = likes.includes(user?.uid ?? '');

  const toggleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    const adding = !isLiked;
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likes: adding ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });
      if (adding && user.uid !== post.authorId) {
        try {
          const authorSnap = await getDoc(doc(db, 'profiles', post.authorId));
          if (authorSnap.exists()) {
            const authorXP = (authorSnap.data() as UserProfile).xp ?? 0;
            await awardXP(post.authorId, 5, authorXP);
          }
        } catch (xpErr) {
          console.warn('Failed to award XP for like:', xpErr);
        }
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className={cn(
      "ursa-card overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all",
      deleting && "opacity-50 grayscale pointer-events-none"
    )}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between relative">
        <Link 
          to={user?.uid === post.authorId ? '/profile' : `/profile/${post.authorId}`}
          className="flex items-center gap-3 group"
        >
          <img
            src={currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentName}`}
            className="w-12 h-12 rounded-full border border-white/10 object-cover group-hover:border-primary/50 transition-colors"
            alt={currentName}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentName}`;
            }}
          />
          <div>
            <h3 className="font-bold text-base leading-none mb-1 group-hover:text-primary transition-colors">{currentName}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {user && user.uid !== post.authorId && (
            <button
              onClick={initDM}
              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-white/5"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-muted-foreground hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 glass border border-white/10 rounded-2xl p-2 z-20 shadow-2xl animate-in fade-in slide-in-from-top-2">
                  {user?.uid === post.authorId ? (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
                    >
                      Obriši objavu
                    </button>
                  ) : (
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 rounded-xl transition-colors"
                      onClick={() => setShowOptions(false)}
                    >
                      Prijavi objavu
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <p className="text-foreground/90 text-base leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/5 mb-4 bg-white/5">
            <img
              src={post.imageUrl}
              className="w-full h-auto object-cover max-h-[500px]"
              alt="Post content"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleLike}
            disabled={!user || likeLoading}
            className={cn(
              'flex items-center gap-2 transition-all disabled:opacity-50',
              isLiked ? 'text-primary scale-110' : 'text-muted-foreground hover:text-white',
            )}
          >
            <Flame className={cn('w-5 h-5', isLiked && 'fill-current')} />
            <span className="text-sm font-black">{likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={cn(
              'flex items-center gap-2 transition-colors',
              showComments ? 'text-primary' : 'text-muted-foreground hover:text-white',
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-black">{post.commentsCount ?? 0}</span>
          </button>
        </div>

        <button 
          onClick={handleShare}
          className="p-2 text-muted-foreground hover:text-white transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="px-6 pb-6 border-t border-white/5">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  );
}
