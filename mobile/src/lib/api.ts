import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getBaseUrl(): string {
  // Override explícito desde .env (recomendado para producción)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // expo-constants v18+ (SDK 54): debuggerHost en expoGoConfig
  const debuggerHost = (Constants as any).expoGoConfig?.debuggerHost as string | undefined;
  if (debuggerHost && !debuggerHost.includes('.exp.direct')) {
    // Solo usamos la IP si es LAN real, no un túnel de Expo
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000`;
  }

  // Fallback para versiones anteriores (LAN)
  const hostUri = Constants.expoConfig?.hostUri as string | undefined;
  if (hostUri && !hostUri.includes('.exp.direct')) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }

  // Con --tunnel, el backend NO está tunelizado.
  // Debes definir EXPO_PUBLIC_API_URL en el archivo .env
  console.warn('[API] Usando tunnel de Expo. Define EXPO_PUBLIC_API_URL en .env con la IP de tu PC.');
  return 'http://localhost:8000';
}

export const BASE_URL = getBaseUrl();

// Solo en desarrollo: imprime la URL base para diagnóstico
if (__DEV__) {
  console.log('[API] BASE_URL:', BASE_URL);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });
    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try {
        const body = await res.json();
        msg = body.detail ?? body.message ?? msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json() as Promise<T>;
  } catch (e: any) {
    // Distingue error de red de error de servidor
    if (e.message === 'Network request failed') {
      throw new Error(`No se pudo conectar al servidor (${BASE_URL}). Verifica que el backend esté corriendo.`);
    }
    throw e;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
