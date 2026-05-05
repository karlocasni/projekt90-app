import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Send, AlertCircle } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { awardXP } from '../../lib/xp';
import { cn } from '../../lib/utils';
import { useMemberSearch } from '../../hooks/useMemberSearch';
import MentionDropdown from '../ui/MentionDropdown';
import { createMentionNotifications } from '../../lib/notifications';

const CATEGORIES = ['Opća rasprava', 'Lekcije', 'Napredak', 'Pobjede'] as const;

function getActiveMention(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@(\w*)$/);
  return match ? match[1] : null;
}

function replaceMention(text: string, cursorPos: number, username: string): string {
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const newBefore = before.replace(/@\w*$/, `@${username} `);
  return newBefore + after;
}

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ isOpen, onClose }: PostModalProps) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeMention, setActiveMention] = useState<string | null>(null);
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const mentionResults = useMemberSearch(activeMention ?? '');

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const avatarUrl =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    const mention = getActiveMention(val, cursor);
    if (mention !== null) {
      setActiveMention(mention);
      const rect = textareaRef.current?.getBoundingClientRect();
      if (rect) {
        setMentionPos({ top: rect.bottom + 8, left: rect.left });
      }
    } else {
      setActiveMention(null);
    }
  };

  const handleMentionSelect = (username: string) => {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const newContent = replaceMention(content, cursor, username);
    setContent(newContent);
    setActiveMention(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!content.trim() || phase !== 'idle') return;
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        if (imageFile.size > 10 * 1024 * 1024) {
          setError('Slika je prevelika. Maksimalna veličina je 10MB.');
          return;
        }

        setPhase('uploading');
        try {
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
          await uploadBytes(storageRef, imageFile);
          imageUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.error('Image upload failed:', storageErr);
          setError('Greška pri uploadu slike. Provjeri vezu ili Firebase postavke.');
          setPhase('idle');
          return;
        }
      }

      setPhase('saving');
      const postRef = await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile?.username || 'Projekt90 Član',
        authorAvatar: avatarUrl,
        content: content.trim(),
        imageUrl,
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
        title: title.trim() || undefined,
        category,
      });

      if (profile && user.uid && !user.uid.startsWith('mock-')) {
        awardXP(user.uid, 50, profile.xp ?? 0).catch((err) =>
          console.warn('XP award failed:', err),
        );
        createMentionNotifications(
          content.trim(),
          user.uid,
          profile.username || 'Projekt90 Član',
          avatarUrl,
          postRef.id,
        ).catch((err) => console.warn('Mention notifications failed:', err));
      }

      setCategory(CATEGORIES[0]);
      setTitle('');
      setContent('');
      setImageFile(null);
      setActiveMention(null);
      setPhase('idle');
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create post:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'permission-denied') {
        setError('Nemaš dozvolu za objavu. Provjeri jesu li Firebase pravila ispravna.');
      } else {
        setError('Greška pri objavi. Pokušaj ponovo.');
      }
      setPhase('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={phase === 'idle' ? onClose : undefined}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full md:max-w-lg ursa-card rounded-t-[2rem] md:rounded-[2rem] p-6 z-10 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-black text-lg uppercase">Nova Objava</h2>
          <button
            onClick={onClose}
            disabled={phase !== 'idle'}
            className="p-2 text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                category === cat
                  ? 'bg-primary text-black'
                  : 'border border-white/20 text-muted-foreground hover:border-white/40 hover:text-white',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Optional title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Naslov (neobavezno)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
        />

        {/* Content textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setActiveMention(null);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
          placeholder="Što ti je na umu, ratniče?"
          className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[120px] placeholder:text-muted-foreground/50 outline-none text-base"
        />

        {/* Image preview */}
        {imageFile && (
          <div className="relative inline-block mb-3">
            <img
              src={URL.createObjectURL(imageFile)}
              className="h-24 rounded-xl object-cover"
              alt="Preview"
            />
            <button
              onClick={() => setImageFile(null)}
              className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors"
            aria-label="Dodaj sliku"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || phase !== 'idle'}
            className="px-6 py-2 bg-primary text-black rounded-full font-black text-sm disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(190,242,100,0.2)] flex items-center gap-2"
          >
            {phase === 'uploading' ? 'SLANJE...' : phase === 'saving' ? 'OBJAVA...' : 'OBJAVI'}
            <Send className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            setImageFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </motion.div>

      {/* Mention dropdown — rendered outside the panel so z-index works */}
      {activeMention !== null && mentionResults.length > 0 && (
        <MentionDropdown
          users={mentionResults}
          onSelect={handleMentionSelect}
          position={mentionPos}
        />
      )}
    </div>
  );
}
