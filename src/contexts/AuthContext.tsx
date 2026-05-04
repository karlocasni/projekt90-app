import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { UserProfile } from '../types/post';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInMock: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  signInMock: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref to the profile listener so we can clean it up synchronously
  const profileUnsubRef = useRef<Unsubscribe | null>(null);

  const stopProfileListener = () => {
    if (profileUnsubRef.current) {
      profileUnsubRef.current();
      profileUnsubRef.current = null;
    }
  };

  useEffect(() => {
    // DEV MOCK Check
    const mockUser = localStorage.getItem('projekt90_mock_user');
    if (mockUser) {
      const u = JSON.parse(mockUser) as { uid: string; email: string; displayName: string };
      setUser(u as unknown as User);
      setProfile({ username: 'dev_user', email: u.email || '', status: 'active', xp: 0, level: 1, createdAt: '' });
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up any previous profile listener before starting a new one
      stopProfileListener();

      setUser(firebaseUser);

      if (firebaseUser) {
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const unsubProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              setProfile({ username: 'Novi Član', email: '', status: 'inactive', xp: 0, level: 1, createdAt: '' });
            }
            setLoading(false);
          },
          (error) => {
            console.warn('Profile snapshot error:', error.code);
            setProfile({ username: 'Novi Član', email: '', status: 'inactive', xp: 0, level: 1, createdAt: '' });
            setLoading(false);
          }
        );
        profileUnsubRef.current = unsubProfile;
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      stopProfileListener();
      unsubscribeAuth();
    };
  }, []);

  const signOut = async () => {
    stopProfileListener();
    localStorage.removeItem('projekt90_mock_user');
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth);
  };

  const signInMock = () => {
    const mock = { uid: 'mock-123', email: 'dev@projekt90.com', displayName: 'Dev User' };
    localStorage.setItem('projekt90_mock_user', JSON.stringify(mock));
    setUser(mock as unknown as User);
    setProfile({ username: 'dev_user', email: 'dev@projekt90.com', status: 'active', xp: 0, level: 1, createdAt: '' });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, signInMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
