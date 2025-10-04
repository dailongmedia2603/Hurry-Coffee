import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch (e) {
        return Promise.resolve(null);
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Bỏ qua lỗi
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Bỏ qua lỗi
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const SUPABASE_URL = "https://qpgjdaaavbvrejygsopz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ2pkYWFhdmJ2cmVqeWdzb3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODg3NTcsImV4cCI6MjA3NTA2NDc1N30.HyBxUEKS1mSp5wZcuvb-iMkDO05zTgiJ4Y69G4Fo0pQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});