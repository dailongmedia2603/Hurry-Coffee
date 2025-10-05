import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useMemo } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;             // chỉ phản ánh trạng thái KHỞI TẠO AUTH
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
  const [loading, setLoading] = useState(true); // chỉ dùng cho bước getSession khởi tạo
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchProfile = async (u: User) => {
      try {
        // Chặn gọi khi không có token (tránh treo khi auto-refresh)
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session?.access_token) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', u.id)
          .single();

        // PGRST116 = no rows; không coi là lỗi nghiêm trọng
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        if (mountedRef.current) setProfile(data ?? null);
      } catch (e) {
        console.error('fetchProfile failed:', e);
      }
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const initialSession = data.session ?? null;
        if (!mountedRef.current) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        // ĐỪNG await profile để không block UI
        if (currentUser) fetchProfile(currentUser);
      } catch (e) {
        console.error('Failed to initialize session:', e);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        // Quan trọng: luôn thả loading về false ngay sau khi kiểm tra session xong
        if (mountedRef.current) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;

      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      // Không block listener bằng await
      if (nextUser) {
        // Fetch profile “best effort”, không ảnh hưởng UI
        Promise.resolve().then(() => fetchProfile(nextUser));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mountedRef.current = false;
      // phòng khi subscription undefined trong một số môi trường
      try {
        listener?.subscription?.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const refetchProfile = async () => {
    if (!user) return;
    try {
      // gọi version nhẹ, không ảnh hưởng cờ loading
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error refetching profile:', error);
      }
      if (mountedRef.current) setProfile(data ?? null);
    } catch (e) {
      console.error('refetchProfile failed:', e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // chủ động dọn state để UI thoát ngay, không chờ listener
    if (mountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  // Tránh re-render không cần thiết vì value object thay đổi mỗi render
  const value = useMemo(
    () => ({ session, user, profile, loading, signOut, refetchProfile }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};