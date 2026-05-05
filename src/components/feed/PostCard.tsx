import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Share2,
  MoreHorizontal,
  Flame,
  MessageCircle,
  Pin,
} from 'lucide-react';
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
import { createNotification } from '../../lib/notifications';

function renderWithMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <Link
        key={i}
        to={`/profile/u/${part.slice(1)}`}
        className="text-primary font-bold hover:underline"
      >
        {part}
      </Link>
    ) : (
      part
    ),
  );
}

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

  const cachedProfile = getProfile(post.authorId);
  const currentAvatar = cachedProfile?.avatar_url || post.authorAvatar;
  const currentName = cachedProfile?.username || post.authorName;

  const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentName}`;

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
      await updateDoc(doc(db, 'posts', post.id), { status: 'deleted' });
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
        createNotification({
          recipientId: post.authorId,
          senderId: user.uid,
          senderName: profile?.username || 'Projekt90 Član',
          senderAvatar: profile?.avatar_url || dicebearUrl,
          type: 'like',
          message: `${profile?.username || 'Projekt90 Član'} je reagirao na tvoju objavu`,
          postId: post.id,
        }).catch((err) => console.warn('Like notification failed:', err));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const profilePath = user?.uid === post.authorId ? '/profile' : `/profile/${post.authorId}`;

  return (
    <div
      className={cn(
        'ursa-card overflow-hidden transition-colors hover:border-primary/50',
        deleting && 'opacity-50 grayscale pointer-events-none',
      )}
    >
      {/* Compact header */}
      <div className="p-4 flex items-center gap-3">
        <Link to={profilePath} className="flex-shrink-0">
          <img
            src={currentAvatar || dicebearUrl}
            className="w-9 h-9 rounded-full border border-white/10 object-cover hover:border-primary/50 transition-colors"
            alt={currentName}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = dicebearUrl;
            }}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={profilePath}
              className="font-bold text-sm hover:text-primary transition-colors leading-none"
            >
              {currentName}
            </Link>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(post.createdAt)}
            </span>
            {post.pinned && (
              <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded font-bold">
                <Pin size={10} />
                PRIKVAČENO
              </span>
            )}
          </div>
          {post.category && (
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5 block">
              {post.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {user && user.uid !== post.authorId && (
            <button
              onClick={initDM}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-white/5"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 text-muted-foreground hover:text-white transition-colors"
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

      {/* Content: text left, thumbnail right if image exists */}
      <div className="px-4 pb-3 flex gap-3">
        <div className="flex-1 min-w-0">
          {post.title ? (
            <>
              <h2 className="font-heading font-black text-base uppercase leading-tight mb-1">
                {renderWithMentions(post.title)}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {renderWithMentions(post.content)}
              </p>
            </>
          ) : (
            <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
              {renderWithMentions(post.content)}
            </p>
          )}
        </div>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            loading="lazy"
            alt="Post slika"
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-white/5">
        <button
          onClick={toggleLike}
          disabled={!user || likeLoading}
          className={cn(
            'flex items-center gap-1.5 transition-all disabled:opacity-50 text-sm font-black',
            isLiked ? 'text-primary' : 'text-muted-foreground hover:text-white',
          )}
        >
          <Flame className={cn('w-4 h-4', isLiked && 'fill-current')} />
          {likes.length}
        </button>

        <button
          onClick={() => setShowComments((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 transition-colors text-sm font-black',
            showComments ? 'text-primary' : 'text-muted-foreground hover:text-white',
          )}
        >
          <MessageSquare className="w-4 h-4" />
          {post.commentsCount ?? 0}
        </button>

        <button
          onClick={handleShare}
          className="p-1 text-muted-foreground hover:text-white transition-colors ml-auto"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <span className="text-primary text-xs font-medium">
          {formatRelativeTime(post.createdAt)}
        </span>
      </div>

      {showComments && (
        <div className="px-4 pb-4 border-t border-white/5">
          <CommentSection postId={post.id} postAuthorId={post.authorId} />
        </div>
      )}
    </div>
  );
}
