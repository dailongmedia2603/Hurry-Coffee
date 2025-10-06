import * as SecureStore from 'expo-secure-store';

const ANONYMOUS_ID_KEY = 'anonymous_device_id';

const generateAnonymousId = (): string => {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const getAnonymousId = async (): Promise<string> => {
  try {
    let id = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
    if (!id) {
      id = generateAnonymousId();
      await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, id);
    }
    return id;
  } catch (error) {
    console.error("Failed to get or set anonymous ID", error);
    // Fallback to a temporary ID if SecureStore fails
    return generateAnonymousId();
  }
};