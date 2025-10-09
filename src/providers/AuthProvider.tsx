import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import React from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data as Profile);
      }
      setLoading(false);
    };

    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => setProfile(data as Profile));
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);