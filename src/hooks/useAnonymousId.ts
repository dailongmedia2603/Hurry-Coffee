import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_ID_KEY = 'anonymous_device_id';

export const useAnonymousId = () => {
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrGenerateId = async () => {
      try {
        let storedId = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
        if (!storedId) {
          storedId = uuidv4();
          await AsyncStorage.setItem(ANONYMOUS_ID_KEY, storedId);
        }
        setAnonymousId(storedId);
      } catch (error) {
        console.error('Failed to load or generate anonymous ID', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrGenerateId();
  }, []);

  return { anonymousId, isLoading };
};