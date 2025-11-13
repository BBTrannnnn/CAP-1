// src/lib/api.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'auth_token'; // <-- export để dùng thống nhất ở auth service

// Helpers quản lý token (dùng lại ở auth service để tránh lệch key)
export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// --- BASE URL ---
// Ưu tiên ENV (cần cho thiết bị thật): EXPO_PUBLIC_API_BASE_URL=http://<IP máy>:5000
const env = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
const BASE =
  env ||
  (Platform.OS === 'web'
    ? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000`
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:5000' // Android emulator
    : 'http://localhost:5000'); // iOS simulator

if (__DEV__) console.log('[API BASE]', BASE);

// Nếu path đã là absolute URL thì dùng nguyên xi
function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

function buildUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return new URL(clean, BASE).toString();
}

async function authHeaders(extra: Record<string, string> = {}) {
  const t = await getToken();
  if (__DEV__) {
    console.log('[authHeaders] token:', t ? `${String(t).slice(0, 10)}…` : '(no token)');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

// (Tuỳ chọn) timeout cho fetch
async function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    // @ts-ignore
    const res = await p(ctrl.signal);
    return res as T;
  } finally {
    clearTimeout(t);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Tùy bạn: clear token + điều hướng về login
    // await clearToken();
    // throw new Error('HTTP 401 Unauthorized');
  }
  if (!res.ok) {
    // cố gắng đọc message từ JSON
    try {
      const data = (await res.json()) as any;
      throw new Error(data?.message || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }
  return (await res.json()) as T;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep/logs')) {
    console.log('[REQ GET]', url, headers.Authorization || '(no auth)');
  }
  const res = await fetch(url, { headers });
  return handle<T>(res);
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep/logs')) {
    console.log('[REQ POST]', url, headers.Authorization || '(no auth)');
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep/logs')) {
    console.log('[REQ PUT]', url, headers.Authorization || '(no auth)');
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__) console.log('[REQ DELETE]', url, headers.Authorization || '(no auth)');
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  return handle<T>(res);
}
