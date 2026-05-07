import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
  getJson: async <T>(key: string): Promise<T | null> => {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setJson: (key: string, value: unknown) =>
    AsyncStorage.setItem(key, JSON.stringify(value)),
  multiGet: (keys: string[]) => AsyncStorage.multiGet(keys),
  multiSet: (pairs: [string, string][]) => AsyncStorage.multiSet(pairs),
  multiRemove: (keys: string[]) => AsyncStorage.multiRemove(keys),
};
