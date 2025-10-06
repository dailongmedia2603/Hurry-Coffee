import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('localStorage.getItem failed', e);
        return null;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (e) {
        console.error('SecureStore.getItemAsync failed', e);
        return null;
      }
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('localStorage.setItem failed', e);
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.error('SecureStore.setItemAsync failed', e);
      }
    }
  },
};