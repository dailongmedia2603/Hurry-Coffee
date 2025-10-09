import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useMemo, useCallback } from 'react';
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
  const mountedRef = useRef(true);
  const profileRef = useRef<Profile | null>(null); // Ref to hold the latest profile state for comparison

  // Update profileRef whenever profile state changes
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async (u: User | null) => {
    if (!u) {
      if (mountedRef.current && profileRef.current !== null) {
        setProfile(null);
      }
      return;
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.access_token) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, location_id')
        .eq('id', u.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found" for .single()
        console.error('Error fetching profile:', error);
      }

      if (mountedRef.current) {
        const newProfile = data ?? null;
        const currentProfile = profileRef.current;

        // Perform a shallow comparison of relevant fields to prevent unnecessary re-renders
        const isProfileContentSame = 
          currentProfile?.full_name === newProfile?.full_name &&
          currentProfile?.avatar_url === newProfile?.avatar_url &&
          currentProfile?.role === newProfile?.role &&
          currentProfile?.location_id === newProfile?.location_id;

        // Only update state if the profile content has actually changed or if null/non-null status changes
        if (currentProfile === null && newProfile !== null ||
            currentProfile !== null && newProfile === null ||
            (currentProfile !== null && newProfile !== null && !isProfileContentSame)) {
          setProfile(newProfile);
        }
      }
    } catch (e) {
      console.error('fetchProfile failed:', e);
    }
  }, []); // fetchProfile remains stable with empty dependencies

  useEffect(() => {
    mountedRef.current = true;

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mountedRef.current) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchProfile(currentUser);
        }
      } catch (e) {
        console.error('Failed to initialize session:', e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;
      // React's useState performs a shallow comparison, so if nextSession/nextUser are new objects
      // but contain the same data, it might not trigger a re-render.
      // However, to be safe, we ensure fetchProfile only updates if content changes.
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      fetchProfile(nextUser);
    });

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
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