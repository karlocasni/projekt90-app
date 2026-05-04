import React, { createContext, useContext, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/post';

interface ProfileCache {
  [uid: string]: {
    avatar_url?: string;
    username?: string;
    timestamp: number;
  };
}

interface ProfileCacheContextType {
  getProfile: (uid: string) => { avatar_url?: string; username?: string } | null;
  refreshProfile: (uid: string) => Promise<void>;
}

const ProfileCacheContext = createContext<ProfileCacheContextType>({
  getProfile: () => null,
  refreshProfile: async () => {},
});

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export const ProfileCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [cache, setCache] = useState<ProfileCache>({});

  const refreshProfile = useCallback(async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setCache((prev) => ({
          ...prev,
          [uid]: {
            avatar_url: data.avatar_url,
            username: data.username,
            timestamp: Date.now(),
          },
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch profile for cache:', uid, err);
    }
  }, []);

  const getProfile = useCallback((uid: string) => {
    const entry = cache[uid];
    const now = Date.now();

    if (!entry || now - entry.timestamp > CACHE_DURATION) {
      // Trigger refresh in background if expired or missing
      if (!entry || now - entry.timestamp > CACHE_DURATION * 2) {
         refreshProfile(uid);
      }
    }

    return entry ? { avatar_url: entry.avatar_url, username: entry.username } : null;
  }, [cache, refreshProfile]);

  return (
    <ProfileCacheContext.Provider value={{ getProfile, refreshProfile }}>
      {children}
    </ProfileCacheContext.Provider>
  );
};

export const useProfileCache = () => useContext(ProfileCacheContext);
