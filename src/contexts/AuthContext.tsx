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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

const ADMIN_EMAILS = ['ursa2706@gmail.com', 'karlo.casni2@gmail.com', 'brunovujcec6@gmail.com'];

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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up any previous profile listener before starting a new one
      stopProfileListener();

      setUser(firebaseUser);

      if (firebaseUser) {
        const isEmailAdmin = firebaseUser.email ? ADMIN_EMAILS.includes(firebaseUser.email) : false;
        
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const unsubProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              if (isEmailAdmin) data.isAdmin = true;
              setProfile(data);
            } else {
              setProfile({ 
                username: 'Novi Član', 
                email: firebaseUser.email || '', 
                status: 'inactive', 
                xp: 0, 
                level: 1, 
                createdAt: '',
                isAdmin: isEmailAdmin
              });
            }
            setLoading(false);
          },
          (error) => {
            console.warn('Profile snapshot error:', error.code);
            setProfile({ username: 'Novi Član', email: firebaseUser.email || '', status: 'inactive', xp: 0, level: 1, createdAt: '' });
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
    setUser(null);
    setProfile(null);
    await firebaseSignOut(auth);
  };



  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
