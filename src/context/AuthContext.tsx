import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  location_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, location_id')
        .eq('id', u.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      setProfile(data ?? null);
    } catch (e) {
      console.error('fetchProfile failed:', e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchProfile(currentUser);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refetchProfile = useCallback(async () => {
    await fetchProfile(user);
  }, [user, fetchProfile]);

  const value = useMemo(
    () => ({ session, user, profile, loading, signOut, refetchProfile }),
    [session, user, profile, loading, signOut, refetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};