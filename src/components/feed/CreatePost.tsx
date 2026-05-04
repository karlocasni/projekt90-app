import { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, AlertCircle } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { awardXP } from '../../lib/xp';

export default function CreatePost() {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const avatarUrl =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`;

  const handleSubmit = async () => {
    if (!content.trim() || phase !== 'idle') return;
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        // Check file size (10MB limit as per rules)
        if (imageFile.size > 10 * 1024 * 1024) {
          setError('Slika je prevelika. Maksimalna veličina je 10MB.');
          return;
        }

        setPhase('uploading');
        try {
          console.log('Starting image upload...', imageFile.name);
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
          await uploadBytes(storageRef, imageFile);
          imageUrl = await getDownloadURL(storageRef);
          console.log('Upload successful, URL:', imageUrl);
        } catch (storageErr: unknown) {
          console.error('Image upload failed:', storageErr);
          setError('Greška pri uploadu slike. Provjeri vezu ili Firebase postavke.');
          setPhase('idle');
          return; // Stop here if image was requested but failed
        }
      }

      setPhase('saving');
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile?.username || 'Projekt90 Član',
        authorAvatar: avatarUrl,
        content: content.trim(),
        imageUrl,
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      if (profile && user.uid && !user.uid.startsWith('mock-')) {
        awardXP(user.uid, 50, profile.xp ?? 0).catch((err) =>
          console.warn('XP award failed:', err),
        );
      }

      setContent('');
      setImageFile(null);
    } catch (err: unknown) {
      console.error('Failed to create post:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'permission-denied') {
        setError('Nemaš dozvolu za objavu. Provjeri jesu li Firebase pravila ispravna.');
      } else {
        setError('Greška pri objavi. Pokušaj ponovo.');
      }
    } finally {
      setPhase('idle');
    }
  };

  return (
    <div className="ursa-card p-6 shadow-xl mb-8">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-accent flex-shrink-0">
          <img src={avatarUrl} className="w-full h-full rounded-full" alt="Me" />
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
            placeholder="Što ti je na umu, ratniče?"
            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[100px] placeholder:text-muted-foreground/50 outline-none"
          />

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

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-colors"
                title="Dodaj sliku"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!content.trim() || phase !== 'idle'}
              className="px-6 py-2 bg-primary text-black rounded-full font-black text-sm disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(190,242,100,0.2)] flex items-center gap-2"
            >
              {phase === 'uploading' ? 'SLANJE...' : phase === 'saving' ? 'OBJAVA...' : 'OBJAVI'}{' '}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          setImageFile(e.target.files?.[0] ?? null);
          // Reset value so same file can be selected again
          e.target.value = '';
        }}
      />
    </div>
  );
}
