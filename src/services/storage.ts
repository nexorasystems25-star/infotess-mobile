import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'infotess.token';
const UID = 'infotess.uid';
const ROLE = 'infotess.role';

const webStorage = {
  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const storage = {
  async setToken(token: string): Promise<void> {
    try { await webStorage.setItemAsync(KEY, token); } catch {}
  },
  async getToken(): Promise<string | null> {
    try { return await webStorage.getItemAsync(KEY); } catch { return null; }
  },
  async setUserId(id: string): Promise<void> {
    try { await webStorage.setItemAsync(UID, id); } catch {}
  },
  async getUserId(): Promise<string | null> {
    try { return await webStorage.getItemAsync(UID); } catch { return null; }
  },
  async setRole(role: string): Promise<void> {
    try { await webStorage.setItemAsync(ROLE, role); } catch {}
  },
  async getRole(): Promise<string | null> {
    try { return await webStorage.getItemAsync(ROLE); } catch { return null; }
  },
  async clear(): Promise<void> {
    try {
      await webStorage.deleteItemAsync(KEY);
      await webStorage.deleteItemAsync(UID);
      await webStorage.deleteItemAsync(ROLE);
    } catch {}
  },
};
