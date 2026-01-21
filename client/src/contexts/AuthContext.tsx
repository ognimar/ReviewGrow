import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOut } from '@/lib/firebase';
import { syncUser } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        
        try {
          const syncResult = await syncUser();
          setIsAdmin(syncResult.user?.isAdmin || false);
        } catch (error) {
          console.error('Failed to sync user:', error);
          const adminEmails = import.meta.env.VITE_OMNISEND_ADMIN_EMAILS?.split(',').map((e: string) => e.trim()) || [];
          setIsAdmin(adminEmails.includes(firebaseUser.email || ''));
        }
      } else {
        setToken(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    // Clear all cached data to ensure no user data leaks between sessions
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
